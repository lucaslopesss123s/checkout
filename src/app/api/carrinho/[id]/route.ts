import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// DELETE - Deletar carrinho específico
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Verificar se o carrinho existe
    const carrinhoExistente = await prisma.carrinho.findUnique({
      where: { id }
    })

    if (!carrinhoExistente) {
      return NextResponse.json(
        { error: 'Carrinho não encontrado' },
        { status: 404 }
      )
    }

    // Deletar o carrinho
    await prisma.carrinho.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Carrinho deletado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao deletar carrinho:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}