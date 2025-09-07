import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import dns from 'dns'
import { promisify } from 'util'

const prisma = new PrismaClient()
const resolveCname = promisify(dns.resolveCname)
const resolve4 = promisify(dns.resolve4)
const resolveTxt = promisify(dns.resolveTxt)

// IPs válidos do servidor
const VALID_SERVER_IPS = [
  '181.41.200.99', // IP da VPS
]

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
    console.log(`Verificando DNS para: ${fullDomain}`)
    
    // Tentar resolver CNAME primeiro
    try {
      const cnameRecords = await resolveCname(fullDomain)
      if (cnameRecords && cnameRecords.length > 0) {
        const target = cnameRecords[0]
        console.log(`CNAME encontrado: ${target}`)
        
        // Verificar se aponta para nosso servidor
        if (target.includes('checkout.lojafacil.com') || target.includes('lojafacil.com')) {
          return {
            verificado: true,
            tipo: 'CNAME',
            valor: target,
            erro: null,
            detalhes: `CNAME configurado corretamente: ${fullDomain} → ${target}`
          }
        } else {
          return {
            verificado: false,
            tipo: 'CNAME',
            valor: target,
            erro: `CNAME aponta para ${target}, mas deveria apontar para checkout.lojafacil.com`,
            detalhes: 'O registro CNAME existe, mas não aponta para o servidor correto'
          }
        }
      }
    } catch (cnameError) {
      console.log('Nenhum CNAME encontrado, tentando A record...')
      
      // Se não tem CNAME, tentar A record
      try {
        const aRecords = await resolve4(fullDomain)
        if (aRecords && aRecords.length > 0) {
          console.log(`Registros A encontrados: ${aRecords.join(', ')}`)
          
          // Verificar se algum IP aponta para nosso servidor ou Cloudflare (proxy ativo)
          const validIPs = aRecords.filter(ip => VALID_SERVER_IPS.includes(ip))
          const cloudflareIPs = aRecords.filter(ip => isCloudflareIP(ip))
          
          if (validIPs.length > 0) {
            return {
              verificado: true,
              tipo: 'A',
              valor: aRecords.join(', '),
              erro: null,
              detalhes: `Registro A configurado corretamente: ${fullDomain} → ${validIPs.join(', ')}`
            }
          } else if (cloudflareIPs.length > 0) {
            return {
              verificado: true,
              tipo: 'A',
              valor: aRecords.join(', '),
              erro: null,
              detalhes: `Registro A configurado com Cloudflare proxy ativo: ${fullDomain} → ${cloudflareIPs.join(', ')} (Cloudflare)`
            }
          } else {
            return {
              verificado: false,
              tipo: 'A',
              valor: aRecords.join(', '),
              erro: `Registro A aponta para ${aRecords.join(', ')}, mas deveria apontar para um dos IPs válidos: ${VALID_SERVER_IPS.join(', ')} ou usar Cloudflare proxy`,
              detalhes: 'O registro A existe, mas não aponta para o servidor correto nem usa Cloudflare proxy'
            }
          }
        }
      } catch (aError) {
        console.log('Nenhum A record encontrado')
        
        // Verificar se o domínio principal existe
        try {
          await resolve4(dominio)
          return {
            verificado: false,
            tipo: null,
            valor: null,
            erro: `Subdomínio ${subdominio}.${dominio} não configurado`,
            detalhes: `O domínio ${dominio} existe, mas o subdomínio ${subdominio} não está configurado. Crie um registro CNAME: ${subdominio} → checkout.lojafacil.com`
          }
        } catch (domainError) {
          return {
            verificado: false,
            tipo: null,
            valor: null,
            erro: `Domínio ${dominio} não encontrado ou inacessível`,
            detalhes: 'Verifique se o domínio está registrado e os servidores DNS estão funcionando corretamente'
          }
        }
      }
    }
    
    return {
      verificado: false,
      tipo: null,
      valor: null,
      erro: 'Configuração DNS não encontrada',
      detalhes: 'Nenhum registro DNS válido foi encontrado para este domínio'
    }
  } catch (error) {
    console.error('Erro na verificação DNS:', error)
    return {
      verificado: false,
      tipo: null,
      valor: null,
      erro: `Erro na verificação DNS: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      detalhes: 'Ocorreu um erro técnico durante a verificação. Tente novamente em alguns minutos.'
    }
  }
}

// POST - Verificar DNS de um domínio específico
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do domínio é obrigatório' },
        { status: 400 }
      )
    }
    
    // Buscar o domínio no banco
    const dominio = await prisma.dominios.findUnique({
      where: { id }
    })
    
    if (!dominio) {
      return NextResponse.json(
        { error: 'Domínio não encontrado' },
        { status: 404 }
      )
    }
    
    // Verificar DNS
    const resultadoVerificacao = await verificarDNS(dominio.dominio, dominio.subdominio)
    
    // Atualizar o domínio no banco com o resultado da verificação
    const dominioAtualizado = await prisma.dominios.update({
      where: { id },
      data: {
        status: resultadoVerificacao.verificado ? 'verified' : 'failed',
        dns_verificado: resultadoVerificacao.verificado,
        ultima_verificacao: new Date(),
        erro_verificacao: resultadoVerificacao.erro,
        configuracao_dns: {
          ...dominio.configuracao_dns,
          ultimo_resultado: {
            verificado: resultadoVerificacao.verificado,
            tipo: resultadoVerificacao.tipo,
            valor: resultadoVerificacao.valor,
            erro: resultadoVerificacao.erro,
            detalhes: resultadoVerificacao.detalhes,
            verificado_em: new Date().toISOString()
          }
        }
      }
    })
    
    return NextResponse.json({
      dominio: dominioAtualizado,
      verificacao: resultadoVerificacao
    })
  } catch (error) {
    console.error('Erro ao verificar domínio:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET - Obter status de verificação de um domínio
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do domínio é obrigatório' },
        { status: 400 }
      )
    }
    
    const dominio = await prisma.dominios.findUnique({
      where: { id }
    })
    
    if (!dominio) {
      return NextResponse.json(
        { error: 'Domínio não encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      id: dominio.id,
      dominio: dominio.dominio,
      subdominio: dominio.subdominio,
      status: dominio.status,
      dns_verificado: dominio.dns_verificado,
      ultima_verificacao: dominio.ultima_verificacao,
      erro_verificacao: dominio.erro_verificacao,
      configuracao_dns: dominio.configuracao_dns,
      url_checkout: `https://${dominio.subdominio}.${dominio.dominio}`
    })
  } catch (error) {
    console.error('Erro ao buscar domínio:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}