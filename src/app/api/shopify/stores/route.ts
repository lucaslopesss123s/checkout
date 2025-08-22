import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateUser } from '@/lib/auth'

// Função para adicionar cabeçalhos CORS
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Private-Network', 'true')
  response.headers.set('Access-Control-Max-Age', '86400')
  return response
}

// Função OPTIONS para requisições preflight
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 })
  return addCorsHeaders(response)
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { chave_api, chave_secreta, token_api, dominio_api, id_loja } = body

    if (!chave_api || !chave_secreta || !token_api || !dominio_api || !id_loja) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se a loja pertence ao usuário
    const loja = await prisma.loja_admin.findFirst({
      where: {
        id: id_loja,
        user_id: user.id
      }
    })

    if (!loja) {
      return NextResponse.json(
        { error: 'Loja não encontrada ou não pertence ao usuário' },
        { status: 404 }
      )
    }

    // Verificar se já existe uma configuração Shopify para esta loja
    const existingConfig = await prisma.loja_Shopify.findFirst({
      where: {
        id_loja: id_loja
      }
    })

    let shopifyConfig

    if (existingConfig) {
      // Atualizar configuração existente
      shopifyConfig = await prisma.loja_Shopify.update({
        where: {
          id: existingConfig.id
        },
        data: {
          chave_api,
          chave_secreta,
          token_api,
          dominio_api,
          updatedAt: new Date()
        }
      })
    } else {
      // Criar nova configuração
      shopifyConfig = await prisma.loja_Shopify.create({
        data: {
          chave_api,
          chave_secreta,
          token_api,
          dominio_api,
          id_loja
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Configuração Shopify salva com sucesso',
      id: shopifyConfig.id
    })

  } catch (error) {
    console.error('Erro ao salvar configuração Shopify:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se a loja pertence ao usuário
    const loja = await prisma.loja_admin.findFirst({
      where: {
        id: storeId,
        user_id: user.id
      }
    })

    if (!loja) {
      return NextResponse.json(
        { error: 'Loja não encontrada ou não pertence ao usuário' },
        { status: 404 }
      )
    }

    // Buscar configuração Shopify
    const shopifyConfig = await prisma.loja_Shopify.findFirst({
      where: {
        id_loja: storeId
      }
    })

    if (!shopifyConfig) {
      return NextResponse.json(
        { error: 'Configuração Shopify não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: shopifyConfig.id,
      chave_api: shopifyConfig.chave_api,
      chave_secreta: shopifyConfig.chave_secreta,
      token_api: shopifyConfig.token_api,
      dominio_api: shopifyConfig.dominio_api,
      id_loja: shopifyConfig.id_loja
    })

  } catch (error) {
    console.error('Erro ao buscar configuração Shopify:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}