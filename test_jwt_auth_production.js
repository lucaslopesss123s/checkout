// Script para testar autenticação JWT em produção
// Execute: node test_jwt_auth_production.js

const jwt = require('jsonwebtoken');

// Configurações de produção
const PRODUCTION_URL = 'https://zollim-checkout.rboln1.easypanel.host';
const TEST_STORE_ID = '7453e5c4-bbb1-4e16-87da-0f031f7e3d56';

// ===== INSTRUÇÕES DE USO =====
console.log('🔧 TESTE DE AUTENTICAÇÃO JWT EM PRODUÇÃO');
console.log('==========================================');
console.log('1. Este script testa problemas de autenticação JWT');
console.log('2. Substitua as credenciais de teste abaixo pelos dados reais');
console.log('3. Execute no terminal do container Easypanel para testar variáveis de ambiente');
console.log('4. Para testar externamente, use dados de usuário válido\n');

// ===== DADOS DE TESTE - SUBSTITUA PELOS REAIS =====
const TEST_CREDENTIALS = {
  username: 'seu_username_aqui',  // Substitua pelo username real
  password: 'sua_senha_aqui'      // Substitua pela senha real
};

// Função para fazer requisições HTTP
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.text();
    let jsonData;
    
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = { raw: data };
    }
    
    return {
      success: response.ok,
      status: response.status,
      data: jsonData,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: 0
    };
  }
}

// Função para analisar token JWT
function analyzeJWT(token) {
  try {
    // Decodificar sem verificar assinatura (apenas para análise)
    const decoded = jwt.decode(token, { complete: true });
    
    if (!decoded) {
      console.log('❌ Token não pôde ser decodificado');
      return false;
    }
    
    console.log('📋 Estrutura do Token:');
    console.log('   Header:', JSON.stringify(decoded.header, null, 2));
    console.log('   Payload:', JSON.stringify(decoded.payload, null, 2));
    
    // Verificar campos esperados
    const payload = decoded.payload;
    const hasId = payload.id || payload.userId;
    const hasUsername = payload.username;
    const hasExp = payload.exp;
    
    console.log('\n🔍 Validação do Payload:');
    console.log(`   ✅ ID do usuário: ${hasId ? '✓' : '✗'} (${hasId || 'não encontrado'})`);
    console.log(`   ✅ Username: ${hasUsername ? '✓' : '✗'} (${hasUsername || 'não encontrado'})`);
    console.log(`   ✅ Expiração: ${hasExp ? '✓' : '✗'} (${hasExp ? new Date(hasExp * 1000).toISOString() : 'não encontrado'})`);
    
    // Verificar se o token expirou
    if (hasExp) {
      const now = Math.floor(Date.now() / 1000);
      const isExpired = now > hasExp;
      console.log(`   ⏰ Status: ${isExpired ? '❌ EXPIRADO' : '✅ VÁLIDO'}`);
      
      if (isExpired) {
        console.log(`   📅 Expirou em: ${new Date(hasExp * 1000).toISOString()}`);
        console.log(`   📅 Agora: ${new Date(now * 1000).toISOString()}`);
      }
    }
    
    return true;
  } catch (error) {
    console.log('❌ Erro ao analisar token:', error.message);
    return false;
  }
}

