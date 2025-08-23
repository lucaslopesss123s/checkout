#!/usr/bin/env node

/**
 * Script para processar carrinhos abandonados automaticamente
 * 
 * Este script pode ser executado via cron job para marcar carrinhos
 * como abandonados após um período de inatividade.
 * 
 * Uso:
 * node scripts/process-abandoned-carts.js
 * 
 * Cron job sugerido (executar a cada 15 minutos):
 * 0,15,30,45 * * * * cd /path/to/checkout && node scripts/process-abandoned-carts.js
 */

const https = require('https')
const http = require('http')

// Configurações
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9002'
const ENDPOINT = '/api/carrinho/abandonados'

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Abandoned-Cart-Processor/1.0'
      }
    }

    const req = protocol.request(url, options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data)
          resolve({ statusCode: res.statusCode, data: response })
        } catch (error) {
          reject(new Error(`Erro ao parsear resposta: ${error.message}`))
        }
      })
    })

    req.on('error', (error) => {
      reject(new Error(`Erro na requisição: ${error.message}`))
    })

    req.end()
  })
}

async function processAbandonedCarts() {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] Iniciando processamento de carrinhos abandonados...`)

  try {
    const url = `${API_URL}${ENDPOINT}`
    console.log(`[${timestamp}] Fazendo requisição para: ${url}`)
    
    const { statusCode, data } = await makeRequest(url)
    
    if (statusCode === 200 && data.success) {
      console.log(`[${timestamp}] ✅ Sucesso: ${data.message}`)
      
      if (data.processados > 0) {
        console.log(`[${timestamp}] Carrinhos processados:`)
        data.carrinhos?.forEach((carrinho, index) => {
          console.log(`[${timestamp}]   ${index + 1}. ID: ${carrinho.id}, Cliente: ${carrinho.cliente}, Última atividade: ${carrinho.ultima_atividade}`)
        })
      } else {
        console.log(`[${timestamp}] Nenhum carrinho precisou ser processado.`)
      }
    } else {
      console.error(`[${timestamp}] ❌ Erro na API:`, data)
      process.exit(1)
    }
    
  } catch (error) {
    console.error(`[${timestamp}] ❌ Erro ao processar carrinhos abandonados:`, error.message)
    process.exit(1)
  }
}

// Executar o processamento
processAbandonedCarts()
  .then(() => {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] Processamento concluído com sucesso.`)
    process.exit(0)
  })
  .catch((error) => {
    const timestamp = new Date().toISOString()
    console.error(`[${timestamp}] ❌ Erro fatal:`, error)
    process.exit(1)
  })