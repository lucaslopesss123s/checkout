import cron from 'node-cron'
import prisma from '@/lib/prisma'
import { acme } from 'acme-client'
import fs from 'fs/promises'
import path from 'path'

// Configurações do cron
const CRON_CONFIG = {
  // Executar todos os dias às 2:00 AM
  schedule: '0 2 * * *',
  // Renovar certificados que expiram em 30 dias ou menos
  daysBeforeExpiry: 30,
  // Máximo de renovações por execução
  maxRenewalsPerRun: 10,
  // Timeout para cada renovação (em ms)
  renewalTimeout: 5 * 60 * 1000 // 5 minutos
}

// Função para criar diretório se não existir
async function ensureDirectoryExists(dirPath: string) {
  try {
    await fs.access(dirPath)
  } catch {
    await fs.mkdir(dirPath, { recursive: true })
  }
}

// Função para salvar certificado renovado
async function saveCertificate(domain: string, cert: string, key: string, chain: string) {
  const certDir = path.join(process.cwd(), 'ssl-certificates', domain)
  await ensureDirectoryExists(certDir)
  
  // Fazer backup do certificado anterior
  const backupDir = path.join(certDir, 'backup', new Date().toISOString().split('T')[0])
  await ensureDirectoryExists(backupDir)
  
  try {
    const oldCert = await fs.readFile(path.join(certDir, 'cert.pem'))
    const oldKey = await fs.readFile(path.join(certDir, 'key.pem'))
    const oldChain = await fs.readFile(path.join(certDir, 'chain.pem'))
    
    await fs.writeFile(path.join(backupDir, 'cert.pem'), oldCert)
    await fs.writeFile(path.join(backupDir, 'key.pem'), oldKey)
    await fs.writeFile(path.join(backupDir, 'chain.pem'), oldChain)
  } catch (error) {
    console.warn('Não foi possível fazer backup do certificado anterior:', error)
  }
  
  // Salvar novo certificado
  await fs.writeFile(path.join(certDir, 'cert.pem'), cert)
  await fs.writeFile(path.join(certDir, 'key.pem'), key)
  await fs.writeFile(path.join(certDir, 'chain.pem'), chain)
  
  return {
    certPath: path.join(certDir, 'cert.pem'),
    keyPath: path.join(certDir, 'key.pem'),
    chainPath: path.join(certDir, 'chain.pem')
  }
}

