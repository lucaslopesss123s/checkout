const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function testDomainAccess() {
  const domain = 'checkout.zollim.store';
  
  console.log(`🔍 Testando acesso ao domínio: ${domain}`);
  
  // Teste 1: Verificar se o domínio resolve
  try {
    const dns = require('dns').promises;
    const addresses = await dns.resolve4(domain);
    console.log('✅ DNS resolve para:', addresses);
  } catch (error) {
    console.log('❌ Erro na resolução DNS:', error.message);
    return;
  }
  
  // Teste 2: Verificar se conseguimos acessar via HTTP
  console.log('\n🌐 Testando acesso HTTP...');
  
  const testHttpAccess = () => {
    return new Promise((resolve) => {
      const req = http.request({
        hostname: domain,
        port: 80,
        path: '/',
        method: 'GET',
        timeout: 10000
      }, (res) => {
        console.log('✅ HTTP Status:', res.statusCode);
        console.log('   Headers:', Object.keys(res.headers));
        resolve(true);
      });
      
      req.on('error', (error) => {
        console.log('❌ Erro HTTP:', error.message);
        resolve(false);
      });
      
      req.on('timeout', () => {
        console.log('❌ Timeout HTTP');
        req.destroy();
        resolve(false);
      });
      
      req.end();
    });
  };
  
  const httpWorking = await testHttpAccess();
  
  if (!httpWorking) {
    console.log('\n⚠️  O domínio não está acessível via HTTP.');
    console.log('   Para Let\'s Encrypt funcionar, o domínio precisa:');
    console.log('   1. Apontar para este servidor via DNS');
    console.log('   2. Ser acessível na porta 80 (HTTP)');
    console.log('   3. Servir arquivos do diretório .well-known/acme-challenge/');
    return;
  }
  
  // Teste 3: Criar um arquivo de teste para simular o desafio ACME
  console.log('\n📁 Testando diretório de desafio ACME...');
  
  const challengeDir = path.join(process.cwd(), 'public', '.well-known', 'acme-challenge');
  const testFile = path.join(challengeDir, 'test-challenge');
  const testContent = 'test-challenge-content-' + Date.now();
  
  try {
    // Criar diretório se não existir
    await fs.promises.mkdir(challengeDir, { recursive: true });
    
    // Criar arquivo de teste
    await fs.promises.writeFile(testFile, testContent);
    console.log('✅ Arquivo de teste criado:', testFile);
    
    // Tentar acessar o arquivo via HTTP
    const testUrl = `http://${domain}/.well-known/acme-challenge/test-challenge`;
    console.log('🌐 Testando acesso ao desafio:', testUrl);
    
    const testChallengeAccess = () => {
      return new Promise((resolve) => {
        const req = http.request({
          hostname: domain,
          port: 80,
          path: '/.well-known/acme-challenge/test-challenge',
          method: 'GET',
          timeout: 10000
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (data.trim() === testContent) {
              console.log('✅ Desafio ACME acessível! Let\'s Encrypt deve funcionar.');
              resolve(true);
            } else {
              console.log('❌ Conteúdo do desafio incorreto:');
              console.log('   Esperado:', testContent);
              console.log('   Recebido:', data.trim());
              resolve(false);
            }
          });
        });
        
        req.on('error', (error) => {
          console.log('❌ Erro ao acessar desafio:', error.message);
          resolve(false);
        });
        
        req.on('timeout', () => {
          console.log('❌ Timeout ao acessar desafio');
          req.destroy();
          resolve(false);
        });
        
        req.end();
      });
    };
    
    const challengeWorking = await testChallengeAccess();
    
    // Limpar arquivo de teste
    try {
      await fs.promises.unlink(testFile);
    } catch (e) {}
    
    if (challengeWorking) {
      console.log('\n🎉 Domínio está pronto para Let\'s Encrypt!');
      console.log('   Você pode tentar gerar um certificado válido agora.');
    } else {
      console.log('\n⚠️  Domínio não está configurado corretamente para Let\'s Encrypt.');
      console.log('   Verifique se:');
      console.log('   - O servidor Next.js está servindo arquivos estáticos');
      console.log('   - O domínio aponta para este servidor');
      console.log('   - A porta 80 está acessível');
    }
    
  } catch (error) {
    console.log('❌ Erro ao testar desafio ACME:', error.message);
  }
}

testDomainAccess().catch(console.error);