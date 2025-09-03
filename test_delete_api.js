const https = require('https');
const http = require('http');

// Configurações
const BASE_URL = 'http://localhost:3000';
const DOMAIN_ID = 'afca9b6a-3db7-484d-a343-776cb49c1f86'; // ID do domínio de teste

// Função para fazer requisição HTTP
function makeRequest(url, options, postData = null) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function testDeleteAPI() {
  try {
    console.log('🧪 Testando API de exclusão de domínio...');
    console.log(`📋 ID do domínio: ${DOMAIN_ID}`);
    
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
    console.log('🎫 Token obtido:', token.substring(0, 20) + '...');
    
    // 2. Testar exclusão do domínio
    console.log('\n2. 🗑️ Testando exclusão do domínio...');
    
    const deleteOptions = {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    const deleteResponse = await makeRequest(
      `${BASE_URL}/api/cloudflare/domains/delete?id=${DOMAIN_ID}`,
      deleteOptions
    );
    
    console.log('📊 Resposta da exclusão:');
    console.log('Status:', deleteResponse.status);
    console.log('Dados:', JSON.stringify(deleteResponse.data, null, 2));
    
    if (deleteResponse.status === 200 && deleteResponse.data.success) {
      console.log('\n✅ Domínio excluído com sucesso!');
    } else {
      console.log('\n❌ Falha na exclusão do domínio');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testDeleteAPI();