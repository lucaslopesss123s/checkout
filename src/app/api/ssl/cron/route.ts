import { NextRequest, NextResponse } from 'next/server'
import { startSSLCron, stopSSLCron, runManualRenewal, getCronStatus, CRON_CONFIG } from '@/lib/ssl-cron'
import prisma from '@/lib/prisma'

// Função para adicionar cabeçalhos CORS
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

// Função OPTIONS para requisições preflight
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 })
  return addCorsHeaders(response)
}

// GET para obter status do cron job
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeLogs = searchParams.get('includeLogs') === 'true'
    const logsLimit = parseInt(searchParams.get('logsLimit') || '10')
    
    const cronStatus = getCronStatus()
    
    let recentLogs = null
    if (includeLogs) {
      try {
        recentLogs = await prisma.ssl_renewal_logs.findMany({
          take: logsLimit,
          orderBy: {
            executed_at: 'desc'
          }
        })
      } catch (error) {
        console.warn('Erro ao buscar logs de renovação:', error)
      }
    }
    
    // Buscar próximos certificados que precisam ser renovados
    const upcomingRenewals = await prisma.ssl_certificates.findMany({
      where: {
        status: 'active',
        auto_renew: true,
        expires_at: {
          lte: new Date(Date.now() + CRON_CONFIG.daysBeforeExpiry * 24 * 60 * 60 * 1000)
        }
      },
      take: 5,
      orderBy: {
        expires_at: 'asc'
      },
      select: {
        id: true,
        domain: true,
        expires_at: true,
        last_renewal_attempt: true,
        renewal_error: true
      }
    })
    
    const upcomingWithDays = upcomingRenewals.map(cert => ({
      ...cert,
      days_until_expiry: Math.ceil(
        (new Date(cert.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    }))

    const response = NextResponse.json({
      cron_status: cronStatus,
      upcoming_renewals: upcomingWithDays,
      recent_logs: recentLogs,
      statistics: {
        total_certificates: await prisma.ssl_certificates.count({
          where: { status: 'active' }
        }),
        auto_renew_enabled: await prisma.ssl_certificates.count({
          where: { status: 'active', auto_renew: true }
        }),
        expiring_soon: upcomingRenewals.length
      }
    })
    return addCorsHeaders(response)

  } catch (error) {
    console.error('Erro ao obter status do cron SSL:', error)
    const response = NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}

// POST para iniciar o cron job
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    switch (action) {
      case 'start':
        startSSLCron()
        const response1 = NextResponse.json({
          success: true,
          message: 'Cron job de renovação SSL iniciado',
          status: getCronStatus()
        })
        return addCorsHeaders(response1)
        
      case 'stop':
        stopSSLCron()
        const response2 = NextResponse.json({
          success: true,
          message: 'Cron job de renovação SSL parado',
          status: getCronStatus()
        })
        return addCorsHeaders(response2)
        
      case 'run_manual':
        // Executar renovação manual em background
        runManualRenewal().catch(error => {
          console.error('Erro na renovação manual:', error)
        })
        
        const response3 = NextResponse.json({
          success: true,
          message: 'Renovação manual iniciada em background',
          note: 'Verifique os logs para acompanhar o progresso'
        })
        return addCorsHeaders(response3)
        
      default:
        const response4 = NextResponse.json(
          { error: 'Ação inválida. Use: start, stop ou run_manual' },
          { status: 400 }
        )
        return addCorsHeaders(response4)
    }

  } catch (error) {
    console.error('Erro ao gerenciar cron SSL:', error)
    const response = NextResponse.json(
      { 
        error: 'Erro ao gerenciar cron job',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}

// PUT para atualizar configurações do cron
export async function PUT(request: NextRequest) {
  try {
    const { 
      daysBeforeExpiry,
      maxRenewalsPerRun,
      renewalTimeout,
      autoStart = true
    } = await request.json()
    
    // Validar parâmetros
    if (daysBeforeExpiry && (daysBeforeExpiry < 1 || daysBeforeExpiry > 89)) {
      const response = NextResponse.json(
        { error: 'daysBeforeExpiry deve estar entre 1 e 89 dias' },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }
    
    if (maxRenewalsPerRun && (maxRenewalsPerRun < 1 || maxRenewalsPerRun > 50)) {
      const response = NextResponse.json(
        { error: 'maxRenewalsPerRun deve estar entre 1 e 50' },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }
    
    if (renewalTimeout && (renewalTimeout < 60000 || renewalTimeout > 600000)) {
      const response = NextResponse.json(
        { error: 'renewalTimeout deve estar entre 60000ms (1min) e 600000ms (10min)' },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }
    
    // Atualizar configurações (em uma implementação real, você salvaria isso no banco)
    const updatedConfig = {
      ...CRON_CONFIG,
      ...(daysBeforeExpiry && { daysBeforeExpiry }),
      ...(maxRenewalsPerRun && { maxRenewalsPerRun }),
      ...(renewalTimeout && { renewalTimeout })
    }
    
    // Reiniciar cron com novas configurações se estava ativo
    const wasActive = getCronStatus().active
    if (wasActive) {
      stopSSLCron()
      if (autoStart) {
        startSSLCron()
      }
    }
    
    const response = NextResponse.json({
      success: true,
      message: 'Configurações do cron atualizadas',
      config: updatedConfig,
      cron_restarted: wasActive && autoStart,
      status: getCronStatus()
    })
    return addCorsHeaders(response)

  } catch (error) {
    console.error('Erro ao atualizar configurações do cron:', error)
    const response = NextResponse.json(
      { 
        error: 'Erro ao atualizar configurações',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}

// DELETE para limpar logs antigos
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const daysToKeep = parseInt(searchParams.get('daysToKeep') || '30')
    
    if (daysToKeep < 1 || daysToKeep > 365) {
      const response = NextResponse.json(
        { error: 'daysToKeep deve estar entre 1 e 365 dias' },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }
    
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000)
    
    const deletedLogs = await prisma.ssl_renewal_logs.deleteMany({
      where: {
        executed_at: {
          lt: cutoffDate
        }
      }
    })
    
    const response = NextResponse.json({
      success: true,
      message: `Logs antigos removidos com sucesso`,
      deleted_count: deletedLogs.count,
      cutoff_date: cutoffDate
    })
    return addCorsHeaders(response)

  } catch (error) {
    console.error('Erro ao limpar logs:', error)
    const response = NextResponse.json(
      { 
        error: 'Erro ao limpar logs',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}