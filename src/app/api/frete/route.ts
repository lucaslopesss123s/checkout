import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET - Listar opções de frete de uma loja
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id_loja = searchParams.get('id_loja');

    if (!id_loja) {
      return NextResponse.json(
        { error: 'ID da loja é obrigatório' },
        { status: 400 }
      );
    }

    const opcoesFrete = await prisma.frete.findMany({
      where: {
        id_loja: id_loja,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(opcoesFrete);
  } catch (error) {
    console.error('Erro ao buscar opções de frete:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar nova opção de frete
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nome,
      preco,
      prazo_minimo,
      prazo_maximo,
      ativo = true,
      id_loja,
      frete_gratis_ativo = false,
      valor_minimo_gratis,
    } = body;

    // Validações
    if (!nome || !id_loja) {
      return NextResponse.json(
        { error: 'Nome e ID da loja são obrigatórios' },
        { status: 400 }
      );
    }

    if (preco < 0) {
      return NextResponse.json(
        { error: 'Preço não pode ser negativo' },
        { status: 400 }
      );
    }

    if (prazo_minimo < 0 || prazo_maximo < 0 || prazo_minimo > prazo_maximo) {
      return NextResponse.json(
        { error: 'Prazos inválidos' },
        { status: 400 }
      );
    }

    if (frete_gratis_ativo && (!valor_minimo_gratis || valor_minimo_gratis <= 0)) {
      return NextResponse.json(
        { error: 'Valor mínimo para frete grátis deve ser maior que zero' },
        { status: 400 }
      );
    }

    const novaOpcaoFrete = await prisma.frete.create({
      data: {
        nome,
        preco,
        prazo_minimo,
        prazo_maximo,
        ativo,
        id_loja,
        frete_gratis_ativo,
        valor_minimo_gratis,
      },
    });

    return NextResponse.json(novaOpcaoFrete, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar opção de frete:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar opção de frete
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      nome,
      preco,
      prazo_minimo,
      prazo_maximo,
      ativo,
      frete_gratis_ativo,
      valor_minimo_gratis,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID da opção de frete é obrigatório' },
        { status: 400 }
      );
    }

    // Validações
    if (preco < 0) {
      return NextResponse.json(
        { error: 'Preço não pode ser negativo' },
        { status: 400 }
      );
    }

    if (prazo_minimo < 0 || prazo_maximo < 0 || prazo_minimo > prazo_maximo) {
      return NextResponse.json(
        { error: 'Prazos inválidos' },
        { status: 400 }
      );
    }

    if (frete_gratis_ativo && (!valor_minimo_gratis || valor_minimo_gratis <= 0)) {
      return NextResponse.json(
        { error: 'Valor mínimo para frete grátis deve ser maior que zero' },
        { status: 400 }
      );
    }

    const opcaoFreteAtualizada = await prisma.frete.update({
      where: { id },
      data: {
        nome,
        preco,
        prazo_minimo,
        prazo_maximo,
        ativo,
        frete_gratis_ativo,
        valor_minimo_gratis,
      },
    });

    return NextResponse.json(opcaoFreteAtualizada);
  } catch (error) {
    console.error('Erro ao atualizar opção de frete:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar opção de frete
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID da opção de frete é obrigatório' },
        { status: 400 }
      );
    }

    await prisma.frete.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Opção de frete deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar opção de frete:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}