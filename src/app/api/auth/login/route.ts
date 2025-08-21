import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Nome de usuário e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar o usuário pelo nome de usuário
    const user = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Verificar se a senha está correta
    const passwordMatch = await compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Gerar token JWT
    const token = sign(
      {
        id: user.id,
        username: user.username,
      },
      process.env.JWT_SECRET || 'fallback_secret',
      {
        expiresIn: '7d',
      }
    );

    // Remover a senha do objeto de resposta
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    );
  }
}