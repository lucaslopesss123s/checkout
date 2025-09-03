const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkShopifyStore() {
  try {
    console.log('Verificando loja Shopify no banco de dados...');
    
    const lojaShopify = await prisma.loja_Shopify.findFirst({
      where: {
        dominio_api: 'egex0y-ue.myshopify.com'
      }
    });
    
    if (lojaShopify) {
      console.log('✅ Loja encontrada:');
      console.log('ID:', lojaShopify.id);
      console.log('Domínio:', lojaShopify.dominio_api);
      console.log('ID da Loja:', lojaShopify.id_loja);
      console.log('Criada em:', lojaShopify.createdAt);
    } else {
      console.log('❌ Loja não encontrada no banco de dados');
    }
    
    // Verificar todas as lojas Shopify
    const todasLojas = await prisma.loja_Shopify.findMany();
    console.log('\n📊 Total de lojas Shopify cadastradas:', todasLojas.length);
    
    if (todasLojas.length > 0) {
      console.log('\n📋 Lojas cadastradas:');
      todasLojas.forEach((loja, index) => {
        console.log(`${index + 1}. ${loja.dominio_api} (ID: ${loja.id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar loja:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkShopifyStore();