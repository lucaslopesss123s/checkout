import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface ShopifyProduct {
  id: string;
  title: string;
  body_html: string;
  image?: {
    src: string;
  };
  variants: Array<{
    id: string;
    price: string;
    compare_at_price?: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'ID da loja é obrigatório' }, { status: 400 });
    }

    // Buscar configuração Shopify da loja
    const shopifyConfig = await prisma.loja_Shopify.findFirst({
      where: {
        id_loja: storeId
      }
    });

    if (!shopifyConfig) {
      return NextResponse.json({ 
        error: 'Configuração Shopify não encontrada para esta loja' 
      }, { status: 404 });
    }

    // Buscar produtos atuais da Shopify
    const shopifyProducts = await fetchAllShopifyProducts(
      shopifyConfig.dominio_api,
      shopifyConfig.token_api
    );

    if (!shopifyProducts) {
      return NextResponse.json({ 
        error: 'Erro ao buscar produtos da Shopify' 
      }, { status: 500 });
    }

    // Buscar produtos locais
    const localProducts = await prisma.produtos.findMany({
      where: {
        id_loja: storeId
      }
    });

    // Comparar e sincronizar
    const syncResult = await syncProducts(shopifyProducts, localProducts, storeId);

    return NextResponse.json({
      message: 'Sincronização concluída com sucesso',
      ...syncResult
    });

  } catch (error) {
    console.error('Erro na sincronização:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor durante a sincronização' 
    }, { status: 500 });
  }
}

async function fetchAllShopifyProducts(
  domainApi: string, 
  tokenApi: string
): Promise<ShopifyProduct[] | null> {
  try {
    const shopifyStoreDomain = domainApi.includes('.myshopify.com') 
      ? domainApi 
      : `${domainApi}.myshopify.com`;

    let allProducts: ShopifyProduct[] = [];
    let nextPageInfo = null;
    let hasNextPage = true;

    while (hasNextPage) {
      let url = `https://${shopifyStoreDomain}/admin/api/2023-10/products.json?limit=250`;
      if (nextPageInfo) {
        url += `&page_info=${nextPageInfo}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': tokenApi,
        },
      });

      if (!response.ok) {
        console.error('Erro ao buscar produtos da Shopify:', await response.text());
        return null;
      }

      const { products } = await response.json();
      
      if (products && products.length > 0) {
        allProducts = allProducts.concat(products);
        
        // Verificar se há próxima página
        const linkHeader = response.headers.get('Link');
        if (linkHeader && linkHeader.includes('rel="next"')) {
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

    return allProducts;
  } catch (error) {
    console.error('Erro ao buscar produtos da Shopify:', error);
    return null;
  }
}

async function syncProducts(
  shopifyProducts: ShopifyProduct[], 
  localProducts: any[], 
  storeId: string
) {
  let added = 0;
  let updated = 0;
  let removed = 0;

  // Criar mapa de produtos da Shopify por ID
  const shopifyProductsMap = new Map();
  shopifyProducts.forEach(product => {
    shopifyProductsMap.set(product.id.toString(), product);
  });

  // Criar mapa de produtos locais por shopify_produto_id
  const localProductsMap = new Map();
  localProducts.forEach(product => {
    if (product.shopify_produto_id) {
      localProductsMap.set(product.shopify_produto_id, product);
    }
  });

  // 1. Adicionar/Atualizar produtos da Shopify
  for (const shopifyProduct of shopifyProducts) {
    const shopifyId = shopifyProduct.id.toString();
    const localProduct = localProductsMap.get(shopifyId);

    const productData = {
      id_loja: storeId,
      Titulo: shopifyProduct.title,
      Descricao: shopifyProduct.body_html || '',
      valor: parseFloat(shopifyProduct.variants[0]?.price || '0'),
      valordesconto: shopifyProduct.variants[0]?.compare_at_price 
        ? parseFloat(shopifyProduct.variants[0].compare_at_price) 
        : null,
      Imagem: shopifyProduct.image?.src || 'https://placehold.co/40x40.png',
      shopify_produto_id: shopifyId,
      shopify_variante_id: shopifyProduct.variants[0]?.id?.toString() || null,
    };

    try {
      if (localProduct) {
        // Atualizar produto existente
        await prisma.produtos.update({
          where: { id: localProduct.id },
          data: productData
        });
        updated++;
      } else {
        // Criar novo produto
        await prisma.produtos.create({
          data: productData
        });
        added++;
      }
    } catch (error) {
      console.error(`Erro ao sincronizar produto ${shopifyProduct.title}:`, error);
    }
  }

  // 2. Remover produtos que não existem mais na Shopify
  for (const localProduct of localProducts) {
    if (localProduct.shopify_produto_id && 
        !shopifyProductsMap.has(localProduct.shopify_produto_id)) {
      try {
        await prisma.produtos.delete({
          where: { id: localProduct.id }
        });
        removed++;
      } catch (error) {
        console.error(`Erro ao remover produto ${localProduct.Titulo}:`, error);
      }
    }
  }

  return { added, updated, removed };
}