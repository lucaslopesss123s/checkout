import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - Buscar configurações públicas da loja para checkout
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id_loja = searchParams.get('id_loja')

  if (!id_loja) {
    return NextResponse.json(
      { error: 'ID da loja é obrigatório' },
      { status: 400 }
    )
  }

  try {
    // Buscar configurações da loja (acesso público para checkout)
    const config = await prisma.loja_config.findUnique({
      where: {
        id_loja: id_loja
      },
      select: {
        logo: true,
        cor_tema: true,
        cor_botao: true,
        aviso: true
      }
    })

    return NextResponse.json({
      success: true,
      config: config || {
        logo: null,
        cor_tema: '#0a101a',
        cor_botao: '#10b981',
        aviso: null
      }
    })

  } catch (error) {
    console.error('Erro ao buscar configurações de checkout:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}