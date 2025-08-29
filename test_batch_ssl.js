/**
 * Script de teste para o sistema de ativação SSL em lote
 * Testa a funcionalidade de ativação SSL para múltiplos domínios
 */

const https = require('https');
const http = require('http');

// Configuração
const BASE_URL = 'http://localhost:3000';
const TEST_DOMAINS = [
  'exemplo1.com',
  'exemplo2.com', 
  'exemplo3.com'
];

// Função para fazer requisições HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: 30000,
      ...options
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Função para aguardar
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Teste 1: Verificar domínios elegíveis
async function testEligibleDomains() {
  console.log('\n🔍 Testando busca de domínios elegíveis...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/ssl/batch`);
    
    if (response.status === 200) {
      console.log('✅ API de domínios elegíveis funcionando');
      console.log(`📊 Domínios elegíveis encontrados: ${response.data.eligibleDomains?.length || 0}`);
      
      if (response.data.statistics) {
        console.log('📈 Estatísticas SSL:');
        console.log(`   - Total de domínios: ${response.data.statistics.totalDomains}`);
        console.log(`   - SSL ativo: ${response.data.statistics.sslActive}`);
        console.log(`   - SSL inativo: ${response.data.statistics.sslInactive}`);
        console.log(`   - Domínios verificados: ${response.data.statistics.verifiedDomains}`);
      }
      
      return response.data.eligibleDomains || [];
    } else {
      console.log(`❌ Erro ao buscar domínios elegíveis: ${response.status}`);
      return [];
    }
  } catch (error) {
    console.log(`❌ Erro na requisição: ${error.message}`);
    return [];
  }
}

// Teste 2: Iniciar ativação SSL em lote
async function testBatchSSLActivation(domainIds) {
  console.log('\n🚀 Testando ativação SSL em lote...');
  
  if (domainIds.length === 0) {
    console.log('⚠️  Nenhum domínio elegível para teste');
    return null;
  }
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/ssl/batch`, {
      method: 'POST',
      body: {
        domainIds: domainIds.slice(0, 3) // Limitar a 3 domínios para teste
      }
    });
    
    if (response.status === 200) {
      console.log('✅ Ativação SSL em lote iniciada com sucesso');
      console.log(`🆔 Job ID: ${response.data.jobId}`);
      console.log(`📝 Status: ${response.data.status}`);
      console.log(`📊 Total de domínios: ${response.data.total}`);
      
      return response.data.jobId;
    } else {
      console.log(`❌ Erro ao iniciar ativação SSL: ${response.status}`);
      console.log(`📄 Resposta: ${JSON.stringify(response.data, null, 2)}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Erro na requisição: ${error.message}`);
    return null;
  }
}

// Teste 3: Monitorar progresso do job
async function testJobMonitoring(jobId) {
  console.log('\n📊 Monitorando progresso do job...');
  
  if (!jobId) {
    console.log('⚠️  Nenhum job ID para monitorar');
    return;
  }
  
  let attempts = 0;
  const maxAttempts = 20; // 2 minutos máximo
  
  while (attempts < maxAttempts) {
    try {
      const response = await makeRequest(`${BASE_URL}/api/ssl/batch?jobId=${jobId}`);
      
      if (response.status === 200 && response.data.job) {
        const job = response.data.job;
        console.log(`📈 Progresso: ${job.progress}/${job.total} (${job.percentage}%) - Status: ${job.status}`);
        
        if (job.status === 'completed' || job.status === 'failed') {
          console.log('✅ Job finalizado');
          
          if (job.results) {
            console.log('📋 Resultados:');
            job.results.forEach((result, index) => {
              console.log(`   ${index + 1}. ${result.domain}: ${result.success ? '✅ Sucesso' : '❌ Falha'}`);
              if (!result.success && result.error) {
                console.log(`      Erro: ${result.error}`);
              }
            });
          }
          
          break;
        }
        
        await sleep(6000); // Aguardar 6 segundos
        attempts++;
      } else {
        console.log(`❌ Erro ao consultar status do job: ${response.status}`);
        break;
      }
    } catch (error) {
      console.log(`❌ Erro ao monitorar job: ${error.message}`);
      break;
    }
  }
  
  if (attempts >= maxAttempts) {
    console.log('⏰ Timeout no monitoramento do job');
  }
}

// Teste 4: Cancelar job (se necessário)
async function testJobCancellation(jobId) {
  console.log('\n🛑 Testando cancelamento de job...');
  
  if (!jobId) {
    console.log('⚠️  Nenhum job ID para cancelar');
    return;
  }
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/ssl/batch`, {
      method: 'DELETE',
      body: { jobId }
    });
    
    if (response.status === 200) {
      console.log('✅ Job cancelado com sucesso');
    } else {
      console.log(`❌ Erro ao cancelar job: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Erro na requisição: ${error.message}`);
  }
}

// Teste 5: Verificar conectividade SSL após ativação
async function testSSLConnectivity(domains) {
  console.log('\n🔒 Testando conectividade SSL...');
  
  for (const domain of domains.slice(0, 3)) {
    try {
      console.log(`\n🌐 Testando ${domain}...`);
      
      // Testar HTTPS
      const httpsUrl = `https://checkout.${domain}`;
      const response = await makeRequest(httpsUrl, {
        timeout: 10000,
        rejectUnauthorized: false // Para aceitar certificados auto-assinados
      });
      
      console.log(`✅ HTTPS acessível (Status: ${response.status})`);
      
      // Verificar certificado
      const cert = response.headers['x-ssl-cert'] || 'Não disponível';
      console.log(`🔐 Certificado: ${cert}`);
      
    } catch (error) {
      console.log(`❌ Erro HTTPS: ${error.message}`);
    }
  }
}

// Função principal
async function runTests() {
  console.log('🧪 Iniciando testes do sistema SSL em lote\n');
  console.log('=' .repeat(50));
  
  try {
    // Teste 1: Buscar domínios elegíveis
    const eligibleDomains = await testEligibleDomains();
    
    if (eligibleDomains.length > 0) {
      // Teste 2: Iniciar ativação SSL
      const jobId = await testBatchSSLActivation(eligibleDomains.map(d => d.id));
      
      if (jobId) {
        // Teste 3: Monitorar progresso
        await testJobMonitoring(jobId);
        
        // Teste 5: Verificar conectividade SSL
        await testSSLConnectivity(eligibleDomains.map(d => d.domain));
      }
    } else {
      console.log('\n⚠️  Nenhum domínio elegível encontrado para teste completo');
      console.log('💡 Dica: Adicione alguns domínios verificados sem SSL para testar');
    }
    
  } catch (error) {
    console.log(`\n❌ Erro geral nos testes: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Testes concluídos');
}

// Executar testes
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testEligibleDomains,
  testBatchSSLActivation,
  testJobMonitoring,
  testJobCancellation,
  testSSLConnectivity,
  runTests
};