// Configuração centralizada dos gateways de pagamento

export interface GatewayConfig {
  id: string
  name: string
  description: string
  icon: {
    gradient: string
    color: string
  }
  features: string[]
  credentials: {
    [key: string]: {
      label: string
      type: 'text' | 'password' | 'email'
      required: boolean
      placeholder: string
    }
  }
  settings: {
    [key: string]: {
      label: string
      type: 'boolean' | 'select'
      options?: { value: string; label: string }[]
      defaultValue: any
    }
  }
  paymentMethods: {
    [key: string]: {
      label: string
      defaultEnabled: boolean
    }
  }
  documentation: {
    helpText: string
    linkText: string
    linkUrl?: string
  }
}

export const gatewayConfigs: Record<string, GatewayConfig> = {
  brazapay: {
    id: 'brazapay',
    name: 'Braza Pay',
    description: 'Gateway de pagamento brasileiro',
    icon: {
      gradient: 'from-blue-500 to-purple-600',
      color: 'bg-pink-500 hover:bg-pink-600'
    },
    features: [
      'Pagamentos via PIX, Cartão e Boleto',
      'Taxas competitivas',
      'Integração simplificada',
      'Suporte 24/7'
    ],
    credentials: {
      chaveSecreta: {
        label: 'Chave Secreta',
        type: 'password',
        required: true,
        placeholder: 'Digite sua chave secreta'
      }
    },
    settings: {
      status: {
        label: 'Status',
        type: 'boolean',
        defaultValue: true
      }
    },
    paymentMethods: {
      ativarCartaoCredito: {
        label: 'Ativar cartão de crédito',
        defaultEnabled: true
      },
      ativarPix: {
        label: 'Ativar pix',
        defaultEnabled: true
      },
      utilizarTaxaJurosCustomizada: {
        label: 'Utilizar taxa de juros customizada',
        defaultEnabled: false
      }
    },
    documentation: {
      helpText: 'Está com dúvidas?',
      linkText: 'Como integrar a gateway Braza Pay?'
    }
  },
  freepay: {
    id: 'freepay',
    name: 'FreePay',
    description: 'Gateway de pagamento moderno',
    icon: {
      gradient: 'from-green-500 to-emerald-600',
      color: 'bg-green-500 hover:bg-green-600'
    },
    features: [
      'Pagamentos via PIX, Cartão e Boleto',
      'API moderna e flexível',
      'Sandbox para testes',
      'Documentação completa'
    ],
    credentials: {
      apiKey: {
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'Digite sua API Key'
      },
      merchantId: {
        label: 'Merchant ID',
        type: 'text',
        required: true,
        placeholder: 'Digite seu Merchant ID'
      }
    },
    settings: {
      ambiente: {
        label: 'Ambiente',
        type: 'select',
        options: [
          { value: 'sandbox', label: 'Sandbox' },
          { value: 'production', label: 'Produção' }
        ],
        defaultValue: 'sandbox'
      },
      status: {
        label: 'Status',
        type: 'boolean',
        defaultValue: true
      }
    },
    paymentMethods: {
      ativarCartaoCredito: {
        label: 'Ativar cartão de crédito',
        defaultEnabled: true
      },
      ativarPix: {
        label: 'Ativar PIX',
        defaultEnabled: true
      },
      ativarBoleto: {
        label: 'Ativar boleto',
        defaultEnabled: true
      }
    },
    documentation: {
      helpText: 'Precisa de ajuda?',
      linkText: 'Consulte a documentação do FreePay para integração.'
    }
  }
}

// Função para obter configuração de um gateway específico
export function getGatewayConfig(gatewayId: string): GatewayConfig | undefined {
  return gatewayConfigs[gatewayId]
}

// Função para obter todos os gateways disponíveis
export function getAllGateways(): GatewayConfig[] {
  return Object.values(gatewayConfigs)
}

// Função para verificar se um gateway está disponível
export function isGatewayAvailable(gatewayId: string): boolean {
  return gatewayId in gatewayConfigs
}