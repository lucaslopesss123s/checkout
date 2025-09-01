// Configuração da API do Cloudflare

export interface CloudflareConfig {
  apiToken: string
  email?: string
  apiKey?: string
}

export interface CloudflareZone {
  id: string
  name: string
  status: string
  nameServers: string[]
}

export interface CloudflareDNSRecord {
  id?: string
  type: string
  name: string
  content: string
  ttl?: number
  proxied?: boolean
  priority?: number
}

// Configuração padrão do Cloudflare
export const CLOUDFLARE_CONFIG = {
  baseUrl: 'https://api.cloudflare.com/client/v4',
  defaultTTL: 300,
  defaultProxied: true,
  supportedRecordTypes: ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'SRV'],
  nameServers: {
    primary: ['ava.ns.cloudflare.com', 'bob.ns.cloudflare.com'],
    secondary: ['cara.ns.cloudflare.com', 'dave.ns.cloudflare.com']
  }
}

// Validação de credenciais
export function validateCloudflareCredentials(config: CloudflareConfig): boolean {
  if (config.apiToken) {
    // Validar formato do token (deve ter pelo menos 40 caracteres)
    return config.apiToken.length >= 40
  }
  
  if (config.email && config.apiKey) {
    // Validar email e API key
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(config.email) && config.apiKey.length >= 32
  }
  
  return false
}

// Credenciais fixas do Cloudflare
export const FIXED_CLOUDFLARE_CREDENTIALS = {
  apiToken: 'Xfh4fwnRxG11r90AK8ngKYCeqjxWjS5VIRUYKBaE',
  accountId: '1a0e1733b95b544dc866d7eef149ca81'
}

// Função para obter configuração fixa do Cloudflare
export function getCloudflareConfig(): CloudflareConfig {
  const config: CloudflareConfig = {
    apiToken: FIXED_CLOUDFLARE_CREDENTIALS.apiToken
  }

  if (!validateCloudflareCredentials(config)) {
    throw new Error('Credenciais do Cloudflare inválidas')
  }

  return config
}

// Função para obter Account ID
export function getCloudflareAccountId(): string {
  return FIXED_CLOUDFLARE_CREDENTIALS.accountId
}

// Tipos de erro do Cloudflare
export interface CloudflareError {
  code: number
  message: string
  error_chain?: CloudflareError[]
}

export interface CloudflareResponse<T = any> {
  success: boolean
  errors: CloudflareError[]
  messages: string[]
  result: T
  result_info?: {
    page: number
    per_page: number
    count: number
    total_count: number
  }
}

// Headers padrão para requisições
export function getCloudflareHeaders(config: CloudflareConfig): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  
  if (config.apiToken) {
    headers['Authorization'] = `Bearer ${config.apiToken}`
  } else if (config.email && config.apiKey) {
    headers['X-Auth-Email'] = config.email
    headers['X-Auth-Key'] = config.apiKey
  }
  
  return headers
}

