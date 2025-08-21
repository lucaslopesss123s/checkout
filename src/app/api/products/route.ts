import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    // Se não há storeId, buscar todos os produtos (para desenvolvimento)
    // Em produção, você deve sempre exigir autenticação e storeId
    const whereClause = storeId ? { id_loja: storeId } : {};

    // Buscar produtos da tabela Produtos
    const produtos = await prisma.produtos.findMany({
      where: whereClause,
      orderBy: {
        id: 'desc',
      },
    });

    // Mapear os campos da tabela Produtos para o formato esperado pelo frontend
    const products = produtos.map(produto => ({
      id: produto.id.toString(),
      name: produto.Titulo,
      status: 'Ativo', // Campo fixo por enquanto
      shipping: true, // Campo fixo por enquanto
      image: produto.Imagem,
      inventory: 100, // Campo fixo por enquanto
      price: produto.valor || 0,
      valordesconto: produto.valordesconto,
      shopify_id: produto.id_loja // Indica que veio do Shopify
    }));

    return NextResponse.json(products);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produtos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, price, storeId, image, status, inventory, shipping } = body;

    if (!name || !price || !storeId) {
      return NextResponse.json(
        { error: 'Nome, preço e ID da loja são obrigatórios' },
        { status: 400 }
      );
    }

    // Criar um novo produto no banco de dados
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        storeId,
        image,
        status: status || 'Ativo',
        inventory: inventory || 0,
        shipping: shipping !== undefined ? shipping : true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return NextResponse.json(
      { error: 'Erro ao criar produto' },
      { status: 500 }
    );
  }
}