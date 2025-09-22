import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const carrinhoId = params.id;
    const { produtoId, quantidade, precoUnitario, isOrderBump } = await request.json();

    // Validar dados
    if (!produtoId || !quantidade || !precoUnitario) {
      return NextResponse.json(
        { error: 'Dados inválidos. Produto, quantidade e preço são obrigatórios.' },
        { status: 400 }
      );
    }

    // Verificar se o carrinho existe
    const carrinho = await prisma.carrinho.findUnique({
      where: { id: carrinhoId },
    });

    if (!carrinho) {
      return NextResponse.json(
        { error: 'Carrinho não encontrado.' },
        { status: 404 }
      );
    }

    // Verificar se o produto existe
    const produto = await prisma.produto.findUnique({
      where: { id: produtoId },
    });

    if (!produto) {
      return NextResponse.json(
        { error: 'Produto não encontrado.' },
        { status: 404 }
      );
    }

    // Adicionar item ao carrinho
    const itemCarrinho = await prisma.itemCarrinho.create({
      data: {
        carrinhoId,
        produtoId,
        quantidade,
        precoUnitario,
        isOrderBump: isOrderBump || false,
      },
    });

    // Atualizar o valor total do carrinho
    const valorTotal = await prisma.itemCarrinho.aggregate({
      where: { carrinhoId },
      _sum: {
        precoUnitario: true,
      },
    });

    await prisma.carrinho.update({
      where: { id: carrinhoId },
      data: {
        valorTotal: valorTotal._sum.precoUnitario || 0,
      },
    });

    return NextResponse.json(itemCarrinho, { status: 201 });
  } catch (error) {
    console.error('Erro ao adicionar item ao carrinho:', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar item ao carrinho.' },
      { status: 500 }
    );
  }
}