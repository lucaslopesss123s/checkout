const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testShopifyWithoutAuth() {
  try {
    console.log('🔍 Verificando credenciais Shopify após remoção da criptografia...');
    
    // Verificar dados diretamente no banco
    console.log('\n📍 Verificando dados no banco de dados...');
    const shopifyConfig = await prisma.loja_Shopify.findFirst({
      where: {
        dominio_api: 'ethf0j-1z.myshopify.com'
      }
    });
    
    if (shopifyConfig) {
      console.log('✅ Configuração encontrada no banco:');
      console.log(`   ID: ${shopifyConfig.id}`);
      console.log(`   Domínio: ${shopifyConfig.dominio_api}`);
      console.log(`   Chave API: ${shopifyConfig.chave_api ? shopifyConfig.chave_api.substring(0, 10) + '...' : 'VAZIA'}`);
      console.log(`   Chave Secreta: ${shopifyConfig.chave_secreta ? shopifyConfig.chave_secreta.substring(0, 10) + '...' : 'VAZIA'}`);
      console.log(`   Token API: ${shopifyConfig.token_api ? shopifyConfig.token_api.substring(0, 10) + '...' : 'VAZIO'}`);
      
      // Verificar se os dados estão em texto plano (não criptografados)
      const isPlainText = shopifyConfig.chave_api && !shopifyConfig.chave_api.includes(':');
      console.log(`\n${isPlainText ? '✅' : '❌'} Dados estão em texto plano: ${isPlainText}`);
    } else {
      console.log('❌ Configuração não encontrada no banco');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testShopifyWithoutAuth();