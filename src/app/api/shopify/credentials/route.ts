import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-char-encryption-key-here';

// Função para criptografar dados sensíveis
function encrypt(text: string): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Função para descriptografar dados sensíveis
function decrypt(encryptedText: string): string {
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedData = textParts.join(':');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Erro na descriptografia:', error);
    // Se a descriptografia falhar, retornar o texto original (pode ser que não esteja criptografado)
    return encryptedText;
  }
}

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
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = decoded.userId;
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

    // Criptografar dados sensíveis
    const encryptedApiToken = encrypt(apiToken);
    const encryptedApiKey = encrypt(apiKey);
    const encryptedApiSecret = encrypt(apiSecret);

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
          chave_api: encryptedApiKey,
          chave_secreta: encryptedApiSecret,
          token_api: encryptedApiToken,
          dominio_api: shopifyDomain,
          updatedAt: new Date()
        }
      });
    } else {
      // Criar nova configuração
      shopifyConfig = await prisma.loja_Shopify.create({
        data: {
          chave_api: encryptedApiKey,
          chave_secreta: encryptedApiSecret,
          token_api: encryptedApiToken,
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
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      userId = decoded.userId;
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

    // Descriptografar dados para retorno (para visualização/edição)
    const decryptedConfig = {
      id: shopifyConfig.id,
      dominio_api: shopifyConfig.dominio_api,
      chave_api: shopifyConfig.chave_api ? decrypt(shopifyConfig.chave_api) : '',
      chave_secreta: shopifyConfig.chave_secreta ? decrypt(shopifyConfig.chave_secreta) : '',
      token_api: shopifyConfig.token_api ? decrypt(shopifyConfig.token_api) : '',
      createdAt: shopifyConfig.createdAt,
      updatedAt: shopifyConfig.updatedAt
    };

    return NextResponse.json(decryptedConfig, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar credenciais Shopify:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}