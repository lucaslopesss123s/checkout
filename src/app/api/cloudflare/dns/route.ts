import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { 
  listDNSRecords, 
  createDNSRecord, 
  updateDNSRecord, 
  deleteDNSRecord,
  getZoneByName 
} from '@/lib/cloudflare-config'
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

// Função para obter credenciais do Cloudflare
async function getCloudflareCredentials(storeId: string, userId: string) {
  const cloudflareConfig = await prisma.cloudflare_config.findFirst({
    where: {
      id_loja: storeId,
      status: 'active'
    }
  })

  if (!cloudflareConfig) {
    throw new Error('Configuração do Cloudflare não encontrada')
  }

  return {
    email: cloudflareConfig.email,
    apiToken: cloudflareConfig.api_token,
    apiKey: cloudflareConfig.api_key
  }
}

// GET - Listar registros DNS
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
    const recordType = searchParams.get('type')
    const recordName = searchParams.get('name')

    if (!storeId || !zoneName) {
      const response = NextResponse.json(
        { error: 'ID da loja e nome da zona são obrigatórios' },
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

    try {
      const credentials = await getCloudflareCredentials(storeId, userId)
      
      // Obter zona
      const zone = await getZoneByName(credentials, zoneName)
      if (!zone) {
        const response = NextResponse.json(
          { error: 'Zona não encontrada no Cloudflare' },
          { status: 404 }
        )
        return addCorsHeaders(response)
      }

      // Listar registros DNS
      const records = await listDNSRecords(credentials, zone.id, recordType, recordName)

      const response = NextResponse.json({
        success: true,
        zone: {
          id: zone.id,
          name: zone.name,
          status: zone.status
        },
        records: records.map(record => ({
          id: record.id,
          type: record.type,
          name: record.name,
          content: record.content,
          ttl: record.ttl,
          proxied: record.proxied,
          priority: record.priority
        }))
      })
      return addCorsHeaders(response)

    } catch (error) {
      console.error('Erro ao listar registros DNS:', error)
      const response = NextResponse.json(
        { error: 'Erro ao conectar com Cloudflare. Verifique suas credenciais.' },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

  } catch (error) {
    console.error('Erro ao obter registros DNS:', error)
    const response = NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}

// POST - Criar registro DNS
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

    const { storeId, zoneName, type, name, content, ttl, proxied, priority } = await request.json()

    if (!storeId || !zoneName || !type || !name || !content) {
      const response = NextResponse.json(
        { error: 'Campos obrigatórios: storeId, zoneName, type, name, content' },
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

    try {
      const credentials = await getCloudflareCredentials(storeId, userId)
      
      // Obter zona
      const zone = await getZoneByName(credentials, zoneName)
      if (!zone) {
        const response = NextResponse.json(
          { error: 'Zona não encontrada no Cloudflare' },
          { status: 404 }
        )
        return addCorsHeaders(response)
      }

      // Criar registro DNS
      const record = await createDNSRecord(credentials, zone.id, {
        type,
        name,
        content,
        ttl,
        proxied,
        priority
      })

      const response = NextResponse.json({
        success: true,
        message: 'Registro DNS criado com sucesso',
        record: {
          id: record.id,
          type: record.type,
          name: record.name,
          content: record.content,
          ttl: record.ttl,
          proxied: record.proxied,
          priority: record.priority
        }
      })
      return addCorsHeaders(response)

    } catch (error) {
      console.error('Erro ao criar registro DNS:', error)
      const response = NextResponse.json(
        { error: `Erro ao criar registro DNS: ${error.message}` },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

  } catch (error) {
    console.error('Erro ao criar registro DNS:', error)
    const response = NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}

// PUT - Atualizar registro DNS
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
    const userId = decoded.userId

    const { storeId, zoneName, recordId, type, name, content, ttl, proxied, priority } = await request.json()

    if (!storeId || !zoneName || !recordId) {
      const response = NextResponse.json(
        { error: 'Campos obrigatórios: storeId, zoneName, recordId' },
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

    try {
      const credentials = await getCloudflareCredentials(storeId, userId)
      
      // Obter zona
      const zone = await getZoneByName(credentials, zoneName)
      if (!zone) {
        const response = NextResponse.json(
          { error: 'Zona não encontrada no Cloudflare' },
          { status: 404 }
        )
        return addCorsHeaders(response)
      }

      // Atualizar registro DNS
      const updateData: any = {}
      if (type) updateData.type = type
      if (name) updateData.name = name
      if (content) updateData.content = content
      if (ttl) updateData.ttl = ttl
      if (proxied !== undefined) updateData.proxied = proxied
      if (priority) updateData.priority = priority

      const record = await updateDNSRecord(credentials, zone.id, recordId, updateData)

      const response = NextResponse.json({
        success: true,
        message: 'Registro DNS atualizado com sucesso',
        record: {
          id: record.id,
          type: record.type,
          name: record.name,
          content: record.content,
          ttl: record.ttl,
          proxied: record.proxied,
          priority: record.priority
        }
      })
      return addCorsHeaders(response)

    } catch (error) {
      console.error('Erro ao atualizar registro DNS:', error)
      const response = NextResponse.json(
        { error: `Erro ao atualizar registro DNS: ${error.message}` },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

  } catch (error) {
    console.error('Erro ao atualizar registro DNS:', error)
    const response = NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}

// DELETE - Deletar registro DNS
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
    const zoneName = searchParams.get('zoneName')
    const recordId = searchParams.get('recordId')

    if (!storeId || !zoneName || !recordId) {
      const response = NextResponse.json(
        { error: 'Parâmetros obrigatórios: storeId, zoneName, recordId' },
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

    try {
      const credentials = await getCloudflareCredentials(storeId, userId)
      
      // Obter zona
      const zone = await getZoneByName(credentials, zoneName)
      if (!zone) {
        const response = NextResponse.json(
          { error: 'Zona não encontrada no Cloudflare' },
          { status: 404 }
        )
        return addCorsHeaders(response)
      }

      // Deletar registro DNS
      await deleteDNSRecord(credentials, zone.id, recordId)

      const response = NextResponse.json({
        success: true,
        message: 'Registro DNS deletado com sucesso'
      })
      return addCorsHeaders(response)

    } catch (error) {
      console.error('Erro ao deletar registro DNS:', error)
      const response = NextResponse.json(
        { error: `Erro ao deletar registro DNS: ${error.message}` },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

  } catch (error) {
    console.error('Erro ao deletar registro DNS:', error)
    const response = NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}