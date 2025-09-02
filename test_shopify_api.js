const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-char-encryption-key-here';

// Função para descriptografar dados sensíveis
function decrypt(encryptedText) {
  try {
    const algorithm = 'aes-256-cbc';A
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedData = textParts.join(':');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Erro ao descriptografar:', error.message);
    return '[ERRO_DESCRIPTOGRAFIA]';
  }
}

async function testShopifyAPI() {
  try {
    console.log('Testando API de credenciais Shopify...');
    
    const storeId = 'd76a4e1b-1066-4389-80a0-2ce401e4ff90'; // ID da loja testefinal
    
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
    
    // Tentar descriptografar os dados
    console.log('\nTentando descriptografar credenciais...');
    
    const decryptedConfig = {
      id: shopifyConfig.id,
      dominio_api: shopifyConfig.dominio_api,
      chave_api: shopifyConfig.chave_api ? decrypt(shopifyConfig.chave_api) : '',
      chave_secreta: shopifyConfig.chave_secreta ? decrypt(shopifyConfig.chave_secreta) : '',
      token_api: shopifyConfig.token_api ? decrypt(shopifyConfig.token_api) : '',
      createdAt: shopifyConfig.createdAt,
      updatedAt: shopifyConfig.updatedAt
    };
    
    console.log('✅ Dados descriptografados:');
    console.log(`   Chave API: ${decryptedConfig.chave_api.substring(0, 10)}...`);
    console.log(`   Chave Secreta: ${decryptedConfig.chave_secreta.substring(0, 10)}...`);
    console.log(`   Token API: ${decryptedConfig.token_api.substring(0, 10)}...`);
    
    // Verificar se os dados são válidos para integração
    const isConfigured = !!(decryptedConfig.id && decryptedConfig.dominio_api && 
                           decryptedConfig.chave_api && decryptedConfig.chave_secreta && 
                           decryptedConfig.token_api);
    
    console.log(`\n${isConfigured ? '✅' : '❌'} Configuração ${isConfigured ? 'VÁLIDA' : 'INVÁLIDA'} para integração`);
    
    return {
      configured: isConfigured,
      data: decryptedConfig
    };
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testShopifyAPI();