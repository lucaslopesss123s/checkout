import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { getSSLStatus, enableUniversalSSL, CloudflareConfig } from '@/lib/cloudflare-config'
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

// GET - Verificar status SSL de uma zona
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
    const zoneId = searchParams.get('zoneId')

    if (!storeId) {
      const response = NextResponse.json(
        { error: 'ID da loja é obrigatório' },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

    if (!zoneId) {
      const response = NextResponse.json(
        { error: 'ID da zona é obrigatório' },
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

    // Verificar status SSL
    const sslStatus = await getSSLStatus(config, zoneId)

    const response = NextResponse.json({
      success: true,
      zoneId,
      sslStatus,
      universalSSL: sslStatus.find((cert: any) => cert.type === 'universal')
    })
    return addCorsHeaders(response)

  } catch (error: any) {
    console.error('Erro ao verificar SSL Cloudflare:', error)
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

// POST - Ativar SSL Universal para uma zona
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

    const { storeId, zoneId, zoneName } = await request.json()

    if (!storeId) {
      const response = NextResponse.json(
        { error: 'ID da loja é obrigatório' },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

    if (!zoneId) {
      const response = NextResponse.json(
        { error: 'ID da zona é obrigatório' },
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

    // Ativar SSL Universal
    const sslResult = await enableUniversalSSL(config, zoneId)

    // Registrar ativação no banco de dados
    await prisma.cloudflare_zones.updateMany({
      where: {
        cloudflare_id: zoneId,
        id_loja: storeId
      },
      data: {
        ssl_enabled: true,
        ssl_activated_at: new Date(),
        updatedAt: new Date()
      }
    })

    const response = NextResponse.json({
      success: true,
      message: 'SSL Universal ativado com sucesso',
      zoneId,
      zoneName,
      sslResult
    })
    return addCorsHeaders(response)

  } catch (error: any) {
    console.error('Erro ao ativar SSL Cloudflare:', error)
    
    let errorMessage = 'Erro ao ativar SSL Universal'
    if (error.message?.includes('already enabled')) {
      errorMessage = 'SSL Universal já está ativo para esta zona'
    } else if (error.message?.includes('zone not active')) {
      errorMessage = 'Zona não está ativa. Configure os nameservers primeiro.'
    }
    
    const response = NextResponse.json(
      { 
        error: errorMessage,
        details: error.message 
      },
      { status: 400 }
    )
    return addCorsHeaders(response)
  }
}

// PUT - Configurar SSL settings (modo, nível de segurança, etc.)
export async function PUT(request: NextRequest) {
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

    const { storeId, zoneId, sslMode, securityLevel, alwaysUseHttps } = await request.json()

    if (!storeId || !zoneId) {
      const response = NextResponse.json(
        { error: 'ID da loja e zona são obrigatórios' },
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

    const config: CloudflareConfig = {
      apiToken: cloudflareConfig.api_token,
      email: cloudflareConfig.email || undefined
    }

    const updates = []

    // Configurar modo SSL se especificado
    if (sslMode) {
      const sslModeResponse = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/ssl`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${config.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: sslMode })
      })
      
      if (!sslModeResponse.ok) {
        throw new Error('Erro ao configurar modo SSL')
      }
      
      updates.push(`Modo SSL: ${sslMode}`)
    }

    // Configurar Always Use HTTPS se especificado
    if (alwaysUseHttps !== undefined) {
      const httpsResponse = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/settings/always_use_https`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${config.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: alwaysUseHttps ? 'on' : 'off' })
      })
      
      if (!httpsResponse.ok) {
        throw new Error('Erro ao configurar Always Use HTTPS')
      }
      
      updates.push(`Always Use HTTPS: ${alwaysUseHttps ? 'Ativado' : 'Desativado'}`)
    }

    const response = NextResponse.json({
      success: true,
      message: 'Configurações SSL atualizadas com sucesso',
      updates
    })
    return addCorsHeaders(response)

  } catch (error: any) {
    console.error('Erro ao configurar SSL:', error)
    const response = NextResponse.json(
      { 
        error: 'Erro ao configurar SSL',
        details: error.message 
      },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}