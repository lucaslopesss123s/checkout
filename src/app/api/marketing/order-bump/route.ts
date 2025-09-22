import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/marketing/order-bump - Listar todos os order bumps de uma loja
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id_loja = searchParams.get('id_loja');

    if (!id_loja) {
      return NextResponse.json({ error: 'ID da loja não fornecido' }, { status: 400 });
    }

    const orderBumps = await prisma.orderbump.findMany({
      where: {
        id_loja: id_loja,
      },
    });

    return NextResponse.json(orderBumps);
  } catch (error) {
    console.error('Erro ao buscar order bumps:', error);
    return NextResponse.json({ error: 'Erro ao buscar order bumps' }, { status: 500 });
  }
}

// POST /api/marketing/order-bump - Criar um novo order bump
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id_loja, nome, todos_produtos, produtos_aplicados, produto_id, tipo_desconto, valor_desconto, preco_final, ativo } = body;

    if (!id_loja) {
      return NextResponse.json({ error: 'ID da loja não fornecido' }, { status: 400 });
    }

    if (!nome) {
      return NextResponse.json({ error: 'Nome do Order Bump não fornecido' }, { status: 400 });
    }

    if (!produto_id) {
      return NextResponse.json({ error: 'Produto do Order Bump não selecionado' }, { status: 400 });
    }

    const orderBump = await prisma.orderbump.create({
      data: {
        id_loja,
        nome,
        todos_produtos,
        produtos_aplicados,
        produto_id,
        tipo_desconto,
        valor_desconto,
        preco_final,
        ativo,
      },
    });

    return NextResponse.json(orderBump, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar order bump:', error);
    return NextResponse.json({ error: 'Erro ao criar order bump' }, { status: 500 });
  }
}

// PUT /api/marketing/order-bump/[id] - Atualizar um order bump existente
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await request.json();
    const { id_loja, nome, todos_produtos, produtos_aplicados, produto_id, tipo_desconto, valor_desconto, preco_final, ativo } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do Order Bump não fornecido' }, { status: 400 });
    }

    if (!id_loja) {
      return NextResponse.json({ error: 'ID da loja não fornecido' }, { status: 400 });
    }

    if (!nome) {
      return NextResponse.json({ error: 'Nome do Order Bump não fornecido' }, { status: 400 });
    }

    if (!produto_id) {
      return NextResponse.json({ error: 'Produto do Order Bump não selecionado' }, { status: 400 });
    }

    // Verificar se o order bump existe
    const existingOrderBump = await prisma.orderbump.findUnique({
      where: { id },
    });

    if (!existingOrderBump) {
      return NextResponse.json({ error: 'Order Bump não encontrado' }, { status: 404 });
    }

    // Atualizar o order bump
    const updatedOrderBump = await prisma.orderbump.update({
      where: { id },
      data: {
        id_loja,
        nome,
        todos_produtos,
        produtos_aplicados,
        produto_id,
        tipo_desconto,
        valor_desconto,
        preco_final,
        ativo,
      },
    });

    return NextResponse.json(updatedOrderBump);
  } catch (error) {
    console.error('Erro ao atualizar order bump:', error);
    return NextResponse.json({ error: 'Erro ao atualizar order bump' }, { status: 500 });
  }
}

// DELETE /api/marketing/order-bump/[id] - Excluir um order bump
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json({ error: 'ID do Order Bump não fornecido' }, { status: 400 });
    }

    // Verificar se o order bump existe
    const existingOrderBump = await prisma.orderbump.findUnique({
      where: { id },
    });

    if (!existingOrderBump) {
      return NextResponse.json({ error: 'Order Bump não encontrado' }, { status: 404 });
    }

    // Excluir o order bump
    await prisma.orderbump.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Order Bump excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir order bump:', error);
    return NextResponse.json({ error: 'Erro ao excluir order bump' }, { status: 500 });
  }
}