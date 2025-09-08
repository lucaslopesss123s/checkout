'use client';

import React, { useState, use, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { useCheckoutTracking } from '@/hooks/use-checkout-tracking';

interface CheckoutPageProps {
  params: Promise<{ id: string }>;
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const { id } = use(params);
  const { startTracking, updateStep, updateCustomer, updateItems, stopTracking } = useCheckoutTracking();
  
  const [customerData, setCustomerData] = useState({
    email: '',
    telephone: '',
    name: '',
    document: '',
    noEmail: false
  });

  const [addressData, setAddressData] = useState({
    receiverName: '',
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    country: 'Brasil',
    noNumber: false
  });

  const [paymentData, setPaymentData] = useState({
    method: 'card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: ''
  });

  const [addressLoaded, setAddressLoaded] = useState(false);

  // Inicializar rastreamento quando a página carregar
  useEffect(() => {
    startTracking({
      etapa_atual: 'carrinho',
      itens: [], // Será atualizado quando os dados do produto forem carregados
      valor_total: 0
    });
    
    // Cleanup ao sair da página
    return () => {
      stopTracking();
    };
  }, []);

  const handleCustomerChange = (field: string, value: string | boolean) => {
    const updatedData = { ...customerData, [field]: value };
    setCustomerData(updatedData);
    
    // Atualizar rastreamento com dados do cliente
    updateCustomer(
      updatedData.name || undefined,
      updatedData.email || undefined,
      updatedData.telephone || undefined
    );
    
    // Se preencheu dados básicos, atualizar etapa
    if (updatedData.name && (updatedData.email || updatedData.telephone)) {
      updateStep('dados_pessoais');
    }
  };

  const handleAddressChange = (field: string, value: string | boolean) => {
    const updatedData = { ...addressData, [field]: value };
    setAddressData(updatedData);
    
    // Se preencheu endereço completo, atualizar etapa
    if (updatedData.zipCode && updatedData.street && updatedData.city) {
      updateStep('endereco');
    }
  };

  const handlePaymentChange = (field: string, value: string) => {
    const updatedData = { ...paymentData, [field]: value };
    setPaymentData(updatedData);
    
    // Se selecionou método de pagamento, atualizar etapa
    if (updatedData.method) {
      updateStep('pagamento');
    }
  };

  const handleCepChange = async (cep: string) => {
    // Remove todos os caracteres não numéricos
    const cleanCep = cep.replace(/\D/g, '');
    
    // Formata o CEP com hífen se tiver 8 dígitos
    let formattedCep = cleanCep;
    if (cleanCep.length > 5) {
      formattedCep = cleanCep.slice(0, 5) + '-' + cleanCep.slice(5, 8);
    }
    
    handleAddressChange('zipCode', formattedCep);
    
    // Faz a busca quando tiver 8 dígitos
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          handleAddressChange('street', data.logradouro || '');
          handleAddressChange('neighborhood', data.bairro || '');
          handleAddressChange('city', data.localidade || '');
          handleAddressChange('state', data.uf || '');
          setAddressLoaded(true);
        } else {
          setAddressLoaded(false);
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        setAddressLoaded(false);
      }
    } else {
      setAddressLoaded(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Dados do checkout:', { customerData, addressData, paymentData });
    
    try {
      // Preparar dados do pedido
      const pedidoData = {
        id_loja: 1, // ID da loja padrão
        nome: customerData.name,
        email: customerData.email,
        telefone: customerData.telephone,
        cep: addressData.zipCode,
        endereco: addressData.street,
        numero: addressData.number,
        complemento: addressData.complement,
        bairro: addressData.neighborhood,
        cidade: addressData.city,
        estado: addressData.state,
        itens: [
          {
            nome: '[COMBO] 6X Happy Hair + 1X Pote de Melatonina + 1X Pote de Colágeno',
            quantidade: 1,
            preco: 167.90
          }
        ],
        valor_total: 167.90,
        metodo_pagamento: paymentData.method,
        carrinho_id: id // ID do carrinho
      };

      // Criar o pedido
      const response = await fetch('/api/pedidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pedidoData)
      });

      const result = await response.json();

      if (result.success) {
        console.log('Pedido criado com sucesso:', result.pedido);
        
        // Redirecionar para página de sucesso ou mostrar mensagem
        if (paymentData.method === 'pix') {
          alert(`Pedido finalizado! Número do pedido: ${result.pedido.numero_pedido}\n\nVocê receberá o código PIX por email.`);
        } else {
          alert(`Pedido finalizado com sucesso! Número do pedido: ${result.pedido.numero_pedido}`);
        }
        
        // Aqui você pode redirecionar para uma página de confirmação
        // window.location.href = '/obrigado';
      } else {
        console.error('Erro ao criar pedido:', result.error);
        alert('Erro ao finalizar pedido. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao processar pedido:', error);
      alert('Erro ao finalizar pedido. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com logo Lucas Lopes */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <img 
              src="https://cloudfox-digital-products.s3.amazonaws.com/uploads/user/KN1nVZpmemGlM6B/public/stores/4KovG1n46dgyDEm/logo/fHWNAd9vHNPmkRBAn0EcaCZjqC7hqzBly1rqjzk5.png" 
              alt="Lucas Lopes Logo" 
              className="h-[3.2rem]"
            />
            <div>
              <img src="/assets/img/safe-payment.svg" alt="Pagamento Seguro" />
            </div>
          </div>
        </div>
      </div>

      {/* Barra azul com texto */}
      <div className="bg-blue-600 text-white">
        <div className="container mx-auto px-4 py-3 text-center">
          <span className="text-sm font-medium">Confirme seus dados abaixo.</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col-reverse lg:flex-row gap-6 justify-center">
          {/* Formulário principal */}
          <div className="lg:w-2/3 max-w-[650px]">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Seção Identificação */}
              <Card className="max-w-[650px]">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="qtde text-center bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3">
                      1
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Identificação</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@email.com"
                        value={customerData.email}
                        onChange={(e) => handleCustomerChange('email', e.target.value)}
                        className="w-full"
                      />

                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="telephone" className="text-sm font-medium text-gray-700">Telefone</Label>
                      <Input
                        id="telephone"
                        type="tel"
                        placeholder="(99) 99999-9999"
                        value={customerData.telephone}
                        onChange={(e) => handleCustomerChange('telephone', e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">Nome completo</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Nome e Sobrenome"
                        value={customerData.name}
                        onChange={(e) => handleCustomerChange('name', e.target.value)}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="document" className="text-sm font-medium text-gray-700">CPF/CNPJ</Label>
                      <Input
                        id="document"
                        type="text"
                        placeholder="123.456.789-12"
                        value={customerData.document}
                        onChange={(e) => handleCustomerChange('document', e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Seção Entrega */}
              <Card className="max-w-[650px]">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="qtde text-center bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3">
                      2
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Entrega</h3>
                  </div>
                  


                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode" className="text-sm font-medium text-blue-600">CEP</Label>
                      <Input
                        id="zipCode"
                        type="text"
                        placeholder="12345-000"
                        value={addressData.zipCode}
                        onChange={(e) => handleCepChange(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {addressLoaded && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="space-y-2">
                          <Label htmlFor="city" className="text-sm font-medium text-gray-700">Cidade</Label>
                          <Input
                            id="city"
                            type="text"
                            placeholder="Cidade"
                            value={addressData.city}
                            onChange={(e) => handleAddressChange('city', e.target.value)}
                            className="w-full"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="state" className="text-sm font-medium text-gray-700">Estado</Label>
                          <Select value={addressData.state} onValueChange={(value) => handleAddressChange('state', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AC">Acre</SelectItem>
                              <SelectItem value="AL">Alagoas</SelectItem>
                              <SelectItem value="AP">Amapá</SelectItem>
                              <SelectItem value="AM">Amazonas</SelectItem>
                              <SelectItem value="BA">Bahia</SelectItem>
                              <SelectItem value="CE">Ceará</SelectItem>
                              <SelectItem value="DF">Distrito Federal</SelectItem>
                              <SelectItem value="ES">Espírito Santo</SelectItem>
                              <SelectItem value="GO">Goiás</SelectItem>
                              <SelectItem value="MA">Maranhão</SelectItem>
                              <SelectItem value="MT">Mato Grosso</SelectItem>
                              <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                              <SelectItem value="MG">Minas Gerais</SelectItem>
                              <SelectItem value="PA">Pará</SelectItem>
                              <SelectItem value="PB">Paraíba</SelectItem>
                              <SelectItem value="PR">Paraná</SelectItem>
                              <SelectItem value="PE">Pernambuco</SelectItem>
                              <SelectItem value="PI">Piauí</SelectItem>
                              <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                              <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                              <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                              <SelectItem value="RO">Rondônia</SelectItem>
                              <SelectItem value="RR">Roraima</SelectItem>
                              <SelectItem value="SC">Santa Catarina</SelectItem>
                              <SelectItem value="SP">São Paulo</SelectItem>
                              <SelectItem value="SE">Sergipe</SelectItem>
                              <SelectItem value="TO">Tocantins</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="country" className="text-sm font-medium text-gray-700">País</Label>
                          <Input
                            id="country"
                            type="text"
                            value={addressData.country}
                            readOnly
                            className="w-full bg-gray-50"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="md:col-span-3 space-y-2">
                          <Label htmlFor="street" className="text-sm font-medium text-gray-700">Endereço</Label>
                          <Input
                            id="street"
                            type="text"
                            placeholder="Rua, Avenida, Alameda"
                            value={addressData.street}
                            onChange={(e) => handleAddressChange('street', e.target.value)}
                            className="w-full"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="neighborhood" className="text-sm font-medium text-gray-700">Bairro</Label>
                          <Input
                            id="neighborhood"
                            type="text"
                            placeholder="Centro"
                            value={addressData.neighborhood}
                            onChange={(e) => handleAddressChange('neighborhood', e.target.value)}
                            className="w-full"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row gap-4 mb-4 md:w-1/2">
                        <div className="space-y-2 w-full md:w-[30%]">
                          <Label htmlFor="number" className="text-sm font-medium text-gray-700">Número</Label>
                          <Input
                            id="number"
                            type="text"
                            placeholder="3213"
                            value={addressData.number}
                            onChange={(e) => handleAddressChange('number', e.target.value)}
                            className="w-full"
                          />
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="noNumber" 
                              checked={addressData.noNumber}
                              onCheckedChange={(checked) => handleAddressChange('noNumber', checked)}
                            />
                            <Label htmlFor="noNumber" className="text-sm text-gray-600">S/N</Label>
                          </div>
                        </div>
                        
                        <div className="space-y-2 w-full md:w-[70%]">
                          <Label htmlFor="complement" className="text-sm font-medium text-gray-700">Complemento</Label>
                          <Input
                            id="complement"
                            type="text"
                            placeholder="Apartamento, unidade, prédio, andar, etc."
                            value={addressData.complement}
                            onChange={(e) => handleAddressChange('complement', e.target.value)}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </>
                  )}



                  {/* Seção de Frete */}
                  {addressLoaded && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-gray-700 mb-3">Escolha o melhor frete para você</p>
                      <div className="space-y-2">
                        <div className="border border-blue-300 rounded-lg p-4 bg-blue-50 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <input 
                                type="radio" 
                                id="frete-gratis" 
                                name="shipping" 
                                value="gratis" 
                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" 
                                defaultChecked
                              />
                              <div>
                                <label htmlFor="frete-gratis" className="font-medium text-gray-900 cursor-pointer">
                                  Frete gratis
                                  <span className="ml-2 text-green-600 font-semibold">Grátis</span>
                                </label>
                                <p className="text-sm text-gray-600 mt-1">de 15 até 30 dias</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        A previsão de entrega pode variar de acordo com a região e facilidade de acesso ao seu endereço
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Seção Pagamento */}
              {addressLoaded && (
                <Card className="max-w-[650px]">
                  <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="qtde text-center bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3">3</div>
                    <h3 className="text-lg font-semibold text-gray-800">Pagamento</h3>
                  </div>
                  
                  {/* Mensagem de cartão recusado (oculta por padrão) */}
                  <div id="refused-card-message" className="alert alert-danger mb-4" style={{borderColor: '#FA0000', backgroundColor: '#FFF9F9', display: 'none'}}>
                    <button type="button" className="close" aria-label="Close" style={{color: '#fa0000'}}>
                      <span aria-hidden="true">×</span>
                    </button>
                    <b style={{color: '#ff0000'}}>Seu cartão foi recusado.</b>
                    <p>Se o erro persistir, você pode finalizar seu pagamento com <b>Pix</b>.</p>
                  </div>

                  {/* Opções de pagamento */}
                  <div className="mb-4">
                    <div className="flex space-x-4 mb-4">
                      {/* Opção Cartão */}
                      <div 
                        className={`flex items-center justify-center w-[100px] h-[57px] border rounded-lg cursor-pointer ${
                          paymentData.method === 'card' ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200'
                        }`}
                        onClick={() => handlePaymentChange('method', 'card')}
                      >
                        <svg width="32" height="23" viewBox="0 0 32 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21.9995 15.3532C21.3367 15.3532 20.7995 15.8886 20.7995 16.5491C20.7995 17.2095 21.3367 17.7449 21.9995 17.7449H25.9995C26.6622 17.7449 27.1995 17.2095 27.1995 16.5491C27.1995 15.8886 26.6622 15.3532 25.9995 15.3532H21.9995ZM3.66667 0.205811C1.64162 0.205811 0 1.84175 0 3.85979V19.1401C0 21.1581 1.64162 22.794 3.66667 22.794H28.3333C30.3584 22.794 32 21.1581 32 19.1401V3.85979C32 1.84175 30.3584 0.205811 28.3333 0.205811H3.66667ZM2 19.1401V8.84249H30V19.1401C30 20.0574 29.2538 20.801 28.3333 20.801H3.66667C2.74619 20.801 2 20.0574 2 19.1401ZM2 6.84941V3.85979C2 2.9425 2.74619 2.19889 3.66667 2.19889H28.3333C29.2538 2.19889 30 2.9425 30 3.85979V6.84941H2Z" fill="#5B8DE8"/>
                        </svg>
                      </div>

                      {/* Opção PIX */}
                      <div 
                        className={`flex items-center justify-center w-[100px] h-[57px] border rounded-lg cursor-pointer ${
                          paymentData.method === 'pix' ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200'
                        }`}
                        onClick={() => handlePaymentChange('method', 'pix')}
                      >
                        <svg width="56" height="21" viewBox="0 0 56 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <g clipPath="url(#clip0_1193_2161)">
                            <path d="M14.4714 16.0877C13.7434 16.0877 13.0602 15.8077 12.545 15.2925L9.76739 12.5149C9.57699 12.3245 9.22979 12.3245 9.03939 12.5149L6.2506 15.3037C5.7354 15.8189 5.05219 16.0989 4.32419 16.0989H3.77539L7.30339 19.6269C8.40099 20.7245 10.193 20.7245 11.2906 19.6269L14.8298 16.0877H14.4714Z" fill="#32BCAD"/>
                            <path d="M4.31293 6.25403C5.04093 6.25403 5.72413 6.53403 6.23933 7.04923L9.02813 9.83803C9.22973 10.0396 9.55453 10.0396 9.75613 9.83803L12.5449 7.06043C13.0601 6.54523 13.7433 6.26523 14.4713 6.26523H14.8073L11.2681 2.72603C10.1705 1.62843 8.37853 1.62843 7.28093 2.72603L3.75293 6.25403H4.31293Z" fill="#32BCAD"/>
                            <path d="M17.7308 9.18849L15.5916 7.04929C15.5468 7.07169 15.4908 7.08289 15.4348 7.08289H14.4604C13.9564 7.08289 13.4636 7.28449 13.1164 7.64289L10.3388 10.4205C10.0812 10.6781 9.73404 10.8125 9.39804 10.8125C9.05084 10.8125 8.71483 10.6781 8.45723 10.4205L5.66844 7.63169C5.31004 7.27329 4.81724 7.07169 4.32444 7.07169H3.12604C3.07004 7.07169 3.02524 7.06049 2.98044 7.03809L0.830036 9.18849C-0.267564 10.2861 -0.267564 12.0781 0.830036 13.1757L2.96923 15.3149C3.01403 15.2925 3.05884 15.2813 3.11484 15.2813H4.31323C4.81723 15.2813 5.31003 15.0797 5.65723 14.7213L8.44604 11.9325C8.95004 11.4285 9.83484 11.4285 10.3388 11.9325L13.1164 14.7101C13.4748 15.0685 13.9676 15.2701 14.4604 15.2701H15.4348C15.4908 15.2701 15.5356 15.2813 15.5916 15.3037L17.7308 13.1645C18.8284 12.0669 18.8284 10.2861 17.7308 9.18849Z" fill="#32BCAD"/>
                          </g>
                          <defs>
                            <clipPath id="clip0_1193_2161">
                              <rect width="56" height="19.9136" fill="white" transform="translate(0 0.543213)"/>
                            </clipPath>
                          </defs>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Formulário de cartão */}
                  {paymentData.method === 'card' && (
                    <div>
                      {/* Bandeiras e parcelamento */}
                      <div className="mb-4">
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                          <p className="text-sm text-gray-600 mb-2 sm:mb-0">
                            Parcele em <strong>até 1x</strong> nos cartões:
                          </p>
                          <div className="flex space-x-2">
                            <img src="/assets/img/mastercard.svg" alt="Mastercard" width="44" />
                            <img src="/assets/img/visa.svg" alt="Visa" width="44" />
                            <img src="/assets/img/amex.svg" alt="American Express" width="44" />
                            <img src="/assets/img/elo.svg" alt="Elo" width="44" />
                            <img src="/assets/img/hiper.svg" alt="Hipercard" width="44" />
                          </div>
                        </div>
                      </div>

                      {/* Campos do cartão */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="cardNumber" className="text-sm font-medium text-gray-700">Número do cartão</Label>
                          <Input
                            id="cardNumber"
                            type="text"
                            placeholder="1234 5678 9012 3456"
                            value={paymentData.cardNumber}
                            onChange={(e) => handlePaymentChange('cardNumber', e.target.value)}
                            className="w-full"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="cardName" className="text-sm font-medium text-gray-700">Nome no cartão</Label>
                          <Input
                            id="cardName"
                            type="text"
                            placeholder="Nome como está no cartão"
                            value={paymentData.cardName}
                            onChange={(e) => handlePaymentChange('cardName', e.target.value)}
                            className="w-full"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="expiryDate" className="text-sm font-medium text-gray-700">Validade</Label>
                            <Input
                              id="expiryDate"
                              type="text"
                              placeholder="MM/AA"
                              value={paymentData.expiryDate}
                              onChange={(e) => handlePaymentChange('expiryDate', e.target.value)}
                              className="w-full"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="cvv" className="text-sm font-medium text-gray-700">CVV</Label>
                            <Input
                              id="cvv"
                              type="text"
                              placeholder="123"
                              value={paymentData.cvv}
                              onChange={(e) => handlePaymentChange('cvv', e.target.value)}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Formulário PIX */}
                  {paymentData.method === 'pix' && (
                    <div className="text-center py-8">
                      <div className="mb-4">
                        <svg width="80" height="30" viewBox="0 0 56 21" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                          <g clipPath="url(#clip0_1193_2161)">
                            <path d="M14.4714 16.0877C13.7434 16.0877 13.0602 15.8077 12.545 15.2925L9.76739 12.5149C9.57699 12.3245 9.22979 12.3245 9.03939 12.5149L6.2506 15.3037C5.7354 15.8189 5.05219 16.0989 4.32419 16.0989H3.77539L7.30339 19.6269C8.40099 20.7245 10.193 20.7245 11.2906 19.6269L14.8298 16.0877H14.4714Z" fill="#32BCAD"/>
                            <path d="M4.31293 6.25403C5.04093 6.25403 5.72413 6.53403 6.23933 7.04923L9.02813 9.83803C9.22973 10.0396 9.55453 10.0396 9.75613 9.83803L12.5449 7.06043C13.0601 6.54523 13.7433 6.26523 14.4713 6.26523H14.8073L11.2681 2.72603C10.1705 1.62843 8.37853 1.62843 7.28093 2.72603L3.75293 6.25403H4.31293Z" fill="#32BCAD"/>
                            <path d="M17.7308 9.18849L15.5916 7.04929C15.5468 7.07169 15.4908 7.08289 15.4348 7.08289H14.4604C13.9564 7.08289 13.4636 7.28449 13.1164 7.64289L10.3388 10.4205C10.0812 10.6781 9.73404 10.8125 9.39804 10.8125C9.05084 10.8125 8.71483 10.6781 8.45723 10.4205L5.66844 7.63169C5.31004 7.27329 4.81724 7.07169 4.32444 7.07169H3.12604C3.07004 7.07169 3.02524 7.06049 2.98044 7.03809L0.830036 9.18849C-0.267564 10.2861 -0.267564 12.0781 0.830036 13.1757L2.96923 15.3149C3.01403 15.2925 3.05884 15.2813 3.11484 15.2813H4.31323C4.81723 15.2813 5.31003 15.0797 5.65723 14.7213L8.44604 11.9325C8.95004 11.4285 9.83484 11.4285 10.3388 11.9325L13.1164 14.7101C13.4748 15.0685 13.9676 15.2701 14.4604 15.2701H15.4348C15.4908 15.2701 15.5356 15.2813 15.5916 15.3037L17.7308 13.1645C18.8284 12.0669 18.8284 10.2861 17.7308 9.18849Z" fill="#32BCAD"/>
                          </g>
                          <defs>
                            <clipPath id="clip0_1193_2161">
                              <rect width="56" height="19.9136" fill="white" transform="translate(0 0.543213)"/>
                            </clipPath>
                          </defs>
                        </svg>
                      </div>
                      <p className="text-gray-600 mb-4">Após finalizar a compra, você receberá o código PIX para pagamento.</p>
                    </div>
                  )}

                    <Button 
                      type="submit" 
                      className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 text-base"
                    >
                      FINALIZAR COMPRA
                    </Button>
                  </CardContent>
                </Card>
              )}
            </form>
          </div>

          {/* Sidebar com resumo do pedido */}
          <div className="lg:w-1/3 lg:max-w-[370px]">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <img 
                      src="https://cdn.shopify.com/s/files/1/0930/5774/5217/files/kit3happyhair_3happyhair_1happycollagen_1happysleep.jpg?v=1745462576" 
                      alt="Produto" 
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-800 leading-tight">
                        [COMBO] 6X Happy Hair + 1X Pote de Melatonina + 1X Pote de Colágeno
                      </h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="w-8 h-8 flex items-center justify-center border rounded">
                        <span className="text-lg">-</span>
                      </button>
                      <span className="w-8 text-center">1</span>
                      <button className="w-8 h-8 flex items-center justify-center border rounded">
                        <span className="text-lg">+</span>
                      </button>
                    </div>
                  </div>

                  <hr />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-800">R$ 167,90</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Frete</span>
                      <span className="text-gray-800">-</span>
                    </div>
                  </div>

                  <hr />

                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>R$ 167,90</span>
                  </div>

                  <button className="flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg mt-4 w-full justify-center">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm3.5 6.1L7.1 10.5c-.2.2-.4.3-.7.3s-.5-.1-.7-.3L3.5 8.3c-.4-.4-.4-1 0-1.4s1-.4 1.4 0L6.4 8.4l3.7-3.7c.4-.4 1-.4 1.4 0s.4 1 0 1.4z" fill="#10B981"/>
                    </svg>
                    <span className="text-sm font-medium text-green-700">Ambiente seguro</span>
                  </button>

                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="flex py-4 flex-col items-center bg-white border-t">
        <p className="mb-2 text-sm text-gray-700">Formas de pagamento</p>
        <div className="flex gap-2">
          <img src="/assets/img/mastercard.svg" alt="Mastercard" width="44" />
          <img src="/assets/img/visa.svg" alt="Visa" width="44" />
          <img src="/assets/img/amex.svg" alt="American Express" width="44" />
          <img src="/assets/img/elo.svg" alt="Elo" width="44" />
          <img src="/assets/img/hiper.svg" alt="Hipercard" width="44" />
          <svg width="44" height="30" viewBox="0 0 56 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_pix)">
              <path d="M14.4714 16.0877C13.7434 16.0877 13.0602 15.8077 12.545 15.2925L9.76739 12.5149C9.57699 12.3245 9.22979 12.3245 9.03939 12.5149L6.2506 15.3037C5.7354 15.8189 5.05219 16.0989 4.32419 16.0989H3.77539L7.30339 19.6269C8.40099 20.7245 10.193 20.7245 11.2906 19.6269L14.8298 16.0877H14.4714Z" fill="#32BCAD"/>
              <path d="M4.31293 6.25403C5.04093 6.25403 5.72413 6.53403 6.23933 7.04923L9.02813 9.83803C9.22973 10.0396 9.55453 10.0396 9.75613 9.83803L12.5449 7.06043C13.0601 6.54523 13.7433 6.26523 14.4713 6.26523H14.8073L11.2681 2.72603C10.1705 1.62843 8.37853 1.62843 7.28093 2.72603L3.75293 6.25403H4.31293Z" fill="#32BCAD"/>
              <path d="M17.7308 9.18849L15.5916 7.04929C15.5468 7.07169 15.4908 7.08289 15.4348 7.08289H14.4604C13.9564 7.08289 13.4636 7.28449 13.1164 7.64289L10.3388 10.4205C10.0812 10.6781 9.73404 10.8125 9.39804 10.8125C9.05084 10.8125 8.71483 10.6781 8.45723 10.4205L5.66844 7.63169C5.31004 7.27329 4.81724 7.07169 4.32444 7.07169H3.12604C3.07004 7.07169 3.02524 7.06049 2.98044 7.03809L0.830036 9.18849C-0.267564 10.2861 -0.267564 12.0781 0.830036 13.1757L2.96923 15.3149C3.01403 15.2925 3.05884 15.2813 3.11484 15.2813H4.31323C4.81723 15.2813 5.31003 15.0797 5.65723 14.7213L8.44604 11.9325C8.95004 11.4285 9.83484 11.4285 10.3388 11.9325L13.1164 14.7101C13.4748 15.0685 13.9676 15.2701 14.4604 15.2701H15.4348C15.4908 15.2701 15.5356 15.2813 15.5916 15.3037L17.7308 13.1645C18.8284 12.0669 18.8284 10.2861 17.7308 9.18849Z" fill="#32BCAD"/>
            </g>
            <defs>
              <clipPath id="clip0_pix">
                <rect width="56" height="19.9136" fill="white" transform="translate(0 0.543213)"/>
              </clipPath>
            </defs>
          </svg>
        </div>
        <p className="mt-4 text-sm text-gray-700">© 2025 Lucas Lopes</p>
        

      </footer>
    </div>
  );
}