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

    // Criar automaticamente o template de carrinho abandonado para a nova loja
    try {
      await prisma.marketing.create({
        data: {
          id_loja: lojaAdmin.id,
          tipo: 'email',
          evento: 'abandono_carrinho',
          tempo: 60, // 1 hora após abandono
          assunto: 'Você esqueceu algo no seu carrinho! 🛒',
          mensagem: `Olá \{\{nome_cliente\}\},

Notamos que você deixou alguns itens incríveis no seu carrinho em \{\{nome_loja\}\}.

Não perca essa oportunidade! Seus produtos estão esperando por você:

\{\{lista_produtos\}\}

Total: \{\{valor_total\}\}

Finalize sua compra agora e garante esses produtos:
\{\{link_checkout\}\}

Se tiver alguma dúvida, estamos aqui para ajudar!

Atenciosamente,
Equipe \{\{nome_loja\}\}`,
          status: 'ativo'
        }
      });
      console.log(`Template de carrinho abandonado criado para loja ${lojaAdmin.id}`);
    } catch (emailError) {
      console.error('Erro ao criar template de email padrão:', emailError);
      // Não falhar a criação da loja se houver erro no template
    }

    return NextResponse.json(lojaAdmin, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar loja admin:', error);
    return NextResponse.json(
      { error: 'Erro ao criar loja admin' },
      { status: 500 }
    );
  }
}