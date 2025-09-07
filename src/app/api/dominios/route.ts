import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import dns from 'dns'
import { promisify } from 'util'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const resolveCname = promisify(dns.resolveCname)
const resolve4 = promisify(dns.resolve4)

// IPs do Cloudflare (quando proxy está ativo)
const CLOUDFLARE_IPS = [
  '172.67.132.113',
  '104.21.4.208',
  // Adicionar outros IPs do Cloudflare conforme necessário
]

// Função para verificar se um IP pertence ao Cloudflare
function isCloudflareIP(ip: string): boolean {
  return CLOUDFLARE_IPS.includes(ip) || 
         ip.startsWith('172.67.') || 
         ip.startsWith('104.21.') ||
         ip.startsWith('198.41.') ||
         ip.startsWith('162.158.')
}

// Função para verificar DNS
async function verificarDNS(dominio: string, subdominio: string = 'checkout') {
  try {
    const fullDomain = `${subdominio}.${dominio}`
    
    // Tentar resolver CNAME primeiro
    try {
      const cnameRecords = await resolveCname(fullDomain)
      if (cnameRecords && cnameRecords.length > 0) {
        const target = cnameRecords[0]
        // Verificar se aponta para nosso servidor
        if (target.includes('checkout.lojafacil.com') || target.includes('lojafacil.com')) {
          return {
            verificado: true,
            tipo: 'CNAME',
            valor: target,
            erro: null
          }
        } else {
          return {
            verificado: false,
            tipo: 'CNAME',
            valor: target,
            erro: `CNAME aponta para ${target}, mas deveria apontar para checkout.lojafacil.com`
          }
        }
      }
    } catch (cnameError) {
      // Se não tem CNAME, tentar A record
      try {
        const aRecords = await resolve4(fullDomain)
        if (aRecords && aRecords.length > 0) {
          // Verificar se usa Cloudflare proxy
          const cloudflareIPs = aRecords.filter(ip => isCloudflareIP(ip))
          
          if (cloudflareIPs.length > 0) {
            return {
              verificado: true,
              tipo: 'A',
              valor: aRecords.join(', '),
              erro: null
            }
          } else {
            return {
              verificado: false,
              tipo: 'A',
              valor: aRecords.join(', '),
              erro: 'Domínio tem registro A, mas é necessário um CNAME apontando para checkout.lojafacil.com ou usar Cloudflare proxy'
            }
          }
        }
      } catch (aError) {
        return {
          verificado: false,
          tipo: null,
          valor: null,
          erro: 'Nenhum registro DNS encontrado. Configure um CNAME apontando para checkout.lojafacil.com'
        }
      }
    }
    
    return {
      verificado: false,
      tipo: null,
      valor: null,
      erro: 'Configuração DNS não encontrada'
    }
  } catch (error) {
    return {
      verificado: false,
      tipo: null,
      valor: null,
      erro: `Erro na verificação DNS: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }
  }
}

// GET - Listar domínios
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorização necessário' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let userId: string

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id?: string; userId?: string }
      userId = decoded.id || decoded.userId // Suporte para ambos os formatos
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Buscar lojas do usuário
    const lojas = await prisma.loja_admin.findMany({
      where: {
        user_id: userId
      },
      select: {
        id: true
      }
    })

    if (lojas.length === 0) {
      return NextResponse.json([])
    }

    const lojaIds = lojas.map(loja => loja.id)

    // Buscar domínios das lojas do usuário
    const dominios = await prisma.dominios.findMany({
      where: {
        ativo: true,
        id_loja: {
          in: lojaIds
        }
      },
      include: {
        ssl_certificate: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json(dominios)
  } catch (error) {
    console.error('Erro ao buscar domínios:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Adicionar novo domínio
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dominio, id_loja, subdominio = 'checkout' } = body
    
    if (!dominio || !id_loja) {
      return NextResponse.json(
        { error: 'Domínio e ID da loja são obrigatórios' },
        { status: 400 }
      )
    }
    
    // Validar formato do domínio
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/
    if (!domainRegex.test(dominio)) {
      return NextResponse.json(
        { error: 'Formato de domínio inválido' },
        { status: 400 }
      )
    }
    
    // Verificar se o domínio já existe
    const dominioExistente = await prisma.dominios.findUnique({
      where: { dominio }
    })
    
    if (dominioExistente) {
      return NextResponse.json(
        { error: 'Este domínio já está cadastrado' },
        { status: 409 }
      )
    }
    
    // Verificar DNS antes de criar o domínio
    const dnsResult = await verificarDNS(dominio, subdominio)
    
    // Criar novo domínio
    const novoDominio = await prisma.dominios.create({
      data: {
        dominio,
        id_loja,
        subdominio,
        status: dnsResult.verificado ? 'verified' : 'pending',
        dns_verificado: dnsResult.verificado,
        configuracao_dns: {
          tipo: 'CNAME',
          nome: subdominio,
          valor: 'checkout.lojafacil.com',
          ttl: 300
        },
        erro_verificacao: dnsResult.erro
      }
    })
    
    // Se DNS está verificado, tentar ativar SSL automaticamente
    if (dnsResult.verificado) {
      try {
        console.log(`Tentando ativar SSL automaticamente para: ${dominio}`)
        
        // Fazer chamada para a API de ativação SSL
        const sslResponse = await fetch(`${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://checkout.pesquisaencomenda.online'}/api/ssl/activate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            domainId: novoDominio.id
          })
        })
        
        if (sslResponse.ok) {
          console.log(`SSL ativado automaticamente para: ${dominio}`)
        } else {
          console.log(`Falha na ativação automática de SSL para: ${dominio}`)
        }
      } catch (sslError) {
        console.error(`Erro na ativação automática de SSL para ${dominio}:`, sslError)
      }
    }
    
    return NextResponse.json(novoDominio, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar domínio:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Remover domínio
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const idLoja = searchParams.get('id_loja')
    
    if (!id || !idLoja) {
      return NextResponse.json(
        { error: 'ID do domínio e ID da loja são obrigatórios' },
        { status: 400 }
      )
    }
    
    // Verificar se o domínio pertence à loja e buscar certificado SSL
    const dominio = await prisma.dominios.findFirst({
      where: {
        id,
        id_loja: idLoja
      },
      include: {
        ssl_certificate: true
      }
    })
    
    if (!dominio) {
      return NextResponse.json(
        { error: 'Domínio não encontrado' },
        { status: 404 }
      )
    }
    
    // Remover certificado SSL se existir
    if (dominio.ssl_certificate_id) {
      await prisma.sSL_certificates.delete({
        where: { id: dominio.ssl_certificate_id }
      })
      console.log(`Certificado SSL removido para domínio: ${dominio.dominio}`)
    }
    
    // Deletar fisicamente do banco de dados para permitir reutilização
    await prisma.dominios.delete({
      where: { id }
    })
    
    console.log(`Domínio removido: ${dominio.dominio}`)
    
    return NextResponse.json({ message: 'Domínio removido com sucesso' })
  } catch (error) {
    console.error('Erro ao remover domínio:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}