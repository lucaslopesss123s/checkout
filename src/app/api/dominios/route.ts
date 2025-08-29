import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import dns from 'dns'
import { promisify } from 'util'

const prisma = new PrismaClient()
const resolveCname = promisify(dns.resolveCname)
const resolve4 = promisify(dns.resolve4)

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
          return {
            verificado: false,
            tipo: 'A',
            valor: aRecords.join(', '),
            erro: 'Domínio tem registro A, mas é necessário um CNAME apontando para checkout.lojafacil.com'
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
    const { searchParams } = new URL(request.url)
    const idLoja = searchParams.get('id_loja')
    
    if (!idLoja) {
      return NextResponse.json(
        { error: 'ID da loja é obrigatório' },
        { status: 400 }
      )
    }
    
    const dominios = await prisma.dominios.findMany({
      where: {
        id_loja: idLoja,
        ativo: true
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
    
    // Criar novo domínio
    const novoDominio = await prisma.dominios.create({
      data: {
        dominio,
        id_loja,
        subdominio,
        configuracao_dns: {
          tipo: 'CNAME',
          nome: subdominio,
          valor: 'checkout.lojafacil.com',
          ttl: 300
        }
      }
    })
    
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
    
    // Verificar se o domínio pertence à loja
    const dominio = await prisma.dominios.findFirst({
      where: {
        id,
        id_loja: idLoja
      }
    })
    
    if (!dominio) {
      return NextResponse.json(
        { error: 'Domínio não encontrado' },
        { status: 404 }
      )
    }
    
    // Deletar fisicamente do banco de dados para permitir reutilização
    await prisma.dominios.delete({
      where: { id }
    })
    
    return NextResponse.json({ message: 'Domínio removido com sucesso' })
  } catch (error) {
    console.error('Erro ao remover domínio:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}