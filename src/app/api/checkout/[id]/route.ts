import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const checkoutId = params.id;

    // Buscar informações do checkout (carrinho)
    const checkout = await prisma.carrinho.findUnique({
      where: { id: checkoutId },
      include: {
        itensCarrinho: true,
      },
    });

    if (!checkout) {
      return NextResponse.json(
        { error: 'Checkout não encontrado.' },
        { status: 404 }
      );
    }

    // Buscar informações da loja
    const loja = await prisma.loja_admin.findUnique({
      where: { id: checkout.id_loja },
    });

    if (!loja) {
      return NextResponse.json(
        { error: 'Loja não encontrada.' },
        { status: 404 }
      );
    }
    
    // Buscar produtos dos itens do carrinho
    const produtosIds = checkout.itensCarrinho.map(item => item.produtoId);
    const produtos = await prisma.produtos.findMany({
      where: {
        id: { in: produtosIds }
      }
    });

    // Retornar informações do checkout com a loja
    return NextResponse.json({
      id: checkout.id,
      lojaId: checkout.id_loja,
      valorTotal: checkout.valor_total,
      status: checkout.status,
      createdAt: checkout.createdAt,
      updatedAt: checkout.updatedAt,
      itens: checkout.itensCarrinho.map(item => {
        const produto = produtos.find(p => p.id === item.produtoId);
        return {
          id: item.id,
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
          isOrderBump: item.isOrderBump,
          produto: produto ? {
            id: produto.id,
            name: produto.Titulo,
            price: produto.valor,
            image: produto.Imagem,
          } : null,
        };
      }),
      loja: {
        id: loja.id,
        nome: loja.Nome,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar informações do checkout:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar informações do checkout.' },
      { status: 500 }
    );
  }
}