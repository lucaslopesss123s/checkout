// Biblioteca para registrar eventos de marketing

interface CarrinhoAbandonadoData {
  session_id: string
  email_cliente?: string
  nome_cliente?: string
  itens_carrinho: Array<{
    produto_id: string
    nome: string
    preco: number
    quantidade: number
  }>
  valor_total: number
  link_checkout: string
}

interface EventoMarketing {
  evento: string
  id_loja: string
  session_id: string
  email_cliente?: string
  nome_cliente?: string
  itens_carrinho?: any[]
  valor_total?: number
  link_checkout?: string
}

// Função para registrar evento de carrinho abandonado
export async function registrarCarrinhoAbandonado(
  id_loja: string,
  dados: CarrinhoAbandonadoData
): Promise<boolean> {
  try {
    const evento: EventoMarketing = {
      evento: 'abandono_carrinho',
      id_loja,
      session_id: dados.session_id,
      email_cliente: dados.email_cliente,
      nome_cliente: dados.nome_cliente,
      itens_carrinho: dados.itens_carrinho,
      valor_total: dados.valor_total,
      link_checkout: dados.link_checkout
    }

    const response = await fetch('/api/marketing/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(evento)
    })

    if (!response.ok) {
      console.error('Erro ao registrar evento de carrinho abandonado:', await response.text())
      return false
    }

    const result = await response.json()
    console.log('Evento de carrinho abandonado registrado:', result)
    return true

  } catch (error) {
    console.error('Erro ao registrar evento de carrinho abandonado:', error)
    return false
  }
}

// Função para cancelar evento de carrinho abandonado (quando compra é finalizada)
export async function cancelarCarrinhoAbandonado(
  session_id: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/marketing/events/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session_id,
        evento: 'abandono_carrinho'
      })
    })

    if (!response.ok) {
      console.error('Erro ao cancelar evento de carrinho abandonado:', await response.text())
      return false
    }

    return true

  } catch (error) {
    console.error('Erro ao cancelar evento de carrinho abandonado:', error)
    return false
  }
}

// Hook para detectar abandono de carrinho automaticamente
export class CarrinhoAbandonoDetector {
  private timeoutId: NodeJS.Timeout | null = null
  private readonly TEMPO_ABANDONO = 5 * 60 * 1000 // 5 minutos

  constructor(
    private id_loja: string,
    private session_id: string,
    private onAbandonoDetectado: (dados: CarrinhoAbandonadoData) => void
  ) {}

  // Iniciar detecção de abandono
  iniciarDeteccao(dados: Omit<CarrinhoAbandonadoData, 'session_id'>) {
    this.pararDeteccao()
    
    this.timeoutId = setTimeout(() => {
      this.onAbandonoDetectado({
        ...dados,
        session_id: this.session_id
      })
    }, this.TEMPO_ABANDONO)
  }

  // Parar detecção (chamado quando usuário interage com o checkout)
  pararDeteccao() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
  }

  // Reiniciar detecção (chamado quando carrinho é atualizado)
  reiniciarDeteccao(dados: Omit<CarrinhoAbandonadoData, 'session_id'>) {
    this.iniciarDeteccao(dados)
  }

  // Destruir detector
  destruir() {
    this.pararDeteccao()
  }
}

// Exemplo de uso:
/*
// No componente do checkout:
const detector = new CarrinhoAbandonoDetector(
  loja.id,
  sessionId,
  async (dados) => {
    await registrarCarrinhoAbandonado(loja.id, dados)
  }
)

// Quando carrinho é carregado/atualizado:
detector.iniciarDeteccao({
  email_cliente: 'cliente@email.com',
  nome_cliente: 'João Silva',
  itens_carrinho: [...],
  valor_total: 199.90,
  link_checkout: window.location.href
})

// Quando usuário interage (clica, digita, etc):
detector.pararDeteccao()

// Quando compra é finalizada:
await cancelarCarrinhoAbandonado(sessionId)
detector.destruir()
*/