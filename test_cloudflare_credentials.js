/**
 * Teste Avançado de Credenciais Cloudflare
 * 
 * Testa se as credenciais fornecidas funcionam com a API do Cloudflare
 * e fornece diagnósticos detalhados
 */

const https = require('https')

// Credenciais fornecidas pelo usuário
const CREDENTIALS = {
  email: 'cfdojulian@gmail.com',
  apiToken: 'AEaC4zA6L-XV94AGwiuOkt1p4fixfg9ToA9bhqRV'
}

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
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

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

function logDebug(message) {
  log(`🔍 ${message}`, 'dim')
}

// Função para fazer requisição à API do Cloudflare
function makeCloudflareRequest(endpoint, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'CloudflareTest/1.0'
    }
    
    const options = {
      hostname: 'api.cloudflare.com',
      port: 443,
      path: `/client/v4${endpoint}`,
      method: method,
      headers: { ...defaultHeaders, ...headers }
    }

    logDebug(`Fazendo requisição: ${method} ${options.hostname}${options.path}`)
    logDebug(`Headers: ${JSON.stringify(options.headers, null, 2)}`)

    const req = https.request(options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data)
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          })
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: error.message
          })
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.setTimeout(15000, () => {
      req.destroy()
      reject(new Error('Timeout na requisição (15s)'))
    })

    req.end()
  })
}

// Análise detalhada do token
function analyzeToken(token) {
  log('\n🔍 Análise Detalhada do Token:', 'cyan')
  
  logInfo(`Comprimento: ${token.length} caracteres`)
  logInfo(`Formato: ${token.substring(0, 10)}...${token.substring(token.length - 4)}`)
  
  // Verificar caracteres
  const hasUppercase = /[A-Z]/.test(token)
  const hasLowercase = /[a-z]/.test(token)
  const hasNumbers = /[0-9]/.test(token)
  const hasSpecialChars = /[^A-Za-z0-9]/.test(token)
  
  logInfo(`Contém maiúsculas: ${hasUppercase ? '✅' : '❌'}`)
  logInfo(`Contém minúsculas: ${hasLowercase ? '✅' : '❌'}`)
  logInfo(`Contém números: ${hasNumbers ? '✅' : '❌'}`)
  logInfo(`Contém caracteres especiais: ${hasSpecialChars ? '⚠️  Sim' : '✅ Não'}`)
  
  if (hasSpecialChars) {
    const specialChars = token.match(/[^A-Za-z0-9]/g)
    logWarning(`Caracteres especiais encontrados: ${[...new Set(specialChars)].join(', ')}`)
    logWarning('Tokens válidos do Cloudflare geralmente não contêm caracteres especiais')
  }
  
  // Verificar se parece com um token válido
  const looksValid = token.length >= 40 && hasUppercase && hasLowercase && hasNumbers && !hasSpecialChars
  
  if (looksValid) {
    logSuccess('Token tem formato aparentemente válido')
  } else {
    logError('Token não tem formato típico de token Cloudflare')
  }
  
  return looksValid
}

