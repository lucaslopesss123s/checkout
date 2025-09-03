// Script para testar o botão de excluir domínio
// Simula o comportamento do frontend

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3000';

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

async function testDeleteButton() {
  try {
    console.log('🧪 Testando funcionalidade do botão Excluir...');
    
    // 1. Fazer login para obter token
    console.log('\n1. 🔐 Fazendo login...');
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
    console.log('✅ Login realizado com sucesso');
    
    // 2. Listar domínios para encontrar um ID válido
    console.log('\n2. 📋 Listando domínios...');
    const listOptions = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    const listResponse = await makeRequest(`${BASE_URL}/api/dominios`, listOptions);
    
    if (listResponse.status !== 200) {
      console.log('❌ Falha ao listar domínios');
      console.log('Status:', listResponse.status);
      console.log('Resposta:', listResponse.data);
      return;
    }
    
    const domains = listResponse.data;
    console.log('✅ Domínios encontrados:', domains.length);
    
    if (domains.length === 0) {
      console.log('⚠️ Nenhum domínio encontrado para testar exclusão');
      return;
    }
    
    // Pegar o primeiro domínio para teste
    const testDomain = domains[0];
    console.log('🎯 Domínio selecionado para teste:', testDomain.dominio);
    console.log('🆔 ID do domínio:', testDomain.id);
    
    // 3. Testar exclusão do domínio (simulando o clique do botão)
    console.log('\n3. 🗑️ Testando exclusão do domínio...');
    
    const deleteOptions = {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    const deleteResponse = await makeRequest(
      `${BASE_URL}/api/cloudflare/domains/delete?id=${testDomain.id}`,
      deleteOptions
    );
    
    console.log('📊 Resposta da exclusão:');
    console.log('Status:', deleteResponse.status);
    console.log('Dados:', JSON.stringify(deleteResponse.data, null, 2));
    
    if (deleteResponse.status === 200 && deleteResponse.data.success) {
      console.log('\n✅ Botão de excluir funcionando corretamente!');
      console.log('✅ Domínio excluído com sucesso!');
      
      // 4. Verificar se o domínio foi realmente removido
      console.log('\n4. 🔍 Verificando se o domínio foi removido...');
      const verifyResponse = await makeRequest(`${BASE_URL}/api/dominios`, listOptions);
      
      if (verifyResponse.status === 200) {
        const remainingDomains = verifyResponse.data;
        const domainStillExists = remainingDomains.find(d => d.id === testDomain.id);
        
        if (!domainStillExists) {
          console.log('✅ Domínio removido com sucesso do banco de dados!');
        } else {
          console.log('❌ Domínio ainda existe no banco de dados');
        }
      }
    } else {
      console.log('\n❌ Falha na exclusão do domínio');
      console.log('❌ Botão de excluir não está funcionando corretamente');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testDeleteButton();