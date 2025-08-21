// src/app/api/shopify/import-products/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Esta é uma função de Handler de Rota do Next.js.
// Ela atua como um endpoint de API no seu backend.
// https://nextjs.org/docs/app/building-your-application/routing/route-handlers

export async function POST(request: Request) {
  try {
    // =================================================================
    // PASSO 1: Obter dados do corpo da requisição
    // =================================================================
    const body = await request.json();
    const { shopifyDomain, apiToken, storeId } = body;

    if (!shopifyDomain || !apiToken || !storeId) {
      return NextResponse.json({ error: 'Domínio, token de API e ID da loja são obrigatórios.' }, { status: 400 });
    }

    const shopifyStoreDomain = `${shopifyDomain}.myshopify.com`;

    // =================================================================
    // PASSO 2: Chamar a API do Shopify para buscar TODOS os produtos (com paginação)
    // =================================================================
    let allProducts = [];
    let nextPageInfo = null;
    let hasNextPage = true;

    while (hasNextPage) {
      let url = `https://${shopifyStoreDomain}/admin/api/2023-10/products.json?limit=250`;
      if (nextPageInfo) {
        url += `&page_info=${nextPageInfo}`;
      }

      const shopifyResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': apiToken,
        },
      });

      if (!shopifyResponse.ok) {
        const errorData = await shopifyResponse.json();
        console.error('Erro ao buscar produtos do Shopify:', errorData);
        throw new Error('Falha ao buscar produtos do Shopify');
      }

      const { products } = await shopifyResponse.json();
      
      if (products && products.length > 0) {
        allProducts = allProducts.concat(products);
        
        // Verificar se há próxima página através do header Link
        const linkHeader = shopifyResponse.headers.get('Link');
        if (linkHeader && linkHeader.includes('rel="next"')) {
          // Extrair page_info do header Link
          const nextMatch = linkHeader.match(/<[^>]*[?&]page_info=([^&>]+)[^>]*>; rel="next"/);
          if (nextMatch) {
            nextPageInfo = nextMatch[1];
          } else {
            hasNextPage = false;
          }
        } else {
          hasNextPage = false;
        }
      } else {
        hasNextPage = false;
      }
    }

    if (!allProducts || allProducts.length === 0) {
      return NextResponse.json({ message: 'Nenhum produto encontrado na loja Shopify para importar.' });
    }

    console.log(`Total de produtos encontrados: ${allProducts.length}`);


    // =================================================================
    // PASSO 3: Salvar os produtos na tabela Produtos do PostgreSQL
    // =================================================================
    const createdProducts = [];

    for (const product of allProducts) {
      // Mapeie os dados do produto do Shopify para o formato do banco
      const productData = {
        id_loja: storeId,
        Titulo: product.title,
        Descricao: product.body_html || '',
        valor: parseFloat(product.variants[0]?.price || '0'),
        valordesconto: product.variants[0]?.compare_at_price ? parseFloat(product.variants[0].compare_at_price) : null,
        Imagem: product.image?.src || 'https://placehold.co/40x40.png',
        Altura: null, // Dados não disponíveis no Shopify por padrão
        Largura: null,
        Comprimento: null,
        shopify_produto_id: product.id?.toString() || null,
        shopify_variante_id: product.variants[0]?.id?.toString() || null,
      };
      
      try {
        // Verifica se o produto já existe pelo shopify_produto_id ou título e id_loja
        const existingProduct = await prisma.produtos.findFirst({
          where: { 
            OR: [
              { shopify_produto_id: productData.shopify_produto_id },
              { 
                AND: [
                  { Titulo: productData.Titulo },
                  { id_loja: storeId }
                ]
              }
            ]
          }
        });

        if (existingProduct) {
          // Atualiza o produto existente
          const updatedProduct = await prisma.produtos.update({
            where: { id: existingProduct.id },
            data: productData
          });
          createdProducts.push(updatedProduct);
        } else {
          // Cria um novo produto
          const newProduct = await prisma.produtos.create({
            data: productData
          });
          createdProducts.push(newProduct);
        }
      } catch (error) {
        console.error(`Erro ao salvar produto ${product.title}:`, error);
      }
    }

    console.log(`${createdProducts.length} produtos importados com sucesso para o PostgreSQL.`);

    // =================================================================
    // PASSO 4: Retornar uma resposta de sucesso
    // =================================================================
    return NextResponse.json({ message: 'Produtos importados com sucesso!', count: allProducts.length });

  } catch (error) {
    console.error('Erro na rota de importação:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido';
    return NextResponse.json({ error: 'Falha ao importar produtos.', details: errorMessage }, { status: 500 });
  }
}
