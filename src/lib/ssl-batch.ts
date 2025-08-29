import { PrismaClient } from '@prisma/client';
import { generateLetsEncryptCertificate } from './letsencrypt-ssl';
import { generateSelfSignedCertificate } from './ssl-generator';

const prisma = new PrismaClient();

interface BatchSSLResult {
  domainId: string;
  domain: string;
  success: boolean;
  provider?: 'letsencrypt' | 'self-signed';
  error?: string;
  certificateId?: string;
}

interface BatchSSLOptions {
  timeout?: number; // Timeout em ms para cada domínio (padrão: 60 segundos)
  maxConcurrent?: number; // Máximo de domínios processados simultaneamente (padrão: 3)
  fallbackToSelfSigned?: boolean; // Usar certificado auto-assinado se Let's Encrypt falhar (padrão: true)
  onProgress?: (completed: number, total: number) => void; // Callback de progresso
}

/**
 * Ativa SSL para múltiplos domínios de forma eficiente
 */
export async function activateSSLBatch(
  domainIds: string[],
  options: BatchSSLOptions = {}
): Promise<BatchSSLResult[]> {
  const {
    timeout = 60000, // 60 segundos por domínio
    maxConcurrent = 3, // Máximo 3 domínios simultâneos
    fallbackToSelfSigned = true,
    onProgress
  } = options;

  console.log(`Iniciando ativação SSL em lote para ${domainIds.length} domínios`);
  console.log(`Configurações: timeout=${timeout}ms, concurrent=${maxConcurrent}, fallback=${fallbackToSelfSigned}`);

  const results: BatchSSLResult[] = [];
  
  // Processar domínios em lotes
  for (let i = 0; i < domainIds.length; i += maxConcurrent) {
    const batch = domainIds.slice(i, i + maxConcurrent);
    console.log(`Processando lote ${Math.floor(i / maxConcurrent) + 1}: ${batch.length} domínios`);
    
    const batchPromises = batch.map(domainId => 
      activateSSLSingle(domainId, timeout, fallbackToSelfSigned)
    );
    
    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          domainId: batch[index],
          domain: 'unknown',
          success: false,
          error: result.reason?.message || 'Erro desconhecido'
        });
      }
    });
    
    // Atualizar progresso
    if (onProgress) {
      onProgress(results.length, domainIds.length);
    }
    
    // Pequena pausa entre lotes para não sobrecarregar
    if (i + maxConcurrent < domainIds.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Ativação SSL em lote concluída: ${successful} sucessos, ${failed} falhas`);
  
  return results;
}

/**
 * Ativa SSL para um único domínio com timeout e fallback
 */
async function activateSSLSingle(
  domainId: string,
  timeout: number,
  fallbackToSelfSigned: boolean
): Promise<BatchSSLResult> {
  try {
    // Buscar informações do domínio
    const dominio = await prisma.dominios.findUnique({
      where: { id: domainId },
      include: { ssl_certificate: true }
    });

    if (!dominio) {
      throw new Error('Domínio não encontrado');
    }

    if (dominio.status !== 'verified') {
      throw new Error('Domínio não está verificado');
    }

    const fullDomain = `checkout.${dominio.dominio}`;
    console.log(`Ativando SSL para: ${fullDomain}`);

    // Verificar se já existe certificado válido
    const existingCert = await prisma.sSL_certificates.findFirst({
      where: {
        domain: fullDomain,
        status: 'active',
        expires_at: {
          gt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Válido por mais de 7 dias
        }
      }
    });

    if (existingCert) {
      console.log(`Certificado já existe e é válido para: ${fullDomain}`);
      return {
        domainId,
        domain: fullDomain,
        success: true,
        provider: existingCert.provider as 'letsencrypt' | 'self-signed',
        certificateId: existingCert.id
      };
    }

    // Tentar Let's Encrypt com timeout
    let sslResult: BatchSSLResult;
    
    try {
      console.log(`Tentando Let's Encrypt para: ${fullDomain}`);
      const letsEncryptResult = await Promise.race([
        generateLetsEncryptCertificate(fullDomain),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout Let\'s Encrypt')), timeout)
        )
      ]);

      if (letsEncryptResult.success && letsEncryptResult.certificate && letsEncryptResult.privateKey) {
        // Salvar certificado Let's Encrypt
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 90);

        const sslCert = await prisma.sSL_certificates.create({
          data: {
            domain: fullDomain,
            certificate: letsEncryptResult.certificate,
            private_key: letsEncryptResult.privateKey,
            provider: 'letsencrypt',
            expires_at: expiresAt,
            is_active: true,
            auto_renew: true
          }
        });

        await prisma.dominios.update({
          where: { id: domainId },
          data: {
            ssl_ativo: true,
            ssl_certificate_id: sslCert.id
          }
        });

        console.log(`✅ Let's Encrypt ativado para: ${fullDomain}`);
        sslResult = {
          domainId,
          domain: fullDomain,
          success: true,
          provider: 'letsencrypt',
          certificateId: sslCert.id
        };
      } else {
        throw new Error(letsEncryptResult.error || 'Falha na geração Let\'s Encrypt');
      }
    } catch (letsEncryptError) {
      console.log(`❌ Let's Encrypt falhou para ${fullDomain}: ${letsEncryptError}`);
      
      if (!fallbackToSelfSigned) {
        throw letsEncryptError;
      }

      // Fallback para certificado auto-assinado
      console.log(`🔄 Usando fallback auto-assinado para: ${fullDomain}`);
      
      const selfSignedResult = await generateSelfSignedCertificate(fullDomain);
      
      const sslCert = await prisma.sSL_certificates.create({
        data: {
          domain: fullDomain,
          certificate: selfSignedResult.certificate,
          private_key: selfSignedResult.privateKey,
          provider: 'self-signed',
          expires_at: selfSignedResult.expiresAt,
          is_active: true,
          auto_renew: false
        }
      });

      await prisma.dominios.update({
        where: { id: domainId },
        data: {
          ssl_ativo: true,
          ssl_certificate_id: sslCert.id
        }
      });

      console.log(`✅ Certificado auto-assinado ativado para: ${fullDomain}`);
      sslResult = {
        domainId,
        domain: fullDomain,
        success: true,
        provider: 'self-signed',
        certificateId: sslCert.id
      };
    }

    return sslResult;
    
  } catch (error) {
    console.error(`❌ Erro ao ativar SSL para domínio ${domainId}:`, error);
    return {
      domainId,
      domain: 'unknown',
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Obtém domínios elegíveis para ativação SSL
 */
export async function getEligibleDomainsForSSL(): Promise<Array<{id: string, domain: string}>> {
  const domains = await prisma.dominios.findMany({
    where: {
      status: 'verified',
      dns_verificado: true,
      ssl_ativo: false
    },
    select: {
      id: true,
      dominio: true
    }
  });

  return domains.map(d => ({ id: d.id, domain: d.dominio }));
}

/**
 * Obtém estatísticas de SSL
 */
export async function getSSLStatistics() {
  const [total, active, letsencrypt, selfSigned, expiringSoon] = await Promise.all([
    prisma.dominios.count(),
    prisma.dominios.count({ where: { ssl_ativo: true } }),
    prisma.sSL_certificates.count({ where: { provider: 'letsencrypt', is_active: true } }),
    prisma.sSL_certificates.count({ where: { provider: 'self-signed', is_active: true } }),
    prisma.sSL_certificates.count({
      where: {
        is_active: true,
        expires_at: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
        }
      }
    })
  ]);

  return {
    total_domains: total,
    ssl_active: active,
    ssl_inactive: total - active,
    letsencrypt_certificates: letsencrypt,
    self_signed_certificates: selfSigned,
    expiring_soon: expiringSoon
  };
}