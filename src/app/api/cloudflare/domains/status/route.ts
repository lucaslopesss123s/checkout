import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareConfig, cloudflareRequest, createDNSRecord, listDNSRecords } from '@/lib/cloudflare-config'
import prisma from '@/lib/prisma'
import { authenticateUser } from '@/lib/auth'

// IP da VPS para apontamento do checkout
const CHECKOUT_VPS_IP = '181.41.200.99'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const user = await authenticateUser(request)
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain')
    const zoneId = searchParams.get('zone_id')

    if (!domain && !zoneId) {
      return NextResponse.json(
        { error: 'Domínio ou zone_id é obrigatório' },
        { status: 400 }
      )
    }

    // Obter configuração do Cloudflare
    const cloudflareConfig = getCloudflareConfig()

    let finalZoneId = zoneId

    // Se não temos zone_id, buscar pelo domínio
    if (!finalZoneId && domain) {
      console.log(`[info] Buscando zona para domínio: ${domain}`)
      
      const zonesResponse = await cloudflareRequest<any[]>(
        `/zones?name=${domain}`,
        cloudflareConfig
      )

      if (!zonesResponse.success || !zonesResponse.result.length) {
        return NextResponse.json(
          { error: 'Domínio não encontrado no Cloudflare' },
          { status: 404 }
        )
      }

      finalZoneId = zonesResponse.result[0].id
    }

    // Verificar status da zona
    console.log(`[info] Verificando status da zona: ${finalZoneId}`)
    
    const zoneResponse = await cloudflareRequest<any>(
      `/zones/${finalZoneId}`,
      cloudflareConfig
    )

    if (!zoneResponse.success) {
      return NextResponse.json(
        { 
          error: 'Erro ao verificar zona no Cloudflare',
          details: zoneResponse.errors
        },
        { status: 500 }
      )
    }

    const zone = zoneResponse.result

    // Verificar registros DNS
    console.log(`[info] Verificando registros DNS para zona: ${finalZoneId}`)
    
    const dnsResponse = await cloudflareRequest<any[]>(
      `/zones/${finalZoneId}/dns_records?per_page=100`,
      cloudflareConfig
    )

    const dnsRecords = dnsResponse.success ? dnsResponse.result : []

    // Verificar SSL Universal
    console.log(`[info] Verificando SSL Universal para zona: ${finalZoneId}`)
    
    let sslStatus = 'unknown'
    let sslCertificates = []

    try {
      const sslResponse = await cloudflareRequest<any>(
        `/zones/${finalZoneId}/ssl/universal/settings`,
        cloudflareConfig
      )

      if (sslResponse.success) {
        sslStatus = sslResponse.result.enabled ? 'active' : 'disabled'
      }
    } catch (error: any) {
      console.log('[info] Erro ao verificar SSL Universal (pode ser normal - sem permissões):', error.message)
      // Continuar sem SSL se não tiver permissões
    }

    try {
      // Verificar certificados SSL
      const certsResponse = await cloudflareRequest<any[]>(
        `/zones/${finalZoneId}/ssl/certificate_packs?status=all`,
        cloudflareConfig
      )

      if (certsResponse.success) {
        sslCertificates = certsResponse.result
      }
    } catch (error: any) {
      console.log('[info] Erro ao verificar certificados SSL (pode ser normal - sem permissões):', error.message)
      // Continuar sem certificados se não tiver permissões
    }

    // Verificar DNS via DoH (DNS over HTTPS)
    let dohStatus = 'unknown'
    const domainName = domain || zone.name
    
    try {
      console.log(`[info] Verificando DNS via DoH para: ${domainName}`)
      
      const dohResponse = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${domainName}&type=A`,
        {
          headers: {
            'accept': 'application/dns-json'
          }
        }
      )

      if (dohResponse.ok) {
        const dohData = await dohResponse.json()
        dohStatus = dohData.Answer && dohData.Answer.length > 0 ? 'resolved' : 'not_resolved'
      }
    } catch (error) {
      console.log('[info] Erro ao verificar DoH:', error)
    }

    // Criar registro DNS para checkout se o domínio estiver ativo
    let checkoutDNSCreated = false
    if (zone.status === 'active') {
      try {
        // Verificar se já existe registro DNS para checkout
        const existingRecords = await listDNSRecords(cloudflareConfig, finalZoneId, 'A', 'checkout')
        
        if (existingRecords.length === 0) {
          console.log(`[info] Criando registro DNS tipo A para checkout.${zone.name} -> ${CHECKOUT_VPS_IP}`)
          
          const dnsRecord = await createDNSRecord(cloudflareConfig, finalZoneId, {
            type: 'A',
            name: 'checkout',
            content: CHECKOUT_VPS_IP,
            ttl: 1, // Automático
            proxied: true // Ativar proxy (orange cloud) para SSL automático
          })
          
          checkoutDNSCreated = true
          console.log(`[success] Registro DNS criado com sucesso: checkout.${zone.name} -> ${CHECKOUT_VPS_IP}`)
        } else {
          console.log(`[info] Registro DNS para checkout.${zone.name} já existe`)
        }
      } catch (error) {
        console.log('[error] Erro ao criar registro DNS para checkout:', error)
      }
    }

    // Atualizar status no banco de dados se o domínio existir
    if (domain) {
      try {
        await prisma.dominios.updateMany({
          where: {
            dominio: domain,
            id_loja: user.id
          },
          data: {
            status: zone.status,
            ssl_ativo: sslStatus === 'active',
            dns_verificado: zone.status === 'active',
            ultima_verificacao: new Date()
          }
        })
      } catch (error) {
        console.log('[info] Erro ao atualizar domínio no banco:', error)
      }
    }

    return NextResponse.json({
      success: true,
      zone: {
        id: zone.id,
        name: zone.name,
        status: zone.status,
        name_servers: zone.name_servers,
        created_on: zone.created_on,
        modified_on: zone.modified_on
      },
      dns: {
        records_count: dnsRecords.length,
        records: dnsRecords.slice(0, 10), // Primeiros 10 registros
        doh_status: dohStatus
      },
      ssl: {
        status: sslStatus,
        certificates_count: sslCertificates.length,
        certificates: sslCertificates.map(cert => ({
          id: cert.id,
          type: cert.type,
          status: cert.status,
          validation_method: cert.validation_method,
          certificate_authority: cert.certificate_authority
        }))
      },
      checkout: {
        dns_created: checkoutDNSCreated,
        subdomain: zone.status === 'active' ? `checkout.${zone.name}` : null,
        ip: CHECKOUT_VPS_IP,
        ssl_enabled: zone.status === 'active' // SSL automático com proxy ativado
      }
    })

  } catch (error) {
    console.error('[error] Erro ao verificar status do domínio:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}