import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import jwt from 'jsonwebtoken'

// Função para verificar o token JWT
function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any
    return decoded.id // Mudança: usar 'id' ao invés de 'userId'
  } catch (error) {
    return null
  }
}

// GET - Buscar configurações da loja
export async function GET(request: NextRequest) {
  const userId = verifyToken(request)
  if (!userId) {
    return NextResponse.json(
      { error: 'Token inválido ou não fornecido' },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const id_loja = searchParams.get('id_loja')

  if (!id_loja) {
    return NextResponse.json(
      { error: 'ID da loja é obrigatório' },
      { status: 400 }
    )
  }

  try {
    // Verificar se a loja pertence ao usuário
    const loja = await prisma.loja_admin.findFirst({
      where: {
        id: id_loja,
        user_id: userId
      }
    })

    if (!loja) {
      return NextResponse.json(
        { error: 'Loja não encontrada ou não autorizada' },
        { status: 404 }
      )
    }

    // Buscar configurações da loja
    const config = await prisma.loja_config.findUnique({
      where: {
        id_loja: id_loja
      }
    })

    return NextResponse.json({
      success: true,
      config: config || {
        logo: null,
        cor_tema: '#0a101a',
        cor_botao: '#10b981',
        aviso: null
      }
    })

  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Salvar/Atualizar configurações da loja
export async function POST(request: NextRequest) {
  const userId = verifyToken(request)
  if (!userId) {
    return NextResponse.json(
      { error: 'Token inválido ou não fornecido' },
      { status: 401 }
    )
  }

  try {
    const { id_loja, settings } = await request.json()

    if (!id_loja) {
      return NextResponse.json(
        { error: 'ID da loja é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se a loja pertence ao usuário
    const loja = await prisma.loja_admin.findFirst({
      where: {
        id: id_loja,
        user_id: userId
      }
    })

    if (!loja) {
      return NextResponse.json(
        { error: 'Loja não encontrada ou não autorizada' },
        { status: 404 }
      )
    }

    // Verificar se já existe configuração
    const existingConfig = await prisma.loja_config.findUnique({
      where: {
        id_loja: id_loja
      }
    })

    let config
    if (existingConfig) {
      // Atualizar configuração existente
      config = await prisma.loja_config.update({
        where: {
          id_loja: id_loja
        },
        data: {
          logo: settings?.logo,
          cor_tema: settings?.cor_barra, // Mapeando cor_barra para cor_tema
          cor_botao: settings?.cor_botao,
          aviso: settings?.barra_texto, // Mapeando barra_texto para aviso
          updatedAt: new Date()
        }
      })
    } else {
      // Criar nova configuração
      config = await prisma.loja_config.create({
        data: {
          id_loja: id_loja,
          logo: settings?.logo,
          cor_tema: settings?.cor_barra, // Mapeando cor_barra para cor_tema
          cor_botao: settings?.cor_botao,
          aviso: settings?.barra_texto // Mapeando barra_texto para aviso
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Configurações salvas com sucesso',
      config_id: config.id
    })

  } catch (error) {
    console.error('Erro ao salvar configurações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}