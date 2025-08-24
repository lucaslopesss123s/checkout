// Tipos TypeScript para os gateways de pagamento

// Credenciais específicas do BrazaPay
export interface BrazaPayCredentials {
  chaveSecreta: string
  status: boolean
  ativarCartaoCredito: boolean
  ativarPix: boolean
  utilizarTaxaJurosCustomizada: boolean
}

// Credenciais específicas do FreePay
export interface FreePayCredentials {
  apiKey: string
  merchantId: string
  status: boolean
  ativarCartaoCredito: boolean
  ativarPix: boolean
  ativarBoleto: boolean
  ambiente: 'sandbox' | 'production'
}

// União de todos os tipos de credenciais
export type GatewayCredentials = BrazaPayCredentials | FreePayCredentials

// Interface base para um gateway
export interface Gateway {
  id: string
  name: string
  enabled: boolean
  credentials: GatewayCredentials
  createdAt: Date
  updatedAt: Date
}

// Tipos para métodos de pagamento
export type PaymentMethod = 'credit_card' | 'debit_card' | 'pix' | 'boleto'

// Interface para configuração de pagamento
export interface PaymentConfig {
  gatewayId: string
  method: PaymentMethod
  amount: number
  currency: string
  metadata?: Record<string, any>
}

// Interface para resposta de pagamento
export interface PaymentResponse {
  success: boolean
  transactionId?: string
  paymentUrl?: string
  qrCode?: string
  boletoUrl?: string
  error?: string
  metadata?: Record<string, any>
}

// Interface para webhook de pagamento
export interface PaymentWebhook {
  gatewayId: string
  transactionId: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  amount: number
  currency: string
  paidAt?: Date
  metadata?: Record<string, any>
}

// Enum para status de transação
export enum TransactionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

// Interface para logs de transação
export interface TransactionLog {
  id: string
  gatewayId: string
  transactionId: string
  status: TransactionStatus
  amount: number
  currency: string
  method: PaymentMethod
  createdAt: Date
  updatedAt: Date
  metadata?: Record<string, any>
}