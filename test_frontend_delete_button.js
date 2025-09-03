// Script para testar o botão de excluir do frontend
// Simula exatamente o comportamento do botão na interface

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3000';
const DOMAIN_ID = '550c0b4e-d7c2-40f4-8ae6-3ad4593a2ce5'; // ID do domínio de teste

// Função para fazer requisições HTTP
function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsedBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

async function testFrontendDeleteButton() {
  try {
    console.log('🧪 Testando botão Excluir do Frontend...');
    console.log(`🎯 Domínio ID: ${DOMAIN_ID}`);
    
    // 1. Fazer login (simular localStorage.getItem('token'))
    console.log('\n1. 🔐 Obtendo token de autenticação...');
    const loginData = JSON.stringify({
      username: 'teste',
      password: 'teste'
    });
    
    const loginOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };
    
    const loginResponse = await makeRequest(`${BASE_URL}/api/auth/login`, loginOptions, loginData);
    
    if (loginResponse.status !== 200 || !loginResponse.data.token) {
      console.log('❌ Falha no login');
      console.log('Status:', loginResponse.status);
      console.log('Resposta:', loginResponse.data);
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Token obtido com sucesso');
    
    // 2. Verificar se o domínio existe antes da exclusão
    console.log('\n2. 📋 Verificando domínios antes da exclusão...');
    const listBeforeOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const listBeforeResponse = await makeRequest(`${BASE_URL}/api/dominios`, listBeforeOptions);
    
    if (listBeforeResponse.status === 200) {
      const domainsBefore = listBeforeResponse.data;
      const targetDomain = domainsBefore.find(d => d.id === DOMAIN_ID);
      
      if (targetDomain) {
        console.log('✅ Domínio encontrado:', targetDomain.dominio);
      } else {
        console.log('❌ Domínio não encontrado na lista');
        return;
      }
    }
    
    // 3. Simular clique no botão Excluir (exatamente como no frontend)
    console.log('\n3. 🗑️ Simulando clique no botão Excluir...');
    console.log('   - Confirmação do usuário: SIM (simulado)');
    console.log('   - Chamando API de exclusão...');
    
    const deleteOptions = {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}` // Exatamente como no frontend
      }
    };
    
    const deleteResponse = await makeRequest(
      `${BASE_URL}/api/cloudflare/domains/delete?id=${DOMAIN_ID}`,
      deleteOptions
    );
    
    console.log('📊 Resposta da API de exclusão:');
    console.log('Status:', deleteResponse.status);
    console.log('Dados:', JSON.stringify(deleteResponse.data, null, 2));
    
    if (deleteResponse.status === 200 && deleteResponse.data.success) {
      console.log('\n✅ API de exclusão funcionou corretamente!');
      
      // 4. Simular recarregamento da lista (loadCloudflareZones)
      console.log('\n4. 🔄 Simulando recarregamento da lista...');
      const listAfterResponse = await makeRequest(`${BASE_URL}/api/dominios`, listBeforeOptions);
      
      if (listAfterResponse.status === 200) {
        const domainsAfter = listAfterResponse.data;
        const domainStillExists = domainsAfter.find(d => d.id === DOMAIN_ID);
        
        if (!domainStillExists) {
          console.log('✅ Domínio removido da lista com sucesso!');
          console.log('✅ BOTÃO DE EXCLUIR ESTÁ FUNCIONANDO PERFEITAMENTE!');
        } else {
          console.log('❌ Domínio ainda aparece na lista');
          console.log('❌ Problema no recarregamento da lista');
        }
        
        console.log(`\n📊 Total de domínios restantes: ${domainsAfter.length}`);
      } else {
        console.log('❌ Erro ao recarregar lista de domínios');
      }
    } else {
      console.log('\n❌ Falha na API de exclusão');
      console.log('❌ BOTÃO DE EXCLUIR NÃO ESTÁ FUNCIONANDO');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testFrontendDeleteButton();