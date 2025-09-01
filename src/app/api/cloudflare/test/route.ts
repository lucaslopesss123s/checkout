import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { listZones } from '@/lib/cloudflare-config'
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

// POST - Testar conexão com Cloudflare
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
    const userId = decoded.userId

    const body = await request.json()
    const { id_loja, api_token, email } = body

    if (!id_loja) {
      const response = NextResponse.json(
        { error: 'ID da loja é obrigatório' },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

    if (!api_token || !email) {
      const response = NextResponse.json(
        { error: 'API Token e Email são obrigatórios' },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

    // Verificar se o usuário tem acesso à loja
    const loja = await prisma.loja_admin.findFirst({
      where: {
        id: id_loja,
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

    try {
      // Testar conexão com Cloudflare
      const cloudflareConfig = {
        apiToken: api_token,
        email: email,
        apiKey: '' // Não é necessário para teste com API Token
      }
      
      // Tentar listar zonas para validar as credenciais
      const zones = await listZones(cloudflareConfig)
      
      const response = NextResponse.json({
        success: true,
        message: 'Conexão com Cloudflare estabelecida com sucesso',
        zonesCount: zones.length
      })
      return addCorsHeaders(response)

    } catch (error: any) {
      console.error('Erro ao testar conexão Cloudflare:', error)
      
      let errorMessage = 'Erro ao conectar com Cloudflare'
      if (error.message?.includes('Invalid request headers')) {
        errorMessage = 'Token de API inválido'
      } else if (error.message?.includes('Authentication')) {
        errorMessage = 'Credenciais inválidas'
      } else if (error.message?.includes('Forbidden')) {
        errorMessage = 'Token sem permissões necessárias'
      }
      
      const response = NextResponse.json(
        { 
          success: false,
          error: errorMessage,
          details: error.message 
        },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

  } catch (error) {
    console.error('Erro ao testar configuração Cloudflare:', error)
    const response = NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}