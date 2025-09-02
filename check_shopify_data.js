const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkShopifyData() {
  try {
    console.log('Verificando dados da tabela loja_shopify...');
    
    // Buscar todas as configurações Shopify
    const shopifyConfigs = await prisma.loja_Shopify.findMany({
      select: {
        id: true,
        id_loja: true,
        dominio_api: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (shopifyConfigs.length === 0) {
      console.log('❌ Nenhuma configuração Shopify encontrada na tabela loja_shopify');
    } else {
      console.log(`✅ Encontradas ${shopifyConfigs.length} configuração(ões) Shopify:`);
      shopifyConfigs.forEach((config, index) => {
        console.log(`   ${index + 1}. ID: ${config.id}, ID_Loja: ${config.id_loja}, Domínio: ${config.dominio_api}`);
        console.log(`      Criado em: ${config.createdAt}, Atualizado em: ${config.updatedAt}`);
      });
    }
    
    // Verificar lojas admin para comparação
    console.log('\nVerificando lojas admin disponíveis...');
    const lojas = await prisma.loja_admin.findMany({
      select: {
        id: true,
        Nome: true,
        user_id: true
      }
    });
    
    if (lojas.length === 0) {
      console.log('❌ Nenhuma loja admin encontrada');
    } else {
      console.log(`✅ Encontradas ${lojas.length} loja(s) admin:`);
      lojas.forEach((loja, index) => {
        console.log(`   ${index + 1}. ID: ${loja.id}, Nome: ${loja.Nome}, User ID: ${loja.user_id}`);
      });
    }
    
  } catch (error) {
    console.error('Erro ao verificar dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkShopifyData();