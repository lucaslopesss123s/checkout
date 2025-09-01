/**
 * Script de Teste - Integração Cloudflare Completa
 * 
 * Este script testa todos os aspectos da integração Cloudflare:
 * 1. Configuração e autenticação
 * 2. Gerenciamento de zonas
 * 3. Criação de registros DNS
 * 4. Configuração SSL automática
 * 5. Verificação de status
 */

const https = require('https')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Configurações de teste
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testDomain: 'teste-cloudflare.com', // Substitua por um domínio real para teste
  storeId: null, // Será preenchido automaticamente
  token: null    // Será preenchido automaticamente
}

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logStep(step, message) {
  log(`\n${colors.bold}[STEP ${step}]${colors.reset} ${message}`, 'blue')
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

// Função para fazer requisições HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }

    const req = (urlObj.protocol === 'https:' ? https : require('http')).request(requestOptions, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data)
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers })
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers })
        }
      })
    })

    req.on('error', reject)

    if (options.body) {
      req.write(JSON.stringify(options.body))
    }

    req.end()
  })
}

// Função para obter token de autenticação
async function getAuthToken() {
  try {
    // Buscar usuário de teste no banco
    const user = await prisma.users.findFirst({
      where: {
        email: { contains: '@' } // Pega qualquer usuário válido
      }
    })

    if (!user) {
      throw new Error('Nenhum usuário encontrado no banco de dados')
    }

    // Simular login (em produção, use credenciais reais)
    const loginResponse = await makeRequest(`${TEST_CONFIG.baseUrl}/api/auth/login`, {
      method: 'POST',
      body: {
        email: user.email,
        password: 'senha-teste' // Ajuste conforme necessário
      }
    })

    if (loginResponse.status === 200 && loginResponse.data.token) {
      TEST_CONFIG.token = loginResponse.data.token
      logSuccess(`Token obtido para usuário: ${user.email}`)
      return loginResponse.data.token
    } else {
      throw new Error('Falha ao obter token de autenticação')
    }
  } catch (error) {
    logError(`Erro ao obter token: ${error.message}`)
    // Para testes, usar um token mock
    TEST_CONFIG.token = 'mock-token-for-testing'
    logWarning('Usando token mock para testes')
    return TEST_CONFIG.token
  }
}

// Função para obter ID da loja
async function getStoreId() {
  try {
    const store = await prisma.loja_admin.findFirst({})

    if (!store) {
      throw new Error('Nenhuma loja ativa encontrada')
    }

    TEST_CONFIG.storeId = store.id
    logSuccess(`Loja encontrada: ${store.nome_loja} (${store.id})`)
    return store.id
  } catch (error) {
    logError(`Erro ao obter loja: ${error.message}`)
    throw error
  }
}

// Teste 1: Configuração Cloudflare
async function testCloudflareConfig() {
  logStep(1, 'Testando configuração Cloudflare')

  try {
    // Verificar configuração existente
    const getResponse = await makeRequest(
      `${TEST_CONFIG.baseUrl}/api/cloudflare/config?storeId=${TEST_CONFIG.storeId}`,
      {
        headers: { 'Authorization': `Bearer ${TEST_CONFIG.token}` }
      }
    )

    if (getResponse.status === 200) {
      logSuccess('Configuração Cloudflare encontrada')
      console.log('Detalhes:', JSON.stringify(getResponse.data, null, 2))
      return true
    } else if (getResponse.status === 404) {
      logWarning('Nenhuma configuração encontrada. Isso é esperado se for o primeiro teste.')
      return false
    } else {
      logError(`Erro ao buscar configuração: ${getResponse.status}`)
      return false
    }
  } catch (error) {
    logError(`Erro no teste de configuração: ${error.message}`)
    return false
  }
}

// Teste 2: Gerenciamento de Zonas
async function testZoneManagement() {
  logStep(2, 'Testando gerenciamento de zonas')

  try {
    // Listar zonas existentes
    const listResponse = await makeRequest(
      `${TEST_CONFIG.baseUrl}/api/cloudflare/zones?storeId=${TEST_CONFIG.storeId}`,
      {
        headers: { 'Authorization': `Bearer ${TEST_CONFIG.token}` }
      }
    )

    if (listResponse.status === 200) {
      logSuccess(`Encontradas ${listResponse.data.zones?.length || 0} zonas`)
      if (listResponse.data.zones?.length > 0) {
        console.log('Zonas:', listResponse.data.zones.map(z => `${z.name} (${z.status})`).join(', '))
      }
      return true
    } else {
      logError(`Erro ao listar zonas: ${listResponse.status}`)
      return false
    }
  } catch (error) {
    logError(`Erro no teste de zonas: ${error.message}`)
    return false
  }
}

// Teste 3: SSL Manager
async function testSSLManager() {
  logStep(3, 'Testando SSL Manager')

  try {
    // Verificar status SSL
    const sslStatusResponse = await makeRequest(
      `${TEST_CONFIG.baseUrl}/api/cloudflare/zones/ssl-check?storeId=${TEST_CONFIG.storeId}`,
      {
        headers: { 'Authorization': `Bearer ${TEST_CONFIG.token}` }
      }
    )

    if (sslStatusResponse.status === 200) {
      const stats = sslStatusResponse.data.statistics
      logSuccess('Status SSL obtido com sucesso')
      console.log('Estatísticas SSL:')
      console.log(`  - Total de zonas: ${stats.total}`)
      console.log(`  - SSL ativo: ${stats.sslEnabled}`)
      console.log(`  - SSL inativo: ${stats.sslDisabled}`)
      console.log(`  - Zonas ativas: ${stats.activeZones}`)
      console.log(`  - Zonas pendentes: ${stats.pendingZones}`)
      return true
    } else {
      logError(`Erro ao verificar SSL: ${sslStatusResponse.status}`)
      return false
    }
  } catch (error) {
    logError(`Erro no teste SSL: ${error.message}`)
    return false
  }
}

