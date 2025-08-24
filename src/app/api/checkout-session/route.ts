import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Buscar sessões ativas de uma loja
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id_loja = searchParams.get('id_loja')

    if (!id_loja) {
      return NextResponse.json(
        { error: 'ID da loja é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar sessões ativas dos últimos 30 minutos
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
    
    const sessions = await prisma.checkoutSession.findMany({
      where: {
        id_loja,
        ativo: true,
        ultima_atividade: {
          gte: thirtyMinutesAgo
        }
      },
      orderBy: {
        entrada_em: 'desc'
      }
    })

    // Processar dados para exibição
    const processedSessions = sessions.map(session => ({
      id: session.id,
      nome: session.nome || 'Cliente Anônimo',
      email: session.email,
      telefone: session.telefone,
      etapa_atual: session.etapa_atual,
      itens: session.itens,
      valor_total: session.valor_total,
      entrada_em: session.entrada_em,
      ultima_atividade: session.ultima_atividade
    }))

    return NextResponse.json({
      success: true,
      sessions: processedSessions,
      total: processedSessions.length
    })

  } catch (error) {
    console.error('Erro ao buscar sessões:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar ou atualizar sessão de checkout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id_loja,
      session_id,
      nome,
      email,
      telefone,
      etapa_atual,
      itens,
      valor_total,
      action // 'enter', 'update', 'exit'
    } = body

    if (!id_loja || !session_id) {
      return NextResponse.json(
        { error: 'ID da loja e session_id são obrigatórios' },
        { status: 400 }
      )
    }

    // Obter IP e User Agent
    const ip_cliente = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown'
    const user_agent = request.headers.get('user-agent') || 'unknown'

    let session

    if (action === 'exit') {
      // Marcar sessão como inativa
      session = await prisma.checkoutSession.update({
        where: { session_id },
        data: {
          ativo: false,
          saida_em: new Date(),
          ultima_atividade: new Date()
        }
      })
    } else {
      // Criar ou atualizar sessão
      session = await prisma.checkoutSession.upsert({
        where: { session_id },
        update: {
          nome: nome || undefined,
          email: email || undefined,
          telefone: telefone || undefined,
          etapa_atual: etapa_atual || undefined,
          itens: itens || undefined,
          valor_total: valor_total || undefined,
          ultima_atividade: new Date(),
          ativo: true,
          saida_em: null // Reativar se estava inativa
        },
        create: {
          id_loja,
          session_id,
          nome: nome || null,
          email: email || null,
          telefone: telefone || null,
          etapa_atual: etapa_atual || 'carrinho',
          itens: itens || [],
          valor_total: valor_total || null,
          ip_cliente,
          user_agent,
          ativo: true
        }
      })
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        session_id: session.session_id,
        nome: session.nome || 'Cliente Anônimo',
        etapa_atual: session.etapa_atual,
        ativo: session.ativo
      }
    })

  } catch (error) {
    console.error('Erro ao gerenciar sessão:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Limpar sessões antigas (pode ser chamado por cron)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hours = parseInt(searchParams.get('hours') || '2')
    
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000)
    
    const result = await prisma.checkoutSession.deleteMany({
      where: {
        OR: [
          {
            ativo: false,
            saida_em: {
              lt: cutoffTime
            }
          },
          {
            ultima_atividade: {
              lt: cutoffTime
            }
          }
        ]
      }
    })

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `${result.count} sessões antigas foram removidas`
    })

  } catch (error) {
    console.error('Erro ao limpar sessões:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}