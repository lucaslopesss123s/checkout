'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { useCheckoutTracking } from '@/hooks/use-checkout-tracking';

interface Product {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  variant_title?: string;
}

interface ShopifyCheckoutData {
  products: Product[];
  store_domain: string;
  currency: string;
  total_price: number;
  subtotal_price: number;
}

interface CheckoutSettings {
  theme: string;
  logo?: string;
  favicon?: string;
  cor_barra?: string;
  cor_botao?: string;
  contagem_regressiva: boolean;
  barra_texto?: string;
}

interface FreteOption {
  id: number;
  nome: string;
  preco: number;
  prazo_minimo: number | null;
  prazo_maximo: number | null;
  valor_minimo_gratis: number | null;
  frete_gratis_ativo: boolean;
  ativo: boolean;
}

export default function ShopifyCheckoutPage() {
  const [checkoutData, setCheckoutData] = useState<ShopifyCheckoutData | null>(null);
  const [checkoutSettings, setCheckoutSettings] = useState<CheckoutSettings>({
    theme: 'default',
    cor_barra: '#0a101a',
    cor_botao: '#10b981',
    contagem_regressiva: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Hook de rastreamento
  const {
    startTracking,
    updateStep,
    updateCustomer,
    updateItems,
    stopTracking
  } = useCheckoutTracking({ autoTrack: false });
  
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

  const [cardValidation, setCardValidation] = useState({
    isValid: false,
    cardType: '',
    error: ''
  });

  const [addressLoaded, setAddressLoaded] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lojaId, setLojaId] = useState<string | null>(null);
  const [primeiraEtapaCompleta, setPrimeiraEtapaCompleta] = useState(false);
  
  // Estados para frete
  const [freteOptions, setFreteOptions] = useState<FreteOption[]>([]);
  const [selectedFrete, setSelectedFrete] = useState<FreteOption | null>(null);
  const [freteLoading, setFreteLoading] = useState(false);

  // Função para carregar configurações de checkout
  const loadCheckoutSettings = async (storeDomain: string) => {
    try {
      // Primeiro buscar a loja pelo domínio
      const lojaResponse = await fetch(`/api/shopify/config?domain=${encodeURIComponent(storeDomain)}`);
      if (lojaResponse.ok) {
        const lojaData = await lojaResponse.json();
        if (lojaData.configured && lojaData.id_loja) {
          // Buscar configurações da loja_config usando API pública
          const configResponse = await fetch(`/api/checkout-config?id_loja=${lojaData.id_loja}`);
          if (configResponse.ok) {
            const configData = await configResponse.json();
            if (configData.success && configData.config) {
              setCheckoutSettings(prev => ({
                ...prev,
                cor_barra: configData.config.cor_tema || '#0a101a',
                cor_botao: configData.config.cor_botao || '#10b981',
                logo: configData.config.logo,
                barra_texto: configData.config.aviso
              }));
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de checkout:', error);
    }
  };

  // Função para buscar opções de frete
  const fetchFreteOptions = async (lojaId: string) => {
    setFreteLoading(true);
    try {
      const response = await fetch(`/api/frete?id_loja=${lojaId}`);
      if (response.ok) {
        const options = await response.json();
        setFreteOptions(options);
        // Selecionar automaticamente o primeiro frete (mais barato)
        if (options.length > 0) {
          setSelectedFrete(options[0]);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar opções de frete:', error);
    } finally {
      setFreteLoading(false);
    }
  };

  // Funções auxiliares para frete
  const isFreteGratis = (frete: FreteOption, totalPedido: number): boolean => {
    return frete.frete_gratis_ativo && 
           frete.valor_minimo_gratis !== null && 
           totalPedido >= frete.valor_minimo_gratis;
  };

  const getFreteValue = (frete: FreteOption, totalPedido: number): number => {
    return isFreteGratis(frete, totalPedido) ? 0 : frete.preco;
  };

  const formatPrazoEntrega = (prazoMinimo: number | null, prazoMaximo: number | null): string => {
    if (!prazoMinimo && !prazoMaximo) return 'Prazo não informado';
    if (prazoMinimo && prazoMaximo) {
      if (prazoMinimo === prazoMaximo) {
        return `${prazoMinimo} ${prazoMinimo === 1 ? 'dia' : 'dias'}`;
      }
      return `de ${prazoMinimo} até ${prazoMaximo} dias`;
    }
    if (prazoMinimo) return `a partir de ${prazoMinimo} ${prazoMinimo === 1 ? 'dia' : 'dias'}`;
    if (prazoMaximo) return `até ${prazoMaximo} ${prazoMaximo === 1 ? 'dia' : 'dias'}`;
    return 'Prazo não informado';
  };

  useEffect(() => {
    // Processar dados da sessão via URL
    const urlParams = new URLSearchParams(window.location.search);
    const sessionData = urlParams.get('session');
    
    if (sessionData) {
      try {
        // Decodificar dados da sessão
        const decodedData = JSON.parse(atob(sessionData));
        
        // Mapear dados para o formato esperado
        const mappedData: ShopifyCheckoutData = {
          products: decodedData.produtos.map((produto: any) => ({
            id: produto.id,
            title: produto.titulo,
            price: produto.preco,
            quantity: produto.quantidade,
            image: produto.imagem,
            variant_title: produto.variante
          })),
          store_domain: decodedData.shop_domain,
          currency: decodedData.currency || 'BRL',
          total_price: decodedData.total,
          subtotal_price: decodedData.total
        };
        
        setCheckoutData(mappedData);
        
        // Iniciar rastreamento com dados iniciais
        startTracking({
          etapa_atual: 'carrinho',
          itens: mappedData.products.map(p => ({
            nome: p.title,
            quantidade: p.quantity,
            preco: p.price
          })),
          valor_total: mappedData.total_price
        });
        
        // Carregar configurações de checkout
        loadCheckoutSettings(decodedData.shop_domain);
        
        // Armazenar dados da sessão para salvar carrinho
        setSessionId(sessionData);
        if (decodedData.loja_id) {
          setLojaId(decodedData.loja_id);
          // Buscar opções de frete para a loja
          fetchFreteOptions(decodedData.loja_id);
        }
        
        // Preencher dados do cliente se disponíveis
        if (decodedData.customer) {
          setCustomerData(prev => ({
            ...prev,
            email: decodedData.customer.email || '',
            name: `${decodedData.customer.first_name || ''} ${decodedData.customer.last_name || ''}`.trim()
          }));
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erro ao processar dados da sessão:', error);
        setError('Erro ao carregar dados do checkout');
        setLoading(false);
      }
    } else {
      // Dados de teste se não houver sessão
      setTimeout(() => {
        setCheckoutData({
          products: [
            {
              id: '1',
              title: 'Produto de Teste',
              price: 99.90,
              quantity: 1,
              image: 'https://via.placeholder.com/64x64'
            }
          ],
          store_domain: 'loja-teste.myshopify.com',
          currency: 'BRL',
          total_price: 99.90,
          subtotal_price: 99.90
        });
        
        // Gerar sessionId e lojaId para teste
        const testSessionId = 'test-session-' + Date.now();
        const testLojaId = '7453e5c4-bbb1-4e16-87da-0f031f7e3d56'; // ID da loja específica
        
        setSessionId(testSessionId);
        setLojaId(testLojaId);
        
        // Buscar opções de frete para a loja de teste
        fetchFreteOptions(testLojaId);
        
        console.log('Modo teste: sessionId e lojaId definidos', { testSessionId, testLojaId });
        
        setLoading(false);
      }, 1000);
    }
  }, []);

  // useEffect para salvar carrinho quando usuário sair da página
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Parar rastreamento ao sair da página
      stopTracking();
      
      if (sessionId && lojaId && (customerData.email || customerData.telephone)) {
        // Usar sendBeacon para garantir que a requisição seja enviada
        const carrinhoData = {
          id_loja: lojaId,
          session_id: sessionId,
          nome: customerData.name || null,
          email: customerData.email || null,
          telefone: customerData.telephone || null,
          cpf: customerData.document || null,
          cep: addressData.zipCode || null,
          endereco: addressData.street || null,
          numero: addressData.number || null,
          complemento: addressData.complement || null,
          bairro: addressData.neighborhood || null,
          cidade: addressData.city || null,
          estado: addressData.state || null,
          itens: checkoutData?.products.map(product => ({
            id: product.id,
            title: product.title,
            price: product.price,
            quantity: product.quantity,
            image: product.image,
            variant_title: product.variant_title
          })) || [],
          valor_total: checkoutData?.total_price || null,
          metodo_pagamento: paymentData.method || null,
          user_agent: navigator.userAgent,
          primeira_etapa_completada: true
        };
        
        navigator.sendBeacon('/api/carrinho', JSON.stringify(carrinhoData));
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleBeforeUnload();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sessionId, lojaId, customerData, addressData, paymentData, checkoutData]);

  // Função para salvar carrinho
  const saveCarrinho = async (primeiraEtapa = false) => {
    if (!checkoutData || !lojaId) {
      console.log('saveCarrinho: Dados insuficientes', { checkoutData: !!checkoutData, lojaId });
      return;
    }

    try {
      const carrinhoData = {
        id_loja: lojaId,
        session_id: sessionId,
        nome: customerData.name || null,
        email: customerData.email || null,
        telefone: customerData.telephone || null,
        cpf: customerData.document || null,
        cep: addressData.zipCode || null,
        endereco: addressData.street || null,
        numero: addressData.number || null,
        complemento: addressData.complement || null,
        bairro: addressData.neighborhood || null,
        cidade: addressData.city || null,
        estado: addressData.state || null,
        itens: checkoutData.products.map(product => ({
          id: product.id,
          title: product.title,
          price: product.price,
          quantity: product.quantity,
          image: product.image,
          variant_title: product.variant_title
        })),
        valor_total: checkoutData.total_price,
        metodo_pagamento: paymentData.method || null,
        ip_cliente: null, // Pode ser obtido do servidor
        user_agent: navigator.userAgent,
        primeira_etapa_completada: primeiraEtapa
      };

      console.log('saveCarrinho: Enviando dados', {
        email: carrinhoData.email,
        telefone: carrinhoData.telefone,
        nome: carrinhoData.nome,
        session_id: carrinhoData.session_id,
        id_loja: carrinhoData.id_loja
      });

      const response = await fetch('/api/carrinho', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(carrinhoData)
      });

      const result = await response.json();
      console.log('saveCarrinho: Resposta da API', result);

      if (!response.ok) {
        console.error('saveCarrinho: Erro na resposta', result);
      }
    } catch (error) {
      console.error('Erro ao salvar carrinho:', error);
    }
  };

  // Função para formatar telefone (XX) XXXXX-XXXX
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length === 0) return '';
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  // Função para formatar CPF XXX.XXX.XXX-XX
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length === 0) return '';
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    if (numbers.length <= 11) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
    
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const handleCustomerChange = (field: string, value: string | boolean) => {
    console.log('handleCustomerChange:', { field, value });
    
    let formattedValue = value;
    
    // Aplicar máscaras de formatação
    if (typeof value === 'string') {
      if (field === 'telephone') {
        formattedValue = formatPhone(value);
      } else if (field === 'document') {
        formattedValue = formatCPF(value);
      }
    }
    
    const updatedData = { ...customerData, [field]: formattedValue };
    setCustomerData(updatedData);
    
    // Atualizar rastreamento com dados do cliente
    updateCustomer(
      updatedData.name || undefined,
      updatedData.email || undefined,
      updatedData.telephone || undefined
    );
    
    // Verificar se a primeira etapa foi completada (nome e email/telefone)
    const etapaCompleta = updatedData.name && (updatedData.email || updatedData.telephone);
    
    if (etapaCompleta && !primeiraEtapaCompleta) {
      console.log('handleCustomerChange: Primeira etapa completada');
      setPrimeiraEtapaCompleta(true);
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

  // Função para aplicar máscara no cartão de crédito
  const formatCardNumber = (value: string) => {
    // Remove todos os caracteres não numéricos
    const cleanValue = value.replace(/\D/g, '');
    
    // Detecta o tipo de cartão baseado nos primeiros dígitos
    const cardType = detectCardType(cleanValue);
    
    // Aplica máscara baseada no tipo de cartão
    if (cardType === 'amex') {
      // American Express: XXXX XXXXXX XXXXX (15 dígitos)
      return cleanValue.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3').substring(0, 17);
    } else {
      // Visa, Mastercard, etc: XXXX XXXX XXXX XXXX (16 dígitos)
      return cleanValue.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4').substring(0, 19);
    }
  };

  // Função para detectar tipo de cartão
  const detectCardType = (cardNumber: string) => {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    
    if (cleanNumber.match(/^3[47]/)) {
      return 'amex'; // American Express
    } else if (cleanNumber.match(/^4/)) {
      return 'visa'; // Visa
    } else if (cleanNumber.match(/^5[1-5]/) || cleanNumber.match(/^2[2-7]/)) {
      return 'mastercard'; // Mastercard
    } else if (cleanNumber.match(/^6(?:011|5)/)) {
      return 'discover'; // Discover
    } else if (cleanNumber.match(/^3[0-9]/)) {
      return 'diners'; // Diners Club
    }
    return 'unknown';
  };

  // Algoritmo de validação Luhn
  const validateLuhn = (cardNumber: string) => {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      return false;
    }
    
    let sum = 0;
    let isEven = false;
    
    // Percorre o número do cartão de trás para frente
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber.charAt(i));
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  };

  // Função para formatar data de expiração
  const formatExpiryDate = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length >= 2) {
      return cleanValue.substring(0, 2) + '/' + cleanValue.substring(2, 4);
    }
    return cleanValue;
  };

  // Função para formatar CVV
  const formatCVV = (value: string, cardType: string) => {
    const cleanValue = value.replace(/\D/g, '');
    const maxLength = cardType === 'amex' ? 4 : 3;
    return cleanValue.substring(0, maxLength);
  };

  const handlePaymentChange = (field: string, value: string) => {
    let formattedValue = value;
    let validation = { ...cardValidation };
    
    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
      const cleanNumber = formattedValue.replace(/\D/g, '');
      const cardType = detectCardType(cleanNumber);
      const isValid = validateLuhn(cleanNumber);
      
      // Verifica se o cartão tem o número correto de dígitos
      const expectedLength = cardType === 'amex' ? 15 : 16;
      const isComplete = cleanNumber.length === expectedLength;
      
      validation = {
        isValid: isValid && isComplete,
        cardType: cardType,
        error: !isValid && cleanNumber.length >= 13 ? 'Número de cartão inválido' : 
               !isComplete && cleanNumber.length >= 13 ? `Cartão deve ter ${expectedLength} dígitos` : ''
      };
      
      setCardValidation(validation);
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    } else if (field === 'cvv') {
      formattedValue = formatCVV(value, cardValidation.cardType);
    }
    
    const updatedData = { ...paymentData, [field]: formattedValue };
    setPaymentData(updatedData);
    
    // Se selecionou método de pagamento, atualizar etapa
    if (updatedData.method) {
      updateStep('pagamento');
    }
  };

  // useEffect para salvamento automático com debounce
  useEffect(() => {
    if (checkoutData && lojaId && (customerData.email || customerData.telephone || customerData.name)) {
      const timeoutId = setTimeout(() => {
        console.log('Salvamento automático ativado por mudança nos dados');
        saveCarrinho(customerData.email || customerData.telephone ? true : false);
      }, 1000); // Debounce de 1 segundo

      return () => clearTimeout(timeoutId);
    }
  }, [customerData, addressData, paymentData, checkoutData, lojaId]);

  const handleCepChange = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    
    // Limita a 8 dígitos no total
    if (cleanCep.length > 8) {
      return;
    }
    
    let formattedCep = cleanCep;
    if (cleanCep.length > 5) {
      formattedCep = cleanCep.slice(0, 5) + '-' + cleanCep.slice(5);
    }
    
    handleAddressChange('zipCode', formattedCep);
    
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
    
    if (!checkoutData) {
      setError('Dados do checkout não encontrados');
      return;
    }

    // Validação específica para pagamento com cartão
    if (paymentData.method === 'card') {
      if (!cardValidation.isValid) {
        setError('Por favor, insira um número de cartão válido antes de finalizar a compra.');
        return;
      }
      
      if (!paymentData.cardName.trim()) {
        setError('Por favor, insira o nome como está no cartão.');
        return;
      }
      
      if (!paymentData.expiryDate || paymentData.expiryDate.length < 5) {
        setError('Por favor, insira uma data de validade válida (MM/AA).');
        return;
      }
      
      if (!paymentData.cvv || paymentData.cvv.length < 3) {
        setError('Por favor, insira um CVV válido.');
        return;
      }
    }

    try {
      const response = await fetch('/api/shopify/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: customerData,
          address: addressData,
          payment: paymentData,
          products: checkoutData.products,
          store_domain: checkoutData.store_domain,
          total_price: checkoutData.total_price
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Checkout processado:', result);
        
        // Deletar carrinho quando compra for finalizada
        if (sessionId && lojaId) {
          try {
            await fetch(`/api/carrinho?session_id=${sessionId}&id_loja=${lojaId}`, {
              method: 'DELETE'
            });
          } catch (error) {
            console.error('Erro ao deletar carrinho:', error);
          }
        }
        
        // Redirecionar para página de sucesso ou processar pagamento
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao processar checkout');
      }
    } catch (error) {
      console.error('Erro no checkout:', error);
      setError('Erro interno do servidor');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando checkout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  if (!checkoutData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Nenhum dado de checkout encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com logo */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="text-xl font-bold text-gray-800">
              {checkoutData.store_domain.replace('.myshopify.com', '')}
            </div>
            <div>
              <img src="/assets/img/safe-payment.svg" alt="Pagamento Seguro" />
            </div>
          </div>
        </div>
      </div>

      {/* Barra com cor personalizada */}
      <div 
        className="text-white"
        style={{ backgroundColor: checkoutSettings.cor_barra || '#0a101a' }}
      >
        <div className="container mx-auto px-4 py-3 text-center">
          <span className="text-sm font-medium">
            {checkoutSettings.barra_texto || 'Confirme seus dados abaixo.'}
          </span>
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
                    <div 
                       className="qtde text-center text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 cursor-pointer" 
                       style={{ 
                         backgroundColor: checkoutSettings.cor_barra,
                         border: selectedElement === 'element1' ? `2px solid ${checkoutSettings.cor_barra}` : 'none',
                         boxShadow: selectedElement === 'element1' ? `0 0 0 2px ${checkoutSettings.cor_barra}40` : 'none'
                       }}
                       onClick={() => setSelectedElement(selectedElement === 'element1' ? null : 'element1')}
                     >1</div>
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
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="telephone" className="text-sm font-medium text-gray-700">Telefone</Label>
                      <Input
                        id="telephone"
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={customerData.telephone}
                        onChange={(e) => handleCustomerChange('telephone', e.target.value)}
                        className="w-full"
                        required
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
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="document" className="text-sm font-medium text-gray-700">CPF/CNPJ</Label>
                      <Input
                        id="document"
                        type="text"
                        placeholder="000.000.000-00"
                        value={customerData.document}
                        onChange={(e) => handleCustomerChange('document', e.target.value)}
                        className="w-full"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Seção Entrega */}
              <Card className="max-w-[650px]">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div 
                       className="qtde text-center text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 cursor-pointer" 
                       style={{ 
                         backgroundColor: checkoutSettings.cor_barra,
                         border: selectedElement === 'element2' ? `2px solid ${checkoutSettings.cor_barra}` : 'none',
                         boxShadow: selectedElement === 'element2' ? `0 0 0 2px ${checkoutSettings.cor_barra}40` : 'none'
                       }}
                       onClick={() => setSelectedElement(selectedElement === 'element2' ? null : 'element2')}
                     >2</div>
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
                        required
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
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="state" className="text-sm font-medium text-gray-700">Estado</Label>
                          <Select value={addressData.state} onValueChange={(value) => handleAddressChange('state', value)} required>
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
                            required
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
                            required
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
                            disabled={addressData.noNumber}
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

                      {/* Seção de Frete */}
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium text-gray-700 mb-3">Escolha o melhor frete para você</p>
                        {freteLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-sm text-gray-600">Carregando opções de frete...</span>
                          </div>
                        ) : freteOptions.length > 0 ? (
                          <div className="space-y-2">
                            {freteOptions.map((frete, index) => {
                              const totalPedido = checkoutData?.total_price || 0;
                              const valorFrete = getFreteValue(frete, totalPedido);
                              const isGratis = isFreteGratis(frete, totalPedido);
                              const prazoFormatado = formatPrazoEntrega(frete.prazo_minimo, frete.prazo_maximo);
                              
                              return (
                                <div 
                                  key={frete.id} 
                                  className={`border rounded-lg p-4 shadow-sm ${
                                    selectedFrete?.id === frete.id 
                                      ? 'border-blue-300 bg-blue-50' 
                                      : 'border-gray-200 bg-white hover:border-gray-300'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <input 
                                        type="radio" 
                                        id={`frete-${frete.id}`}
                                        name="shipping" 
                                        value={frete.id.toString()}
                                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" 
                                        checked={selectedFrete?.id === frete.id}
                                        onChange={() => setSelectedFrete(frete)}
                                      />
                                      <div>
                                        <label htmlFor={`frete-${frete.id}`} className="font-medium text-gray-900 cursor-pointer">
                                          {frete.nome}
                                          <span className={`ml-2 font-semibold ${
                                            valorFrete === 0 ? 'text-green-600' : 'text-gray-900'
                                          }`}>
                                            {valorFrete === 0 ? 'Grátis' : `R$ ${valorFrete.toFixed(2).replace('.', ',')}`}
                                          </span>
                                        </label>
                                        <p className="text-sm text-gray-600 mt-1">{prazoFormatado}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <p className="text-sm text-gray-600 text-center">
                              Nenhuma opção de frete disponível para esta loja.
                            </p>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          A previsão de entrega pode variar de acordo com a região e facilidade de acesso ao seu endereço
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Seção Pagamento */}
              {addressLoaded && (
                <Card className="max-w-[650px]">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div 
                         className="qtde text-center text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 cursor-pointer" 
                         style={{ 
                           backgroundColor: checkoutSettings.cor_barra,
                           border: selectedElement === 'element3' ? `2px solid ${checkoutSettings.cor_barra}` : 'none',
                           boxShadow: selectedElement === 'element3' ? `0 0 0 2px ${checkoutSettings.cor_barra}40` : 'none'
                         }}
                         onClick={() => setSelectedElement(selectedElement === 'element3' ? null : 'element3')}
                       >3</div>
                      <h3 className="text-lg font-semibold text-gray-800">Pagamento</h3>
                    </div>
                    
                    {/* Opções de pagamento */}
                    <div className="mb-4">
                      <div className="flex space-x-4 mb-4">
                        {/* Opção Cartão */}
                        <div 
                           className={`flex items-center justify-center w-[100px] h-[57px] border rounded-lg cursor-pointer`}
                           style={{
                             backgroundColor: paymentData.method === 'card' ? `${checkoutSettings.cor_barra}20` : 'white',
                             borderColor: paymentData.method === 'card' ? checkoutSettings.cor_barra : '#e5e7eb',
                             border: selectedElement === 'input-card' ? `3px solid ${checkoutSettings.cor_barra}` : `1px solid ${paymentData.method === 'card' ? checkoutSettings.cor_barra : '#e5e7eb'}`,
                             boxShadow: selectedElement === 'input-card' ? `0 0 0 2px ${checkoutSettings.cor_barra}40` : 'none'
                           }}
                           onClick={(e) => {
                             e.stopPropagation();
                             if (selectedElement === 'input-card') {
                               setSelectedElement(null);
                             } else {
                               setSelectedElement('input-card');
                               handlePaymentChange('method', 'card');
                             }
                           }}
                        >
                          <svg width="32" height="23" viewBox="0 0 32 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21.9995 15.3532C21.3367 15.3532 20.7995 15.8886 20.7995 16.5491C20.7995 17.2095 21.3367 17.7449 21.9995 17.7449H25.9995C26.6622 17.7449 27.1995 17.2095 27.1995 16.5491C27.1995 15.8886 26.6622 15.3532 25.9995 15.3532H21.9995ZM3.66667 0.205811C1.64162 0.205811 0 1.84175 0 3.85979V19.1401C0 21.1581 1.64162 22.794 3.66667 22.794H28.3333C30.3584 22.794 32 21.1581 32 19.1401V3.85979C32 1.84175 30.3584 0.205811 28.3333 0.205811H3.66667ZM2 19.1401V8.84249H30V19.1401C30 20.0574 29.2538 20.801 28.3333 20.801H3.66667C2.74619 20.801 2 20.0574 2 19.1401ZM2 6.84941V3.85979C2 2.9425 2.74619 2.19889 3.66667 2.19889H28.3333C29.2538 2.19889 30 2.9425 30 3.85979V6.84941H2Z" fill="#5B8DE8"/>
                          </svg>
                        </div>

                        {/* Opção PIX */}
                        <div 
                           className={`flex items-center justify-center w-[100px] h-[57px] border rounded-lg cursor-pointer`}
                           style={{
                             backgroundColor: paymentData.method === 'pix' ? `${checkoutSettings.cor_barra}20` : 'white',
                             borderColor: paymentData.method === 'pix' ? checkoutSettings.cor_barra : '#e5e7eb',
                             border: selectedElement === 'input-pix' ? `3px solid ${checkoutSettings.cor_barra}` : `1px solid ${paymentData.method === 'pix' ? checkoutSettings.cor_barra : '#e5e7eb'}`,
                             boxShadow: selectedElement === 'input-pix' ? `0 0 0 2px ${checkoutSettings.cor_barra}40` : 'none'
                           }}
                           onClick={(e) => {
                             e.stopPropagation();
                             if (selectedElement === 'input-pix') {
                               setSelectedElement(null);
                             } else {
                               setSelectedElement('input-pix');
                               handlePaymentChange('method', 'pix');
                             }
                           }}
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
                            <div className="relative">
                              <Input
                                id="cardNumber"
                                type="text"
                                placeholder={cardValidation.cardType === 'amex' ? '1234 567890 12345' : '1234 5678 9012 3456'}
                                value={paymentData.cardNumber}
                                onChange={(e) => handlePaymentChange('cardNumber', e.target.value)}
                                className={`w-full pr-12 ${
                                  cardValidation.error ? 'border-red-500 focus:border-red-500' : 
                                  cardValidation.isValid ? 'border-green-500 focus:border-green-500' : ''
                                }`}
                                required
                              />
                              {/* Ícone do tipo de cartão */}
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                {cardValidation.cardType === 'visa' && (
                                  <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">VISA</div>
                                )}
                                {cardValidation.cardType === 'mastercard' && (
                                  <div className="w-8 h-5 bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold">MC</div>
                                )}
                                {cardValidation.cardType === 'amex' && (
                                  <div className="w-8 h-5 bg-blue-800 rounded text-white text-xs flex items-center justify-center font-bold">AMEX</div>
                                )}
                                {cardValidation.isValid && (
                                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                            {cardValidation.error && (
                              <p className="text-sm text-red-600 mt-1">{cardValidation.error}</p>
                            )}
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
                              required
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
                                required
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="cvv" className="text-sm font-medium text-gray-700">CVV</Label>
                              <Input
                                id="cvv"
                                type="text"
                                placeholder={cardValidation.cardType === 'amex' ? '1234' : '123'}
                                value={paymentData.cvv}
                                onChange={(e) => handlePaymentChange('cvv', e.target.value)}
                                className="w-full"
                                maxLength={cardValidation.cardType === 'amex' ? 4 : 3}
                                required
                              />
                              <p className="text-xs text-gray-500">
                                {cardValidation.cardType === 'amex' ? '4 dígitos no verso do cartão' : '3 dígitos no verso do cartão'}
                              </p>
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
                       className="w-full mt-6 text-white font-semibold py-3 text-base cursor-pointer"
                       style={{ 
                         backgroundColor: checkoutSettings.cor_botao,
                         borderColor: checkoutSettings.cor_botao,
                         border: selectedElement === 'button' ? `3px solid ${checkoutSettings.cor_barra}` : `1px solid ${checkoutSettings.cor_botao}`,
                         boxShadow: selectedElement === 'button' ? `0 0 0 2px ${checkoutSettings.cor_barra}40` : 'none'
                       }}
                       onMouseEnter={(e) => {
                         const target = e.target as HTMLElement;
                         target.style.backgroundColor = `${checkoutSettings.cor_botao}dd`;
                       }}
                       onMouseLeave={(e) => {
                         const target = e.target as HTMLElement;
                         target.style.backgroundColor = checkoutSettings.cor_botao || '#10b981';
                       }}
                       onClick={(e) => {
                         e.preventDefault();
                         setSelectedElement(selectedElement === 'button' ? null : 'button');
                       }}
                       disabled={!addressLoaded}
                     >
                       Finalizar Compra
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
                  {checkoutData.products.map((product, index) => (
                    <div key={product.id || index} className="flex items-center space-x-4">
                      <img 
                        src={product.image || 'https://via.placeholder.com/64x64'} 
                        alt={product.title} 
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-800 leading-tight">
                          {product.title}
                          {product.variant_title && (
                            <span className="text-xs text-gray-500 block">{product.variant_title}</span>
                          )}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="w-8 h-8 flex items-center justify-center border rounded">
                          <span className="text-lg">-</span>
                        </button>
                        <span className="w-8 text-center">{product.quantity}</span>
                        <button className="w-8 h-8 flex items-center justify-center border rounded">
                          <span className="text-lg">+</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  <hr />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-800">
                        {checkoutData.currency === 'BRL' ? 'R$' : checkoutData.currency} {checkoutData.subtotal_price.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Frete</span>
                      <span className="text-gray-800">
                        {selectedFrete ? (
                          (() => {
                            const valorFrete = getFreteValue(selectedFrete, checkoutData.total_price);
                            return valorFrete === 0 ? 'Grátis' : `R$ ${valorFrete.toFixed(2).replace('.', ',')}`;
                          })()
                        ) : 'Grátis'}
                      </span>
                    </div>
                  </div>

                  <hr />

                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>
                      {(() => {
                        const valorFrete = selectedFrete ? getFreteValue(selectedFrete, checkoutData.total_price) : 0;
                        const totalComFrete = checkoutData.total_price + valorFrete;
                        return `${checkoutData.currency === 'BRL' ? 'R$' : checkoutData.currency} ${totalComFrete.toFixed(2).replace('.', ',')}`;
                      })()}
                    </span>
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
        </div>
      </footer>
    </div>
  );
}