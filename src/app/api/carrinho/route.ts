import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// POST - Salvar/Atualizar carrinho
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id_loja,
      session_id,
      nome,
      email,
      telefone,
      cpf,
      cep,
      endereco,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      itens,
      valor_total,
      valor_frete,
      metodo_pagamento,
      ip_cliente,
      user_agent,
      primeira_etapa_completada
    } = body

    if (!id_loja || !session_id) {
      return NextResponse.json(
        { error: 'ID da loja e session_id são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se já existe um carrinho para esta sessão
    const carrinhoExistente = await prisma.carrinho.findFirst({
      where: {
        session_id: session_id,
        id_loja: id_loja
      }
    })

    const dadosCarrinho = {
      id_loja,
      session_id,
      nome: nome || null,
      email: email || null,
      telefone: telefone || null,
      cpf: cpf || null,
      cep: cep || null,
      endereco: endereco || null,
      numero: numero || null,
      complemento: complemento || null,
      bairro: bairro || null,
      cidade: cidade || null,
      estado: estado || null,
      itens: itens || [],
      valor_total: valor_total || null,
      valor_frete: valor_frete || null,
      metodo_pagamento: metodo_pagamento || null,
      ip_cliente: ip_cliente || null,
      user_agent: user_agent || null,
      primeira_etapa_em: primeira_etapa_completada ? new Date() : null,
      ultima_atividade: new Date()
    }

    let carrinho

    if (carrinhoExistente) {
      // Atualizar carrinho existente
      carrinho = await prisma.carrinho.update({
        where: { id: carrinhoExistente.id },
        data: {
          ...dadosCarrinho,
          // Manter a data da primeira etapa se já existir
          primeira_etapa_em: primeira_etapa_completada && !carrinhoExistente.primeira_etapa_em 
            ? new Date() 
            : carrinhoExistente.primeira_etapa_em
        }
      })
    } else {
      // Criar novo carrinho
      carrinho = await prisma.carrinho.create({
        data: dadosCarrinho
      })
    }

    return NextResponse.json({
      success: true,
      carrinho: {
        id: carrinho.id,
        primeira_etapa_em: carrinho.primeira_etapa_em
      }
    })

  } catch (error) {
    console.error('Erro ao salvar carrinho:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET - Buscar carrinhos por loja (para dashboard)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id_loja = searchParams.get('id_loja')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  try {
    const skip = (page - 1) * limit

    // Criar filtro base - todos os carrinhos são considerados abandonados
    const whereFilter: any = {}
    
    // Adicionar filtro de loja apenas se especificado
    if (id_loja) {
      whereFilter.id_loja = id_loja
    }

    const [carrinhos, total] = await Promise.all([
      prisma.carrinho.findMany({
        where: whereFilter,
        orderBy: {
          ultima_atividade: 'desc'
        },
        skip,
        take: limit,
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          valor_total: true,
          itens: true,
          primeira_etapa_em: true,
          ultima_atividade: true,
          createdAt: true
        }
      }),
      prisma.carrinho.count({
        where: whereFilter
      })
    ])

    return NextResponse.json({
      success: true,
      carrinhos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Erro ao buscar carrinhos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar carrinho (usado quando finalizar compra)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const carrinho_id = searchParams.get('carrinho_id')
    const session_id = searchParams.get('session_id')
    const id_loja = searchParams.get('id_loja')

    if (!carrinho_id && (!session_id || !id_loja)) {
      return NextResponse.json(
        { error: 'ID do carrinho ou (session_id + id_loja) são obrigatórios' },
        { status: 400 }
      )
    }

    let carrinho

    if (carrinho_id) {
      // Deletar por ID do carrinho
      carrinho = await prisma.carrinho.delete({
        where: { id: carrinho_id }
      })
    } else {
      // Deletar por session_id e id_loja
      const carrinhoExistente = await prisma.carrinho.findFirst({
        where: {
          session_id: session_id!,
          id_loja: id_loja!
        }
      })

      if (carrinhoExistente) {
        carrinho = await prisma.carrinho.delete({
          where: { id: carrinhoExistente.id }
        })
      } else {
        return NextResponse.json(
          { error: 'Carrinho não encontrado' },
          { status: 404 }
        )
      }
    }

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