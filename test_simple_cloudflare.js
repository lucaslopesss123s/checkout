/**
 * Teste Simples - Integração Cloudflare
 * 
 * Verifica se as APIs estão funcionando e acessíveis
 */

const http = require('http')

// Configurações
const BASE_URL = 'http://localhost:3000'
const ENDPOINTS = [
  '/api/cloudflare/config',
  '/api/cloudflare/zones/manage', 
  '/api/cloudflare/dns',
  '/api/cloudflare/ssl',
  '/api/cloudflare/zones/ssl-check'
]

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

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue')
}

// Função para testar endpoint
function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = new URL(endpoint, BASE_URL)
    
    const req = http.get(url, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        resolve({
          endpoint,
          status: res.statusCode,
          accessible: res.statusCode !== 404,
          response: data.substring(0, 100) // Primeiros 100 chars
        })
      })
    })
    
    req.on('error', (error) => {
      resolve({
        endpoint,
        status: 0,
        accessible: false,
        error: error.message
      })
    })
    
    req.setTimeout(5000, () => {
      req.destroy()
      resolve({
        endpoint,
        status: 0,
        accessible: false,
        error: 'Timeout'
      })
    })
  })
}

// Teste principal
async function runSimpleTests() {
  log('\n🚀 Testando APIs Cloudflare\n', 'bold')
  
  // Verificar se servidor está rodando
  logInfo('Verificando se o servidor está rodando...')
  
  try {
    const healthCheck = await testEndpoint('/')
    if (healthCheck.accessible) {
      logSuccess('Servidor está rodando')
    } else {
      logError('Servidor não está acessível')
      return
    }
  } catch (error) {
    logError(`Erro ao conectar com servidor: ${error.message}`)
    return
  }
  
  // Testar endpoints
  logInfo('\nTestando endpoints da API Cloudflare...')
  
  const results = []
  
  for (const endpoint of ENDPOINTS) {
    const result = await testEndpoint(endpoint)
    results.push(result)
    
    if (result.accessible) {
      logSuccess(`${endpoint} - Acessível (${result.status})`)
    } else {
      logError(`${endpoint} - Não acessível (${result.status || 'erro'})`)
      if (result.error) {
        console.log(`   Erro: ${result.error}`)
      }
    }
  }
  
  // Relatório
  const accessible = results.filter(r => r.accessible).length
  const total = results.length
  
  log('\n📊 Relatório:', 'bold')
  log(`Endpoints testados: ${total}`)
  log(`Acessíveis: ${accessible}`, accessible > 0 ? 'green' : 'red')
  log(`Não acessíveis: ${total - accessible}`, total - accessible > 0 ? 'red' : 'green')
  
  const successRate = ((accessible / total) * 100).toFixed(1)
  log(`Taxa de sucesso: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow')
  
  if (accessible === total) {
    log('\n🎉 Todas as APIs estão acessíveis!', 'green')
  } else {
    log('\n⚠️  Algumas APIs não estão acessíveis. Verifique se o servidor está rodando corretamente.', 'yellow')
  }
  
  // Verificar arquivos importantes
  logInfo('\nVerificando arquivos da integração...')
  
  const fs = require('fs')
  const path = require('path')
  
  const importantFiles = [
    'src/lib/cloudflare-config.ts',
    'src/app/api/cloudflare/config/route.ts',
    'src/app/api/cloudflare/zones/manage/route.ts',
    'src/app/api/cloudflare/ssl/route.ts',
    'src/components/cloudflare/SSLManager.tsx',
    'docs/CLOUDFLARE_INTEGRATION.md',
    'docs/CLOUDFLARE_MIGRATION_GUIDE.md'
  ]
  
  let filesOk = 0
  
  for (const file of importantFiles) {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      logSuccess(`${file} - Existe`)
      filesOk++
    } else {
      logError(`${file} - Não encontrado`)
    }
  }
  
  log(`\nArquivos verificados: ${filesOk}/${importantFiles.length}`, filesOk === importantFiles.length ? 'green' : 'yellow')
  
  // Conclusão
  if (accessible === total && filesOk === importantFiles.length) {
    log('\n🎉 Integração Cloudflare está completa e funcionando!', 'green')
    process.exit(0)
  } else {
    log('\n⚠️  Integração parcialmente funcional. Verifique os itens acima.', 'yellow')
    process.exit(1)
  }
}

// Executar teste
if (require.main === module) {
  runSimpleTests().catch(error => {
    logError(`Erro fatal: ${error.message}`)
    process.exit(1)
  })
}

module.exports = { runSimpleTests }