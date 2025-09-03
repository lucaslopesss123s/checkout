/**
 * Script para comparar autenticação entre desenvolvimento e produção
 * Identifica diferenças específicas no Easypanel
 */

const jwt = require('jsonwebtoken');

// Configurações para teste
const TEST_CONFIG = {
  // URL base da produção (substitua pela sua URL do Easypanel)
  PRODUCTION_URL: 'https://seu-app.easypanel.host',
  
  // Dados de teste para login
  TEST_USER: {
    username: 'seu-usuario',
    password: 'sua-senha'
  }
};

console.log('🔍 DIAGNÓSTICO: Desenvolvimento vs Produção\n');

// Função para testar login e obter token
async function testLogin(baseUrl, environment) {
  console.log(`\n📍 Testando ${environment}:`);
  console.log(`URL: ${baseUrl}`);
  
  try {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_CONFIG.TEST_USER)
    });

    console.log(`Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Erro no login: ${errorText}`);
      return null;
    }

    const data = await response.json();
    console.log(`✅ Login realizado com sucesso`);
    console.log(`Token recebido: ${data.token ? 'SIM' : 'NÃO'}`);
    
    if (data.token) {
      // Decodificar token sem verificar assinatura
      const decoded = jwt.decode(data.token);
      console.log(`Payload do token:`, JSON.stringify(decoded, null, 2));
      
      // Verificar estrutura do payload
      console.log(`Campo 'id': ${decoded?.id || 'AUSENTE'}`);
      console.log(`Campo 'userId': ${decoded?.userId || 'AUSENTE'}`);
      console.log(`Campo 'username': ${decoded?.username || 'AUSENTE'}`);
      console.log(`Expiração: ${decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : 'AUSENTE'}`);
    }
    
    return data.token;
  } catch (error) {
    console.log(`❌ Erro na requisição: ${error.message}`);
    return null;
  }
}

// Função para testar API protegida
async function testProtectedAPI(baseUrl, token, environment) {
  console.log(`\n🔐 Testando API protegida em ${environment}:`);
  
  if (!token) {
    console.log('❌ Sem token para testar');
    return;
  }
  
  try {
    const response = await fetch(`${baseUrl}/api/shopify/credentials`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Status da API: ${response.status}`);
    
    if (response.status === 401) {
      console.log('❌ Token inválido na API');
      const errorText = await response.text();
      console.log(`Erro: ${errorText}`);
    } else if (response.ok) {
      console.log('✅ Token válido na API');
      const data = await response.json();
      console.log(`Dados recebidos: ${JSON.stringify(data).substring(0, 100)}...`);
    } else {
      console.log(`⚠️ Outro erro: ${response.status}`);
      const errorText = await response.text();
      console.log(`Erro: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Erro na requisição da API: ${error.message}`);
  }
}

// Função para verificar variáveis de ambiente (apenas informativo)
function checkEnvironmentInfo() {
  console.log('\n🔧 INFORMAÇÕES DO AMBIENTE:');
  console.log('Para verificar no Easypanel:');
  console.log('1. Acesse o painel do Easypanel');
  console.log('2. Vá em Environment Variables');
  console.log('3. Verifique se estas variáveis estão definidas:');
  console.log('   - JWT_SECRET (deve ser a mesma do desenvolvimento)');
  console.log('   - DATABASE_URL');
  console.log('   - ENCRYPTION_KEY');
  console.log('   - NODE_ENV=production');
  console.log('\n⚠️ IMPORTANTE: JWT_SECRET deve ser EXATAMENTE igual em dev e prod!');
}

// Função principal
async function main() {
  console.log('🚀 Iniciando comparação Desenvolvimento vs Produção\n');
  
  // Verificar informações do ambiente
  checkEnvironmentInfo();
  
  // Testar desenvolvimento (localhost)
  const devToken = await testLogin('http://localhost:3000', 'DESENVOLVIMENTO');
  await testProtectedAPI('http://localhost:3000', devToken, 'DESENVOLVIMENTO');
  
  // Testar produção
  const prodToken = await testLogin(TEST_CONFIG.PRODUCTION_URL, 'PRODUÇÃO');
  await testProtectedAPI(TEST_CONFIG.PRODUCTION_URL, prodToken, 'PRODUÇÃO');
  
  // Comparar tokens se ambos existirem
  if (devToken && prodToken) {
    console.log('\n🔍 COMPARAÇÃO DE TOKENS:');
    
    const devDecoded = jwt.decode(devToken);
    const prodDecoded = jwt.decode(prodToken);
    
    console.log('Desenvolvimento:', JSON.stringify(devDecoded, null, 2));
    console.log('Produção:', JSON.stringify(prodDecoded, null, 2));
    
    // Verificar diferenças específicas
    const differences = [];
    if (devDecoded?.id !== prodDecoded?.id) differences.push('id diferente');
    if (devDecoded?.userId !== prodDecoded?.userId) differences.push('userId diferente');
    if (devDecoded?.username !== prodDecoded?.username) differences.push('username diferente');
    
    if (differences.length > 0) {
      console.log(`⚠️ Diferenças encontradas: ${differences.join(', ')}`);
    } else {
      console.log('✅ Payloads dos tokens são idênticos');
    }
  }
  
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. Verifique se JWT_SECRET é igual em dev e prod');
  console.log('2. Confirme se o deploy das correções JWT foi feito');
  console.log('3. Verifique logs do container no Easypanel');
  console.log('4. Teste com dados reais da sua aplicação');
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testLogin, testProtectedAPI };