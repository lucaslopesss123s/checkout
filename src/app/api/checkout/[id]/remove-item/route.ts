import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const carrinhoId = params.id;
    const { produtoId, isOrderBump } = await request.json();

    // Validar dados
    if (!produtoId) {
      return NextResponse.json(
        { error: 'ID do produto é obrigatório.' },
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

    // Buscar o item do carrinho
    const itemCarrinho = await prisma.itemCarrinho.findFirst({
      where: {
        carrinhoId,
        produtoId,
        isOrderBump: isOrderBump || false,
      },
    });

    if (!itemCarrinho) {
      return NextResponse.json(
        { error: 'Item não encontrado no carrinho.' },
        { status: 404 }
      );
    }

    // Remover o item do carrinho
    await prisma.itemCarrinho.delete({
      where: { id: itemCarrinho.id },
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

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Erro ao remover item do carrinho:', error);
    return NextResponse.json(
      { error: 'Erro ao remover item do carrinho.' },
      { status: 500 }
    );
  }
}