// Função para fazer requisições à API do Cloudflare
export async function cloudflareRequest<T = any>(
  endpoint: string,
  config: CloudflareConfig,
  options: RequestInit = {}
): Promise<CloudflareResponse<T>> {
  const url = `${CLOUDFLARE_CONFIG.baseUrl}${endpoint}`
  const headers = getCloudflareHeaders(config)
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  })
  
  if (!response.ok) {
    throw new Error(`Cloudflare API error: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}

// Função para fazer requisições à API do Cloudflare (versão simplificada)
export async function makeCloudflareRequest(
  config: CloudflareConfig,
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `${CLOUDFLARE_CONFIG.baseUrl}${endpoint}`;
  
  const headers = {
    'Authorization': `Bearer ${config.apiToken}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (config.email) {
    headers['X-Auth-Email'] = config.email;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Cloudflare API Error: ${data.errors?.[0]?.message || response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error('Erro na requisição Cloudflare:', error);
    throw error;
  }
}

// Criar zona no Cloudflare
export async function createCloudflareZone(
  config: CloudflareConfig,
  domain: string
): Promise<any> {
  const endpoint = '/zones';
  
  const body = {
    name: domain,
    account: config.accountId ? { id: config.accountId } : undefined,
    jump_start: true, // Importar registros DNS existentes automaticamente
    type: 'full' // Zona completa
  };

  return makeCloudflareRequest(config, endpoint, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

// Obter informações de uma zona específica
export async function getCloudflareZone(
  config: CloudflareConfig,
  zoneId: string
): Promise<any> {
  const endpoint = `/zones/${zoneId}`;
  return makeCloudflareRequest(config, endpoint, { method: 'GET' });
}

// Deletar zona do Cloudflare
export async function deleteCloudflareZone(
  config: CloudflareConfig,
  zoneId: string
): Promise<any> {
  const endpoint = `/zones/${zoneId}`;
  return makeCloudflareRequest(config, endpoint, { method: 'DELETE' });
}

// Função para listar zonas
export async function listZones(config: CloudflareConfig): Promise<CloudflareZone[]> {
  const response = await cloudflareRequest<CloudflareZone[]>('/zones', config)
  
  if (!response.success) {
    throw new Error(`Erro ao listar zonas: ${response.errors.map(e => e.message).join(', ')}`)
  }
  
  return response.result
}

// Função para obter zona por nome
export async function getZoneByName(config: CloudflareConfig, zoneName: string): Promise<CloudflareZone | null> {
  const response = await cloudflareRequest<CloudflareZone[]>(`/zones?name=${zoneName}`, config)
  
  if (!response.success) {
    throw new Error(`Erro ao buscar zona: ${response.errors.map(e => e.message).join(', ')}`)
  }
  
  return response.result.length > 0 ? response.result[0] : null
}

// Função para listar registros DNS
export async function listDNSRecords(
  config: CloudflareConfig,
  zoneId: string,
  type?: string,
  name?: string
): Promise<CloudflareDNSRecord[]> {
  let endpoint = `/zones/${zoneId}/dns_records`
  const params = new URLSearchParams()
  
  if (type) params.append('type', type)
  if (name) params.append('name', name)
  
  if (params.toString()) {
    endpoint += `?${params.toString()}`
  }
  
  const response = await cloudflareRequest<CloudflareDNSRecord[]>(endpoint, config)
  
  if (!response.success) {
    throw new Error(`Erro ao listar registros DNS: ${response.errors.map(e => e.message).join(', ')}`)
  }
  
  return response.result
}

// Função para criar registro DNS
export async function createDNSRecord(
  config: CloudflareConfig,
  zoneId: string,
  record: Omit<CloudflareDNSRecord, 'id'>
): Promise<CloudflareDNSRecord> {
  const response = await cloudflareRequest<CloudflareDNSRecord>(
    `/zones/${zoneId}/dns_records`,
    config,
    {
      method: 'POST',
      body: JSON.stringify({
        type: record.type,
        name: record.name,
        content: record.content,
        ttl: record.ttl || CLOUDFLARE_CONFIG.defaultTTL,
        proxied: record.proxied ?? CLOUDFLARE_CONFIG.defaultProxied,
        priority: record.priority
      })
    }
  )
  
  if (!response.success) {
    throw new Error(`Erro ao criar registro DNS: ${response.errors.map(e => e.message).join(', ')}`)
  }
  
  return response.result
}

// Função para atualizar registro DNS
export async function updateDNSRecord(
  config: CloudflareConfig,
  zoneId: string,
  recordId: string,
  record: Partial<CloudflareDNSRecord>
): Promise<CloudflareDNSRecord> {
  const response = await cloudflareRequest<CloudflareDNSRecord>(
    `/zones/${zoneId}/dns_records/${recordId}`,
    config,
    {
      method: 'PUT',
      body: JSON.stringify(record)
    }
  )
  
  if (!response.success) {
    throw new Error(`Erro ao atualizar registro DNS: ${response.errors.map(e => e.message).join(', ')}`)
  }
  
  return response.result
}

// Função para deletar registro DNS
export async function deleteDNSRecord(
  config: CloudflareConfig,
  zoneId: string,
  recordId: string
): Promise<boolean> {
  const response = await cloudflareRequest(
    `/zones/${zoneId}/dns_records/${recordId}`,
    config,
    {
      method: 'DELETE'
    }
  )
  
  if (!response.success) {
    throw new Error(`Erro ao deletar registro DNS: ${response.errors.map(e => e.message).join(', ')}`)
  }
  
  return true
}

// Função para verificar status SSL
export async function getSSLStatus(config: CloudflareConfig, zoneId: string) {
  const response = await cloudflareRequest(`/zones/${zoneId}/ssl/certificate_packs`, config)
  
  if (!response.success) {
    throw new Error(`Erro ao verificar SSL: ${response.errors.map(e => e.message).join(', ')}`)
  }
  
  return response.result
}

// Função para ativar SSL Universal
export async function enableUniversalSSL(config: CloudflareConfig, zoneId: string) {
  const response = await cloudflareRequest(
    `/zones/${zoneId}/ssl/universal/settings`,
    config,
    {
      method: 'PATCH',
      body: JSON.stringify({
        enabled: true
      })
    }
  )
  
  if (!response.success) {
    throw new Error(`Erro ao ativar SSL Universal: ${response.errors.map(e => e.message).join(', ')}`)
  }
  
  return response.result
}

// Função para configurar modo SSL
export async function setSSLMode(config: CloudflareConfig, zoneId: string, mode: 'off' | 'flexible' | 'full' | 'strict') {
  const response = await cloudflareRequest(
    `/zones/${zoneId}/settings/ssl`,
    config,
    {
      method: 'PATCH',
      body: JSON.stringify({
        value: mode
      })
    }
  )
  
  if (!response.success) {
    throw new Error(`Erro ao configurar modo SSL: ${response.errors.map(e => e.message).join(', ')}`)
  }
  
  return response.result
}

// Função para ativar Always Use HTTPS
export async function setAlwaysUseHTTPS(config: CloudflareConfig, zoneId: string, enabled: boolean) {
  const response = await cloudflareRequest(
    `/zones/${zoneId}/settings/always_use_https`,
    config,
    {
      method: 'PATCH',
      body: JSON.stringify({
        value: enabled ? 'on' : 'off'
      })
    }
  )
  
  
  if (!response.success) {
    throw new Error(`Erro ao configurar Always Use HTTPS: ${response.errors.map(e => e.message).join(', ')}`)
  }
  
  return response.result
}

// Função para configurar SSL automaticamente para uma nova zona
export async function setupAutomaticSSL(config: CloudflareConfig, zoneId: string) {
  try {
    console.log(`Configurando SSL automático para zona: ${zoneId}`)
    
    // 1. Ativar SSL Universal
    await enableUniversalSSL(config, zoneId)
    console.log('SSL Universal ativado')
    
    // 2. Configurar modo SSL para 'full' (recomendado)
    await setSSLMode(config, zoneId, 'full')
    console.log('Modo SSL configurado para Full')
    
    // 3. Ativar Always Use HTTPS
    await setAlwaysUseHTTPS(config, zoneId, true)
    console.log('Always Use HTTPS ativado')
    
    return {
      success: true,
      message: 'SSL configurado automaticamente',
      settings: {
        universalSSL: true,
        sslMode: 'full',
        alwaysUseHTTPS: true
      }
    }
  } catch (error: any) {
    console.error('Erro ao configurar SSL automático:', error)
    throw new Error(`Falha na configuração SSL automática: ${error.message}`)
  }
}