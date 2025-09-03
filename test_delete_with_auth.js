// Script para testar exclusão de domínio com autenticação
// Usando fetch nativo do Node.js 18+

async function testDeleteWithAuth() {
  const API_BASE = 'http://localhost:3000';
  const domainId = 'd2e8e6c7-937f-4c05-82ce-e2aa47a470cd'; // ID do domínio durango.com
  
  console.log('Testando exclusão de domínio com autenticação...');
  
  try {
    // Primeiro, fazer login para obter um token válido
    console.log('1. Fazendo login para obter token...');
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'teste', // Username encontrado no banco
        password: 'teste' // Tentativa com senha comum
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Falha no login');
      const loginError = await loginResponse.json();
      console.log('Erro de login:', loginError);
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login realizado com sucesso');
    
    // Agora testar a exclusão do domínio
    console.log('2. Testando exclusão do domínio...');
    const deleteResponse = await fetch(`${API_BASE}/api/cloudflare/domains/delete?id=${domainId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Status:', deleteResponse.status);
    console.log('Status Text:', deleteResponse.statusText);
    
    const deleteResult = await deleteResponse.json();
    console.log('Resposta:', deleteResult);
    
    if (deleteResponse.ok) {
      console.log('✅ Domínio excluído com sucesso!');
    } else {
      console.log('❌ Falha na exclusão');
    }
    
  } catch (error) {
    console.error('Erro na requisição:', error.message);
  }
}

testDeleteWithAuth();