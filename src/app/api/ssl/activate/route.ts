import { NextRequest, NextResponse } from 'next/server'
import acme from 'acme-client'
import prisma from '@/lib/prisma'
import fs from 'fs/promises'
import path from 'path'
import { generateSelfSignedCertificate, checkCertificateExists, readExistingCertificate } from '@/lib/ssl-generator'

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

    // Verificar se já existe certificado local
    const certExists = await checkCertificateExists(fullDomain)
    let certificateData

    if (certExists) {
      // Usar certificado existente
      certificateData = await readExistingCertificate(fullDomain)
      certificateData.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 ano
    } else {
      // Gerar novo certificado auto-assinado
      console.log(`Gerando certificado SSL auto-assinado para ${fullDomain}...`)
      certificateData = await generateSelfSignedCertificate(fullDomain)
    }
    // Salvar certificado no banco de dados
    const expiresAt = certificateData.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

    // Salvar no banco de dados
    const sslCert = await prisma.sSL_certificates.create({
      data: {
        domain: fullDomain,
        certificate: certificateData.certificate,
        private_key: certificateData.privateKey,
        certificate_chain: certificateData.certificateChain,
        cert_path: certificateData.certPath,
        key_path: certificateData.keyPath,
        chain_path: certificateData.chainPath,
        status: 'active',
        provider: 'self-signed',
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

    console.log(`Certificado SSL ativado com sucesso para ${fullDomain}`)

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