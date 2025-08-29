const https = require('https');
const http = require('http');
const dns = require('dns').promises;

async function testSSLConfiguration() {
  const domain = 'checkout.zollim.store';
  
  console.log('🔍 Testando configuração SSL para:', domain);
  console.log('=' .repeat(50));
  
  try {
    // 1. Verificar resolução DNS
    console.log('\n1. Verificando resolução DNS...');
    const addresses = await dns.resolve4(domain);
    console.log('✅ IP resolvido:', addresses[0]);
    
    // 2. Testar conexão HTTP (porta 80)
    console.log('\n2. Testando conexão HTTP (porta 80)...');
    await testHTTPConnection(domain);
    
    // 3. Testar conexão HTTPS (porta 443)
    console.log('\n3. Testando conexão HTTPS (porta 443)...');
    await testHTTPSConnection(domain);
    
    // 4. Verificar certificado SSL
    console.log('\n4. Verificando detalhes do certificado SSL...');
    await checkSSLCertificate(domain);
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

function testHTTPConnection(domain) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: domain,
      port: 80,
      path: '/',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      console.log('✅ HTTP Status:', res.statusCode);
      console.log('✅ HTTP Headers:', JSON.stringify(res.headers, null, 2));
      resolve();
    });
    
    req.on('error', (error) => {
      console.log('❌ Erro HTTP:', error.message);
      resolve(); // Não rejeitar, apenas logar
    });
    
    req.on('timeout', () => {
      console.log('❌ Timeout na conexão HTTP');
      req.destroy();
      resolve();
    });
    
    req.end();
  });
}

function testHTTPSConnection(domain) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: domain,
      port: 443,
      path: '/',
      method: 'GET',
      timeout: 5000,
      rejectUnauthorized: false // Aceitar certificados auto-assinados para teste
    }, (res) => {
      console.log('✅ HTTPS Status:', res.statusCode);
      console.log('✅ HTTPS Headers:', JSON.stringify(res.headers, null, 2));
      resolve();
    });
    
    req.on('error', (error) => {
      console.log('❌ Erro HTTPS:', error.message);
      resolve();
    });
    
    req.on('timeout', () => {
      console.log('❌ Timeout na conexão HTTPS');
      req.destroy();
      resolve();
    });
    
    req.end();
  });
}

function checkSSLCertificate(domain) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: domain,
      port: 443,
      path: '/',
      method: 'GET',
      rejectUnauthorized: false
    }, (res) => {
      const cert = res.socket.getPeerCertificate();
      
      console.log('📋 Detalhes do Certificado:');
      console.log('  - Emissor:', cert.issuer?.CN || 'N/A');
      console.log('  - Assunto:', cert.subject?.CN || 'N/A');
      console.log('  - Válido de:', cert.valid_from);
      console.log('  - Válido até:', cert.valid_to);
      console.log('  - Auto-assinado:', cert.issuer?.CN === cert.subject?.CN ? 'Sim' : 'Não');
      console.log('  - Algoritmo:', cert.sigalg);
      
      // Verificar se é Let's Encrypt
      const isLetsEncrypt = cert.issuer?.CN?.includes('Let\'s Encrypt') || 
                           cert.issuer?.O?.includes('Let\'s Encrypt');
      console.log('  - Let\'s Encrypt:', isLetsEncrypt ? 'Sim' : 'Não');
      
      // Verificar se é EasyPanel
      const isEasyPanel = cert.issuer?.CN?.includes('EasyPanel') || 
                         cert.subject?.CN?.includes('EasyPanel');
      console.log('  - EasyPanel:', isEasyPanel ? 'Sim' : 'Não');
      
      resolve();
    });
    
    req.on('error', (error) => {
      console.log('❌ Erro ao verificar certificado:', error.message);
      resolve();
    });
    
    req.end();
  });
}

// Executar teste
testSSLConfiguration().then(() => {
  console.log('\n🏁 Teste concluído!');
}).catch(error => {
  console.error('❌ Erro fatal:', error);
});