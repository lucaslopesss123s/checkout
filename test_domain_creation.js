const fetch = require('node-fetch');

// Teste de criação de domínio
async function testDomainCreation() {
  try {
    console.log('Testando criação de domínio...');
    
    const response = await fetch('http://localhost:3000/api/cloudflare/domains/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Você precisará adicionar o token de autenticação aqui
        'Authorization': 'Bearer SEU_TOKEN_AQUI'
      },
      body: JSON.stringify({
        domain: 'teste-' + Date.now() + '.com'
      })
    });
    
    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Resposta:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Domínio criado com sucesso!');
      console.log('Zone ID:', result.zone_id);
      console.log('Domain ID:', result.domain?.id);
    } else {
      console.log('❌ Erro ao criar domínio:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

testDomainCreation();