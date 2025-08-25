import { NextRequest, NextResponse } from 'next/server'
import { acme } from 'acme-client'
import prisma from '@/lib/prisma'
import fs from 'fs/promises'
import path from 'path'

// Função para adicionar cabeçalhos CORS
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

// Função OPTIONS para requisições preflight
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 })
  return addCorsHeaders(response)
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

// Função para renovar um certificado específico
async function renewCertificate(certificateId: string) {
  const certificate = await prisma.ssl_certificates.findUnique({
    where: { id: certificateId },
    include: {
      dominio: true
    }
  })

  if (!certificate) {
    throw new Error('Certificado não encontrado')
  }

  if (certificate.status !== 'active') {
    throw new Error('Certificado não está ativo')
  }

  const domain = certificate.domain
  
  // Configurar cliente ACME
  const accountKeyPath = path.join(process.cwd(), 'ssl-certificates', 'account-key.pem')
  const accountKey = await fs.readFile(accountKeyPath, 'utf8')

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
    where: { id: certificateId },
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
    console.warn('Erro ao limpar arquivos de desafio:', error)
  }

  return updatedCert
}

// POST para renovar certificado específico
export async function POST(request: NextRequest) {
  try {
    const { certificateId, domainId } = await request.json()
    
    let targetCertificateId = certificateId
    
    // Se foi fornecido domainId em vez de certificateId
    if (!certificateId && domainId) {
      const dominio = await prisma.dominios.findUnique({
        where: { id: domainId },
        include: { ssl_certificate: true }
      })
      
      if (!dominio || !dominio.ssl_certificate) {
        const response = NextResponse.json(
          { error: 'Domínio não possui certificado SSL ativo' },
          { status: 404 }
        )
        return addCorsHeaders(response)
      }
      
      targetCertificateId = dominio.ssl_certificate.id
    }
    
    if (!targetCertificateId) {
      const response = NextResponse.json(
        { error: 'ID do certificado ou domínio é obrigatório' },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

    const renewedCert = await renewCertificate(targetCertificateId)

    const response = NextResponse.json({
      success: true,
      message: 'Certificado SSL renovado com sucesso',
      certificate: {
        id: renewedCert.id,
        domain: renewedCert.domain,
        status: renewedCert.status,
        provider: renewedCert.provider,
        expires_at: renewedCert.expires_at,
        renewed_at: renewedCert.renewed_at,
        auto_renew: renewedCert.auto_renew
      }
    })
    return addCorsHeaders(response)

  } catch (error) {
    console.error('Erro ao renovar SSL:', error)
    const response = NextResponse.json(
      { 
        error: 'Erro ao renovar SSL',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}

// GET para listar certificados que precisam ser renovados
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const daysBeforeExpiry = parseInt(searchParams.get('days') || '30')
    
    // Buscar certificados que expiram em X dias
    const expiringCerts = await prisma.ssl_certificates.findMany({
      where: {
        status: 'active',
        auto_renew: true,
        expires_at: {
          lte: new Date(Date.now() + daysBeforeExpiry * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        dominio: {
          select: {
            id: true,
            dominio: true,
            status: true
          }
        }
      },
      orderBy: {
        expires_at: 'asc'
      }
    })

    const certificatesWithDays = expiringCerts.map(cert => ({
      id: cert.id,
      domain: cert.domain,
      status: cert.status,
      provider: cert.provider,
      expires_at: cert.expires_at,
      days_until_expiry: Math.ceil(
        (new Date(cert.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ),
      auto_renew: cert.auto_renew,
      dominio: cert.dominio
    }))

    const response = NextResponse.json({
      certificates: certificatesWithDays,
      total: certificatesWithDays.length,
      days_filter: daysBeforeExpiry
    })
    return addCorsHeaders(response)

  } catch (error) {
    console.error('Erro ao listar certificados para renovação:', error)
    const response = NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}

// PUT para renovação automática em lote
export async function PUT(request: NextRequest) {
  try {
    const { daysBeforeExpiry = 30, maxRenewals = 5 } = await request.json()
    
    // Buscar certificados que precisam ser renovados
    const expiringCerts = await prisma.ssl_certificates.findMany({
      where: {
        status: 'active',
        auto_renew: true,
        expires_at: {
          lte: new Date(Date.now() + daysBeforeExpiry * 24 * 60 * 60 * 1000)
        }
      },
      take: maxRenewals,
      orderBy: {
        expires_at: 'asc'
      }
    })

    const results = []
    
    for (const cert of expiringCerts) {
      try {
        const renewedCert = await renewCertificate(cert.id)
        results.push({
          id: cert.id,
          domain: cert.domain,
          status: 'renewed',
          expires_at: renewedCert.expires_at
        })
      } catch (error) {
        console.error(`Erro ao renovar certificado ${cert.id}:`, error)
        results.push({
          id: cert.id,
          domain: cert.domain,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    const successful = results.filter(r => r.status === 'renewed').length
    const failed = results.filter(r => r.status === 'failed').length

    const response = NextResponse.json({
      success: true,
      message: `Renovação em lote concluída: ${successful} sucessos, ${failed} falhas`,
      results,
      summary: {
        total_processed: results.length,
        successful,
        failed
      }
    })
    return addCorsHeaders(response)

  } catch (error) {
    console.error('Erro na renovação em lote:', error)
    const response = NextResponse.json(
      { 
        error: 'Erro na renovação em lote',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}