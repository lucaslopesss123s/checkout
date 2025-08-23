import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// POST - Marcar todos os carrinhos de uma loja como abandonados
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id_loja } = body

    if (!id_loja) {
      return NextResponse.json(
        { error: 'ID da loja é obrigatório' },
        { status: 400 }
      )
    }

    console.log(`Marcando todos os carrinhos da loja ${id_loja} como abandonados...`)

    // Buscar todos os carrinhos da loja que não estão como abandonados
    const carrinhosParaMarcar = await prisma.carrinho.findMany({
      where: {
        id_loja: id_loja,
        status: { not: 'abandonado' }
      },
      select: {
        id: true,
        session_id: true,
        nome: true,
        email: true,
        telefone: true,
        status: true,
        createdAt: true
      }
    })

    console.log(`Encontrados ${carrinhosParaMarcar.length} carrinhos para marcar como abandonados`)

    if (carrinhosParaMarcar.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum carrinho encontrado para marcar como abandonado',
        processados: 0
      })
    }

    // Marcar todos os carrinhos como abandonados
    const resultado = await prisma.carrinho.updateMany({
      where: {
        id_loja: id_loja,
        status: { not: 'abandonado' }
      },
      data: {
        status: 'abandonado',
        ultima_atividade: new Date()
      }
    })

    console.log(`${resultado.count} carrinhos marcados como abandonados`)

    // Log dos carrinhos processados
    carrinhosParaMarcar.forEach(carrinho => {
      console.log(`Carrinho marcado como abandonado: ID ${carrinho.id}, Session: ${carrinho.session_id}, Cliente: ${carrinho.nome || carrinho.email || carrinho.telefone || 'Anônimo'}, Status anterior: ${carrinho.status}`)
    })

    return NextResponse.json({
      success: true,
      message: `${resultado.count} carrinhos marcados como abandonados`,
      processados: resultado.count,
      carrinhos: carrinhosParaMarcar.map(c => ({
        id: c.id,
        session_id: c.session_id,
        cliente: c.nome || c.email || c.telefone || 'Anônimo',
        status_anterior: c.status,
        status_novo: 'abandonado'
      }))
    })

  } catch (error) {
    console.error('Erro ao marcar carrinhos como abandonados:', error)
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

// GET - Listar todos os carrinhos de uma loja (independente do status)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id_loja = searchParams.get('id_loja')

  if (!id_loja) {
    return NextResponse.json(
      { error: 'ID da loja é obrigatório' },
      { status: 400 }
    )
  }

  try {
    const carrinhos = await prisma.carrinho.findMany({
      where: {
        id_loja: id_loja
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        session_id: true,
        nome: true,
        email: true,
        telefone: true,
        valor_total: true,
        status: true,
        createdAt: true,
        ultima_atividade: true,
        itens: true
      }
    })

    const estatisticas = {
      total: carrinhos.length,
      iniciados: carrinhos.filter(c => c.status === 'iniciado').length,
      abandonados: carrinhos.filter(c => c.status === 'abandonado').length,
      convertidos: carrinhos.filter(c => c.status === 'convertido').length
    }

    return NextResponse.json({
      success: true,
      carrinhos,
      estatisticas
    })

  } catch (error) {
    console.error('Erro ao buscar carrinhos:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    )
  }
}