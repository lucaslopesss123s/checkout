import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import prisma from './prisma';

interface JwtPayload {
  id: string;
  username: string;
}

/**
 * Verifica se o usuário está autenticado
 */
export async function authenticateUser(request: NextRequest) {
  try {
    // Obter o token do cabeçalho de autorização
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7);
    
    // Verificar o token
    const decoded = verify(token, process.env.JWT_SECRET || 'fallback_secret') as JwtPayload;
    
    // Buscar o usuário no banco de dados
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
    });
    
    if (!user) {
      return null;
    }
    
    // Remover a senha do objeto de usuário
    const { password: _, ...userWithoutPassword } = user;
    
    return userWithoutPassword;
  } catch (error) {
    console.error('Erro ao autenticar usuário:', error);
    return null;
  }
}

/**
 * Middleware para proteger rotas
 */
export function withAuth(handler: Function) {
  return async (request: NextRequest) => {
    const user = await authenticateUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    return handler(request, user);
  };
}