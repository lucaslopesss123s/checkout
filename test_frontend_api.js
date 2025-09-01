// Usando fetch nativo do Node.js 18+

// Simular exatamente o que o frontend está enviando
async function testFrontendAPI() {
  const API_BASE = 'http://localhost:3000';
  
  // Dados que o frontend está enviando
  const testData = {
    storeId: 'd76a4e1b-1066-4389-80a0-2ce401e4ff90',
    email: 'admin@example.com',
    apiToken: 'your_actual_token_here', // Substitua pelo token real
    apiKey: null
  };
  
  console.log('Testando API do frontend...');
  console.log('Dados enviados:', testData);
  
  try {
    // Primeiro, vamos tentar sem autenticação para ver o erro
    console.log('\n1. Testando sem token de autorização...');
    const response1 = await fetch(`${API_BASE}/api/cloudflare/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const result1 = await response1.json();
    console.log('Status:', response1.status);
    console.log('Resposta:', result1);
    
    // Agora vamos tentar com um token fake para ver se chega na validação
    console.log('\n2. Testando com token fake...');
    const response2 = await fetch(`${API_BASE}/api/cloudflare/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake_token_for_testing'
      },
      body: JSON.stringify(testData)
    });
    
    const result2 = await response2.json();
    console.log('Status:', response2.status);
    console.log('Resposta:', result2);
    
  } catch (error) {
    console.error('Erro na requisição:', error.message);
  }
}

testFrontendAPI();