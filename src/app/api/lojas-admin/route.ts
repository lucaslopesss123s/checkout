import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Buscar todas as lojas admin do usuário logado
    const lojasAdmin = await prisma.loja_admin.findMany({
      where: {
        user_id: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(lojasAdmin);
  } catch (error) {
    console.error('Erro ao buscar lojas admin:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar lojas admin' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { Nome } = body;

    if (!Nome || Nome.trim() === '') {
      return NextResponse.json(
        { error: 'Nome da loja é obrigatório' },
        { status: 400 }
      );
    }

    // Criar uma nova loja admin no banco de dados
    const lojaAdmin = await prisma.loja_admin.create({
      data: {
        Nome: Nome.trim(),
        user_id: user.id,
      },
    });

    return NextResponse.json(lojaAdmin, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar loja admin:', error);
    return NextResponse.json(
      { error: 'Erro ao criar loja admin' },
      { status: 500 }
    );
  }
}