/**
 * Teste específico do endpoint de verificação de token
 */

const https = require('https')

const TOKEN = 'AEaC4zA6L-XV94AGwiuOkt1p4fixfg9ToA9bhqRV'

function makeRequest(endpoint, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.cloudflare.com',
      port: 443,
      path: `/client/v4${endpoint}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }

    console.log(`\n🔍 Testando: GET ${options.hostname}${options.path}`)
    console.log(`📋 Headers:`, JSON.stringify(options.headers, null, 2))

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
            data: jsonData
          })
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: data,
            parseError: error.message
          })
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.setTimeout(10000, () => {
      req.destroy()
      reject(new Error('Timeout'))
    })

    req.end()
  })
}

async function testEndpoints() {
  console.log('🔐 Testando Token Cloudflare')
  console.log(`Token: ${TOKEN.substring(0, 10)}...${TOKEN.substring(TOKEN.length - 4)}`)
  
  // Teste 1: /user/tokens/verify (que o usuário disse funcionar)
  console.log('\n=== TESTE 1: /user/tokens/verify ===')
  try {
    const response = await makeRequest('/user/tokens/verify', {
      'Authorization': `Bearer ${TOKEN}`
    })
    
    console.log(`Status: ${response.statusCode}`)
    console.log(`Response:`, JSON.stringify(response.data, null, 2))
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('✅ Token válido!')
    } else {
      console.log('❌ Token inválido')
    }
  } catch (error) {
    console.log('❌ Erro:', error.message)
  }
  
  // Teste 2: /user (informações do usuário)
  console.log('\n=== TESTE 2: /user ===')
  try {
    const response = await makeRequest('/user', {
      'Authorization': `Bearer ${TOKEN}`
    })
    
    console.log(`Status: ${response.statusCode}`)
    console.log(`Response:`, JSON.stringify(response.data, null, 2))
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('✅ Acesso ao usuário OK!')
    } else {
      console.log('❌ Sem acesso ao usuário')
    }
  } catch (error) {
    console.log('❌ Erro:', error.message)
  }
  
  // Teste 3: /zones (listar zonas)
  console.log('\n=== TESTE 3: /zones ===')
  try {
    const response = await makeRequest('/zones', {
      'Authorization': `Bearer ${TOKEN}`
    })
    
    console.log(`Status: ${response.statusCode}`)
    console.log(`Response:`, JSON.stringify(response.data, null, 2))
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('✅ Acesso às zonas OK!')
      console.log(`Zonas encontradas: ${response.data.result.length}`)
    } else {
      console.log('❌ Sem acesso às zonas')
    }
  } catch (error) {
    console.log('❌ Erro:', error.message)
  }
}

testEndpoints().catch(console.error)