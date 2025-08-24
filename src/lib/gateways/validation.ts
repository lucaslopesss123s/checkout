// Utilitários de validação para gateways de pagamento

import { BrazaPayCredentials, FreePayCredentials } from './types'

// Interface para resultado de validação
export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

// Validação para BrazaPay
export function validateBrazaPayCredentials(credentials: Partial<BrazaPayCredentials>): ValidationResult {
  const errors: string[] = []

  // Validar chave secreta
  if (!credentials.chaveSecreta || credentials.chaveSecreta.trim().length === 0) {
    errors.push('Chave secreta é obrigatória')
  } else if (credentials.chaveSecreta.length < 10) {
    errors.push('Chave secreta deve ter pelo menos 10 caracteres')
  }

  // Validar se pelo menos um método de pagamento está ativo
  if (!credentials.ativarCartaoCredito && !credentials.ativarPix) {
    errors.push('Pelo menos um método de pagamento deve estar ativo')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Validação para FreePay
export function validateFreePayCredentials(credentials: Partial<FreePayCredentials>): ValidationResult {
  const errors: string[] = []

  // Validar API Key
  if (!credentials.apiKey || credentials.apiKey.trim().length === 0) {
    errors.push('API Key é obrigatória')
  } else if (credentials.apiKey.length < 20) {
    errors.push('API Key deve ter pelo menos 20 caracteres')
  }

  // Validar Merchant ID
  if (!credentials.merchantId || credentials.merchantId.trim().length === 0) {
    errors.push('Merchant ID é obrigatório')
  } else if (!/^[a-zA-Z0-9_-]+$/.test(credentials.merchantId)) {
    errors.push('Merchant ID deve conter apenas letras, números, hífens e underscores')
  }

  // Validar ambiente
  if (credentials.ambiente && !['sandbox', 'production'].includes(credentials.ambiente)) {
    errors.push('Ambiente deve ser "sandbox" ou "production"')
  }

  // Validar se pelo menos um método de pagamento está ativo
  if (!credentials.ativarCartaoCredito && !credentials.ativarPix && !credentials.ativarBoleto) {
    errors.push('Pelo menos um método de pagamento deve estar ativo')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Função genérica de validação baseada no tipo de gateway
export function validateGatewayCredentials(gatewayId: string, credentials: any): ValidationResult {
  switch (gatewayId) {
    case 'brazapay':
      return validateBrazaPayCredentials(credentials as Partial<BrazaPayCredentials>)
    case 'freepay':
      return validateFreePayCredentials(credentials as Partial<FreePayCredentials>)
    default:
      return {
        isValid: false,
        errors: [`Gateway "${gatewayId}" não é suportado`]
      }
  }
}

// Função para sanitizar credenciais (remover espaços, etc.)
export function sanitizeCredentials(credentials: any): any {
  const sanitized = { ...credentials }
  
  // Remover espaços em branco de strings
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitized[key].trim()
    }
  })
  
  return sanitized
}

// Função para mascarar credenciais sensíveis para logs
export function maskSensitiveData(credentials: any): any {
  const masked = { ...credentials }
  
  // Mascarar campos sensíveis
  const sensitiveFields = ['chaveSecreta', 'apiKey', 'password', 'secret']
  
  sensitiveFields.forEach(field => {
    if (masked[field] && typeof masked[field] === 'string') {
      const value = masked[field]
      if (value.length > 8) {
        masked[field] = value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4)
      } else {
        masked[field] = '*'.repeat(value.length)
      }
    }
  })
  
  return masked
}