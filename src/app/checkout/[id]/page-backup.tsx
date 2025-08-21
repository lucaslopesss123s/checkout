'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Shield, Lock, CreditCard, Truck, MapPin, User, Phone, Mail } from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  quantity: number
  image: string
}

interface Address {
  cep: string
  street: string
  neighborhood: string
  city: string
  state: string
  complement?: string
  number?: string
}

interface CustomerData {
  email: string
  phone: string
  name: string
  cpf: string
  cep: string
}

export default function CheckoutPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [currentStep, setCurrentStep] = useState(1)
  const [customerData, setCustomerData] = useState<CustomerData>({
    email: '',
    phone: '',
    name: '',
    cpf: '',
    cep: ''
  })
  const [address, setAddress] = useState<Address>({
    cep: '',
    street: '',
    neighborhood: '',
    city: '',
    state: '',
    complement: '',
    number: ''
  })
  const [cepLoading, setCepLoading] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState('pix')
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
    installments: '1'
  })

  // Mock product data
  const product: Product = {
    id: id,
    name: 'Produto de Exemplo',
    price: 99.90,
    quantity: 1,
    image: '/placeholder.jpg'
  }

  const validateCep = async (cep: string) => {
    if (cep.length === 9) {
      setCepLoading(true)
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep.replace('-', '')}/json/`)
        const data = await response.json()
        
        if (!data.erro) {
          setAddress({
            cep: cep,
            street: data.logradouro || '',
            neighborhood: data.bairro || '',
            city: data.localidade || '',
            state: data.uf || '',
            complement: address.complement || '',
            number: address.number || ''
          })
        }
      } catch (error) {
        console.error('Erro ao validar CEP:', error)
      } finally {
        setCepLoading(false)
      }
    }
  }

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2')
  }

  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  const canProceedToStep2 = customerData.email && customerData.phone && customerData.name && customerData.cpf && customerData.cep && customerData.cep.length === 9 && address.street && address.number

  const canProceedToStep3 = address.street && address.number

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header azul dos Correios */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-400 rounded flex items-center justify-center">
                <span className="text-blue-600 text-lg font-bold">C</span>
              </div>
              <span className="text-xl font-bold">Correios</span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-sm font-medium">PAGAMENTO 100% SEGURO</span>
            </div>
          </div>
        </div>
      </div>

      {/* Banner de confirmação */}
      <div className="bg-green-50 border-l-4 border-green-400 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                Preencha seus dados para finalizar a compra
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Container principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Coluna do formulário */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Card de Identificação */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Identificação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerData.email}
                        onChange={(e) => setCustomerData({...customerData, email: e.target.value})}
                        placeholder="seu@email.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={customerData.phone}
                        onChange={(e) => {
                          const formatted = formatPhone(e.target.value)
                          if (formatted.length <= 15) {
                            setCustomerData({...customerData, phone: formatted})
                          }
                        }}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">Nome completo</Label>
                      <Input
                        id="name"
                        value={customerData.name}
                        onChange={(e) => setCustomerData({...customerData, name: e.target.value})}
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        value={customerData.cpf}
                        onChange={(e) => {
                          const formatted = formatCpf(e.target.value)
                          if (formatted.length <= 14) {
                            setCustomerData({...customerData, cpf: formatted})
                          }
                        }}
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card de Entrega */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cep">CEP</Label>
                      <Input
                        id="cep"
                        value={customerData.cep}
                        onChange={(e) => {
                          const formatted = formatCep(e.target.value)
                          if (formatted.length <= 9) {
                            setCustomerData({...customerData, cep: formatted})
                            validateCep(formatted)
                          }
                        }}
                        placeholder="00000-000"
                        disabled={cepLoading}
                      />
                      {cepLoading && <p className="text-sm text-gray-500 mt-1">Buscando endereço...</p>}
                    </div>

                    {address.street && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <Label htmlFor="street">Endereço</Label>
                          <Input
                            id="street"
                            value={address.street}
                            onChange={(e) => setAddress({...address, street: e.target.value})}
                            placeholder="Rua, Avenida..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="number">Número</Label>
                          <Input
                            id="number"
                            value={address.number}
                            onChange={(e) => setAddress({...address, number: e.target.value})}
                            placeholder="123"
                          />
                        </div>
                        <div>
                          <Label htmlFor="complement">Complemento</Label>
                          <Input
                            id="complement"
                            value={address.complement}
                            onChange={(e) => setAddress({...address, complement: e.target.value})}
                            placeholder="Apto, Bloco..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="neighborhood">Bairro</Label>
                          <Input
                            id="neighborhood"
                            value={address.neighborhood}
                            onChange={(e) => setAddress({...address, neighborhood: e.target.value})}
                            placeholder="Bairro"
                          />
                        </div>
                        <div>
                          <Label htmlFor="city">Cidade</Label>
                          <Input
                            id="city"
                            value={address.city}
                            onChange={(e) => setAddress({...address, city: e.target.value})}
                            placeholder="Cidade"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Card de Frete */}
              {address.street && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="w-5 h-5" />
                      Frete
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                      <div className="flex items-center gap-3">
                        <input type="radio" checked readOnly className="text-green-600" />
                        <div>
                          <p className="font-medium text-green-700">Frete grátis</p>
                          <p className="text-sm text-green-600">Entrega em até 7 dias úteis</p>
                        </div>
                      </div>
                      <span className="font-bold text-green-700">Grátis</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Card de Pagamento */}
              {address.street && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Opções de pagamento */}
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setSelectedPayment('pix')}
                          className={`p-4 border rounded-lg text-center transition-colors ${
                            selectedPayment === 'pix' 
                              ? 'border-blue-500 bg-blue-50 text-blue-700' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium">PIX</div>
                          <div className="text-sm text-gray-600">Aprovação imediata</div>
                        </button>
                        <button
                          onClick={() => setSelectedPayment('card')}
                          className={`p-4 border rounded-lg text-center transition-colors ${
                            selectedPayment === 'card' 
                              ? 'border-blue-500 bg-blue-50 text-blue-700' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium">Cartão de Crédito</div>
                          <div className="text-sm text-gray-600">Parcelamento disponível</div>
                        </button>
                      </div>

                      {/* Formulário do cartão */}
                      {selectedPayment === 'card' && (
                        <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <Label htmlFor="card-number">Número do cartão</Label>
                              <Input
                                id="card-number"
                                value={cardData.number}
                                onChange={(e) => setCardData({...cardData, number: e.target.value})}
                                placeholder="0000 0000 0000 0000"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label htmlFor="card-name">Nome no cartão</Label>
                              <Input
                                id="card-name"
                                value={cardData.name}
                                onChange={(e) => setCardData({...cardData, name: e.target.value})}
                                placeholder="Nome como está no cartão"
                              />
                            </div>
                            <div>
                              <Label htmlFor="card-expiry">Validade</Label>
                              <Input
                                id="card-expiry"
                                value={cardData.expiry}
                                onChange={(e) => setCardData({...cardData, expiry: e.target.value})}
                                placeholder="MM/AA"
                              />
                            </div>
                            <div>
                              <Label htmlFor="card-cvv">CVV</Label>
                              <Input
                                id="card-cvv"
                                value={cardData.cvv}
                                onChange={(e) => setCardData({...cardData, cvv: e.target.value})}
                                placeholder="123"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Botão finalizar compra */}
                      <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-3">
                        FINALIZAR COMPRA
                      </Button>

                      {/* Ícones de segurança */}
                      <div className="flex justify-center items-center gap-4 pt-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Lock className="w-4 h-4" />
                          <span>Pagamento seguro</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sidebar - Resumo do pedido (apenas desktop) */}
          <div className="hidden lg:block">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Seu pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Produto */}
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-xs text-gray-500">IMG</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium line-clamp-2">{product.name}</h4>
                      <p className="text-sm text-gray-600">Qtd: {product.quantity}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Resumo de valores */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>R$ {product.price.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Frete</span>
                      <span className="text-green-600">Grátis</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>R$ {product.price.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>

                  {/* Informações de segurança */}
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <Shield className="w-4 h-4" />
                      <span className="text-sm font-medium">Compra 100% segura</span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      Seus dados estão protegidos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}