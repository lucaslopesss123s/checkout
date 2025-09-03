/**
 * Script de Diagnóstico - Shopify em Produção
 * 
 * Este script testa a conectividade e funcionamento das APIs Shopify
 * para identificar problemas específicos do ambiente de produção no Easypanel.
 */

const PRODUCTION_URL = 'https://checkout.pesquisaencomenda.online';
const TEST_SHOP_DOMAIN = 'sua-loja.myshopify.com'; // Substitua pelo domínio real da sua loja
const TEST_STORE_ID = 'seu-store-id'; // Substitua pelo ID real da sua loja

// INSTRUÇÕES PARA USO:
// 1. Substitua TEST_SHOP_DOMAIN pelo domínio real da sua loja Shopify (ex: minhaloja.myshopify.com)
// 2. Substitua TEST_STORE_ID pelo ID real da sua loja no banco de dados
// 3. Execute: node debug_shopify_production.js

// Função para fazer requisições com logs detalhados
async function makeRequest(url, options = {}) {
  console.log(`\n🔍 Testando: ${url}`);
  console.log('Opções:', JSON.stringify(options, null, 2));
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Shopify-Debug-Script/1.0',
        ...options.headers
      }
    });
    
    console.log(`✅ Status: ${response.status} ${response.statusText}`);
    console.log('Headers de resposta:', Object.fromEntries(response.headers.entries()));
    
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    console.log('Dados de resposta:', data);
    
    return {
      success: response.ok,
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    console.error(`❌ Erro na requisição: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Teste 1: Verificar se o servidor está respondendo
async function testServerHealth() {
  console.log('\n=== TESTE 1: SAÚDE DO SERVIDOR ===');
  
  const healthEndpoints = [
    `${PRODUCTION_URL}/api/health`,
    `${PRODUCTION_URL}/api/shopify/checkout?domain=${TEST_SHOP_DOMAIN}`,
    `${PRODUCTION_URL}/`
  ];
  
  for (const endpoint of healthEndpoints) {
    await makeRequest(endpoint);
  }
}

// Teste 2: Verificar conectividade com banco de dados
async function testDatabaseConnection() {
  console.log('\n=== TESTE 2: CONECTIVIDADE COM BANCO DE DADOS ===');
  
  // Testar endpoint que requer acesso ao banco - configuração Shopify
  console.log('\n🔍 Testando configuração Shopify (principal problema):');
  const configResult = await makeRequest(`${PRODUCTION_URL}/api/shopify/config?domain=${TEST_SHOP_DOMAIN}`);
  
  if (configResult.success) {
    console.log('✅ Configuração Shopify carregada com sucesso');
    if (configResult.data.configured) {
      console.log('✅ Loja está configurada');
    } else {
      console.log('❌ Loja não está configurada - verifique:');
      console.log('  - Se a loja existe no banco de dados');
      console.log('  - Se o domínio personalizado está configurado');
      console.log('  - Se há produtos cadastrados');
    }
  } else {
    console.log('❌ Erro ao carregar configuração Shopify');
    console.log('Possíveis causas:');
    console.log('  - Banco de dados inacessível');
    console.log('  - Loja não encontrada no banco');
    console.log('  - Problema de conectividade');
  }
  
  // Testar endpoint de checkout status
  console.log('\n🔍 Testando status do checkout:');
  await makeRequest(`${PRODUCTION_URL}/api/shopify/checkout?domain=${TEST_SHOP_DOMAIN}`);
}

// Teste 3: Verificar credenciais e autenticação Shopify
async function testShopifyCredentials() {
  console.log('\n=== TESTE 3: CREDENCIAIS SHOPIFY ===');
  
  // Testar endpoint de credenciais (requer autenticação)
  console.log('\n🔍 Testando acesso às credenciais Shopify:');
  const credResult = await makeRequest(`${PRODUCTION_URL}/api/shopify/credentials?storeId=${TEST_STORE_ID}`);
  
  if (!credResult.success && credResult.status === 401) {
    console.log('⚠️ Endpoint de credenciais requer autenticação (esperado)');
    console.log('💡 Para testar com autenticação, você precisará de um token JWT válido');
  }
  
  // Testar endpoint de stores
  console.log('\n🔍 Testando endpoint de stores:');
  await makeRequest(`${PRODUCTION_URL}/api/shopify/stores`);
}

// Teste 4: Verificar configuração de CORS
async function testCORS() {
  console.log('\n=== TESTE 4: CONFIGURAÇÃO DE CORS ===');
  
  // Testar requisição OPTIONS (preflight)
  await makeRequest(`${PRODUCTION_URL}/api/shopify/config`, {
    method: 'OPTIONS'
  });
  
  // Testar com Origin específico
  await makeRequest(`${PRODUCTION_URL}/api/shopify/config?domain=${TEST_SHOP_DOMAIN}`, {
    headers: {
      'Origin': 'https://sua-loja.myshopify.com'
    }
  });
}

// Teste 5: Verificar variáveis de ambiente
async function testEnvironmentVariables() {
  console.log('\n=== TESTE 5: VARIÁVEIS DE AMBIENTE ===');
  
  // Testar endpoint que usa variáveis de ambiente
  const result = await makeRequest(`${PRODUCTION_URL}/api/shopify/script?storeId=${TEST_STORE_ID}`);
  
  if (result.success && result.data) {
    console.log('✅ Script gerado com sucesso');
    
    // Verificar se as URLs no script estão corretas
    if (typeof result.data === 'string') {
      const hasCorrectUrls = result.data.includes('checkout.pesquisaencomenda.online');
      console.log(`URLs no script: ${hasCorrectUrls ? '✅ Corretas' : '❌ Incorretas'}`);
    }
  }
}

// Teste 6: Verificar logs de erro
async function testErrorHandling() {
  console.log('\n=== TESTE 6: TRATAMENTO DE ERROS ===');
  
  // Testar com domínio inexistente
  await makeRequest(`${PRODUCTION_URL}/api/shopify/config?domain=loja-inexistente.myshopify.com`);
  
  // Testar com parâmetros inválidos
  await makeRequest(`${PRODUCTION_URL}/api/shopify/config`);
}

// Teste 7: Verificar performance
async function testPerformance() {
  console.log('\n=== TESTE 7: PERFORMANCE ===');
  
  const startTime = Date.now();
  const result = await makeRequest(`${PRODUCTION_URL}/api/shopify/config?domain=${TEST_SHOP_DOMAIN}`);
  const endTime = Date.now();
  
  const responseTime = endTime - startTime;
  console.log(`⏱️ Tempo de resposta: ${responseTime}ms`);
  
  if (responseTime > 5000) {
    console.log('⚠️ Tempo de resposta alto (>5s) - possível problema de conectividade');
  } else if (responseTime > 2000) {
    console.log('⚠️ Tempo de resposta moderado (>2s) - monitorar performance');
  } else {
    console.log('✅ Tempo de resposta bom (<2s)');
  }
}

// Função principal
async function runDiagnostics() {
  console.log('🚀 INICIANDO DIAGNÓSTICO SHOPIFY EM PRODUÇÃO');
  console.log(`🌐 URL de Produção: ${PRODUCTION_URL}`);
  console.log(`🏪 Domínio de Teste: ${TEST_SHOP_DOMAIN}`);
  console.log(`🆔 Store ID de Teste: ${TEST_STORE_ID}`);
  console.log('\n' + '='.repeat(60));
  
  try {
    await testServerHealth();
    await testDatabaseConnection();
    await testShopifyCredentials();
    await testCORS();
    await testEnvironmentVariables();
    await testErrorHandling();
    await testPerformance();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ DIAGNÓSTICO CONCLUÍDO');
    console.log('\n📋 PRÓXIMOS PASSOS PARA RESOLVER O PROBLEMA:');
    console.log('\n🔍 DIAGNÓSTICO ESPECÍFICO - Configurações Shopify não carregam:');
    console.log('1. ✅ Verifique se o endpoint /api/health responde (conectividade básica)');
    console.log('2. ❗ CRÍTICO: Verifique se /api/shopify/config retorna configured: true');
    console.log('3. 🗄️ Confirme se o banco de dados está acessível no Easypanel');
    console.log('4. 🔑 Verifique se as variáveis de ambiente estão configuradas:');
    console.log('   - DATABASE_URL');
    console.log('   - NEXTAUTH_SECRET');
    console.log('   - JWT_SECRET');
    console.log('5. 🌐 Confirme se o domínio personalizado está configurado e ativo');
    console.log('6. 📊 Verifique se há produtos cadastrados para a loja');
    console.log('7. 📋 Consulte os logs do servidor no Easypanel para erros específicos');
    console.log('\n💡 DICA: Se configured: false, o problema está na configuração do domínio personalizado!');
    console.log('💡 DICA: Se erro 500, o problema está na conectividade com o banco de dados!');
    
  } catch (error) {
    console.error('❌ Erro durante o diagnóstico:', error);
  }
}

// Executar diagnóstico
if (typeof window === 'undefined') {
  // Node.js environment
  runDiagnostics();
} else {
  // Browser environment
  console.log('Execute este script no Node.js ou no console do navegador');
  window.runShopifyDiagnostics = runDiagnostics;
}

// Exportar para uso em outros scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runDiagnostics,
    makeRequest,
    PRODUCTION_URL,
    TEST_SHOP_DOMAIN,
    TEST_STORE_ID
  };
}