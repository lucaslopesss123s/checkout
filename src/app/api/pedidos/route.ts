import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id_loja,
      nome,
      email,
      telefone,
      cep,
      endereco,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      itens,
      valor_total,
      metodo_pagamento,
      carrinho_id
    } = body;

    // Criar o pedido
    const pedido = await prisma.pedidos.create({
      data: {
        id_loja: id_loja,
        id_carrinho: carrinho_id ? parseInt(carrinho_id) : null,
        nome,
        email,
        telefone,
        cep,
        endereco,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        itens: JSON.stringify(itens),
        valor_total: parseFloat(valor_total),
        metodo_pagamento: metodo_pagamento === 'card' ? 'card' : 'pix',
        status: 'pending',
        numero_pedido: `PED-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      }
    });

    // Atualizar status do carrinho para finalizado se fornecido
    if (carrinho_id) {
      await prisma.carrinho.update({
        where: {
          id: parseInt(carrinho_id)
        },
        data: {
          status: 'finalizado'
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      pedido,
      message: 'Pedido criado com sucesso!' 
    });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lojaId = searchParams.get('loja_id');

    if (!lojaId) {
      return NextResponse.json(
        { error: 'ID da loja é obrigatório' },
        { status: 400 }
      );
    }

    const pedidos = await prisma.pedidos.findMany({
      where: {
        id_loja: parseInt(lojaId)
      },
      orderBy: {
        finalizado_em: 'desc'
      }
    });

    // Processar os itens JSON
    const pedidosProcessados = pedidos.map(pedido => ({
      ...pedido,
      itens: pedido.itens ? JSON.parse(pedido.itens) : []
    }));

    return NextResponse.json({ pedidos: pedidosProcessados });
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}