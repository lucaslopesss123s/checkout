import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareConfig, getCloudflareAccountId, cloudflareRequest } from '@/lib/cloudflare-config'
import prisma from '@/lib/prisma'
import { authenticateUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { domain } = await request.json()

    if (!domain) {
      return NextResponse.json(
        { error: 'Domínio é obrigatório' },
        { status: 400 }
      )
    }

    // Validar formato do domínio
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { error: 'Formato de domínio inválido' },
        { status: 400 }
      )
    }

    // Verificar se o domínio já existe no banco
    const existingDomain = await prisma.dominios.findFirst({
      where: {
        dominio: domain
      }
    })

    if (existingDomain) {
      return NextResponse.json(
        { error: 'Domínio já cadastrado' },
        { status: 409 }
      )
    }

    // Obter configuração do Cloudflare
    const cloudflareConfig = getCloudflareConfig()
    const accountId = getCloudflareAccountId()

    // Adicionar zona no Cloudflare
    const zoneData = {
      name: domain,
      account: { id: accountId },
      type: 'full',
      jump_start: true
    }

    console.log(`[info] Adicionando domínio ${domain} no Cloudflare...`)
    
    const response = await cloudflareRequest<any>(
      '/zones',
      cloudflareConfig,
      {
        method: 'POST',
        body: JSON.stringify(zoneData)
      }
    )

    if (!response.success) {
      console.error('[error] Erro ao adicionar zona no Cloudflare:', response.errors)
      return NextResponse.json(
        { 
          error: 'Erro ao adicionar domínio no Cloudflare',
          details: response.errors
        },
        { status: 500 }
      )
    }

    const zone = response.result
    console.log(`[info] Zona criada com sucesso: ${zone.id}`)

    // Salvar no banco de dados
    const savedDomain = await prisma.dominios.create({
      data: {
        id_loja: user.id, // Assumindo que user.id é o ID da loja
        dominio: domain,
        status: 'pending',
        dns_verificado: false,
        ssl_ativo: false,
        configuracao_dns: {
          nameservers: zone.name_servers || [],
          zone_id: zone.id
        }
      }
    })

    // Também salvar na tabela cloudflare_zones se existir
    try {
      await prisma.cloudflare_zones.create({
        data: {
          zone_id: zone.id,
          zone_name: domain,
          account_id: accountId,
          status: zone.status || 'pending',
          name_servers: zone.name_servers || [],
          created_at: new Date(),
          updated_at: new Date()
        }
      })
    } catch (error) {
      console.log('[info] Tabela cloudflare_zones não existe ou erro ao salvar:', error)
    }

    return NextResponse.json({
      success: true,
      domain: savedDomain,
      zone_id: zone.id,
      name_servers: zone.name_servers,
      status: zone.status,
      message: 'Domínio adicionado com sucesso! Configure os nameservers no seu provedor de domínio.'
    })

  } catch (error) {
    console.error('[error] Erro ao adicionar domínio:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}