import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST - Cancelar evento de marketing (quando compra é finalizada)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id, evento } = body

    // Validações básicas
    if (!session_id || !evento) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: session_id, evento' },
        { status: 400 }
      )
    }

    // Cancelar eventos pendentes para esta sessão
    const eventosAtualizados = await prisma.marketingEvents.updateMany({
      where: {
        session_id: session_id,
        evento: evento,
        status: 'pendente'
      },
      data: {
        status: 'cancelado',
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: `${eventosAtualizados.count} evento(s) cancelado(s)`,
      eventos_cancelados: eventosAtualizados.count
    })

  } catch (error) {
    console.error('Erro ao cancelar evento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}