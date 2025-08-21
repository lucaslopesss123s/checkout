import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';

// Rota protegida que retorna o perfil do usuário autenticado
export async function GET(request: NextRequest) {
  const user = await authenticateUser(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 }
    );
  }
  
  return NextResponse.json({ user });
}