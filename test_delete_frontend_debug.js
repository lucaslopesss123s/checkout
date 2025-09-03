// Usando fetch nativo do Node.js 18+

// Função para fazer login e obter token
async function login() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'teste',
        password: 'teste'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Login realizado com sucesso');
      return data.token;
    } else {
      console.log('❌ Erro no login:', response.status);
      return null;
    }
  } catch (error) {
    console.log('❌ Erro na requisição de login:', error.message);
    return null;
  }
}

// Função para listar domínios
async function listDomains() {
  try {
    const response = await fetch('http://localhost:3000/api/dominios');
    if (response.ok) {
      const domains = await response.json();
      console.log('📋 Domínios encontrados:', domains.length);
      domains.forEach(domain => {
        console.log(`  - ID: ${domain.id}, Domínio: ${domain.dominio}`);
      });
      return domains;
    } else {
      console.log('❌ Erro ao listar domínios:', response.status);
      return [];
    }
  } catch (error) {
    console.log('❌ Erro na requisição de domínios:', error.message);
    return [];
  }
}

// Função para testar a exclusão
async function testDelete(token, domainId) {
  try {
    console.log(`🗑️ Testando exclusão do domínio ID: ${domainId}`);
    
    const response = await fetch(`http://localhost:3000/api/cloudflare/domains/delete?id=${domainId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📊 Status da resposta:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Exclusão bem-sucedida:', result);
      return true;
    } else {
      const errorData = await response.json();
      console.log('❌ Erro na exclusão:', errorData);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro na requisição de exclusão:', error.message);
    return false;
  }
}

// Função principal
async function main() {
  console.log('🔍 Iniciando teste de debug do botão de exclusão...');
  
  // 1. Fazer login
  const token = await login();
  if (!token) {
    console.log('❌ Não foi possível obter token. Encerrando teste.');
    return;
  }
  
  // 2. Listar domínios
  const domains = await listDomains();
  if (domains.length === 0) {
    console.log('ℹ️ Nenhum domínio encontrado para testar exclusão.');
    return;
  }
  
  // 3. Testar exclusão do primeiro domínio
  const firstDomain = domains[0];
  console.log(`🎯 Selecionado para teste: ${firstDomain.dominio} (ID: ${firstDomain.id})`);
  
  const deleteSuccess = await testDelete(token, firstDomain.id);
  
  if (deleteSuccess) {
    console.log('✅ Teste de exclusão concluído com sucesso!');
    
    // Verificar se o domínio foi realmente removido
    console.log('🔍 Verificando se o domínio foi removido...');
    const domainsAfter = await listDomains();
    const stillExists = domainsAfter.find(d => d.id === firstDomain.id);
    
    if (stillExists) {
      console.log('⚠️ ATENÇÃO: Domínio ainda existe no banco após exclusão!');
    } else {
      console.log('✅ Domínio removido com sucesso do banco de dados!');
    }
  } else {
    console.log('❌ Teste de exclusão falhou.');
  }
}

main().catch(console.error);