import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/produtos - Listar produtos de uma loja
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id_loja = searchParams.get('id_loja');

    if (!id_loja) {
      return NextResponse.json({ error: 'ID da loja não fornecido' }, { status: 400 });
    }

    const produtos = await prisma.produtos.findMany({
      where: {
        id_loja: id_loja,
      },
      select: {
        id: true,
        Titulo: true,
        valor: true,
        Imagem: true,
      },
    });
    
    // Mapear para os nomes de campos usados no frontend
    const produtosMapeados = produtos.map(produto => ({
      id: produto.id,
      name: produto.Titulo,
      price: produto.valor,
      image: produto.Imagem,
    }));

    return NextResponse.json(produtosMapeados);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 });
  }
}

// POST /api/produtos/sync - Sincronizar produtos da loja
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id_loja } = body;

    if (!id_loja) {
      return NextResponse.json({ error: 'ID da loja não fornecido' }, { status: 400 });
    }

    // Aqui você implementaria a lógica de sincronização com a plataforma da loja
    // Por enquanto, apenas retornamos os produtos existentes
    const produtos = await prisma.produtos.findMany({
      where: {
        id_loja: id_loja,
      },
      select: {
        id: true,
        Titulo: true,
        valor: true,
        Imagem: true,
      },
    });
    
    // Mapear para os nomes de campos usados no frontend
    const produtosMapeados = produtos.map(produto => ({
      id: produto.id,
      name: produto.Titulo,
      price: produto.valor,
      image: produto.Imagem,
    }));

    return NextResponse.json(produtosMapeados);
  } catch (error) {
    console.error('Erro ao sincronizar produtos:', error);
    return NextResponse.json({ error: 'Erro ao sincronizar produtos' }, { status: 500 });
  }
}