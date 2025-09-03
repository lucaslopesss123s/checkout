// Script para testar a exclusão de domínio
// Usando fetch nativo do Node.js

async function testDeleteDomain() {
  try {
    const domainId = 'd2e8e6c7-937f-4c05-82ce-e2aa47a470cd'; // ID do domínio durango.com
    const url = `http://localhost:3000/api/cloudflare/domains/delete?id=${domainId}`;
    
    console.log('Testando exclusão de domínio...');
    console.log(`URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        // Nota: Em um teste real, seria necessário incluir cookies de sessão
        // Para este teste, vamos ver se a API responde corretamente
      }
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Status Text: ${response.statusText}`);
    
    const responseData = await response.text();
    console.log('Resposta:', responseData);
    
    if (response.ok) {
      console.log('✅ Exclusão bem-sucedida!');
    } else {
      console.log('❌ Falha na exclusão');
    }
    
  } catch (error) {
    console.error('Erro no teste:', error.message);
  }
}

testDeleteDomain();