// Teste 1: Login e geração de token
async function testLogin() {
  console.log('\n=== TESTE 1: LOGIN E GERAÇÃO DE TOKEN ===');
  
  console.log('🔐 Tentando fazer login...');
  console.log(`   Username: ${TEST_CREDENTIALS.username}`);
  console.log(`   Password: ${TEST_CREDENTIALS.password.replace(/./g, '*')}`);
  
  const loginResult = await makeRequest(`${PRODUCTION_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify(TEST_CREDENTIALS)
  });
  
  console.log(`\n📊 Resultado do Login:`);
  console.log(`   Status: ${loginResult.status}`);
  console.log(`   Sucesso: ${loginResult.success ? '✅' : '❌'}`);
  
  if (!loginResult.success) {
    console.log(`   ❌ Erro: ${JSON.stringify(loginResult.data, null, 2)}`);
    
    if (loginResult.status === 401) {
      console.log('\n💡 POSSÍVEIS CAUSAS:');
      console.log('   - Username ou senha incorretos');
      console.log('   - Usuário não existe no banco de dados');
      console.log('   - Problema na criptografia da senha (bcrypt)');
    } else if (loginResult.status === 500) {
      console.log('\n💡 POSSÍVEIS CAUSAS:');
      console.log('   - Erro de conexão com banco de dados');
      console.log('   - Variável JWT_SECRET não configurada');
      console.log('   - Erro interno do servidor');
    }
    
    return null;
  }
  
  const { token, user } = loginResult.data;
  
  if (!token) {
    console.log('❌ Token não foi retornado no login');
    return null;
  }
  
  console.log('✅ Login realizado com sucesso!');
  console.log(`   Token: ${token.substring(0, 20)}...${token.substring(token.length - 10)}`);
  console.log(`   Usuário: ${JSON.stringify(user, null, 2)}`);
  
  // Analisar o token
  console.log('\n🔍 Analisando token JWT...');
  analyzeJWT(token);
  
  return token;
}

// Teste 2: Testar token nas APIs protegidas
async function testProtectedAPIs(token) {
  console.log('\n=== TESTE 2: APIS PROTEGIDAS ===');
  
  if (!token) {
    console.log('❌ Token não disponível para teste');
    return;
  }
  
  const authHeaders = {
    'Authorization': `Bearer ${token}`
  };
  
  // Teste 2.1: API de credenciais Shopify
  console.log('\n🔍 Testando API de credenciais Shopify...');
  const credResult = await makeRequest(
    `${PRODUCTION_URL}/api/shopify/credentials?storeId=${TEST_STORE_ID}`,
    { headers: authHeaders }
  );
  
  console.log(`   Status: ${credResult.status}`);
  console.log(`   Sucesso: ${credResult.success ? '✅' : '❌'}`);
  
  if (!credResult.success) {
    console.log(`   Erro: ${JSON.stringify(credResult.data, null, 2)}`);
    
    if (credResult.status === 401) {
      console.log('\n💡 POSSÍVEIS CAUSAS DO 401:');
      console.log('   - Token inválido ou expirado');
      console.log('   - JWT_SECRET diferente entre login e validação');
      console.log('   - Formato do token incorreto');
      console.log('   - Header Authorization mal formado');
    } else if (credResult.status === 404) {
      console.log('\n💡 POSSÍVEIS CAUSAS DO 404:');
      console.log('   - Loja não encontrada no banco');
      console.log('   - Loja não pertence ao usuário');
      console.log('   - ID da loja incorreto');
    }
  } else {
    console.log('✅ API de credenciais funcionando!');
  }
  
  // Teste 2.2: API de perfil do usuário
  console.log('\n🔍 Testando API de perfil...');
  const profileResult = await makeRequest(
    `${PRODUCTION_URL}/api/user/profile`,
    { headers: authHeaders }
  );
  
  console.log(`   Status: ${profileResult.status}`);
  console.log(`   Sucesso: ${profileResult.success ? '✅' : '❌'}`);
  
  if (profileResult.success) {
    console.log('✅ API de perfil funcionando!');
    console.log(`   Dados: ${JSON.stringify(profileResult.data, null, 2)}`);
  } else {
    console.log(`   Erro: ${JSON.stringify(profileResult.data, null, 2)}`);
  }
}

// Teste 3: Verificar variáveis de ambiente (apenas no container)
function testEnvironmentVariables() {
  console.log('\n=== TESTE 3: VARIÁVEIS DE AMBIENTE ===');
  console.log('⚠️ Este teste só funciona dentro do container Easypanel\n');
  
  const requiredVars = [
    'JWT_SECRET',
    'ENCRYPTION_KEY',
    'DATABASE_URL',
    'NODE_ENV'
  ];
  
  console.log('🔍 Verificando variáveis de ambiente:');
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    const exists = !!value;
    const masked = value ? `${value.substring(0, 10)}...` : 'não definida';
    
    console.log(`   ${exists ? '✅' : '❌'} ${varName}: ${masked}`);
    
    if (!exists) {
      console.log(`      ⚠️ Variável ${varName} não está definida!`);
    }
  });
  
  // Verificar se JWT_SECRET é o padrão (inseguro)
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret === 'your-secret-key' || jwtSecret === 'fallback_secret') {
    console.log('\n⚠️ AVISO: JWT_SECRET está usando valor padrão (inseguro)!');
    console.log('   Configure uma chave secreta forte em produção.');
  }
}

// Função principal
async function runTests() {
  console.log('🚀 Iniciando testes de autenticação JWT...\n');
  
  try {
    // Teste de variáveis de ambiente
    testEnvironmentVariables();
    
    // Teste de login
    const token = await testLogin();
    
    // Teste de APIs protegidas
    await testProtectedAPIs(token);
    
    console.log('\n=== RESUMO DOS TESTES ===');
    console.log('✅ Testes concluídos!');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Se o login falhou: verifique credenciais e banco de dados');
    console.log('2. Se APIs retornam 401: verifique JWT_SECRET em produção');
    console.log('3. Se APIs retornam 404: verifique se a loja existe e pertence ao usuário');
    console.log('4. Execute este script dentro do container para testar variáveis de ambiente');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
}

// Executar testes
if (require.main === module) {
  runTests();
}

module.exports = { runTests, testLogin, testProtectedAPIs, analyzeJWT };