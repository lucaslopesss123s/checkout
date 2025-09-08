import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST - Registrar evento de carrinho abandonado
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      evento, 
      id_loja, 
      session_id, 
      email_cliente, 
      nome_cliente, 
      itens_carrinho, 
      valor_total,
      link_checkout 
    } = body

    // Validações básicas
    if (!evento || !id_loja || !session_id) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: evento, id_loja, session_id' },
        { status: 400 }
      )
    }

    // Verificar se existe template ativo para este evento
    const template = await prisma.marketing.findFirst({
      where: {
        id_loja: id_loja,
        tipo: 'email',
        evento: evento,
        status: 'ativo'
      }
    })

    if (!template) {
      return NextResponse.json(
        { message: 'Nenhum template ativo encontrado para este evento' },
        { status: 200 }
      )
    }

    // Verificar se já existe um evento pendente para esta sessão
    const eventoExistente = await prisma.marketing_events.findFirst({
      where: {
        session_id: session_id,
        evento: evento,
        status: 'pendente'
      }
    })

    if (eventoExistente) {
      // Atualizar evento existente
      await prisma.marketing_events.update({
        where: { id: eventoExistente.id },
        data: {
          email_cliente,
          nome_cliente,
          dados_evento: {
            itens_carrinho,
            valor_total,
            link_checkout
          },
          agendado_para: new Date(Date.now() + template.tempo * 60 * 1000), // tempo em minutos
          updatedAt: new Date()
        }
      })
    } else {
      // Criar novo evento
      await prisma.marketing_events.create({
        data: {
          id_loja: id_loja,
          template_id: template.id,
          session_id: session_id,
          evento: evento,
          email_cliente,
          nome_cliente,
          dados_evento: {
            itens_carrinho,
            valor_total,
            link_checkout
          },
          agendado_para: new Date(Date.now() + template.tempo * 60 * 1000),
          status: 'pendente'
        }
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Evento registrado com sucesso',
      agendado_para: new Date(Date.now() + template.tempo * 60 * 1000)
    })

  } catch (error) {
    console.error('Erro ao registrar evento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET - Listar eventos pendentes para processamento
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const processar = searchParams.get('processar')

    if (processar === 'true') {
      // Buscar eventos que devem ser processados agora
      const eventosParaProcessar = await prisma.marketing_events.findMany({
        where: {
          status: 'pendente',
          agendado_para: {
            lte: new Date()
          }
        },
        include: {
          template: true
        },
        take: 50 // Processar até 50 eventos por vez
      })

      return NextResponse.json({
        eventos: eventosParaProcessar,
        total: eventosParaProcessar.length
      })
    }

    // Listar todos os eventos (para debug)
    const eventos = await prisma.marketing_events.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    })

    return NextResponse.json({ eventos })

  } catch (error) {
    console.error('Erro ao buscar eventos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}