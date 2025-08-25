import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import fs from 'fs/promises'
import { X509Certificate } from 'crypto'

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

// Função para verificar se o certificado no arquivo está válido
async function verifyCertificateFile(certPath: string): Promise<{
  valid: boolean
  expires_at?: Date
  issued_at?: Date
  issuer?: string
  subject?: string
  error?: string
}> {
  try {
    const certContent = await fs.readFile(certPath, 'utf8')
    const cert = new X509Certificate(certContent)
    
    const now = new Date()
    const validFrom = new Date(cert.validFrom)
    const validTo = new Date(cert.validTo)
    
    return {
      valid: now >= validFrom && now <= validTo,
      expires_at: validTo,
      issued_at: validFrom,
      issuer: cert.issuer,
      subject: cert.subject
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Erro ao verificar certificado'
    }
  }
}

// Função para verificar conectividade SSL de um domínio
async function checkSSLConnectivity(domain: string): Promise<{
  accessible: boolean
  certificate_valid?: boolean
  expires_at?: Date
  issuer?: string
  error?: string
}> {
  try {
    const https = require('https')
    const { URL } = require('url')
    
    return new Promise((resolve) => {
      const options = {
        hostname: domain,
        port: 443,
        path: '/',
        method: 'HEAD',
        timeout: 10000,
        rejectUnauthorized: false // Para capturar informações mesmo com certificado inválido
      }
      
      const req = https.request(options, (res: any) => {
        const cert = res.socket.getPeerCertificate()
        
        if (cert && cert.valid_from && cert.valid_to) {
          const validTo = new Date(cert.valid_to)
          const now = new Date()
          
          resolve({
            accessible: true,
            certificate_valid: now <= validTo,
            expires_at: validTo,
            issuer: cert.issuer?.O || 'Desconhecido'
          })
        } else {
          resolve({
            accessible: true,
            certificate_valid: false,
            error: 'Certificado não encontrado'
          })
        }
      })
      
      req.on('error', (error: Error) => {
        resolve({
          accessible: false,
          error: error.message
        })
      })
      
      req.on('timeout', () => {
        req.destroy()
        resolve({
          accessible: false,
          error: 'Timeout na conexão SSL'
        })
      })
      
      req.end()
    })
  } catch (error) {
    return {
      accessible: false,
      error: error instanceof Error ? error.message : 'Erro na verificação SSL'
    }
  }
}

