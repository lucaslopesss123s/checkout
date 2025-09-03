import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST - Salvar credenciais Shopify
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let userId: string;

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id?: string; userId?: string };
      userId = decoded.id || decoded.userId; // Suporte para ambos os formatos
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      shopifyDomain, 
      apiToken, 
      apiKey, 
      apiSecret, 
      storeId 
    } = body;

    // Validação dos campos obrigatórios
    if (!shopifyDomain || !apiToken || !apiKey || !apiSecret || !storeId) {
      return NextResponse.json({ 
        error: 'Todos os campos são obrigatórios: shopifyDomain, apiToken, apiKey, apiSecret, storeId' 
      }, { status: 400 });
    }

    // Verificar se a loja pertence ao usuário
    const loja = await prisma.loja_admin.findFirst({
      where: {
        id: storeId,
        user_id: userId
      }
    });

    if (!loja) {
      return NextResponse.json({ error: 'Loja não encontrada ou não pertence ao usuário' }, { status: 404 });
    }

    // Dados salvos em texto plano (sem criptografia)

    // Verificar se já existe uma configuração Shopify para esta loja
    const existingConfig = await prisma.loja_Shopify.findFirst({
      where: {
        id_loja: storeId
      }
    });

    let shopifyConfig;

    if (existingConfig) {
      // Atualizar configuração existente
      shopifyConfig = await prisma.loja_Shopify.update({
        where: {
          id: existingConfig.id
        },
        data: {
          chave_api: apiKey,
          chave_secreta: apiSecret,
          token_api: apiToken,
          dominio_api: shopifyDomain,
          updatedAt: new Date()
        }
      });
    } else {
      // Criar nova configuração
      shopifyConfig = await prisma.loja_Shopify.create({
        data: {
          chave_api: apiKey,
          chave_secreta: apiSecret,
          token_api: apiToken,
          dominio_api: shopifyDomain,
          id_loja: storeId
        }
      });
    }

    return NextResponse.json({ 
      message: 'Credenciais Shopify salvas com sucesso',
      id: shopifyConfig.id
    }, { status: 200 });

  } catch (error) {
    console.error('Erro ao salvar credenciais Shopify:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// GET - Buscar credenciais Shopify (descriptografadas)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let userId: string;

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id?: string; userId?: string };
      userId = decoded.id || decoded.userId; // Suporte para ambos os formatos
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId é obrigatório' }, { status: 400 });
    }

    // Verificar se a loja pertence ao usuário
    const loja = await prisma.loja_admin.findFirst({
      where: {
        id: storeId,
        user_id: userId
      }
    });

    if (!loja) {
      return NextResponse.json({ error: 'Loja não encontrada ou não pertence ao usuário' }, { status: 404 });
    }

    // Buscar configuração Shopify
    const shopifyConfig = await prisma.loja_Shopify.findFirst({
      where: {
        id_loja: storeId
      }
    });

    if (!shopifyConfig) {
      return NextResponse.json({ error: 'Configuração Shopify não encontrada' }, { status: 404 });
    }

    // Retornar dados em texto plano (sem descriptografia)
    const config = {
      id: shopifyConfig.id,
      dominio_api: shopifyConfig.dominio_api,
      chave_api: shopifyConfig.chave_api || '',
      chave_secreta: shopifyConfig.chave_secreta || '',
      token_api: shopifyConfig.token_api || '',
      createdAt: shopifyConfig.createdAt,
      updatedAt: shopifyConfig.updatedAt
    };

    return NextResponse.json(config, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar credenciais Shopify:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}