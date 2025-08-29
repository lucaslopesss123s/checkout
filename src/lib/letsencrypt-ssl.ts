import * as acme from 'acme-client';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

// Configuração do Let's Encrypt
const LETSENCRYPT_DIRECTORY_URL = process.env.NODE_ENV === 'production' 
  ? acme.directory.letsencrypt.production 
  : acme.directory.letsencrypt.staging;

const ACCOUNT_EMAIL = process.env.LETSENCRYPT_EMAIL || 'admin@lojafacil.com';

interface CertificateResult {
  success: boolean;
  certificate?: string;
  privateKey?: string;
  error?: string;
}

/**
 * Gera um certificado SSL válido usando Let's Encrypt
 */
export async function generateLetsEncryptCertificate(domain: string): Promise<CertificateResult> {
  try {
    console.log(`Iniciando geração de certificado Let's Encrypt para: ${domain}`);
    
    // Criar cliente ACME
    const client = new acme.Client({
      directoryUrl: LETSENCRYPT_DIRECTORY_URL,
      accountKey: await acme.crypto.createPrivateKey()
    });

    // Criar conta no Let's Encrypt
    await client.createAccount({
      termsOfServiceAgreed: true,
      contact: [`mailto:${ACCOUNT_EMAIL}`]
    });

    // Criar chave privada para o certificado
    const [key, csr] = await acme.crypto.createCsr({
      commonName: domain,
      altNames: [domain]
    });

    // Solicitar certificado
    const cert = await client.auto({
      csr,
      email: ACCOUNT_EMAIL,
      termsOfServiceAgreed: true,
      challengeCreateFn: async (authz, challenge, keyAuthorization) => {
        console.log(`Criando desafio HTTP-01 para: ${authz.identifier.value}`);
        
        // Salvar o desafio no diretório público
        const challengePath = path.join(process.cwd(), 'public', '.well-known', 'acme-challenge');
        await fs.mkdir(challengePath, { recursive: true });
        await fs.writeFile(
          path.join(challengePath, challenge.token),
          keyAuthorization
        );
        
        console.log(`Desafio salvo em: ${challengePath}/${challenge.token}`);
      },
      challengeRemoveFn: async (authz, challenge) => {
        console.log(`Removendo desafio para: ${authz.identifier.value}`);
        
        // Remover o arquivo de desafio
        const challengePath = path.join(
          process.cwd(), 
          'public', 
          '.well-known', 
          'acme-challenge', 
          challenge.token
        );
        
        try {
          await fs.unlink(challengePath);
          console.log(`Desafio removido: ${challengePath}`);
        } catch (error) {
          console.warn(`Erro ao remover desafio: ${error}`);
        }
      }
    });

    console.log(`Certificado Let's Encrypt gerado com sucesso para: ${domain}`);
    
    return {
      success: true,
      certificate: cert.toString(),
      privateKey: key.toString()
    };
    
  } catch (error) {
    console.error(`Erro ao gerar certificado Let's Encrypt para ${domain}:`, error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Salva o certificado Let's Encrypt no banco de dados
 */
export async function saveLetsEncryptCertificate(
  domainId: string,
  domain: string,
  certificate: string,
  privateKey: string
): Promise<boolean> {
  try {
    // Calcular data de expiração (Let's Encrypt = 90 dias)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    // Salvar certificado no banco
    const sslCert = await prisma.sSL_certificates.create({
      data: {
        domain,
        certificate,
        private_key: privateKey,
        provider: 'letsencrypt',
        expires_at: expiresAt,
        is_active: true,
        auto_renew: true
      }
    });

    // Atualizar domínio para referenciar o certificado
    await prisma.dominios.update({
      where: { id: domainId },
      data: {
        ssl_ativo: true,
        ssl_certificate_id: sslCert.id
      }
    });

    console.log(`Certificado Let's Encrypt salvo no banco para: ${domain}`);
    return true;
    
  } catch (error) {
    console.error(`Erro ao salvar certificado no banco:`, error);
    return false;
  }
}

/**
 * Verifica se um certificado precisa ser renovado (30 dias antes do vencimento)
 */
export async function needsRenewal(certificateId: string): Promise<boolean> {
  try {
    const cert = await prisma.sSL_certificates.findUnique({
      where: { id: certificateId }
    });

    if (!cert) return false;

    const now = new Date();
    const expiresAt = new Date(cert.expires_at);
    const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Renovar 30 dias antes do vencimento
    return daysUntilExpiry <= 30;
    
  } catch (error) {
    console.error('Erro ao verificar necessidade de renovação:', error);
    return false;
  }
}

/**
 * Renova um certificado Let's Encrypt
 */
export async function renewLetsEncryptCertificate(certificateId: string): Promise<boolean> {
  try {
    const cert = await prisma.sSL_certificates.findUnique({
      where: { id: certificateId },
      include: {
        domain_ssl: true
      }
    });

    if (!cert || !cert.domain_ssl) {
      console.error('Certificado ou domínio não encontrado');
      return false;
    }

    console.log(`Renovando certificado para: ${cert.domain}`);
    
    // Gerar novo certificado
    const result = await generateLetsEncryptCertificate(cert.domain);
    
    if (!result.success || !result.certificate || !result.privateKey) {
      console.error('Falha na renovação do certificado');
      return false;
    }

    // Atualizar certificado existente
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    await prisma.sSL_certificates.update({
      where: { id: certificateId },
      data: {
        certificate: result.certificate,
        private_key: result.privateKey,
        expires_at: expiresAt,
        updatedAt: new Date()
      }
    });

    console.log(`Certificado renovado com sucesso para: ${cert.domain}`);
    return true;
    
  } catch (error) {
    console.error('Erro na renovação do certificado:', error);
    return false;
  }
}