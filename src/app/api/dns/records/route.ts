import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { maskSensitiveIPsInObject } from '@/lib/ip-mask'

interface CloudflareRecord {
  id: string
  type: string
  name: string
  content: string
  proxied: boolean
  ttl: number
  priority?: number
  created_on: string
  modified_on: string
}

interface CloudflareResponse {
  success: boolean
  errors: any[]
  messages: any[]
  result: CloudflareRecord[]
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('store_id')

    // Buscar a loja - usar storeId se fornecido, senão buscar a loja do usuário
    let userStore
    if (storeId) {
      userStore = await prisma.loja_admin.findFirst({
        where: {
          id: storeId,
          user_id: user.id // Garantir que o usuário tem acesso a esta loja
        }
      })
    } else {
      userStore = await prisma.loja_admin.findFirst({
        where: {
          user_id: user.id
        }
      })
    }

    if (!userStore) {
      return NextResponse.json(
        { error: 'Loja não encontrada para o usuário' },
        { status: 404 }
      )
    }

    // Buscar o domínio da loja
    const domain = await prisma.dominios.findFirst({
      where: {
        id_loja: userStore.id
      }
    })

    if (!domain || !domain.cloudflare_zone_id) {
      return NextResponse.json(
        { error: 'Domínio não encontrado ou não configurado no Cloudflare' },
        { status: 404 }
      )
    }

    // Buscar registros DNS no Cloudflare usando configuração fixa
    const { getCloudflareConfig } = await import('@/lib/cloudflare-config')
    const cloudflareConfig = getCloudflareConfig()

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${domain.cloudflare_zone_id}/dns_records`,
      {
        headers: {
          'Authorization': `Bearer ${cloudflareConfig.apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      console.error('Erro na API do Cloudflare:', response.statusText)
      return NextResponse.json(
        { error: 'Erro ao buscar registros DNS no Cloudflare' },
        { status: 500 }
      )
    }

    const data: CloudflareResponse = await response.json()

    if (!data.success) {
      console.error('Erro na resposta do Cloudflare:', data.errors)
      return NextResponse.json(
        { error: 'Erro ao buscar registros DNS', details: data.errors },
        { status: 500 }
      )
    }

    // Formatar os registros para o frontend
    const records = data.result.map(record => ({
      id: record.id,
      type: record.type,
      name: record.name,
      content: record.content,
      proxied: record.proxied,
      ttl: record.ttl,
      priority: record.priority,
      created_on: record.created_on,
      modified_on: record.modified_on
    }))

    return NextResponse.json(maskSensitiveIPsInObject({
      success: true,
      domain: domain.dominio,
      zone_id: domain.cloudflare_zone_id,
      records
    }))

  } catch (error) {
    console.error('Erro ao buscar registros DNS:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

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

    const { type, name, content, proxied = false, ttl = 1, priority } = await request.json()

    if (!type || !name || !content) {
      return NextResponse.json(
        { error: 'Tipo, nome e conteúdo são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar a loja do usuário
    const userStore = await prisma.loja_admin.findFirst({
      where: {
        user_id: user.id
      }
    })

    if (!userStore) {
      return NextResponse.json(
        { error: 'Loja não encontrada para o usuário' },
        { status: 404 }
      )
    }

    // Buscar o domínio da loja
    const domain = await prisma.dominios.findFirst({
      where: {
        id_loja: userStore.id
      }
    })

    if (!domain || !domain.cloudflare_zone_id) {
      return NextResponse.json(
        { error: 'Domínio não encontrado ou não configurado no Cloudflare' },
        { status: 404 }
      )
    }

    // Criar registro DNS no Cloudflare usando configuração fixa
    const { getCloudflareConfig } = await import('@/lib/cloudflare-config')
    const cloudflareConfig = getCloudflareConfig()

    const recordData: any = {
      type,
      name,
      content,
      proxied,
      ttl
    }

    if (priority && (type === 'MX' || type === 'SRV')) {
      recordData.priority = priority
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${domain.cloudflare_zone_id}/dns_records`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cloudflareConfig.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(recordData)
      }
    )

    if (!response.ok) {
      console.error('Erro na API do Cloudflare:', response.statusText)
      return NextResponse.json(
        { error: 'Erro ao criar registro DNS no Cloudflare' },
        { status: 500 }
      )
    }

    const data: { success: boolean; errors: any[]; result: CloudflareRecord } = await response.json()

    if (!data.success) {
      console.error('Erro na resposta do Cloudflare:', data.errors)
      return NextResponse.json(
        { error: 'Erro ao criar registro DNS', details: data.errors },
        { status: 500 }
      )
    }

    return NextResponse.json(maskSensitiveIPsInObject({
      success: true,
      record: {
        id: data.result.id,
        type: data.result.type,
        name: data.result.name,
        content: data.result.content,
        proxied: data.result.proxied,
        ttl: data.result.ttl,
        priority: data.result.priority,
        created_on: data.result.created_on,
        modified_on: data.result.modified_on
      }
    }))

  } catch (error) {
    console.error('Erro ao criar registro DNS:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const recordId = searchParams.get('id')

    if (!recordId) {
      return NextResponse.json(
        { error: 'ID do registro é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar a loja do usuário
    const userStore = await prisma.loja_admin.findFirst({
      where: {
        user_id: user.id
      }
    })

    if (!userStore) {
      return NextResponse.json(
        { error: 'Loja não encontrada para o usuário' },
        { status: 404 }
      )
    }

    // Buscar o domínio da loja
    const domain = await prisma.dominios.findFirst({
      where: {
        id_loja: userStore.id
      }
    })

    if (!domain || !domain.cloudflare_zone_id) {
      return NextResponse.json(
        { error: 'Domínio não encontrado ou não configurado no Cloudflare' },
        { status: 404 }
      )
    }

    // Deletar registro DNS no Cloudflare usando configuração fixa
    const { getCloudflareConfig } = await import('@/lib/cloudflare-config')
    const cloudflareConfig = getCloudflareConfig()

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${domain.cloudflare_zone_id}/dns_records/${recordId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${cloudflareConfig.apiToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      console.error('Erro na API do Cloudflare:', response.statusText)
      return NextResponse.json(
        { error: 'Erro ao deletar registro DNS no Cloudflare' },
        { status: 500 }
      )
    }

    const data: { success: boolean; errors: any[] } = await response.json()

    if (!data.success) {
      console.error('Erro na resposta do Cloudflare:', data.errors)
      return NextResponse.json(
        { error: 'Erro ao deletar registro DNS', details: data.errors },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Registro DNS deletado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao deletar registro DNS:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}