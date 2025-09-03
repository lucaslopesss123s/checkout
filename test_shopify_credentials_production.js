const https = require('https');
const http = require('http');

// Configurações
const PRODUCTION_URL = 'https://zollim-checkout.rboln1.easypanel.host';
const LOCAL_URL = 'http://localhost:3000';

// Função para fazer requisições HTTP/HTTPS
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Função para fazer login e obter token
async function login(baseUrl, username = 'teste', password = 'teste123') {
  console.log(`\n🔐 Fazendo login em ${baseUrl}...`);
  
  try {
    const response = await makeRequest(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.status === 200 && response.data.token) {
      console.log('✅ Login realizado com sucesso');
      console.log(`Token obtido: ${response.data.token.substring(0, 50)}...`);
      return response.data.token;
    } else {
      console.log('❌ Falha no login:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Erro no login:', error.message);
    return null;
  }
}

// Função para testar API de credenciais Shopify
async function testShopifyCredentials(baseUrl, token, storeId = '1') {
  console.log(`\n🛍️ Testando credenciais Shopify em ${baseUrl}...`);
  
  try {
    const response = await makeRequest(`${baseUrl}/api/shopify/credentials?storeId=${storeId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ Credenciais Shopify obtidas com sucesso');
      console.log('Dados retornados:', {
        id: response.data.id,
        dominio_api: response.data.dominio_api,
        chave_api: response.data.chave_api ? '***PRESENTE***' : 'AUSENTE',
        chave_secreta: response.data.chave_secreta ? '***PRESENTE***' : 'AUSENTE',
        token_api: response.data.token_api ? '***PRESENTE***' : 'AUSENTE'
      });
      return response.data;
    } else {
      console.log('❌ Erro ao obter credenciais:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    return null;
  }
}

// Função para verificar se existem lojas no banco
async function checkStores(baseUrl, token) {
  console.log(`\n🏪 Verificando lojas disponíveis em ${baseUrl}...`);
  
  try {
    const response = await makeRequest(`${baseUrl}/api/stores`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ Lojas encontradas:', response.data.length);
      response.data.forEach((store, index) => {
        console.log(`  ${index + 1}. ID: ${store.id}, Nome: ${store.nome}`);
      });
      return response.data;
    } else {
      console.log('❌ Erro ao buscar lojas:', response.data);
      return [];
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    return [];
  }
}

// Função principal
async function main() {
  console.log('🔍 DIAGNÓSTICO: Credenciais Shopify - Produção vs Desenvolvimento');
  console.log('=' .repeat(70));
  
  // Teste em desenvolvimento (localhost)
  console.log('\n📍 TESTANDO AMBIENTE DE DESENVOLVIMENTO');
  const localToken = await login(LOCAL_URL);
  
  if (localToken) {
    const localStores = await checkStores(LOCAL_URL, localToken);
    if (localStores.length > 0) {
      await testShopifyCredentials(LOCAL_URL, localToken, localStores[0].id);
    } else {
      console.log('⚠️ Nenhuma loja encontrada no desenvolvimento');
    }
  }
  
  // Teste em produção (Easypanel)
  console.log('\n📍 TESTANDO AMBIENTE DE PRODUÇÃO (EASYPANEL)');
  const prodToken = await login(PRODUCTION_URL);
  
  if (prodToken) {
    const prodStores = await checkStores(PRODUCTION_URL, prodToken);
    if (prodStores.length > 0) {
      await testShopifyCredentials(PRODUCTION_URL, prodToken, prodStores[0].id);
    } else {
      console.log('⚠️ Nenhuma loja encontrada na produção');
    }
  }
  
  // Resumo e diagnóstico
  console.log('\n' + '=' .repeat(70));
  console.log('📋 RESUMO DO DIAGNÓSTICO');
  console.log('=' .repeat(70));
  
  if (!localToken && !prodToken) {
    console.log('❌ PROBLEMA CRÍTICO: Login falhou em ambos os ambientes');
    console.log('   → Verificar credenciais de login');
  } else if (localToken && !prodToken) {
    console.log('❌ PROBLEMA: Login funciona no desenvolvimento mas não na produção');
    console.log('   → Verificar JWT_SECRET no Easypanel');
    console.log('   → Verificar se o deploy foi realizado corretamente');
  } else if (!localToken && prodToken) {
    console.log('⚠️ ATENÇÃO: Login funciona na produção mas não no desenvolvimento');
    console.log('   → Verificar se o servidor local está rodando');
  } else {
    console.log('✅ Login funcionando em ambos os ambientes');
    console.log('   → Se ainda há erro "Token inválido", verificar:');
    console.log('     • Logs do console do navegador');
    console.log('     • Variáveis de ambiente ENCRYPTION_KEY');
    console.log('     • Dados na tabela Loja_Shopify');
  }
  
  console.log('\n🔧 PRÓXIMOS PASSOS RECOMENDADOS:');
  console.log('1. Verificar JWT_SECRET no Easypanel');
  console.log('2. Confirmar que o deploy das correções foi realizado');
  console.log('3. Verificar ENCRYPTION_KEY no Easypanel');
  console.log('4. Verificar se existem dados na tabela Loja_Shopify');
  console.log('5. Verificar logs do container no Easypanel');
}

// Executar diagnóstico
main().catch(console.error);