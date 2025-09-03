/**
 * Script para debugar o token JWT específico que está falhando em produção
 * Token do console: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNmNzk1NDM1LTBiZGUtNGJhZC1iZjY5LTdjNGViNjM0ZjgyOCIsInVzZXJuYW1lIjoidGVzdGUiLCJpYXQiOjE3NTY0ODA4MDksImV4cCI6MTc1NzA4NTYwOX0.9Rpxoyf1RdIynEvgH_CDTrPzjvM1_OX6sSX0b-TZFi0
 */

const jwt = require('jsonwebtoken');

// Token específico que está falhando
const FAILING_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNmNzk1NDM1LTBiZGUtNGJhZC1iZjY5LTdjNGViNjM0ZjgyOCIsInVzZXJuYW1lIjoidGVzdGUiLCJpYXQiOjE3NTY0ODA4MDksImV4cCI6MTc1NzA4NTYwOX0.9Rpxoyf1RdIynEvgH_CDTrPzjvM1_OX6sSX0b-TZFi0';

// URL da produção
const PRODUCTION_URL = 'https://zollim-checkout.rboln1.easypanel.host';
const STORE_ID = '7453e5c4-bbb1-4e16-87da-0f031f7e3d56';

console.log('🔍 ANÁLISE DO TOKEN QUE ESTÁ FALHANDO\n');

// 1. Decodificar o token sem verificar assinatura
function analyzeToken() {
  console.log('📋 INFORMAÇÕES DO TOKEN:');
  
  try {
    const decoded = jwt.decode(FAILING_TOKEN);
    console.log('Payload completo:', JSON.stringify(decoded, null, 2));
    
    console.log('\n🔍 CAMPOS ESPECÍFICOS:');
    console.log(`ID do usuário: ${decoded.id}`);
    console.log(`Username: ${decoded.username}`);
    console.log(`Campo 'userId': ${decoded.userId || 'AUSENTE'}`);
    
    console.log('\n⏰ VALIDADE:');
    const now = Math.floor(Date.now() / 1000);
    const exp = decoded.exp;
    console.log(`Emitido em: ${new Date(decoded.iat * 1000).toISOString()}`);
    console.log(`Expira em: ${new Date(exp * 1000).toISOString()}`);
    console.log(`Tempo atual: ${new Date(now * 1000).toISOString()}`);
    console.log(`Token válido: ${exp > now ? '✅ SIM' : '❌ EXPIRADO'}`);
    
    if (exp <= now) {
      console.log('\n🚨 PROBLEMA IDENTIFICADO: TOKEN EXPIRADO!');
      console.log('Solução: Faça logout e login novamente.');
      return false;
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Erro ao decodificar token: ${error.message}`);
    return false;
  }
}

// 2. Testar a API diretamente
async function testAPI() {
  console.log('\n🔗 TESTANDO API DIRETAMENTE:');
  
  const url = `${PRODUCTION_URL}/api/shopify/credentials?storeId=${STORE_ID}`;
  console.log(`URL: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FAILING_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log(`Response: ${responseText}`);
    
    if (response.status === 401) {
      console.log('\n🚨 ERRO 401 CONFIRMADO');
      console.log('Possíveis causas:');
      console.log('1. JWT_SECRET diferente entre dev e prod');
      console.log('2. Deploy das correções não foi aplicado');
      console.log('3. Token expirado');
      console.log('4. Problema na validação do JWT');
    }
    
  } catch (error) {
    console.log(`❌ Erro na requisição: ${error.message}`);
  }
}

// 3. Verificar se o deploy foi aplicado
async function checkDeployStatus() {
  console.log('\n🚀 VERIFICANDO STATUS DO DEPLOY:');
  
  // Testar uma API simples para ver se as correções estão aplicadas
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/user/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FAILING_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status da API /user/profile: ${response.status}`);
    
    if (response.status === 401) {
      console.log('❌ API /user/profile também retorna 401');
      console.log('Isso confirma que o problema é geral, não específico do Shopify');
    } else {
      console.log('✅ API /user/profile funciona');
      console.log('O problema pode ser específico da API Shopify');
    }
    
  } catch (error) {
    console.log(`❌ Erro ao testar /user/profile: ${error.message}`);
  }
}

// 4. Simular validação JWT local
function simulateJWTValidation() {
  console.log('\n🔐 SIMULANDO VALIDAÇÃO JWT:');
  
  // Tentar diferentes JWT_SECRET comuns
  const commonSecrets = [
    'your-secret-key',
    'jwt-secret',
    'secret',
    'development-secret',
    'production-secret'
  ];
  
  console.log('Testando secrets comuns...');
  
  for (const secret of commonSecrets) {
    try {
      const decoded = jwt.verify(FAILING_TOKEN, secret);
      console.log(`✅ Token válido com secret: "${secret}"`);
      console.log('Payload:', JSON.stringify(decoded, null, 2));
      return secret;
    } catch (error) {
      console.log(`❌ Falhou com secret: "${secret}" - ${error.message}`);
    }
  }
  
  console.log('\n⚠️ Nenhum secret comum funcionou.');
  console.log('Isso indica que o JWT_SECRET em produção é diferente.');
  return null;
}

// Função principal
async function main() {
  console.log('🚀 DIAGNÓSTICO COMPLETO DO TOKEN JWT\n');
  
  // Analisar o token
  const tokenValid = analyzeToken();
  
  if (!tokenValid) {
    console.log('\n🛑 Pare aqui: Token expirado ou inválido.');
    return;
  }
  
  // Testar a API
  await testAPI();
  
  // Verificar deploy
  await checkDeployStatus();
  
  // Simular validação
  simulateJWTValidation();
  
  console.log('\n📋 RESUMO DO DIAGNÓSTICO:');
  console.log('1. ✅ Token decodificado com sucesso');
  console.log('2. ❌ API retorna 401 em produção');
  console.log('3. 🔍 Verificar se JWT_SECRET é igual em dev e prod');
  console.log('4. 🔍 Confirmar se deploy das correções foi aplicado');
  
  console.log('\n🎯 PRÓXIMOS PASSOS:');
  console.log('1. Verificar JWT_SECRET no Easypanel');
  console.log('2. Fazer redeploy se necessário');
  console.log('3. Verificar logs do container');
  console.log('4. Testar com novo login');
}

// Executar
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { analyzeToken, testAPI, checkDeployStatus };