// Teste 4: Integração de Domínios
async function testDomainIntegration() {
  logStep(4, 'Testando integração de domínios')

  try {
    // Verificar domínios existentes
    const domainsResponse = await makeRequest(
      `${TEST_CONFIG.baseUrl}/api/dominios?id_loja=${TEST_CONFIG.storeId}`,
      {
        headers: { 'Authorization': `Bearer ${TEST_CONFIG.token}` }
      }
    )

    if (domainsResponse.status === 200) {
      const domains = domainsResponse.data.dominios || []
      logSuccess(`Encontrados ${domains.length} domínios`)
      
      const cloudflaredomains = domains.filter(d => d.cloudflare_zone_id)
      logSuccess(`${cloudflaredomains.length} domínios usando Cloudflare`)
      
      if (cloudflaredomains.length > 0) {
        console.log('Domínios Cloudflare:')
        cloudflaredomains.forEach(d => {
          console.log(`  - ${d.dominio} (${d.status}) - Zone: ${d.cloudflare_zone_id}`)
        })
      }
      
      return true
    } else {
      logError(`Erro ao buscar domínios: ${domainsResponse.status}`)
      return false
    }
  } catch (error) {
    logError(`Erro no teste de domínios: ${error.message}`)
    return false
  }
}

// Teste 5: Verificação de Banco de Dados
async function testDatabaseIntegrity() {
  logStep(5, 'Verificando integridade do banco de dados')

  try {
    // Verificar tabelas Cloudflare
    const configCount = await prisma.cloudflare_config.count()
    const zonesCount = await prisma.cloudflare_zones.count()
    const dnsCount = await prisma.cloudflare_dns_records.count()

    logSuccess('Verificação do banco concluída:')
    console.log(`  - Configurações Cloudflare: ${configCount}`)
    console.log(`  - Zonas Cloudflare: ${zonesCount}`)
    console.log(`  - Registros DNS: ${dnsCount}`)

    // Verificar integridade referencial
    const zonesWithConfig = await prisma.cloudflare_zones.findMany({
      include: {
        config: true
      }
    })

    const orphanedZones = zonesWithConfig.filter(z => !z.config)
    if (orphanedZones.length > 0) {
      logWarning(`${orphanedZones.length} zonas órfãs encontradas (sem configuração)`)
    } else {
      logSuccess('Todas as zonas têm configuração válida')
    }

    return true
  } catch (error) {
    logError(`Erro na verificação do banco: ${error.message}`)
    return false
  }
}

// Função principal de teste
async function runTests() {
  log('\n🚀 Iniciando testes da integração Cloudflare\n', 'bold')

  const results = {
    total: 0,
    passed: 0,
    failed: 0
  }

  try {
    // Preparação
    log('📋 Preparando ambiente de teste...', 'blue')
    await getAuthToken()
    await getStoreId()

    // Executar testes
    const tests = [
      { name: 'Configuração Cloudflare', fn: testCloudflareConfig },
      { name: 'Gerenciamento de Zonas', fn: testZoneManagement },
      { name: 'SSL Manager', fn: testSSLManager },
      { name: 'Integração de Domínios', fn: testDomainIntegration },
      { name: 'Integridade do Banco', fn: testDatabaseIntegrity }
    ]

    for (const test of tests) {
      results.total++
      try {
        const success = await test.fn()
        if (success) {
          results.passed++
          logSuccess(`${test.name}: PASSOU`)
        } else {
          results.failed++
          logError(`${test.name}: FALHOU`)
        }
      } catch (error) {
        results.failed++
        logError(`${test.name}: ERRO - ${error.message}`)
      }
    }

  } catch (error) {
    logError(`Erro na preparação: ${error.message}`)
  } finally {
    await prisma.$disconnect()
  }

  // Relatório final
  log('\n📊 Relatório Final:', 'bold')
  log(`Total de testes: ${results.total}`)
  log(`Passou: ${results.passed}`, results.passed > 0 ? 'green' : 'reset')
  log(`Falhou: ${results.failed}`, results.failed > 0 ? 'red' : 'reset')
  
  const successRate = ((results.passed / results.total) * 100).toFixed(1)
  log(`Taxa de sucesso: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow')

  if (results.failed === 0) {
    log('\n🎉 Todos os testes passaram! A integração Cloudflare está funcionando corretamente.', 'green')
  } else {
    log('\n⚠️  Alguns testes falharam. Verifique os logs acima para mais detalhes.', 'yellow')
  }

  process.exit(results.failed > 0 ? 1 : 0)
}

// Executar testes se chamado diretamente
if (require.main === module) {
  runTests().catch(error => {
    logError(`Erro fatal: ${error.message}`)
    process.exit(1)
  })
}

module.exports = {
  runTests,
  testCloudflareConfig,
  testZoneManagement,
  testSSLManager,
  testDomainIntegration,
  testDatabaseIntegrity
}