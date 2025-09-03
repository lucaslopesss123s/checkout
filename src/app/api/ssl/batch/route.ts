import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { activateSSLBatch, getEligibleDomainsForSSL, getSSLStatistics } from '@/lib/ssl-batch';

const prisma = new PrismaClient();

// Armazenar jobs de ativação SSL em memória (em produção, usar Redis ou banco)
const sslJobs = new Map<string, {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  total: number;
  results?: any[];
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}>();

function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// POST - Iniciar ativação SSL em lote
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domainIds, options = {} } = body;

    if (!domainIds || !Array.isArray(domainIds) || domainIds.length === 0) {
      const response = NextResponse.json(
        { error: 'Lista de IDs de domínios é obrigatória' },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }

    // Validar que todos os domínios existem e estão verificados
    const domains = await prisma.dominios.findMany({
      where: {
        id: { in: domainIds },
        status: {
          in: ['verified', 'active']
        },
        ativo: true
      }
    });

    if (domains.length !== domainIds.length) {
      const response = NextResponse.json(
        { error: 'Alguns domínios não foram encontrados ou não estão verificados' },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }

    // Criar job ID único
    const jobId = `ssl-batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Inicializar job
    sslJobs.set(jobId, {
      id: jobId,
      status: 'pending',
      progress: 0,
      total: domainIds.length,
      startedAt: new Date()
    });

    // Processar em background
    processSSLBatch(jobId, domainIds, options);

    const response = NextResponse.json({
      success: true,
      jobId,
      message: `Ativação SSL iniciada para ${domainIds.length} domínios`,
      domains: domains.map(d => ({ id: d.id, domain: d.dominio }))
    });
    return addCorsHeaders(response);

  } catch (error) {
    console.error('Erro ao iniciar ativação SSL em lote:', error);
    const response = NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

// GET - Verificar status do job ou listar domínios elegíveis
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const action = searchParams.get('action');

    // Verificar status de um job específico
    if (jobId) {
      const job = sslJobs.get(jobId);
      
      if (!job) {
        const response = NextResponse.json(
          { error: 'Job não encontrado' },
          { status: 404 }
        );
        return addCorsHeaders(response);
      }

      const response = NextResponse.json({
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        total: job.total,
        percentage: job.total > 0 ? Math.round((job.progress / job.total) * 100) : 0,
        results: job.results,
        error: job.error,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        duration: job.completedAt 
          ? job.completedAt.getTime() - job.startedAt.getTime()
          : Date.now() - job.startedAt.getTime()
      });
      return addCorsHeaders(response);
    }

    // Listar domínios elegíveis para SSL
    if (action === 'eligible') {
      const eligibleDomains = await getEligibleDomainsForSSL();
      const response = NextResponse.json({
        domains: eligibleDomains,
        count: eligibleDomains.length
      });
      return addCorsHeaders(response);
    }

    // Obter estatísticas SSL
    if (action === 'stats') {
      const stats = await getSSLStatistics();
      const response = NextResponse.json(stats);
      return addCorsHeaders(response);
    }

    // Listar jobs ativos
    const activeJobs = Array.from(sslJobs.values())
      .filter(job => job.status === 'running' || job.status === 'pending')
      .map(job => ({
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        total: job.total,
        percentage: job.total > 0 ? Math.round((job.progress / job.total) * 100) : 0,
        startedAt: job.startedAt
      }));

    const response = NextResponse.json({
      activeJobs,
      count: activeJobs.length
    });
    return addCorsHeaders(response);

  } catch (error) {
    console.error('Erro ao verificar status SSL:', error);
    const response = NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

// Processar ativação SSL em background
async function processSSLBatch(jobId: string, domainIds: string[], options: any) {
  const job = sslJobs.get(jobId);
  if (!job) return;

  try {
    // Atualizar status para running
    job.status = 'running';
    sslJobs.set(jobId, job);

    console.log(`Iniciando processamento SSL em lote - Job: ${jobId}`);

    // Processar com callback de progresso
    const results = await activateSSLBatch(domainIds, {
      ...options,
      onProgress: (completed: number, total: number) => {
        const currentJob = sslJobs.get(jobId);
        if (currentJob) {
          currentJob.progress = completed;
          sslJobs.set(jobId, currentJob);
        }
      }
    });

    // Atualizar job com resultados
    job.status = 'completed';
    job.progress = job.total;
    job.results = results;
    job.completedAt = new Date();
    sslJobs.set(jobId, job);

    console.log(`Job SSL concluído: ${jobId} - ${results.filter(r => r.success).length}/${results.length} sucessos`);

  } catch (error) {
    console.error(`Erro no job SSL ${jobId}:`, error);
    
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : 'Erro desconhecido';
    job.completedAt = new Date();
    sslJobs.set(jobId, job);
  }
}

// DELETE - Cancelar job (se ainda estiver pending)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      const response = NextResponse.json(
        { error: 'Job ID é obrigatório' },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }

    const job = sslJobs.get(jobId);
    
    if (!job) {
      const response = NextResponse.json(
        { error: 'Job não encontrado' },
        { status: 404 }
      );
      return addCorsHeaders(response);
    }

    if (job.status === 'running') {
      const response = NextResponse.json(
        { error: 'Não é possível cancelar job em execução' },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }

    // Remover job
    sslJobs.delete(jobId);

    const response = NextResponse.json({
      success: true,
      message: 'Job cancelado com sucesso'
    });
    return addCorsHeaders(response);

  } catch (error) {
    console.error('Erro ao cancelar job SSL:', error);
    const response = NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

// Limpar jobs antigos (executar periodicamente)
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 horas
  
  for (const [jobId, job] of sslJobs.entries()) {
    if (job.status === 'completed' || job.status === 'failed') {
      const age = now - job.startedAt.getTime();
      if (age > maxAge) {
        sslJobs.delete(jobId);
        console.log(`Job SSL antigo removido: ${jobId}`);
      }
    }
  }
}, 60 * 60 * 1000); // Executar a cada hora