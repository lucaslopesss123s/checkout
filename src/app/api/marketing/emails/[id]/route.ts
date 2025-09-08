import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// PUT - Atualizar template de email
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params
    const body = await request.json()

    // Verificar se o template existe e pertence à loja do usuário
    const existingTemplate = await prisma.marketing.findFirst({
      where: {
        id: id,
        id_loja: user.id_loja,
        tipo: 'email'
      }
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template não encontrado' },
        { status: 404 }
      )
    }

    // Se está alterando apenas o status
    if (body.status && Object.keys(body).length === 1) {
      const updatedTemplate = await prisma.marketing.update({
        where: { id: id },
        data: { status: body.status }
      })
      return NextResponse.json(updatedTemplate)
    }

    // Atualização completa
    const { evento, tempo, assunto, mensagem, status } = body

    // Se está mudando o evento, verificar se não existe outro template para o novo evento
    if (evento && evento !== existingTemplate.evento) {
      const conflictingTemplate = await prisma.marketing.findFirst({
        where: {
          id_loja: user.id_loja,
          tipo: 'email',
          evento: evento,
          id: { not: id }
        }
      })

      if (conflictingTemplate) {
        return NextResponse.json(
          { error: 'Já existe um template para este evento' },
          { status: 400 }
        )
      }
    }

    const updatedTemplate = await prisma.marketing.update({
      where: { id: id },
      data: {
        ...(evento && { evento }),
        ...(tempo !== undefined && { tempo }),
        ...(assunto && { assunto }),
        ...(mensagem && { mensagem }),
        ...(status && { status })
      }
    })

    return NextResponse.json(updatedTemplate)
  } catch (error) {
    console.error('Erro ao atualizar template:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir template de email
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params

    // Verificar se o template existe e pertence à loja do usuário
    const existingTemplate = await prisma.marketing.findFirst({
      where: {
        id: id,
        id_loja: user.id_loja,
        tipo: 'email'
      }
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template não encontrado' },
        { status: 404 }
      )
    }

    await prisma.marketing.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: 'Template excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir template:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}