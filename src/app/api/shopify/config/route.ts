import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const domain = searchParams.get('domain')
  const id_loja = searchParams.get('id_loja')

  if (!domain && !id_loja) {
    const response = NextResponse.json(
      { error: 'Parâmetro domain ou id_loja é obrigatório' },
      { status: 400 }
    )
    return addCorsHeaders(response)
  }

  try {
    // Buscar configurações da loja Shopify
    let lojaShopify
    if (id_loja) {
      lojaShopify = await prisma.loja_Shopify.findFirst({
        where: {
          id_loja: id_loja
        }
      })
    } else {
      lojaShopify = await prisma.loja_Shopify.findFirst({
        where: {
          dominio_api: domain
        }
      })
    }

    if (!lojaShopify) {
      const response = NextResponse.json(
        { 
          error: 'Loja não encontrada',
          configured: false,
          message: 'Esta loja Shopify não está configurada no sistema'
        },
        { status: 404 }
      )
      return addCorsHeaders(response)
    }

    // Buscar informações da loja (checkout personalizado)
    const checkout = await prisma.checkout.findFirst({
      where: {
        id_loja: lojaShopify.id_loja
      }
    })

    // Contar produtos configurados
    const produtosCount = await prisma.produtos.count({
      where: {
        id_loja: lojaShopify.id_loja
      }
    })

    // Determinar URLs baseadas no ambiente e host
    const isDevelopment = process.env.NODE_ENV === 'development'
    const isLocalhost = request.url.includes('localhost')
    const useLocalhost = isDevelopment || isLocalhost
    const baseUrl = useLocalhost ? 'http://localhost:3000' : (process.env.NEXT_PUBLIC_APP_URL || 'https://checkout.zollim.store')

    const response = NextResponse.json({
      success: true,
      configured: true,
      loja_id: lojaShopify.id_loja,
      id_loja: lojaShopify.id_loja,
      domain: lojaShopify.dominio_api,
      checkout_configured: !!checkout,
      produtos_count: produtosCount,
      checkout_url: `${baseUrl}/checkout/shopify`,
      api_endpoint: `${baseUrl}/api/shopify/checkout`,
      theme: checkout?.Tema || 'default',
      config: checkout ? {
        Tema: checkout.Tema,
        Logo: checkout.Logo,
        Favicon: checkout.Favicon,
        Corbarra: checkout.Corbarra,
        Corbotao: checkout.Corbotao,
        Contagemregressiva: checkout.Contagemregressiva,
        BarraTexto: checkout.BarraTexto
      } : null,
      settings: {
        logo: checkout?.Logo,
        favicon: checkout?.Favicon,
        cor_barra: checkout?.Corbarra,
        cor_botao: checkout?.Corbotao,
        contagem_regressiva: checkout?.Contagemregressiva || false,
        barra_texto: checkout?.BarraTexto
      }
    })
    return addCorsHeaders(response)

  } catch (error) {
    console.error('Erro ao buscar configuração da loja:', error)
    const response = NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        configured: false
      },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}

// Endpoint POST para atualizar configurações
export async function POST(request: NextRequest) {
  try {
    const { domain, settings } = await request.json()

    if (!domain) {
      return NextResponse.json(
        { error: 'Domínio é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar loja Shopify
    const lojaShopify = await prisma.loja_Shopify.findFirst({
      where: {
        dominio_api: domain
      }
    })

    if (!lojaShopify) {
      return NextResponse.json(
        { error: 'Loja não encontrada' },
        { status: 404 }
      )
    }

    // Buscar configuração existente do checkout
    const existingCheckout = await prisma.checkout.findFirst({
      where: {
        id_loja: lojaShopify.id_loja
      }
    })

    let checkout
    if (existingCheckout) {
      // Atualizar configuração existente
      checkout = await prisma.checkout.update({
        where: {
          id: existingCheckout.id
        },
        data: {
          Tema: settings?.theme || 'default',
          Logo: settings?.logo,
          Favicon: settings?.favicon,
          Corbarra: settings?.cor_barra,
          Corbotao: settings?.cor_botao,
          Contagemregressiva: settings?.contagem_regressiva || false,
          BarraTexto: settings?.barra_texto,
          updatedAt: new Date()
        }
      })
    } else {
      // Criar nova configuração
      checkout = await prisma.checkout.create({
        data: {
          id_loja: lojaShopify.id_loja,
          Tema: settings?.theme || 'default',
          Logo: settings?.logo,
          Favicon: settings?.favicon,
          Corbarra: settings?.cor_barra,
          Corbotao: settings?.cor_botao,
          Contagemregressiva: settings?.contagem_regressiva || false,
          BarraTexto: settings?.barra_texto
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Configurações atualizadas com sucesso',
      checkout_id: checkout.id
    })

  } catch (error) {
    console.error('Erro ao atualizar configurações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}