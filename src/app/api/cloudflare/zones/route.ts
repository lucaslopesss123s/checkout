import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { listZones, getZoneByName } from '@/lib/cloudflare-config'
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

// GET - Listar zonas do Cloudflare
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
    const userId = decoded.userId

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const zoneName = searchParams.get('zoneName')

    if (!storeId) {
      const response = NextResponse.json(
        { error: 'ID da loja é obrigatório' },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

    // Verificar se o usuário tem acesso à loja
    const loja = await prisma.lojas.findFirst({
      where: {
        id: storeId,
        id_usuario: userId
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
        id_loja: storeId,
        status: 'active'
      }
    })

    if (!cloudflareConfig) {
      const response = NextResponse.json(
        { error: 'Configuração do Cloudflare não encontrada' },
        { status: 404 }
      )
      return addCorsHeaders(response)
    }

    // Preparar credenciais
    const credentials = {
      email: cloudflareConfig.email,
      apiToken: cloudflareConfig.api_token,
      apiKey: cloudflareConfig.api_key
    }

    try {
      let zones
      if (zoneName) {
        // Buscar zona específica
        const zone = await getZoneByName(credentials, zoneName)
        zones = zone ? [zone] : []
      } else {
        // Listar todas as zonas
        zones = await listZones(credentials)
      }

      // Atualizar contador de zonas
      await prisma.cloudflare_config.update({
        where: {
          id: cloudflareConfig.id
        },
        data: {
          zonas_count: zones.length,
          updated_at: new Date()
        }
      })

      const response = NextResponse.json({
        success: true,
        zones: zones.map(zone => ({
          id: zone.id,
          name: zone.name,
          status: zone.status,
          nameServers: zone.nameServers || []
        }))
      })
      return addCorsHeaders(response)

    } catch (error) {
      console.error('Erro ao listar zonas Cloudflare:', error)
      const response = NextResponse.json(
        { error: 'Erro ao conectar com Cloudflare. Verifique suas credenciais.' },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

  } catch (error) {
    console.error('Erro ao obter zonas Cloudflare:', error)
    const response = NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}