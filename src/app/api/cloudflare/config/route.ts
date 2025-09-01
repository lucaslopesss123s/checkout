import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { validateCloudflareCredentials, listZones, getCloudflareConfigFromEnv } from '@/lib/cloudflare-config'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Função para adicionar cabeçalhos CORS
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

// OPTIONS para requisições preflight
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 })
  return addCorsHeaders(response)
}

// GET - Obter configuração do Cloudflare
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const response = NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
      return addCorsHeaders(response)
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const userId = decoded.id || decoded.userId // Suporte para ambos os formatos

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId') || searchParams.get('id_loja')

    if (!storeId) {
      const response = NextResponse.json(
        { error: 'ID da loja é obrigatório' },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

    // Verificar se o usuário tem acesso à loja
    const loja = await prisma.loja_admin.findFirst({
      where: {
        id: storeId,
        user_id: userId
      }
    })

    if (!loja) {
      const response = NextResponse.json(
        { error: 'Loja não encontrada ou sem permissão' },
        { status: 404 }
      )
      return addCorsHeaders(response)
    }

    // Buscar configuração do Cloudflare
    const cloudflareConfig = await prisma.cloudflare_config.findFirst({
      where: {
        id_loja: storeId
      }
    })

    const response = NextResponse.json({
      success: true,
      configured: !!cloudflareConfig,
      config: cloudflareConfig ? {
        id: cloudflareConfig.id,
        email: cloudflareConfig.email,
        hasApiToken: !!cloudflareConfig.api_token,
        hasApiKey: !!cloudflareConfig.api_key,
        zonas_count: cloudflareConfig.zonas_count || 0,
        status: cloudflareConfig.status,
        created_at: cloudflareConfig.created_at,
        updated_at: cloudflareConfig.updated_at
      } : null
    })
    return addCorsHeaders(response)

  } catch (error) {
    console.error('Erro ao obter configuração Cloudflare:', error)
    const response = NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}

// POST - Salvar/atualizar configuração do Cloudflare
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const response = NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
      return addCorsHeaders(response)
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const userId = decoded.id || decoded.userId // Suporte para ambos os formatos

    const body = await request.json()
    const { storeId, email, api_token, apiToken } = body
    
    // Suporte para ambos os formatos de campo (api_token do frontend e apiToken)
    const finalApiToken = api_token || apiToken

    if (!storeId) {
      const response = NextResponse.json(
        { error: 'ID da loja é obrigatório' },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

    // Verificar se o usuário tem acesso à loja
    const loja = await prisma.loja_admin.findFirst({
      where: {
        id: storeId,
        user_id: userId
      }
    })

    if (!loja) {
      const response = NextResponse.json(
        { error: 'Loja não encontrada ou sem permissão' },
        { status: 404 }
      )
      return addCorsHeaders(response)
    }

    // Validar credenciais
    const credentials = { email, apiToken: finalApiToken }
    console.log('Validando credenciais:', {
      hasEmail: !!email,
      hasApiToken: !!finalApiToken,
      tokenLength: finalApiToken?.length || 0
    })
    
    if (!validateCloudflareCredentials(credentials)) {
      console.error('Falha na validação das credenciais')
      const response = NextResponse.json(
        { error: 'Credenciais do Cloudflare inválidas' },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

    console.log('Credenciais validadas com sucesso, testando conexão...')
    
    // Testar conexão com Cloudflare
    try {
      const zones = await listZones(credentials)
      console.log(`Cloudflare conectado com sucesso. ${zones.length} zonas encontradas.`)
    } catch (error) {
      console.error('Erro ao conectar com Cloudflare:', error)
      const response = NextResponse.json(
        { error: 'Erro ao conectar com Cloudflare. Verifique suas credenciais.' },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

    // Buscar configuração existente
    const existingConfig = await prisma.cloudflare_config.findFirst({
      where: {
        id_loja: storeId
      }
    })

    let cloudflareConfig
    if (existingConfig) {
      // Atualizar configuração existente
      cloudflareConfig = await prisma.cloudflare_config.update({
        where: {
          id: existingConfig.id
        },
        data: {
          email: email || null,
          api_token: finalApiToken || null,
          ativo: true,
          updatedAt: new Date()
        }
      })
    } else {
      // Criar nova configuração
      cloudflareConfig = await prisma.cloudflare_config.create({
        data: {
          id_loja: storeId,
          email: email || null,
          api_token: finalApiToken || null,
          ativo: true
        }
      })
    }

    const response = NextResponse.json({
      success: true,
      message: 'Configuração do Cloudflare salva com sucesso',
      config_id: cloudflareConfig.id
    })
    return addCorsHeaders(response)

  } catch (error) {
    console.error('Erro ao salvar configuração Cloudflare:', error)
    const response = NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}

// DELETE - Remover configuração do Cloudflare
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const response = NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
      return addCorsHeaders(response)
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const userId = decoded.userId

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')

    if (!storeId) {
      const response = NextResponse.json(
        { error: 'ID da loja é obrigatório' },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

    // Verificar se o usuário tem acesso à loja
    const loja = await prisma.loja_admin.findFirst({
      where: {
        id: storeId,
        user_id: userId
      }
    })

    if (!loja) {
      const response = NextResponse.json(
        { error: 'Loja não encontrada ou sem permissão' },
        { status: 404 }
      )
      return addCorsHeaders(response)
    }

    // Remover configuração do Cloudflare
    await prisma.cloudflare_config.deleteMany({
      where: {
        id_loja: storeId
      }
    })

    const response = NextResponse.json({
      success: true,
      message: 'Configuração do Cloudflare removida com sucesso'
    })
    return addCorsHeaders(response)

  } catch (error) {
    console.error('Erro ao remover configuração Cloudflare:', error)
    const response = NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}