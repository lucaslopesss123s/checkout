// src/app/api/shopify/import-products/route.ts
import { NextResponse } from 'next/server';
import { doc, setDoc, collection, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Esta é uma função de Handler de Rota do Next.js.
// Ela atua como um endpoint de API no seu backend.
// https://nextjs.org/docs/app/building-your-application/routing/route-handlers

export async function POST(request: Request) {
  try {
    // =================================================================
    // PASSO 1: Obter as credenciais de forma segura do ambiente
    // =================================================================
    const shopifyApiKey = process.env.SHOPIFY_API_KEY;
    const shopifyApiSecret = process.env.SHOPIFY_API_SECRET_KEY;
    const shopifyAccessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    const shopifyStoreDomain = 'sua-loja.myshopify.com'; // Você precisará do domínio da loja

    if (!shopifyApiKey || !shopifyAccessToken) {
      return NextResponse.json({ error: 'Credenciais do Shopify não configuradas no servidor.' }, { status: 500 });
    }

    // =================================================================
    // PASSO 2: Chamar a API do Shopify para buscar os produtos
    // =================================================================
    // Aqui você usará 'fetch' para se conectar à API Admin do Shopify.
    // O URL se parecerá com: `https://${shopifyStoreDomain}/admin/api/2023-10/products.json`
    
    // Exemplo de chamada fetch:
    const shopifyResponse = await fetch(`https://${shopifyStoreDomain}/admin/api/2023-10/products.json`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyAccessToken,
      },
    });

    if (!shopifyResponse.ok) {
        const errorData = await shopifyResponse.json();
        console.error('Erro ao buscar produtos do Shopify:', errorData);
        throw new Error('Falha ao buscar produtos do Shopify');
    }

    const { products } = await shopifyResponse.json();

    if (!products || products.length === 0) {
      return NextResponse.json({ message: 'Nenhum produto encontrado na loja Shopify para importar.' });
    }


    // =================================================================
    // PASSO 3: Salvar os produtos no banco de dados Firestore
    // =================================================================
    // É uma boa prática usar um 'batch' para escrever múltiplos documentos de uma só vez.
    const batch = writeBatch(db);

    products.forEach((product: any) => {
      // Mapeie os dados do produto do Shopify para o formato que você quer no Firestore
      const productData = {
        id: String(product.id),
        name: product.title,
        status: product.status === 'active' ? 'Ativo' : 'Inativo',
        inventory: product.variants[0]?.inventory_quantity ?? 0,
        shipping: product.variants[0]?.requires_shipping ?? false,
        image: product.image?.src || 'https://placehold.co/40x40.png',
      };
      
      // Cria uma referência para um novo documento na coleção 'products'
      const productRef = doc(db, 'products', productData.id);
      batch.set(productRef, productData);
    });

    // Executa todas as operações de escrita no batch
    await batch.commit();

    console.log(`${products.length} produtos importados com sucesso para o Firestore.`);

    // =================================================================
    // PASSO 4: Retornar uma resposta de sucesso
    // =================================================================
    return NextResponse.json({ message: 'Produtos importados com sucesso!', count: products.length });

  } catch (error) {
    console.error('Erro na rota de importação:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido';
    return NextResponse.json({ error: 'Falha ao importar produtos.', details: errorMessage }, { status: 500 });
  }
}
