import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Buscar todas as lojas do banco de dados
    const stores = await prisma.store.findMany({
      include: {
        user: true,
      },
    });

    return NextResponse.json(stores);
  } catch (error) {
    console.error('Erro ao buscar lojas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar lojas' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, userId } = body;

    if (!name || !userId) {
      return NextResponse.json(
        { error: 'Nome da loja e ID do usuário são obrigatórios' },
        { status: 400 }
      );
    }

    // Criar uma nova loja no banco de dados
    const store = await prisma.store.create({
      data: {
        name,
        userId,
      },
    });

    return NextResponse.json(store, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar loja:', error);
    return NextResponse.json(
      { error: 'Erro ao criar loja' },
      { status: 500 }
    );
  }
}