// Função para renovar um certificado
async function renewCertificate(certificate: any): Promise<{
  success: boolean
  error?: string
  renewedCert?: any
}> {
  try {
    const domain = certificate.domain
    
    console.log(`[SSL Cron] Iniciando renovação do certificado para ${domain}`)
    
    // Configurar cliente ACME
    const accountKeyPath = path.join(process.cwd(), 'ssl-certificates', 'account-key.pem')
    let accountKey
    
    try {
      accountKey = await fs.readFile(accountKeyPath, 'utf8')
    } catch {
      console.error(`[SSL Cron] Chave da conta ACME não encontrada em ${accountKeyPath}`)
      return {
        success: false,
        error: 'Chave da conta ACME não encontrada'
      }
    }

    const client = new acme.Client({
      directoryUrl: process.env.NODE_ENV === 'production' 
        ? acme.directory.letsencrypt.production 
        : acme.directory.letsencrypt.staging,
      accountKey
    })

    // Criar ordem para renovação
    const order = await client.createOrder({
      identifiers: [
        { type: 'dns', value: domain }
      ]
    })

    // Obter autorizações
    const authorizations = await client.getAuthorizations(order)
    
    for (const authz of authorizations) {
      // Usar desafio HTTP-01
      const challenge = authz.challenges.find(c => c.type === 'http-01')
      if (!challenge) {
        throw new Error('Desafio HTTP-01 não disponível')
      }

      // Obter resposta do desafio
      const keyAuthorization = await client.getChallengeKeyAuthorization(challenge)
      
      // Salvar arquivo de desafio
      const challengeDir = path.join(process.cwd(), 'public', '.well-known', 'acme-challenge')
      await ensureDirectoryExists(challengeDir)
      await fs.writeFile(
        path.join(challengeDir, challenge.token),
        keyAuthorization
      )

      // Verificar desafio
      await client.verifyChallenge(authz, challenge)
      
      // Aguardar validação
      await client.completeChallenge(challenge)
      await client.waitForValidStatus(authz)
    }

    // Gerar nova chave privada para o certificado
    const [key, csr] = await acme.forge.createCsr({
      commonName: domain
    })

    // Finalizar ordem e obter certificado
    await client.finalizeOrder(order, csr)
    const cert = await client.getCertificate(order)

    // Extrair certificado e cadeia
    const certLines = cert.split('\n')
    const certStart = certLines.findIndex(line => line.includes('-----BEGIN CERTIFICATE-----'))
    const certEnd = certLines.findIndex(line => line.includes('-----END CERTIFICATE-----'), certStart) + 1
    const chainStart = certLines.findIndex(line => line.includes('-----BEGIN CERTIFICATE-----'), certEnd)
    
    const newCertificate = certLines.slice(certStart, certEnd).join('\n')
    const chain = certLines.slice(chainStart).join('\n')

    // Salvar certificado renovado
    const certPaths = await saveCertificate(domain, newCertificate, key, chain)

    // Calcular nova data de expiração
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)

    // Atualizar certificado no banco de dados
    const updatedCert = await prisma.ssl_certificates.update({
      where: { id: certificate.id },
      data: {
        certificate: newCertificate,
        private_key: key,
        certificate_chain: chain,
        cert_path: certPaths.certPath,
        key_path: certPaths.keyPath,
        chain_path: certPaths.chainPath,
        expires_at: expiresAt,
        renewed_at: new Date()
      }
    })

    // Limpar arquivos de desafio
    try {
      const challengeDir = path.join(process.cwd(), 'public', '.well-known', 'acme-challenge')
      const files = await fs.readdir(challengeDir)
      for (const file of files) {
        await fs.unlink(path.join(challengeDir, file))
      }
    } catch (error) {
      console.warn('[SSL Cron] Erro ao limpar arquivos de desafio:', error)
    }

    console.log(`[SSL Cron] Certificado renovado com sucesso para ${domain}`)
    
    return {
      success: true,
      renewedCert: updatedCert
    }

  } catch (error) {
    console.error(`[SSL Cron] Erro ao renovar certificado para ${certificate.domain}:`, error)
    
    // Registrar falha no banco de dados
    try {
      await prisma.ssl_certificates.update({
        where: { id: certificate.id },
        data: {
          last_renewal_attempt: new Date(),
          renewal_error: error instanceof Error ? error.message : 'Erro desconhecido'
        }
      })
    } catch (dbError) {
      console.error('[SSL Cron] Erro ao registrar falha no banco:', dbError)
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

// Função principal do cron job
async function runSSLRenewalCron() {
  console.log('[SSL Cron] Iniciando verificação de certificados para renovação')
  
  try {
    // Buscar certificados que precisam ser renovados
    const expiringCerts = await prisma.ssl_certificates.findMany({
      where: {
        status: 'active',
        auto_renew: true,
        expires_at: {
          lte: new Date(Date.now() + CRON_CONFIG.daysBeforeExpiry * 24 * 60 * 60 * 1000)
        }
      },
      take: CRON_CONFIG.maxRenewalsPerRun,
      orderBy: {
        expires_at: 'asc'
      },
      include: {
        dominio: {
          select: {
            id: true,
            dominio: true,
            status: true
          }
        }
      }
    })

    console.log(`[SSL Cron] Encontrados ${expiringCerts.length} certificados para renovação`)

    if (expiringCerts.length === 0) {
      console.log('[SSL Cron] Nenhum certificado precisa ser renovado')
      return
    }

    const results = {
      total: expiringCerts.length,
      successful: 0,
      failed: 0,
      details: [] as any[]
    }

    // Processar renovações sequencialmente para evitar sobrecarga
    for (const cert of expiringCerts) {
      const daysUntilExpiry = Math.ceil(
        (new Date(cert.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      
      console.log(`[SSL Cron] Renovando certificado para ${cert.domain} (expira em ${daysUntilExpiry} dias)`)
      
      // Aplicar timeout para cada renovação
      const renewalPromise = renewCertificate(cert)
      const timeoutPromise = new Promise<{ success: false; error: string }>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout na renovação')), CRON_CONFIG.renewalTimeout)
      })
      
      try {
        const result = await Promise.race([renewalPromise, timeoutPromise])
        
        if (result.success) {
          results.successful++
          results.details.push({
            domain: cert.domain,
            status: 'success',
            expires_at: result.renewedCert?.expires_at
          })
        } else {
          results.failed++
          results.details.push({
            domain: cert.domain,
            status: 'failed',
            error: result.error
          })
        }
      } catch (error) {
        results.failed++
        results.details.push({
          domain: cert.domain,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Timeout ou erro desconhecido'
        })
      }
      
      // Pequena pausa entre renovações
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    console.log(`[SSL Cron] Renovação concluída: ${results.successful} sucessos, ${results.failed} falhas`)
    
    // Registrar log da execução
    try {
      await prisma.ssl_renewal_logs.create({
        data: {
          executed_at: new Date(),
          certificates_processed: results.total,
          successful_renewals: results.successful,
          failed_renewals: results.failed,
          details: JSON.stringify(results.details)
        }
      })
    } catch (logError) {
      console.error('[SSL Cron] Erro ao registrar log de execução:', logError)
    }

  } catch (error) {
    console.error('[SSL Cron] Erro na execução do cron job:', error)
  }
}

// Variável para controlar se o cron está ativo
let cronJob: cron.ScheduledTask | null = null

// Função para iniciar o cron job
export function startSSLCron() {
  if (cronJob) {
    console.log('[SSL Cron] Cron job já está em execução')
    return
  }
  
  console.log(`[SSL Cron] Iniciando cron job com schedule: ${CRON_CONFIG.schedule}`)
  
  cronJob = cron.schedule(CRON_CONFIG.schedule, runSSLRenewalCron, {
    scheduled: true,
    timezone: 'America/Sao_Paulo'
  })
  
  console.log('[SSL Cron] Cron job iniciado com sucesso')
}

// Função para parar o cron job
export function stopSSLCron() {
  if (cronJob) {
    cronJob.stop()
    cronJob = null
    console.log('[SSL Cron] Cron job parado')
  }
}

// Função para executar renovação manual (para testes)
export async function runManualRenewal() {
  console.log('[SSL Cron] Executando renovação manual')
  await runSSLRenewalCron()
}

// Função para obter status do cron
export function getCronStatus() {
  return {
    active: cronJob !== null,
    schedule: CRON_CONFIG.schedule,
    config: CRON_CONFIG
  }
}

// Exportar configurações para uso externo
export { CRON_CONFIG }