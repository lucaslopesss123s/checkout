import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Simulação de WebSocket usando Server-Sent Events (SSE)
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

    // Configurar headers para Server-Sent Events
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    })

    // Criar stream de dados
    const stream = new ReadableStream({
      start(controller) {
        let isClosed = false

        const sendUpdate = async () => {
          try {
            // Verificar se o controller ainda está aberto
            if (isClosed) {
              return
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

            // Enviar dados via SSE apenas se o controller ainda estiver aberto
            if (!isClosed) {
              const data = JSON.stringify({
                type: 'sessions_update',
                data: processedSessions,
                timestamp: new Date().toISOString()
              })

              controller.enqueue(`data: ${data}\n\n`)
            }
          } catch (error) {
            console.error('Erro ao buscar sessões em tempo real:', error)
            // Só enviar erro se o controller ainda estiver aberto
            if (!isClosed) {
              try {
                controller.enqueue(`data: ${JSON.stringify({ type: 'error', message: 'Erro ao buscar dados' })}\n\n`)
              } catch (controllerError) {
                // Controller já foi fechado, marcar como fechado
                isClosed = true
              }
            }
          }
        }

        // Enviar dados iniciais
        sendUpdate()

        // Configurar intervalo para atualizações (a cada 5 segundos)
        const interval = setInterval(sendUpdate, 5000)

        // Cleanup quando a conexão for fechada
        return () => {
          isClosed = true
          clearInterval(interval)
        }
      }
    })

    return new Response(stream, { headers })

  } catch (error) {
    console.error('Erro no endpoint de tempo real:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Notificar mudança específica (para trigger manual)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id_loja, session_id, event_type } = body

    if (!id_loja || !session_id) {
      return NextResponse.json(
        { error: 'ID da loja e session_id são obrigatórios' },
        { status: 400 }
      )
    }

    // Aqui poderia implementar um sistema de notificação mais sofisticado
    // Por enquanto, apenas retornamos sucesso
    return NextResponse.json({
      success: true,
      message: 'Notificação enviada',
      event_type,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao enviar notificação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}