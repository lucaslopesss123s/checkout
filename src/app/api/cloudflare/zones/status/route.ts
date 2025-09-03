import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { getCloudflareZone, createDNSRecord, updateDNSRecord, getCloudflareConfigFromEnv } from '@/lib/cloudflare-config';

// IP do servidor de checkout (deve ser configurado via variável de ambiente)
const CHECKOUT_SERVER_IP = process.env.CHECKOUT_SERVER_IP || '127.0.0.1';

// Função para obter configuração do Cloudflare
function getCloudflareConfig() {
  try {
    return getCloudflareConfigFromEnv();
  } catch (error) {
    console.error('Erro ao obter configuração do Cloudflare:', error);
    throw new Error('Configuração do Cloudflare não disponível. Verifique as variáveis de ambiente CLOUDFLARE_API_TOKEN, CLOUDFLARE_EMAIL e CLOUDFLARE_ACCOUNT_ID.');
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de acesso requerido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { zone_id, id_loja } = await request.json();

    if (!zone_id || !id_loja) {
      return NextResponse.json({ 
        error: 'ID da zona e ID da loja são obrigatórios' 
      }, { status: 400 });
    }

    // Verificar se o usuário tem acesso à loja
    const loja = await prisma.loja_admin.findFirst({
      where: {
        id: id_loja,
        user_id: decoded.id || decoded.userId // Suporte para ambos os formatos
      }
    });

    if (!loja) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // Buscar zona no banco de dados
    const localZone = await prisma.cloudflare_zones.findFirst({
      where: {
        id: zone_id,
        config: {
          id_loja
        }
      },
      include: {
        config: true
      }
    });

    if (!localZone) {
      return NextResponse.json({ error: 'Zona não encontrada' }, { status: 404 });
    }

    // Usar configuração do Cloudflare do banco de dados
    const cloudflareConfig = {
      apiToken: localZone.config.api_token,
      email: localZone.config.email || '',
      apiKey: localZone.config.api_key || ''
    };

    // Verificar status da zona no Cloudflare
    const cloudflareZone = await getCloudflareZone(cloudflareConfig, localZone.cloudflare_id);

    if (!cloudflareZone.success) {
      return NextResponse.json({ 
        error: 'Erro ao verificar zona no Cloudflare',
        details: cloudflareZone.errors
      }, { status: 500 });
    }

    const zone = cloudflareZone.result;
    const isActive = zone.status === 'active';
    const wasInactive = localZone.status !== 'active';

    // Atualizar status da zona no banco de dados
    const updatedZone = await prisma.cloudflare_zones.update({
      where: { id: zone_id },
      data: {
        status: zone.status,
        paused: zone.paused,
        development_mode: zone.development_mode,
        name_servers: zone.name_servers,
        activated_on: zone.activated_on ? new Date(zone.activated_on) : null,
        modified_on: zone.modified_on ? new Date(zone.modified_on) : null
      }
    });

    let dnsRecordCreated = false;
    let sslActivated = false;
    let checkoutSubdomain = '';

    // Se a zona foi ativada, configurar DNS automaticamente
    if (isActive && wasInactive) {
      try {
        // Determinar subdomínio (checkout por padrão)
        const domainParts = zone.name.split('.');
        checkoutSubdomain = `checkout.${zone.name}`;

        // Criar registro DNS A para checkout.dominio.com
        const dnsRecord = await createDNSRecord(cloudflareConfig, localZone.cloudflare_id, {
          type: 'A',
          name: 'checkout',
          content: CHECKOUT_SERVER_IP,
          ttl: 1, // Automático
          proxied: true // Ativar proxy (orange cloud) para SSL automático
        });

        if (dnsRecord.success) {
          // Salvar registro DNS no banco
          await prisma.cloudflare_dns_records.create({
            data: {
              cloudflare_id: dnsRecord.result.id,
              zone_id: localZone.id,
              config_id: localZone.config_id,
              type: dnsRecord.result.type,
              name: dnsRecord.result.name,
              content: dnsRecord.result.content,
              ttl: dnsRecord.result.ttl,
              proxied: dnsRecord.result.proxied,
              proxiable: dnsRecord.result.proxiable,
              locked: dnsRecord.result.locked || false,
              created_on: dnsRecord.result.created_on ? new Date(dnsRecord.result.created_on) : null,
              modified_on: dnsRecord.result.modified_on ? new Date(dnsRecord.result.modified_on) : null
            }
          });

          dnsRecordCreated = true;
          sslActivated = true; // SSL Universal é automático com proxy ativado
        }

        // Atualizar domínio na tabela Dominios
        await prisma.dominios.updateMany({
          where: { dominio: zone.name },
          data: {
            status: 'verified',
            dns_verificado: true,
            ssl_ativo: sslActivated,
            ultima_verificacao: new Date(),
            configuracao_dns: {
              nameservers: zone.name_servers,
              cloudflare_zone_id: zone.id,
              provider: 'cloudflare',
              checkout_url: `https://${checkoutSubdomain}`,
              dns_records: dnsRecordCreated ? [{
                type: 'A',
                name: 'checkout',
                content: CHECKOUT_SERVER_IP,
                proxied: true
              }] : []
            }
          }
        });

      } catch (dnsError) {
        console.error('Erro ao configurar DNS:', dnsError);
        // Continuar mesmo se houver erro no DNS
      }
    }

    // Atualizar configuração do Cloudflare
    await prisma.cloudflare_config.update({
      where: { id: localZone.config_id },
      data: {
        last_sync: new Date(),
        sync_error: null
      }
    });

    return NextResponse.json({
      success: true,
      zone: {
        ...updatedZone,
        cloudflare_status: zone.status,
        is_active: isActive,
        nameservers: zone.name_servers
      },
      automation: {
        dns_configured: dnsRecordCreated,
        ssl_activated: sslActivated,
        checkout_url: isActive ? `https://${checkoutSubdomain}` : null
      },
      message: isActive 
        ? 'Domínio ativo! DNS e SSL configurados automaticamente.' 
        : `Status: ${zone.status}. Aguardando ativação do domínio.`
    });

  } catch (error) {
    console.error('Erro ao verificar status da zona:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

// GET - Verificar status de todas as zonas da loja
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de acesso requerido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id_loja = searchParams.get('id_loja');

    if (!id_loja) {
      return NextResponse.json({ error: 'ID da loja é obrigatório' }, { status: 400 });
    }

    // Verificar se o usuário tem acesso à loja
    const loja = await prisma.loja_admin.findFirst({
      where: {
        id: id_loja,
        user_id: decoded.id || decoded.userId // Suporte para ambos os formatos
      }
    });

    if (!loja) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // Buscar todas as zonas da loja
    const zones = await prisma.cloudflare_zones.findMany({
      where: {
        config: {
          id_loja
        }
      },
      include: {
        dns_records: true,
        config: {
          select: {
            id: true,
            ativo: true,
            last_sync: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Buscar domínios relacionados
    const dominios = await prisma.dominios.findMany({
      where: {
        id_loja,
        configuracao_dns: {
          path: ['provider'],
          equals: 'cloudflare'
        }
      }
    });

    const zonesWithStatus = zones.map(zone => {
      const relatedDomain = dominios.find(d => d.dominio === zone.name);
      return {
        ...zone,
        domain_info: relatedDomain ? {
          status: relatedDomain.status,
          dns_verificado: relatedDomain.dns_verificado,
          ssl_ativo: relatedDomain.ssl_ativo,
          ultima_verificacao: relatedDomain.ultima_verificacao
        } : null,
        checkout_url: zone.status === 'active' ? `https://checkout.${zone.name}` : null
      };
    });

    return NextResponse.json({
      success: true,
      zones: zonesWithStatus,
      summary: {
        total: zones.length,
        active: zones.filter(z => z.status === 'active').length,
        pending: zones.filter(z => z.status === 'pending').length,
        with_ssl: zones.filter(z => {
          const domain = dominios.find(d => d.dominio === z.name);
          return domain?.ssl_ativo;
        }).length
      }
    });

  } catch (error) {
    console.error('Erro ao verificar status das zonas:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}