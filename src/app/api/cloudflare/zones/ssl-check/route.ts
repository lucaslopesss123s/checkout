import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { 
  CloudflareConfig,
  setupAutomaticSSL,
  getCloudflareZone
} from '@/lib/cloudflare-config'
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Função para adicionar headers CORS
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

// OPTIONS - Preflight CORS
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 })
  return addCorsHeaders(response)
}

// POST - Verificar e ativar SSL para zonas ativas
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

    const { storeId } = await request.json()

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
    const cloudflareConfig = await prisma.cloudflare_config.findUnique({
      where: { id_loja: storeId }
    })

    if (!cloudflareConfig) {
      const response = NextResponse.json(
        { error: 'Configuração do Cloudflare não encontrada' },
        { status: 404 }
      )
      return addCorsHeaders(response)
    }

    const config: CloudflareConfig = {
      apiToken: cloudflareConfig.api_token,
      email: cloudflareConfig.email || undefined
    }

    // Buscar zonas ativas sem SSL configurado
    const zones = await prisma.cloudflare_zones.findMany({
      where: {
        config_id: cloudflareConfig.id,
        status: 'active',
        ssl_enabled: false
      }
    })

    const results = []

    for (const zone of zones) {
      try {
        console.log(`Verificando zona: ${zone.name} (${zone.cloudflare_id})`)
        
        // Verificar se a zona ainda está ativa no Cloudflare
        const cloudflareZone = await getCloudflareZone(config, zone.cloudflare_id)
        
        if (cloudflareZone.result.status === 'active') {
          console.log(`Configurando SSL para zona ativa: ${zone.name}`)
          
          // Configurar SSL automaticamente
          await setupAutomaticSSL(config, zone.cloudflare_id)
          
          // Atualizar zona no banco
          await prisma.cloudflare_zones.update({
            where: { id: zone.id },
            data: {
              ssl_enabled: true,
              ssl_mode: 'full',
              ssl_activated_at: new Date(),
              always_use_https: true,
              status: cloudflareZone.result.status
            }
          })
          
          results.push({
            zoneId: zone.cloudflare_id,
            zoneName: zone.name,
            success: true,
            message: 'SSL configurado automaticamente'
          })
        } else {
          // Atualizar status da zona
          await prisma.cloudflare_zones.update({
            where: { id: zone.id },
            data: {
              status: cloudflareZone.result.status
            }
          })
          
          results.push({
            zoneId: zone.cloudflare_id,
            zoneName: zone.name,
            success: false,
            message: `Zona não está ativa (status: ${cloudflareZone.result.status})`
          })
        }
      } catch (error: any) {
        console.error(`Erro ao processar zona ${zone.name}:`, error)
        results.push({
          zoneId: zone.cloudflare_id,
          zoneName: zone.name,
          success: false,
          error: error.message
        })
      }
    }

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    const response = NextResponse.json({
      success: true,
      message: `Verificação SSL concluída: ${successful} sucessos, ${failed} falhas`,
      summary: {
        total: zones.length,
        successful,
        failed
      },
      results
    })
    return addCorsHeaders(response)

  } catch (error: any) {
    console.error('Erro ao verificar SSL das zonas:', error)
    const response = NextResponse.json(
      { 
        error: 'Erro ao verificar SSL',
        details: error.message 
      },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}

// GET - Listar status SSL das zonas
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

    // Verificar acesso à loja
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
    const cloudflareConfig = await prisma.cloudflare_config.findUnique({
      where: { id_loja: storeId }
    })

    if (!cloudflareConfig) {
      const response = NextResponse.json(
        { error: 'Configuração do Cloudflare não encontrada' },
        { status: 404 }
      )
      return addCorsHeaders(response)
    }

    // Buscar zonas com informações SSL
    const zones = await prisma.cloudflare_zones.findMany({
      where: {
        config_id: cloudflareConfig.id
      },
      select: {
        id: true,
        cloudflare_id: true,
        name: true,
        status: true,
        ssl_enabled: true,
        ssl_mode: true,
        ssl_activated_at: true,
        always_use_https: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const sslStats = {
      total: zones.length,
      sslEnabled: zones.filter(z => z.ssl_enabled).length,
      sslDisabled: zones.filter(z => !z.ssl_enabled).length,
      activeZones: zones.filter(z => z.status === 'active').length,
      pendingZones: zones.filter(z => z.status === 'pending').length
    }

    const response = NextResponse.json({
      success: true,
      zones,
      statistics: sslStats
    })
    return addCorsHeaders(response)

  } catch (error: any) {
    console.error('Erro ao buscar status SSL:', error)
    const response = NextResponse.json(
      { 
        error: 'Erro ao buscar status SSL',
        details: error.message 
      },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}