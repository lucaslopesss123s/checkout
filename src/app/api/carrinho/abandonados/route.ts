import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// POST - Processar carrinhos abandonados automaticamente
export async function POST(request: NextRequest) {
  try {
    // Definir tempo limite para considerar carrinho abandonado (30 minutos)
    const TEMPO_ABANDONO_MINUTOS = 30
    const tempoLimite = new Date(Date.now() - TEMPO_ABANDONO_MINUTOS * 60 * 1000)

    console.log(`Processando carrinhos abandonados. Tempo limite: ${tempoLimite.toISOString()}`)

    // Buscar carrinhos iniciados que não tiveram atividade recente
    const carrinhosParaAbandonar = await prisma.carrinho.findMany({
      where: {
        status: 'iniciado',
        ultima_atividade: {
          lt: tempoLimite
        },
        // Apenas carrinhos que completaram pelo menos a primeira etapa
        OR: [
          { email: { not: null } },
          { telefone: { not: null } }
        ]
      },
      select: {
        id: true,
        session_id: true,
        nome: true,
        email: true,
        telefone: true,
        ultima_atividade: true,
        createdAt: true
      }
    })

    console.log(`Encontrados ${carrinhosParaAbandonar.length} carrinhos para marcar como abandonados`)

    if (carrinhosParaAbandonar.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum carrinho para processar',
        processados: 0
      })
    }

    // Marcar carrinhos como abandonados
    const resultado = await prisma.carrinho.updateMany({
      where: {
        id: {
          in: carrinhosParaAbandonar.map(c => c.id)
        }
      },
      data: {
        status: 'abandonado',
        ultima_atividade: new Date()
      }
    })

    console.log(`${resultado.count} carrinhos marcados como abandonados`)

    // Log dos carrinhos processados
    carrinhosParaAbandonar.forEach(carrinho => {
      console.log(`Carrinho abandonado: ID ${carrinho.id}, Session: ${carrinho.session_id}, Cliente: ${carrinho.nome || carrinho.email || carrinho.telefone || 'Anônimo'}`)
    })

    return NextResponse.json({
      success: true,
      message: `${resultado.count} carrinhos marcados como abandonados`,
      processados: resultado.count,
      carrinhos: carrinhosParaAbandonar.map(c => ({
        id: c.id,
        session_id: c.session_id,
        cliente: c.nome || c.email || c.telefone || 'Anônimo',
        ultima_atividade: c.ultima_atividade
      }))
    })

  } catch (error) {
    console.error('Erro ao processar carrinhos abandonados:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

// GET - Obter estatísticas de carrinhos abandonados
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id_loja = searchParams.get('id_loja')

  try {
    const where = id_loja ? { id_loja } : {}

    const [totalAbandonados, abandonadosHoje, abandonadosUltimos7Dias] = await Promise.all([
      // Total de carrinhos abandonados
      prisma.carrinho.count({
        where: {
          ...where,
          status: 'abandonado'
        }
      }),
      
      // Carrinhos abandonados hoje
      prisma.carrinho.count({
        where: {
          ...where,
          status: 'abandonado',
          updatedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      
      // Carrinhos abandonados nos últimos 7 dias
      prisma.carrinho.count({
        where: {
          ...where,
          status: 'abandonado',
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ])

    return NextResponse.json({
      success: true,
      estatisticas: {
        total_abandonados: totalAbandonados,
        abandonados_hoje: abandonadosHoje,
        abandonados_ultimos_7_dias: abandonadosUltimos7Dias
      }
    })

  } catch (error) {
    console.error('Erro ao obter estatísticas:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    )
  }
}