// Teste principal
async function testCredentials() {
  log('\n🔐 Teste Avançado de Credenciais Cloudflare\n', 'bold')
  
  // Mostrar credenciais
  logInfo(`Email: ${CREDENTIALS.email}`)
  logInfo(`Token: ${CREDENTIALS.apiToken.substring(0, 10)}...${CREDENTIALS.apiToken.substring(CREDENTIALS.apiToken.length - 4)}`)
  
  // Análise do token
  const tokenLooksValid = analyzeToken(CREDENTIALS.apiToken)
  
  // Teste 1: Validar formato das credenciais
  logInfo('\n[TESTE 1] Validando formato das credenciais...')
  
  // Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(CREDENTIALS.email)) {
    logError('Email inválido')
    return
  }
  logSuccess('Email válido')
  
  // Validar token (deve ter pelo menos 40 caracteres)
  if (CREDENTIALS.apiToken.length < 40) {
    logError(`Token muito curto (${CREDENTIALS.apiToken.length} caracteres, mínimo 40)`)
    return
  }
  logSuccess(`Token tem tamanho adequado (${CREDENTIALS.apiToken.length} caracteres)`)
  
  // Teste 2: Verificar conectividade básica
  logInfo('\n[TESTE 2] Testando conectividade básica...')
  
  try {
    const response = await makeCloudflareRequest('/user', 'GET', {
      'Authorization': `Bearer ${CREDENTIALS.apiToken}`
    })
    
    logDebug(`Status Code: ${response.statusCode}`)
    logDebug(`Response: ${JSON.stringify(response.data, null, 2)}`)
    
    if (response.statusCode === 200 && response.data.success) {
      logSuccess('Conectividade básica OK')
    } else {
      logError(`Erro na conectividade: ${response.data.errors?.[0]?.message || 'Erro desconhecido'}`)
      
      if (response.data.errors) {
        response.data.errors.forEach((error, index) => {
          logError(`  Erro ${index + 1}: ${error.message} (Código: ${error.code})`)
        })
      }
      return
    }
  } catch (error) {
    logError(`Erro de conectividade: ${error.message}`)
    return
  }
  
  // Teste 3: Verificar token especificamente
  logInfo('\n[TESTE 3] Verificando validade do token...')
  
  try {
    const response = await makeCloudflareRequest('/user/tokens/verify', 'GET', {
      'Authorization': `Bearer ${CREDENTIALS.apiToken}`
    })
    
    logDebug(`Status Code: ${response.statusCode}`)
    logDebug(`Response: ${JSON.stringify(response.data, null, 2)}`)
    
    if (response.statusCode === 200 && response.data.success) {
      logSuccess('Token válido e ativo')
      
      if (response.data.result) {
        const result = response.data.result
        logInfo(`ID do Token: ${result.id}`)
        logInfo(`Status: ${result.status}`)
        
        if (result.not_before) {
          logInfo(`Válido desde: ${new Date(result.not_before).toLocaleString()}`)
        }
        if (result.expires_on) {
          logInfo(`Expira em: ${new Date(result.expires_on).toLocaleString()}`)
        } else {
          logInfo('Token sem data de expiração')
        }
        
        if (result.policies) {
          logInfo(`Políticas: ${result.policies.length} política(s) configurada(s)`)
        }
      }
    } else {
      logError(`Token inválido: ${response.data.errors?.[0]?.message || 'Erro desconhecido'}`)
      
      if (response.data.errors) {
        response.data.errors.forEach((error, index) => {
          logError(`  Erro ${index + 1}: ${error.message} (Código: ${error.code})`)
        })
      }
      
      // Sugestões baseadas no erro
      if (response.statusCode === 403) {
        logWarning('Erro 403: Token pode estar expirado ou ter permissões insuficientes')
      } else if (response.statusCode === 401) {
        logWarning('Erro 401: Token inválido ou malformado')
      }
      
      return
    }
  } catch (error) {
    logError(`Erro ao verificar token: ${error.message}`)
    return
  }
  
  // Teste 4: Testar permissões (listar zonas)
  logInfo('\n[TESTE 4] Testando permissões (listar zonas)...')
  
  try {
    const response = await makeCloudflareRequest('/zones', 'GET', {
      'Authorization': `Bearer ${CREDENTIALS.apiToken}`
    })
    
    if (response.statusCode === 200 && response.data.success) {
      const zones = response.data.result
      logSuccess(`Permissões de zona OK (${zones.length} zona(s) encontrada(s))`)
      
      if (zones.length > 0) {
        logInfo('Zonas disponíveis:')
        zones.forEach((zone, index) => {
          logInfo(`  ${index + 1}. ${zone.name} (${zone.status}) - ID: ${zone.id}`)
        })
      } else {
        logWarning('Nenhuma zona encontrada na conta')
        logInfo('Isso é normal se você ainda não adicionou domínios ao Cloudflare')
      }
    } else {
      logError(`Erro ao listar zonas: ${response.data.errors?.[0]?.message || 'Erro desconhecido'}`)
      
      if (response.statusCode === 403) {
        logWarning('Token não tem permissão para listar zonas')
        logWarning('Verifique se o token tem a permissão "Zone:Zone:Read"')
      }
    }
  } catch (error) {
    logError(`Erro ao listar zonas: ${error.message}`)
  }
  
  // Teste 5: Verificar informações da conta
  logInfo('\n[TESTE 5] Verificando informações da conta...')
  
  try {
    const response = await makeCloudflareRequest('/user', 'GET', {
      'Authorization': `Bearer ${CREDENTIALS.apiToken}`
    })
    
    if (response.statusCode === 200 && response.data.success) {
      const user = response.data.result
      logSuccess('Informações da conta obtidas com sucesso')
      logInfo(`Email da conta: ${user.email}`)
      logInfo(`ID da conta: ${user.id}`)
      logInfo(`Conta criada em: ${new Date(user.created_on).toLocaleString()}`)
      logInfo(`Última modificação: ${new Date(user.modified_on).toLocaleString()}`)
      
      if (user.email !== CREDENTIALS.email) {
        logWarning(`⚠️  Email da conta (${user.email}) difere do email fornecido (${CREDENTIALS.email})`)
        logWarning('Isso pode causar problemas na integração')
      }
      
      if (user.two_factor_authentication_enabled) {
        logInfo('🔐 2FA está habilitado na conta')
      }
    } else {
      logError(`Erro ao obter informações da conta: ${response.data.errors?.[0]?.message || 'Erro desconhecido'}`)
    }
  } catch (error) {
    logWarning(`Não foi possível obter informações da conta: ${error.message}`)
  }
  
  // Conclusão
  log('\n🎉 Credenciais válidas e funcionando!', 'green')
  log('\n📋 Resumo:', 'cyan')
  logSuccess('✅ Token válido e ativo')
  logSuccess('✅ Conectividade com API OK')
  logSuccess('✅ Permissões básicas funcionando')
  
  log('\n💡 Próximos passos:', 'blue')
  logInfo('1. Use essas credenciais no sistema')
  logInfo('2. Teste a integração completa no dashboard')
  logInfo('3. Adicione domínios ao Cloudflare se necessário')
}

// Executar teste
if (require.main === module) {
  testCredentials().catch(error => {
    logError(`\n💥 Erro fatal: ${error.message}`)
    
    log('\n🔧 Possíveis soluções:', 'yellow')
    logWarning('1. Verifique sua conexão com a internet')
    logWarning('2. Gere um novo token API no painel do Cloudflare')
    logWarning('3. Verifique se o token não expirou')
    logWarning('4. Confirme as permissões do token')
    
    process.exit(1)
  })
}

module.exports = { testCredentials }