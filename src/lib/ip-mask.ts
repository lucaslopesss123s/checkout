/**
 * Função para mascarar IPs sensíveis na interface do usuário
 * Substitui o IP do servidor por um nome amigável para não expor informações sensíveis
 */

const SENSITIVE_IPS = {
  '181.41.200.99': 'Jcheckout Servidor'
}

/**
 * Mascara IPs sensíveis em uma string
 * @param content - Conteúdo que pode conter IPs
 * @returns Conteúdo com IPs mascarados
 */
export function maskSensitiveIPs(content: string): string {
  if (!content) return content
  
  let maskedContent = content
  
  // Substituir cada IP sensível pelo seu nome amigável
  Object.entries(SENSITIVE_IPS).forEach(([ip, friendlyName]) => {
    // Usar regex para encontrar o IP exato (evitar substituições parciais)
    const ipRegex = new RegExp(`\\b${ip.replace(/\./g, '\\.')}\\b`, 'g')
    maskedContent = maskedContent.replace(ipRegex, friendlyName)
  })
  
  return maskedContent
}

/**
 * Verifica se uma string contém IPs sensíveis
 * @param content - Conteúdo para verificar
 * @returns true se contém IPs sensíveis
 */
export function containsSensitiveIPs(content: string): boolean {
  if (!content) return false
  
  return Object.keys(SENSITIVE_IPS).some(ip => {
    const ipRegex = new RegExp(`\\b${ip.replace(/\./g, '\\.')}\\b`)
    return ipRegex.test(content)
  })
}

/**
 * Mascara IPs em objetos complexos (recursivamente)
 * @param obj - Objeto que pode conter IPs em suas propriedades
 * @returns Objeto com IPs mascarados
 */
export function maskSensitiveIPsInObject(obj: any): any {
  if (typeof obj === 'string') {
    return maskSensitiveIPs(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => maskSensitiveIPsInObject(item))
  }
  
  if (obj && typeof obj === 'object') {
    const maskedObj: any = {}
    Object.keys(obj).forEach(key => {
      maskedObj[key] = maskSensitiveIPsInObject(obj[key])
    })
    return maskedObj
  }
  
  return obj
}