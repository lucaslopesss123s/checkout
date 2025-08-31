import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { CloudflareConfig, createCloudflareZone, getCloudflareZones } from '@/lib/cloudflare-config';

const prisma = new PrismaClient();

// Configuração da conta única do Cloudflare
const MASTER_CLOUDFLARE_CONFIG = {
  apiToken: process.env.CLOUDFLARE_API_TOKEN!,
  email: process.env.CLOUDFLARE_EMAIL,
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
};

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

    const { domain, id_loja } = await request.json();

    if (!domain || !id_loja) {
      return NextResponse.json({ 
        error: 'Domínio e ID da loja são obrigatórios' 
      }, { status: 400 });
    }

    // Verificar se o usuário tem acesso à loja
    const loja = await prisma.loja_admin.findFirst({
      where: {
        id: id_loja,
        user_id: decoded.userId
      }
    });

    if (!loja) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // Verificar se já existe uma zona para este domínio
    const existingZone = await prisma.cloudflare_zones.findFirst({
      where: {
        name: domain
      }
    });

    if (existingZone) {
      return NextResponse.json({ 
        error: 'Domínio já está configurado no Cloudflare',
        zone: existingZone
      }, { status: 409 });
    }

    // Verificar/criar configuração do Cloudflare para a loja
    let cloudflareConfig = await prisma.cloudflare_config.findUnique({
      where: { id_loja }
    });

    if (!cloudflareConfig) {
      cloudflareConfig = await prisma.cloudflare_config.create({
        data: {
          id_loja,
          api_token: MASTER_CLOUDFLARE_CONFIG.apiToken,
          email: MASTER_CLOUDFLARE_CONFIG.email,
          account_id: MASTER_CLOUDFLARE_CONFIG.accountId,
          ativo: true
        }
      });
    }

    // Criar zona no Cloudflare
    const zoneData = await createCloudflareZone({
      apiToken: MASTER_CLOUDFLARE_CONFIG.apiToken,
      email: MASTER_CLOUDFLARE_CONFIG.email,
      accountId: MASTER_CLOUDFLARE_CONFIG.accountId
    }, domain);

    if (!zoneData.success) {
      return NextResponse.json({ 
        error: 'Erro ao criar zona no Cloudflare',
        details: zoneData.errors
      }, { status: 500 });
    }

    const zone = zoneData.result;

    // Salvar zona no banco de dados
    const savedZone = await prisma.cloudflare_zones.create({
      data: {
        cloudflare_id: zone.id,
        name: zone.name,
        status: zone.status,
        paused: zone.paused,
        type: zone.type,
        development_mode: zone.development_mode,
        name_servers: zone.name_servers,
        original_name_servers: zone.original_name_servers,
        original_registrar: zone.original_registrar,
        original_dnshost: zone.original_dnshost,
        created_on: zone.created_on ? new Date(zone.created_on) : null,
        modified_on: zone.modified_on ? new Date(zone.modified_on) : null,
        activated_on: zone.activated_on ? new Date(zone.activated_on) : null,
        config_id: cloudflareConfig.id
      }
    });

    // Atualizar domínio na tabela Dominios se existir
    await prisma.dominios.upsert({
      where: { dominio: domain },
      update: {
        status: 'cloudflare_pending',
        dns_verificado: false,
        ssl_ativo: false,
        configuracao_dns: {
          nameservers: zone.name_servers,
          cloudflare_zone_id: zone.id,
          provider: 'cloudflare'
        }
      },
      create: {
        id_loja,
        dominio: domain,
        status: 'cloudflare_pending',
        dns_verificado: false,
        ssl_ativo: false,
        configuracao_dns: {
          nameservers: zone.name_servers,
          cloudflare_zone_id: zone.id,
          provider: 'cloudflare'
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Zona criada com sucesso no Cloudflare',
      zone: savedZone,
      nameservers: zone.name_servers,
      instructions: {
        step1: 'Acesse o painel do seu provedor de domínio',
        step2: 'Altere os nameservers para:',
        nameservers: zone.name_servers,
        step3: 'Aguarde a propagação DNS (pode levar até 24 horas)',
        step4: 'O SSL será ativado automaticamente após a validação'
      }
    });

  } catch (error) {
    console.error('Erro ao criar zona Cloudflare:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

// GET - Listar zonas da loja
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
        user_id: decoded.userId
      }
    });

    if (!loja) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // Buscar configuração do Cloudflare
    const cloudflareConfig = await prisma.cloudflare_config.findUnique({
      where: { id_loja },
      include: {
        zones: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!cloudflareConfig) {
      return NextResponse.json({ 
        zones: [],
        message: 'Nenhuma configuração Cloudflare encontrada'
      });
    }

    return NextResponse.json({
      success: true,
      zones: cloudflareConfig.zones,
      config: {
        id: cloudflareConfig.id,
        ativo: cloudflareConfig.ativo,
        last_sync: cloudflareConfig.last_sync,
        zone_count: cloudflareConfig.zones.length
      }
    });

  } catch (error) {
    console.error('Erro ao listar zonas:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}

// DELETE - Remover zona
export async function DELETE(request: NextRequest) {
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
        user_id: decoded.userId
      }
    });

    if (!loja) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // Buscar zona
    const zone = await prisma.cloudflare_zones.findFirst({
      where: {
        id: zone_id,
        config: {
          id_loja
        }
      }
    });

    if (!zone) {
      return NextResponse.json({ error: 'Zona não encontrada' }, { status: 404 });
    }

    // Remover zona do Cloudflare (implementar se necessário)
    // await deleteCloudflareZone(config, zone.cloudflare_id);

    // Remover zona do banco de dados
    await prisma.cloudflare_zones.delete({
      where: { id: zone_id }
    });

    // Atualizar status do domínio
    await prisma.dominios.updateMany({
      where: { dominio: zone.name },
      data: {
        status: 'inactive',
        dns_verificado: false,
        ssl_ativo: false
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Zona removida com sucesso'
    });

  } catch (error) {
    console.error('Erro ao remover zona:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}