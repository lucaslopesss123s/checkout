import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// GET - Listar todos os templates de email da loja
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar o id_loja do usuário
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id_loja: true }
    })

    if (!user?.id_loja) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })
    }

    const templates = await prisma.marketing.findMany({
      where: {
        id_loja: user.id_loja,
        tipo: 'email'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Erro ao buscar templates:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo template de email
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar o id_loja do usuário
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id_loja: true }
    })

    if (!user?.id_loja) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 })
    }

    const body = await request.json()
    const { evento, tempo, assunto, mensagem, status } = body

    // Validações
    if (!evento || !assunto || !mensagem) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: evento, assunto, mensagem' },
        { status: 400 }
      )
    }

    // Verificar se já existe um template para este evento
    const existingTemplate = await prisma.marketing.findFirst({
      where: {
        id_loja: user.id_loja,
        tipo: 'email',
        evento: evento
      }
    })

    if (existingTemplate) {
      return NextResponse.json(
        { error: 'Já existe um template para este evento' },
        { status: 400 }
      )
    }

    const template = await prisma.marketing.create({
      data: {
        id_loja: user.id_loja,
        tipo: 'email',
        evento,
        tempo: tempo || 60,
        assunto,
        mensagem,
        status: status || 'ativo'
      }
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar template:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}