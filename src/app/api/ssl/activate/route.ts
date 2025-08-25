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

// Função para salvar certificado no sistema de arquivos
async function saveCertificate(domain: string, cert: string, key: string, chain: string) {
  const certDir = path.join(process.cwd(), 'ssl-certificates', domain)
  await ensureDirectoryExists(certDir)
  
  await fs.writeFile(path.join(certDir, 'cert.pem'), cert)
  await fs.writeFile(path.join(certDir, 'key.pem'), key)
  await fs.writeFile(path.join(certDir, 'chain.pem'), chain)
  
  return {
    certPath: path.join(certDir, 'cert.pem'),
    keyPath: path.join(certDir, 'key.pem'),
    chainPath: path.join(certDir, 'chain.pem')
  }
}

// Função para verificar se o domínio aponta para o servidor
async function verifyDomainPointing(domain: string): Promise<boolean> {
  try {
    const dns = require('dns').promises
    const records = await dns.resolve4(domain)
    
    // Aqui você deve verificar se o IP retornado é o IP do seu servidor
    // Por enquanto, vamos assumir que está correto se resolver
    return records && records.length > 0
  } catch (error) {
    console.error('Erro ao verificar DNS:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const { domainId } = await request.json()
    
    if (!domainId) {
      const response = NextResponse.json(
        { error: 'ID do domínio é obrigatório' },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

    // Buscar domínio no banco de dados
    const dominio = await prisma.dominios.findUnique({
      where: { id: domainId }
    })

    if (!dominio) {
      const response = NextResponse.json(
        { error: 'Domínio não encontrado' },
        { status: 404 }
      )
      return addCorsHeaders(response)
    }

    if (dominio.status !== 'verified' || !dominio.dns_verificado) {
      const response = NextResponse.json(
        { error: 'Domínio deve estar verificado antes de ativar SSL' },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

    const fullDomain = `checkout.${dominio.dominio}`
    
    // Verificar se o domínio aponta para o servidor
    const domainPointsToServer = await verifyDomainPointing(fullDomain)
    if (!domainPointsToServer) {
      const response = NextResponse.json(
        { 
          error: 'Domínio não aponta para o servidor',
          message: 'Verifique se o DNS está configurado corretamente'
        },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

    // Verificar se já existe certificado válido
    const existingCert = await prisma.sSL_certificates.findFirst({
      where: {
        domain: fullDomain,
        status: 'active',
        expires_at: {
          gt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Válido por mais de 7 dias
        }
      }
    })

    if (existingCert) {
      const response = NextResponse.json({
        success: true,
        message: 'Certificado SSL já está ativo e válido',
        certificate: {
          id: existingCert.id,
          domain: existingCert.domain,
          status: existingCert.status,
          expires_at: existingCert.expires_at
        }
      })
      return addCorsHeaders(response)
    }

    // Configurar cliente ACME (Let's Encrypt)
    const accountKeyPath = path.join(process.cwd(), 'ssl-certificates', 'account-key.pem')
    let accountKey
    
    try {
      accountKey = await fs.readFile(accountKeyPath, 'utf8')
    } catch {
      // Gerar nova chave de conta se não existir
      accountKey = await acme.crypto.createPrivateRsaKey()
      await ensureDirectoryExists(path.dirname(accountKeyPath))
      await fs.writeFile(accountKeyPath, accountKey)
    }

    const client = new acme.Client({
      directoryUrl: process.env.NODE_ENV === 'production' 
        ? acme.directory.letsencrypt.production 
        : acme.directory.letsencrypt.staging,
      accountKey
    })

    // Criar ou usar conta existente
    const account = await client.createAccount({
      termsOfServiceAgreed: true,
      contact: [`mailto:admin@${dominio.dominio}`]
    })

    // Criar ordem para o certificado
    const order = await client.createOrder({
      identifiers: [
        { type: 'dns', value: fullDomain }
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

    // Gerar chave privada para o certificado
    const [key, csr] = await acme.crypto.createCsr({
      commonName: fullDomain
    })

    // Finalizar ordem e obter certificado
    await client.finalizeOrder(order, csr)
    const cert = await client.getCertificate(order)

    // Extrair certificado e cadeia
    const certLines = cert.split('\n')
    const certStart = certLines.findIndex(line => line.includes('-----BEGIN CERTIFICATE-----'))
    const certEnd = certLines.findIndex(line => line.includes('-----END CERTIFICATE-----'), certStart) + 1
    const chainStart = certLines.findIndex(line => line.includes('-----BEGIN CERTIFICATE-----'), certEnd)
    
    const certificate = certLines.slice(certStart, certEnd).join('\n')
    const chain = certLines.slice(chainStart).join('\n')

    // Salvar certificado no sistema de arquivos
    const certPaths = await saveCertificate(fullDomain, certificate, key, chain)

    // Calcular data de expiração (Let's Encrypt emite por 90 dias)
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)

    // Salvar no banco de dados
    const sslCert = await prisma.sSL_certificates.create({
      data: {
        domain: fullDomain,
        certificate: certificate,
        private_key: key,
        certificate_chain: chain,
        cert_path: certPaths.certPath,
        key_path: certPaths.keyPath,
        chain_path: certPaths.chainPath,
        status: 'active',
        provider: 'letsencrypt',
        expires_at: expiresAt,
        auto_renew: true
      }
    })

    // Atualizar status SSL do domínio
    await prisma.dominios.update({
      where: { id: domainId },
      data: {
        ssl_ativo: true,
        ssl_certificate_id: sslCert.id
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

    const response = NextResponse.json({
      success: true,
      message: 'Certificado SSL ativado com sucesso',
      certificate: {
        id: sslCert.id,
        domain: sslCert.domain,
        status: sslCert.status,
        provider: sslCert.provider,
        expires_at: sslCert.expires_at,
        auto_renew: sslCert.auto_renew
      }
    })
    return addCorsHeaders(response)

  } catch (error) {
    console.error('Erro ao ativar SSL:', error)
    const response = NextResponse.json(
      { 
        error: 'Erro ao ativar SSL',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}

// GET para verificar status de ativação SSL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const domainId = searchParams.get('domainId')
    
    if (!domainId) {
      const response = NextResponse.json(
        { error: 'ID do domínio é obrigatório' },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

    const dominio = await prisma.dominios.findUnique({
      where: { id: domainId },
      include: {
        ssl_certificate: true
      }
    })

    if (!dominio) {
      const response = NextResponse.json(
        { error: 'Domínio não encontrado' },
        { status: 404 }
      )
      return addCorsHeaders(response)
    }

    const response = NextResponse.json({
      domain: dominio.dominio,
      ssl_active: dominio.ssl_ativo,
      certificate: dominio.ssl_certificate ? {
        id: dominio.ssl_certificate.id,
        status: dominio.ssl_certificate.status,
        provider: dominio.ssl_certificate.provider,
        expires_at: dominio.ssl_certificate.expires_at,
        auto_renew: dominio.ssl_certificate.auto_renew,
        days_until_expiry: Math.ceil(
          (new Date(dominio.ssl_certificate.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      } : null
    })
    return addCorsHeaders(response)

  } catch (error) {
    console.error('Erro ao verificar status SSL:', error)
    const response = NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}