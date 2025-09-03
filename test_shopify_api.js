const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testShopifyAPI() {
  try {
    console.log('Testando API de credenciais Shopify...');
    
    const storeId = '7453e5c4-bbb1-4e16-87da-0f031f7e3d56'; // ID da loja Final
    
    console.log(`\nBuscando configuração Shopify para loja ID: ${storeId}`);
    
    // Simular o que a API faz
    const shopifyConfig = await prisma.loja_Shopify.findFirst({
      where: {
        id_loja: storeId
      }
    });
    
    if (!shopifyConfig) {
      console.log('❌ Configuração Shopify não encontrada');
      return;
    }
    
    console.log('✅ Configuração Shopify encontrada:');
    console.log(`   ID: ${shopifyConfig.id}`);
    console.log(`   Domínio API: ${shopifyConfig.dominio_api}`);
    
    // Dados já estão em texto plano (sem criptografia)
    console.log('\nLendo credenciais em texto plano...');
    
    const config = {
      id: shopifyConfig.id,
      dominio_api: shopifyConfig.dominio_api,
      chave_api: shopifyConfig.chave_api || '',
      chave_secreta: shopifyConfig.chave_secreta || '',
      token_api: shopifyConfig.token_api || '',
      createdAt: shopifyConfig.createdAt,
      updatedAt: shopifyConfig.updatedAt
    };
    
    console.log('✅ Dados obtidos:');
    console.log(`   Chave API: ${config.chave_api.substring(0, 10)}...`);
    console.log(`   Chave Secreta: ${config.chave_secreta.substring(0, 10)}...`);
    console.log(`   Token API: ${config.token_api.substring(0, 10)}...`);
    
    // Verificar se os dados são válidos para integração
    const isConfigured = !!(config.id && config.dominio_api && 
                           config.chave_api && config.chave_secreta && 
                           config.token_api);
    
    console.log(`\n${isConfigured ? '✅' : '❌'} Configuração ${isConfigured ? 'VÁLIDA' : 'INVÁLIDA'} para integração`);
    
    return {
      configured: isConfigured,
      data: config
    };
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testShopifyAPI();