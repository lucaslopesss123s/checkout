import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const store = searchParams.get('store');

    if (!store) {
      return NextResponse.json({ error: 'Store domain is required' }, { status: 400 });
    }

    // Buscar configurações de checkout para a loja
    const checkoutSettings = await prisma.checkoutSettings.findFirst({
      where: {
        store_domain: store
      }
    });

    if (!checkoutSettings) {
      // Retornar configurações padrão se não encontrar
      return NextResponse.json({
        theme: 'default',
        cor_barra: '#0a101a',
        cor_botao: '#10b981',
        contagem_regressiva: false
      });
    }

    return NextResponse.json(checkoutSettings);
  } catch (error) {
    console.error('Erro ao buscar configurações de checkout:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}