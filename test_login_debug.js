// Script para testar diferentes combinações de login

// Função para testar login
async function testLogin(username, password) {
  try {
    console.log(`🔐 Testando login: ${username} / ${password}`);
    
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    });

    console.log('📊 Status da resposta:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Login bem-sucedido! Token obtido.');
      return data.token;
    } else {
      const errorData = await response.json();
      console.log('❌ Erro no login:', errorData.error || 'Erro desconhecido');
      return null;
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    return null;
  }
}

// Função principal
async function main() {
  console.log('🔍 Testando diferentes combinações de login...');
  
  const combinations = [
    ['teste', 'teste123'],
    ['teste', 'teste'],
    ['teste', '123456'],
    ['teste', 'password'],
    ['admin', 'admin123'],
    ['admin', 'admin']
  ];
  
  for (const [username, password] of combinations) {
    const token = await testLogin(username, password);
    if (token) {
      console.log(`🎉 Credenciais corretas encontradas: ${username} / ${password}`);
      return;
    }
    console.log('---');
  }
  
  console.log('❌ Nenhuma combinação de credenciais funcionou.');
}

main().catch(console.error);