import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { compare, hash } from 'bcrypt';

// Função para registrar um novo usuário
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, name } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Nome de usuário e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Nome de usuário já está em uso' },
        { status: 400 }
      );
    }

    // Criptografar a senha
    const hashedPassword = await hash(password, 10);

    // Criar um novo usuário no banco de dados
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
      },
    });

    // Remover a senha do objeto de resposta
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
}