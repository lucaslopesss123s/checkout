"use client"

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import Image from 'next/image'

interface FreteOption {
  id: number
  nome: string
  preco: number
  prazo_minimo: number | null
  prazo_maximo: number | null
  frete_gratis_valor_minimo: number | null
  frete_gratis_ativo: boolean
  ativo: boolean
}

interface ProdutoCheckout {
  id: string
  titulo: string
  preco: number
  quantidade: number
  imagem?: string
  variante?: string
  shopify_produto_id: string
  shopify_variante_id: string
  produto_encontrado: boolean
}

interface CheckoutSession {
  id: string
  loja_id: string
  produtos: ProdutoCheckout[]
  total: number
  customer?: {
    email?: string
    first_name?: string
    last_name?: string
  }
  currency: string
  origem: string
  shop_domain: string
  created_at: string
}

interface FormData {
  email: string
  firstName: string
  lastName: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  paymentMethod: string
}

function ShopifyCheckoutContent() {
  const searchParams = useSearchParams()
  const [session, setSession] = useState<CheckoutSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  
  // Estados para o formulário
  const [clienteData, setClienteData] = useState({
    email: '',
    telefone: '',
    nomeCompleto: '',
    cpfCnpj: ''
  })
  
  const [enderecoData, setEnderecoData] = useState({
    cep: '',
    cidade: '',
    estado: '',
    pais: 'Brasil',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: ''
  })
  
  const [pagamentoData, setPagamentoData] = useState({
    tipo: 'cartao',
    numeroCartao: '',
    nomeCartao: '',
    validadeCartao: '',
    cvvCartao: ''
  })

  const [formData, setFormData] = useState<FormData>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    paymentMethod: ''
  })

  // Estado para controlar o salvamento automático
  const [carrinhoId, setCarrinhoId] = useState<string | null>(null)
  
  // Estados para frete
  const [freteOptions, setFreteOptions] = useState<FreteOption[]>([])
  const [selectedFrete, setSelectedFrete] = useState<FreteOption | null>(null)
  const [freteLoading, setFreteLoading] = useState(false)

  useEffect(() => {
    const sessionData = searchParams.get('session')
    
    if (!sessionData) {
      setError('Sessão de checkout não encontrada')
      setLoading(false)
      return
    }

    try {
      const decodedSession = JSON.parse(Buffer.from(sessionData, 'base64').toString())
      setSession(decodedSession)
      
      // Preencher dados do cliente se disponível
      if (decodedSession.customer) {
        setClienteData(prev => ({
          ...prev,
          email: decodedSession.customer.email || '',
          nomeCompleto: `${decodedSession.customer.first_name || ''} ${decodedSession.customer.last_name || ''}`.trim()
        }))
      }
      
      // Buscar opções de frete
      if (decodedSession.loja_id) {
        fetchFreteOptions(decodedSession.loja_id)
      }
      
    } catch (err) {
      setError('Erro ao decodificar sessão de checkout')
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  // Função para buscar opções de frete
  const fetchFreteOptions = async (lojaId: string) => {
    setFreteLoading(true)
    try {
      const response = await fetch(`/api/frete?id_loja=${lojaId}`)
      if (response.ok) {
        const options = await response.json()
        setFreteOptions(options)
        // Selecionar automaticamente o primeiro frete (mais barato)
        if (options.length > 0) {
          setSelectedFrete(options[0])
        }
      }
    } catch (error) {
      console.error('Erro ao buscar opções de frete:', error)
    } finally {
      setFreteLoading(false)
    }
  }

  // Funções auxiliares para frete
  const isFreteGratis = (frete: FreteOption, totalPedido: number): boolean => {
    return frete.frete_gratis_ativo && 
           frete.frete_gratis_valor_minimo !== null && 
           totalPedido >= frete.frete_gratis_valor_minimo
  }

  const getFreteValue = (frete: FreteOption, totalPedido: number): number => {
    return isFreteGratis(frete, totalPedido) ? 0 : frete.preco
  }

  const formatPrazoEntrega = (frete: FreteOption): string => {
    if (frete.prazo_minimo && frete.prazo_maximo) {
      if (frete.prazo_minimo === frete.prazo_maximo) {
        return `${frete.prazo_minimo} dia${frete.prazo_minimo > 1 ? 's' : ''}`
      }
      return `${frete.prazo_minimo} a ${frete.prazo_maximo} dias`
    }
    if (frete.prazo_minimo) {
      return `${frete.prazo_minimo} dia${frete.prazo_minimo > 1 ? 's' : ''}`
    }
    if (frete.prazo_maximo) {
      return `até ${frete.prazo_maximo} dias`
    }
    return 'Prazo não informado'
  }

  // Função para salvar dados no carrinho automaticamente
  const salvarCarrinhoAutomatico = async () => {
    if (!session) return

    try {
      const carrinhoData = {
        id_loja: session.loja_id,
        session_id: session.id,
        nome: clienteData.nomeCompleto || null,
        email: clienteData.email || null,
        telefone: clienteData.telefone || null,
        cpf: clienteData.cpfCnpj || null,
        cep: enderecoData.cep || null,
        endereco: enderecoData.endereco || null,
        numero: enderecoData.numero || null,
        complemento: enderecoData.complemento || null,
        bairro: enderecoData.bairro || null,
        cidade: enderecoData.cidade || null,
        estado: enderecoData.estado || null,
        itens: session.produtos || [],
        valor_total: session.total || null,
        metodo_pagamento: pagamentoData.tipo || null,
        ip_cliente: null,
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
        primeira_etapa_completada: !!(clienteData.email || clienteData.telefone)
      }

      const response = await fetch('/api/carrinho', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(carrinhoData)
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.carrinho?.id) {
          setCarrinhoId(result.carrinho.id)
        }
      }
    } catch (error) {
      console.error('Erro ao salvar carrinho automaticamente:', error)
    }
  }

  // Salvar automaticamente quando dados importantes mudarem
  useEffect(() => {
    if (session && (clienteData.email || clienteData.telefone || clienteData.nomeCompleto)) {
      const timeoutId = setTimeout(() => {
        salvarCarrinhoAutomatico()
      }, 1000) // Debounce de 1 segundo

      return () => clearTimeout(timeoutId)
    }
  }, [clienteData.email, clienteData.telefone, clienteData.nomeCompleto, enderecoData, pagamentoData.tipo, session])

  // Salvar quando o usuário sair da página
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (session && (clienteData.email || clienteData.telefone)) {
        // Usar sendBeacon para garantir que a requisição seja enviada
        const carrinhoData = {
          id_loja: session.loja_id,
          session_id: session.id,
          nome: clienteData.nomeCompleto || null,
          email: clienteData.email || null,
          telefone: clienteData.telefone || null,
          cpf: clienteData.cpfCnpj || null,
          cep: enderecoData.cep || null,
          endereco: enderecoData.endereco || null,
          numero: enderecoData.numero || null,
          complemento: enderecoData.complemento || null,
          bairro: enderecoData.bairro || null,
          cidade: enderecoData.cidade || null,
          estado: enderecoData.estado || null,
          itens: session.produtos || [],
          valor_total: session.total || null,
          metodo_pagamento: pagamentoData.tipo || null,
          primeira_etapa_completada: true
        }

        navigator.sendBeacon('/api/carrinho', JSON.stringify(carrinhoData))
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleBeforeUnload()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [session, clienteData, enderecoData, pagamentoData.tipo])

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: session?.currency || 'BRL'
    }).format(value)
  }

  const handleCepChange = async (cep: string) => {
    setEnderecoData(prev => ({ ...prev, cep }))
    
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await response.json()
        
        if (!data.erro) {
          setEnderecoData(prev => ({
            ...prev,
            cidade: data.localidade,
            estado: data.uf,
            endereco: data.logradouro,
            bairro: data.bairro
          }))
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error)
      }
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)

    try {
      // Aqui você implementaria a lógica de processamento do pedido
      // Por exemplo, integração com gateway de pagamento
      
      const orderData = {
        session_id: session?.id,
        customer_data: { clienteData, enderecoData, pagamentoData },
        produtos: session?.produtos,
        total: session?.total,
        origem: 'shopify',
        shop_domain: session?.shop_domain
      }

      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      alert('Pedido processado com sucesso!')
      
    } catch (error) {
      console.error('Erro ao processar pedido:', error)
      alert('Erro ao processar pedido. Tente novamente.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando checkout...</p>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-red-600 mb-4">Erro no Checkout</h2>
            <p className="text-gray-600 mb-4">{error || 'Sessão inválida'}</p>
            <Button asChild className="w-full">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Início
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <div className="text-2xl font-bold text-gray-800">Checkout</div>
          </div>
        </div>
      </header>
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header Info */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-2xl font-bold">Checkout Personalizado</h1>
                <p className="text-gray-600">Origem: {session.shop_domain}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário de Checkout */}
          <div className="space-y-6">
            {/* Identificação */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Identificação</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={clienteData.email}
                      onChange={(e) => setClienteData({...clienteData, email: e.target.value})}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefone">Telefone *</Label>
                    <Input
                      id="telefone"
                      type="tel"
                      value={clienteData.telefone}
                      onChange={(e) => setClienteData({...clienteData, telefone: e.target.value})}
                      placeholder="(11) 99999-9999"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="nomeCompleto">Nome completo *</Label>
                    <Input
                      id="nomeCompleto"
                      value={clienteData.nomeCompleto}
                      onChange={(e) => setClienteData({...clienteData, nomeCompleto: e.target.value})}
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpfCnpj">CPF/CNPJ *</Label>
                    <Input
                      id="cpfCnpj"
                      value={clienteData.cpfCnpj}
                      onChange={(e) => setClienteData({...clienteData, cpfCnpj: e.target.value})}
                      placeholder="000.000.000-00"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Endereço de Entrega */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Endereço de Entrega</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cep">CEP *</Label>
                      <Input
                        id="cep"
                        value={enderecoData.cep}
                        onChange={(e) => handleCepChange(e.target.value)}
                        placeholder="00000-000"
                        maxLength={8}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cidade">Cidade *</Label>
                      <Input
                        id="cidade"
                        value={enderecoData.cidade}
                        onChange={(e) => setEnderecoData({...enderecoData, cidade: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="estado">Estado *</Label>
                      <Input
                        id="estado"
                        value={enderecoData.estado}
                        onChange={(e) => setEnderecoData({...enderecoData, estado: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="pais">País *</Label>
                      <Input
                        id="pais"
                        value={enderecoData.pais}
                        onChange={(e) => setEnderecoData({...enderecoData, pais: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="endereco">Endereço *</Label>
                    <Input
                      id="endereco"
                      value={enderecoData.endereco}
                      onChange={(e) => setEnderecoData({...enderecoData, endereco: e.target.value})}
                      placeholder="Rua, Avenida, etc."
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="numero">Número *</Label>
                      <Input
                        id="numero"
                        value={enderecoData.numero}
                        onChange={(e) => setEnderecoData({...enderecoData, numero: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="complemento">Complemento</Label>
                      <Input
                        id="complemento"
                        value={enderecoData.complemento}
                        onChange={(e) => setEnderecoData({...enderecoData, complemento: e.target.value})}
                        placeholder="Apto, Bloco, etc."
                      />
                    </div>
                    <div>
                      <Label htmlFor="bairro">Bairro *</Label>
                      <Input
                        id="bairro"
                        value={enderecoData.bairro}
                        onChange={(e) => setEnderecoData({...enderecoData, bairro: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Opções de Frete */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Opções de Frete</h2>
                {freteLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <span className="text-gray-600">Carregando opções de frete...</span>
                  </div>
                ) : freteOptions.length > 0 ? (
                  <div className="space-y-3">
                    {freteOptions.map((frete) => (
                      <div
                        key={frete.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedFrete?.id === frete.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedFrete(frete)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name="frete"
                                checked={selectedFrete?.id === frete.id}
                                onChange={() => setSelectedFrete(frete)}
                                className="text-blue-600"
                              />
                              <span className="font-medium">{frete.nome}</span>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              Prazo: {formatPrazoEntrega(frete)}
                            </div>
                            {isFreteGratis(frete, session.total) && (
                              <div className="text-xs text-green-600 mt-1">
                                Frete grátis para compras acima de {formatCurrency(frete.frete_gratis_valor_minimo || 0)}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className={`font-semibold ${
                              isFreteGratis(frete, session.total) ? 'text-green-600' : 'text-gray-900'
                            }`}>
                              {isFreteGratis(frete, session.total) ? 'Grátis' : formatCurrency(frete.preco)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-600">
                    Nenhuma opção de frete disponível
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pagamento */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Forma de Pagamento</h2>
                <div className="space-y-4">
                  <Select value={pagamentoData.tipo} onValueChange={(value) => setPagamentoData({...pagamentoData, tipo: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="boleto">Boleto Bancário</SelectItem>
                    </SelectContent>
                  </Select>

                  {pagamentoData.tipo === 'cartao' && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="numeroCartao">Número do Cartão *</Label>
                        <Input
                          id="numeroCartao"
                          value={pagamentoData.numeroCartao}
                          onChange={(e) => setPagamentoData({...pagamentoData, numeroCartao: e.target.value})}
                          placeholder="0000 0000 0000 0000"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="nomeCartao">Nome no Cartão *</Label>
                        <Input
                          id="nomeCartao"
                          value={pagamentoData.nomeCartao}
                          onChange={(e) => setPagamentoData({...pagamentoData, nomeCartao: e.target.value})}
                          placeholder="Nome como está no cartão"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="validadeCartao">Validade *</Label>
                          <Input
                            id="validadeCartao"
                            value={pagamentoData.validadeCartao}
                            onChange={(e) => setPagamentoData({...pagamentoData, validadeCartao: e.target.value})}
                            placeholder="MM/AA"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvvCartao">CVV *</Label>
                          <Input
                            id="cvvCartao"
                            value={pagamentoData.cvvCartao}
                            onChange={(e) => setPagamentoData({...pagamentoData, cvvCartao: e.target.value})}
                            placeholder="000"
                            maxLength={4}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {pagamentoData.tipo === 'pix' && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Após confirmar o pedido, você receberá o código PIX para pagamento.
                      </p>
                    </div>
                  )}

                  {pagamentoData.tipo === 'boleto' && (
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        O boleto será gerado após a confirmação do pedido. Prazo de vencimento: 3 dias úteis.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Botão de Finalizar */}
            <Button 
              onClick={handleSubmit}
              className="w-full" 
              size="lg"
              disabled={processing}
            >
              {processing ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processando...
                </div>
              ) : (
                `Finalizar Compra - ${formatCurrency(session.total)}`
              )}
            </Button>
          </div>

          {/* Resumo do Pedido */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Resumo do Pedido</h2>
                <div className="space-y-4">
                  {session.produtos.map((produto, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      {produto.imagem && (
                        <div className="relative w-16 h-16 flex-shrink-0">
                          <Image
                            src={produto.imagem}
                            alt={produto.titulo}
                            fill
                            className="object-cover rounded-md"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm">{produto.titulo}</h3>
                        {produto.variante && (
                          <p className="text-xs text-gray-500">{produto.variante}</p>
                        )}
                        <p className="text-xs text-gray-500">Qtd: {produto.quantidade}</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(produto.preco * produto.quantidade)}
                        </p>
                        {!produto.produto_encontrado && (
                          <span className="text-xs text-orange-600">Produto não sincronizado</span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(session.total)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Frete:</span>
                      {freteLoading ? (
                        <span className="font-medium">Carregando...</span>
                      ) : selectedFrete ? (
                        <div className="text-right">
                          <div className="font-medium">
                            {selectedFrete.nome} - {formatPrazoEntrega(selectedFrete)}
                          </div>
                          <div className={`text-sm ${isFreteGratis(selectedFrete, session.total) ? 'text-green-600' : 'text-gray-600'}`}>
                            {isFreteGratis(selectedFrete, session.total) ? 'Grátis' : formatCurrency(selectedFrete.preco)}
                          </div>
                        </div>
                      ) : (
                        <span className="font-medium text-gray-500">Não disponível</span>
                      )}
                    </div>
                    <div className="border-t pt-2 flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-blue-600">
                        {formatCurrency(session.total + (selectedFrete ? getFreteValue(selectedFrete, session.total) : 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Informações de Segurança */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span>Pagamento 100% seguro</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">🚚</span>
                </div>
                <span>Entrega rápida e segura</span>
              </div>
            </div>
          </div>
        </div>
         
         {/* Rodapé */}
         <footer className="mt-12 pt-8 border-t border-gray-200">
           <div className="text-center space-y-4">
             <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
               <div className="flex items-center space-x-2">
                 <div className="w-8 h-6 bg-blue-600 rounded flex items-center justify-center">
                   <span className="text-white text-xs font-bold">VISA</span>
                 </div>
                 <div className="w-8 h-6 bg-red-600 rounded flex items-center justify-center">
                   <span className="text-white text-xs font-bold">MC</span>
                 </div>
                 <div className="w-8 h-6 bg-orange-500 rounded flex items-center justify-center">
                   <span className="text-white text-xs font-bold">ELO</span>
                 </div>
                 <div className="w-8 h-6 bg-green-600 rounded flex items-center justify-center">
                   <span className="text-white text-xs font-bold">PIX</span>
                 </div>
               </div>
             </div>
             <p className="text-xs text-gray-400">
               © 2024 Checkout Personalizado. Todos os direitos reservados.
             </p>
           </div>
         </footer>
       </div>
     </div>
   )
 }

export default function ShopifyCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando checkout...</p>
        </div>
      </div>
    }>
      <ShopifyCheckoutContent />
    </Suspense>
  )
}