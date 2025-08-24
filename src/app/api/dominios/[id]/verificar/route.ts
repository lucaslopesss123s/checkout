import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import dns from 'dns'
import { promisify } from 'util'

const prisma = new PrismaClient()
const resolveCname = promisify(dns.resolveCname)
const resolve4 = promisify(dns.resolve4)
const resolveTxt = promisify(dns.resolveTxt)

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
          return {
            verificado: false,
            tipo: 'A',
            valor: aRecords.join(', '),
            erro: 'Domínio tem registro A, mas é necessário um CNAME apontando para checkout.lojafacil.com',
            detalhes: `Encontrado registro A: ${aRecords.join(', ')}. Para funcionar corretamente, remova o registro A e crie um CNAME.`
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
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