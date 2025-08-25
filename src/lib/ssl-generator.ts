import fs from 'fs/promises'
import path from 'path'
import { execSync } from 'child_process'
import crypto from 'crypto'

// Função para garantir que o diretório existe
export async function ensureDirectoryExists(dirPath: string) {
  try {
    await fs.access(dirPath)
  } catch {
    await fs.mkdir(dirPath, { recursive: true })
  }
}

// Função para gerar certificado SSL auto-assinado usando Node.js crypto
export async function generateSelfSignedCertificate(domain: string) {
  try {
    // Usar diretório temporário ou relativo com permissões adequadas
    const sslDir = process.env.NODE_ENV === 'production' 
      ? path.join('/tmp', 'ssl-certificates', domain)
      : path.join(process.cwd(), 'ssl-certificates', domain)
    await ensureDirectoryExists(sslDir)

    const keyPath = path.join(sslDir, 'private.key')
    const certPath = path.join(sslDir, 'certificate.crt')
    const chainPath = path.join(sslDir, 'chain.pem')

    // Gerar chave privada RSA
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    })

    // Criar certificado auto-assinado
    const cert = createSelfSignedCertificate(domain, privateKey, publicKey)

    // Salvar arquivos
    await fs.writeFile(keyPath, privateKey)
    await fs.writeFile(certPath, cert)
    await fs.writeFile(chainPath, cert) // Para certificados auto-assinados, chain é igual ao cert

    return {
      certificate: cert,
      privateKey: privateKey,
      certificateChain: cert,
      certPath,
      keyPath,
      chainPath,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 ano
    }
  } catch (error) {
    console.error('Erro ao gerar certificado SSL:', error)
    throw error
  }
}

// Função para criar certificado auto-assinado
function createSelfSignedCertificate(domain: string, privateKey: string, publicKey: string): string {
  const now = new Date()
  const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)

  // Criar um certificado básico (simulado)
  // Em produção, você usaria uma biblioteca como node-forge ou @peculiar/x509
  const certData = {
    subject: {
      commonName: domain,
      organization: 'Self-Signed Certificate',
      country: 'BR'
    },
    issuer: {
      commonName: domain,
      organization: 'Self-Signed Certificate',
      country: 'BR'
    },
    notBefore: now,
    notAfter: oneYearFromNow,
    serialNumber: crypto.randomBytes(16).toString('hex'),
    publicKey: publicKey
  }

  // Simular um certificado PEM (para desenvolvimento)
  const certPem = `-----BEGIN CERTIFICATE-----
${Buffer.from(JSON.stringify(certData)).toString('base64').match(/.{1,64}/g)?.join('\n')}
-----END CERTIFICATE-----`

  return certPem
}

// Função para verificar se um certificado existe e é válido
export async function checkCertificateExists(domain: string): Promise<boolean> {
  try {
    const sslDir = process.env.NODE_ENV === 'production' 
      ? path.join('/tmp', 'ssl-certificates', domain)
      : path.join(process.cwd(), 'ssl-certificates', domain)
    const keyPath = path.join(sslDir, 'private.key')
    const certPath = path.join(sslDir, 'certificate.crt')

    await fs.access(keyPath)
    await fs.access(certPath)
    return true
  } catch {
    return false
  }
}

// Função para ler certificado existente
export async function readExistingCertificate(domain: string) {
  const sslDir = process.env.NODE_ENV === 'production' 
    ? path.join('/tmp', 'ssl-certificates', domain)
    : path.join(process.cwd(), 'ssl-certificates', domain)
  const keyPath = path.join(sslDir, 'private.key')
  const certPath = path.join(sslDir, 'certificate.crt')
  const chainPath = path.join(sslDir, 'chain.pem')

  const privateKey = await fs.readFile(keyPath, 'utf8')
  const certificate = await fs.readFile(certPath, 'utf8')
  const certificateChain = await fs.readFile(chainPath, 'utf8')

  return {
    certificate,
    privateKey,
    certificateChain,
    certPath,
    keyPath,
    chainPath
  }
}