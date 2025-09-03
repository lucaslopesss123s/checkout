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

interface ShopifyCartItem {
  id: string
  product_id: string
  variant_id: string
  title: string
  price: string
  quantity: number
  image?: string
  variant_title?: string
}

interface ShopifyCheckoutData {
  shop_domain: string
  cart_items: ShopifyCartItem[]
  customer?: {
    email?: string
    first_name?: string
    last_name?: string
  }
  currency?: string
  total_price?: string
}

export async function POST(request: NextRequest) {
  try {
    const data: ShopifyCheckoutData = await request.json()
    
    // Validar dados obrigatórios
    if (!data.shop_domain || !data.cart_items || data.cart_items.length === 0) {
      const response = NextResponse.json(
        { error: 'Domínio da loja e itens do carrinho são obrigatórios' },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

    // Buscar configurações da loja Shopify pelo domínio
    const lojaShopify = await prisma.loja_Shopify.findFirst({
      where: {
        dominio_api: data.shop_domain
      }
    })

    if (!lojaShopify) {
      const response = NextResponse.json(
        { error: 'Loja Shopify não encontrada para este domínio' },
        { status: 404 }
      )
      return addCorsHeaders(response)
    }

    // Buscar produtos correspondentes no banco de dados
    const produtosEncontrados = await prisma.produtos.findMany({
      where: {
        id_loja: lojaShopify.id_loja,
        OR: [
          {
            shopify_produto_id: {
              in: data.cart_items.map(item => item.product_id)
            }
          },
          {
            shopify_variante_id: {
              in: data.cart_items.map(item => item.variant_id)
            }
          }
        ]
      }
    })

    // Mapear produtos do carrinho com os produtos do banco
    const produtosMapeados = data.cart_items.map(cartItem => {
      const produtoEncontrado = produtosEncontrados.find(p => 
        p.shopify_produto_id === cartItem.product_id || 
        p.shopify_variante_id === cartItem.variant_id
      )

      return {
        id: produtoEncontrado?.id || cartItem.product_id,
        titulo: cartItem.title,
        preco: parseFloat(cartItem.price),
        quantidade: cartItem.quantity,
        imagem: cartItem.image,
        variante: cartItem.variant_title,
        shopify_produto_id: cartItem.product_id,
        shopify_variante_id: cartItem.variant_id,
        produto_encontrado: !!produtoEncontrado
      }
    })

    // Calcular total
    const total = produtosMapeados.reduce((sum, item) => 
      sum + (item.preco * item.quantidade), 0
    )

    // Criar sessão de checkout temporária
    const checkoutSession = {
      id: `shopify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      loja_id: lojaShopify.id_loja,
      produtos: produtosMapeados,
      total: total,
      customer: data.customer,
      currency: data.currency || 'BRL',
      origem: 'shopify',
      shop_domain: data.shop_domain,
      created_at: new Date().toISOString()
    }

    // Armazenar sessão temporariamente (você pode usar Redis ou banco de dados)
    // Por enquanto, vamos codificar em base64 para passar na URL
    const sessionData = Buffer.from(JSON.stringify(checkoutSession)).toString('base64')

    // Gerar URL do checkout personalizado
    const checkoutUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://checkout.pesquisaencomenda.online'}/shopify-checkout?session=${sessionData}`

    const response = NextResponse.json({
      success: true,
      checkout_url: checkoutUrl,
      session_id: checkoutSession.id,
      produtos_encontrados: produtosMapeados.filter(p => p.produto_encontrado).length,
      total_produtos: produtosMapeados.length,
      total: total,
      message: 'Checkout criado com sucesso'
    })
    return addCorsHeaders(response)

  } catch (error) {
    console.error('Erro ao processar checkout Shopify:', error)
    const response = NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}

// Endpoint GET para verificar status da integração
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const domain = searchParams.get('domain')

  if (!domain) {
    const response = NextResponse.json(
      { error: 'Parâmetro domain é obrigatório' },
      { status: 400 }
    )
    return addCorsHeaders(response)
  }

  try {
    const lojaShopify = await prisma.loja_Shopify.findFirst({
      where: {
        dominio_api: domain
      }
    })

    if (!lojaShopify) {
      const response = NextResponse.json(
        { error: 'Loja não encontrada' },
        { status: 404 }
      )
      return addCorsHeaders(response)
    }

    const response = NextResponse.json({
      success: true,
      loja_id: lojaShopify.id_loja,
      domain: lojaShopify.dominio_api,
      configured: true
    })
    return addCorsHeaders(response)

  } catch (error) {
    console.error('Erro ao verificar configuração:', error)
    const response = NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}