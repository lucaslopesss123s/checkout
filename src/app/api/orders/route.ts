import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json(
        { error: 'ID da loja é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar pedidos de uma loja específica
    const orders = await prisma.order.findMany({
      where: {
        storeId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pedidos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storeId, items } = body;

    if (!storeId || !items || !items.length) {
      return NextResponse.json(
        { error: 'ID da loja e itens do pedido são obrigatórios' },
        { status: 400 }
      );
    }

    // Calcular o total do pedido
    let total = 0;
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: {
          id: item.productId,
        },
      });

      if (!product) {
        return NextResponse.json(
          { error: `Produto com ID ${item.productId} não encontrado` },
          { status: 404 }
        );
      }

      total += product.price * item.quantity;
    }

    // Criar um novo pedido no banco de dados
    const order = await prisma.order.create({
      data: {
        storeId,
        total,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    return NextResponse.json(
      { error: 'Erro ao criar pedido' },
      { status: 500 }
    );
  }
}