// GET para verificar status de um certificado específico
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const certificateId = searchParams.get('certificateId')
    const domainId = searchParams.get('domainId')
    const checkConnectivity = searchParams.get('checkConnectivity') === 'true'
    
    let certificate
    
    if (certificateId) {
      certificate = await prisma.ssl_certificates.findUnique({
        where: { id: certificateId },
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
    } else if (domainId) {
      const dominio = await prisma.dominios.findUnique({
        where: { id: domainId },
        include: {
          ssl_certificate: {
            include: {
              dominio: {
                select: {
                  id: true,
                  dominio: true,
                  status: true
                }
              }
            }
          }
        }
      })
      certificate = dominio?.ssl_certificate
    }
    
    if (!certificate) {
      const response = NextResponse.json(
        { error: 'Certificado não encontrado' },
        { status: 404 }
      )
      return addCorsHeaders(response)
    }

    const now = new Date()
    const expiresAt = new Date(certificate.expires_at)
    const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    // Verificar arquivo do certificado se o caminho existir
    let fileStatus = null
    if (certificate.cert_path) {
      fileStatus = await verifyCertificateFile(certificate.cert_path)
    }
    
    // Verificar conectividade SSL se solicitado
    let connectivityStatus = null
    if (checkConnectivity && certificate.domain) {
      connectivityStatus = await checkSSLConnectivity(certificate.domain)
    }
    
    // Determinar status geral
    let overallStatus = certificate.status
    if (daysUntilExpiry <= 0) {
      overallStatus = 'expired'
    } else if (daysUntilExpiry <= 7) {
      overallStatus = 'expiring_soon'
    } else if (fileStatus && !fileStatus.valid) {
      overallStatus = 'file_invalid'
    } else if (connectivityStatus && !connectivityStatus.accessible) {
      overallStatus = 'not_accessible'
    }

    const response = NextResponse.json({
      certificate: {
        id: certificate.id,
        domain: certificate.domain,
        status: overallStatus,
        provider: certificate.provider,
        expires_at: certificate.expires_at,
        created_at: certificate.created_at,
        renewed_at: certificate.renewed_at,
        auto_renew: certificate.auto_renew,
        days_until_expiry: daysUntilExpiry,
        dominio: certificate.dominio
      },
      file_status: fileStatus,
      connectivity_status: connectivityStatus,
      recommendations: {
        should_renew: daysUntilExpiry <= 30,
        urgent_renewal: daysUntilExpiry <= 7,
        expired: daysUntilExpiry <= 0
      }
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

// POST para verificar status de múltiplos certificados
export async function POST(request: NextRequest) {
  try {
    const { certificateIds, domainIds, checkConnectivity = false } = await request.json()
    
    let certificates = []
    
    if (certificateIds && certificateIds.length > 0) {
      certificates = await prisma.ssl_certificates.findMany({
        where: {
          id: { in: certificateIds }
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
    } else if (domainIds && domainIds.length > 0) {
      const dominios = await prisma.dominios.findMany({
        where: {
          id: { in: domainIds }
        },
        include: {
          ssl_certificate: {
            include: {
              dominio: {
                select: {
                  id: true,
                  dominio: true,
                  status: true
                }
              }
            }
          }
        }
      })
      certificates = dominios.map(d => d.ssl_certificate).filter(Boolean)
    } else {
      // Se não especificado, buscar todos os certificados ativos
      certificates = await prisma.ssl_certificates.findMany({
        where: {
          status: 'active'
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
    }

    const results = await Promise.all(
      certificates.map(async (certificate) => {
        const now = new Date()
        const expiresAt = new Date(certificate.expires_at)
        const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        // Verificar arquivo do certificado
        let fileStatus = null
        if (certificate.cert_path) {
          fileStatus = await verifyCertificateFile(certificate.cert_path)
        }
        
        // Verificar conectividade SSL se solicitado
        let connectivityStatus = null
        if (checkConnectivity && certificate.domain) {
          connectivityStatus = await checkSSLConnectivity(certificate.domain)
        }
        
        // Determinar status geral
        let overallStatus = certificate.status
        if (daysUntilExpiry <= 0) {
          overallStatus = 'expired'
        } else if (daysUntilExpiry <= 7) {
          overallStatus = 'expiring_soon'
        } else if (fileStatus && !fileStatus.valid) {
          overallStatus = 'file_invalid'
        } else if (connectivityStatus && !connectivityStatus.accessible) {
          overallStatus = 'not_accessible'
        }

        return {
          certificate: {
            id: certificate.id,
            domain: certificate.domain,
            status: overallStatus,
            provider: certificate.provider,
            expires_at: certificate.expires_at,
            created_at: certificate.created_at,
            renewed_at: certificate.renewed_at,
            auto_renew: certificate.auto_renew,
            days_until_expiry: daysUntilExpiry,
            dominio: certificate.dominio
          },
          file_status: fileStatus,
          connectivity_status: connectivityStatus,
          recommendations: {
            should_renew: daysUntilExpiry <= 30,
            urgent_renewal: daysUntilExpiry <= 7,
            expired: daysUntilExpiry <= 0
          }
        }
      })
    )

    // Estatísticas gerais
    const stats = {
      total: results.length,
      active: results.filter(r => r.certificate.status === 'active').length,
      expiring_soon: results.filter(r => r.certificate.status === 'expiring_soon').length,
      expired: results.filter(r => r.certificate.status === 'expired').length,
      file_invalid: results.filter(r => r.certificate.status === 'file_invalid').length,
      not_accessible: results.filter(r => r.certificate.status === 'not_accessible').length,
      auto_renew_enabled: results.filter(r => r.certificate.auto_renew).length
    }

    const response = NextResponse.json({
      certificates: results,
      statistics: stats,
      checked_connectivity: checkConnectivity
    })
    return addCorsHeaders(response)

  } catch (error) {
    console.error('Erro ao verificar status de múltiplos certificados:', error)
    const response = NextResponse.json(
      { 
        error: 'Erro ao verificar certificados',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}