// Script para simular exatamente o comportamento do frontend

// Função para fazer login via frontend
async function loginViaFrontend() {
  try {
    console.log('🔐 Fazendo login via API frontend...');
    
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
      console.log('🔑 Token obtido:', data.token.substring(0, 20) + '...');
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

// Função para simular o deleteDomain do frontend
async function simulateDeleteDomain(token, domainId) {
  try {
    console.log(`🗑️ Simulando deleteDomain para ID: ${domainId}`);
    console.log('🔑 Usando token:', token.substring(0, 20) + '...');
    
    // Simular exatamente o que o frontend faz
    const response = await fetch(`http://localhost:3000/api/cloudflare/domains/delete?id=${domainId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📊 Status da resposta:', response.status);
    console.log('📋 Headers da resposta:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Exclusão bem-sucedida:', result);
      return { success: true, data: result };
    } else {
      const errorData = await response.json();
      console.log('❌ Erro na exclusão:', errorData);
      return { success: false, error: errorData };
    }
  } catch (error) {
    console.log('❌ Erro na requisição de exclusão:', error.message);
    return { success: false, error: error.message };
  }
}

// Função para listar domínios
async function listDomains() {
  try {
    console.log('📋 Listando domínios...');
    const response = await fetch('http://localhost:3000/api/dominios');
    if (response.ok) {
      const domains = await response.json();
      console.log(`📊 Total de domínios: ${domains.length}`);
      domains.forEach((domain, index) => {
        console.log(`  ${index + 1}. ID: ${domain.id}`);
        console.log(`     Domínio: ${domain.dominio}`);
        console.log(`     Status: ${domain.status || 'N/A'}`);
        console.log(`     Cloudflare Zone ID: ${domain.cloudflare_zone_id || 'N/A'}`);
        console.log('     ---');
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

// Função principal
async function main() {
  console.log('🔍 Simulando comportamento exato do frontend...');
  console.log('=' .repeat(50));
  
  // 1. Fazer login
  const token = await loginViaFrontend();
  if (!token) {
    console.log('❌ Não foi possível obter token. Encerrando teste.');
    return;
  }
  
  console.log('\n' + '=' .repeat(50));
  
  // 2. Listar domínios antes da exclusão
  console.log('📋 ANTES DA EXCLUSÃO:');
  const domainsBefore = await listDomains();
  
  if (domainsBefore.length === 0) {
    console.log('ℹ️ Nenhum domínio encontrado para testar exclusão.');
    return;
  }
  
  console.log('\n' + '=' .repeat(50));
  
  // 3. Simular clique no botão de exclusão
  const targetDomain = domainsBefore[0];
  console.log(`🎯 TESTANDO EXCLUSÃO:`);
  console.log(`   Domínio: ${targetDomain.dominio}`);
  console.log(`   ID: ${targetDomain.id}`);
  
  // Simular o confirm() do frontend
  console.log('⚠️ Simulando confirmação do usuário: SIM');
  
  const deleteResult = await simulateDeleteDomain(token, targetDomain.id);
  
  console.log('\n' + '=' .repeat(50));
  
  // 4. Verificar resultado
  if (deleteResult.success) {
    console.log('✅ EXCLUSÃO BEM-SUCEDIDA!');
    
    // 5. Listar domínios após exclusão
    console.log('\n📋 APÓS A EXCLUSÃO:');
    const domainsAfter = await listDomains();
    
    const stillExists = domainsAfter.find(d => d.id === targetDomain.id);
    if (stillExists) {
      console.log('⚠️ PROBLEMA: Domínio ainda existe após exclusão!');
    } else {
      console.log('✅ SUCESSO: Domínio removido corretamente!');
    }
  } else {
    console.log('❌ FALHA NA EXCLUSÃO:', deleteResult.error);
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Teste concluído!');
}

main().catch(console.error);