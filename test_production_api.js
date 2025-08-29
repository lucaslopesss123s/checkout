const https = require('https');
const http = require('http');

async function testProductionAPI() {
  const domain = 'checkout.zollim.store';
  const baseUrl = `https://${domain}`;
  
  console.log('🔍 Testando API de produção:', baseUrl);
  console.log('=' .repeat(50));
  
  // Testar endpoints importantes
  const endpoints = [
    '/api/dominios',
    '/api/ssl/status',
    '/api/ssl/activate',
    '/dashboard/dominio'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n📡 Testando: ${endpoint}`);
    await testEndpoint(baseUrl + endpoint);
  }
  
  // Testar ativação SSL via API
  console.log('\n🔐 Testando ativação SSL via API...');
  await testSSLActivation(baseUrl);
}

function testEndpoint(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: 'GET',
      timeout: 10000,
      rejectUnauthorized: false // Aceitar certificados auto-assinados
    };
    
    const req = https.request(options, (res) => {
      console.log(`  ✅ Status: ${res.statusCode}`);
      console.log(`  📋 Headers: ${JSON.stringify(res.headers, null, 4)}`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (data.length < 500) {
          console.log(`  📄 Response: ${data}`);
        } else {
          console.log(`  📄 Response: ${data.substring(0, 200)}...`);
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`  ❌ Erro: ${error.message}`);
      resolve();
    });
    
    req.on('timeout', () => {
      console.log('  ❌ Timeout');
      req.destroy();
      resolve();
    });
    
    req.end();
  });
}

function testSSLActivation(baseUrl) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      domain: 'checkout.zollim.store'
    });
    
    const urlObj = new URL(baseUrl + '/api/ssl/activate');
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: 'POST',
      timeout: 30000, // 30 segundos para SSL
      rejectUnauthorized: false,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      console.log(`  ✅ SSL Activation Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(`  📋 SSL Response:`, JSON.stringify(response, null, 2));
        } catch (e) {
          console.log(`  📄 SSL Response: ${data}`);
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`  ❌ SSL Activation Error: ${error.message}`);
      resolve();
    });
    
    req.on('timeout', () => {
      console.log('  ❌ SSL Activation Timeout');
      req.destroy();
      resolve();
    });
    
    req.write(postData);
    req.end();
  });
}

// Executar teste
testProductionAPI().then(() => {
  console.log('\n🏁 Teste da API de produção concluído!');
  console.log('\n💡 Próximos passos:');
  console.log('1. Verificar se o aplicação está rodando no servidor');
  console.log('2. Configurar o domínio no EasyPanel');
  console.log('3. Ativar SSL via interface da aplicação');
}).catch(error => {
  console.error('❌ Erro fatal:', error);
});