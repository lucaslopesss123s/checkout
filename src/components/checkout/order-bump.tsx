'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

interface OrderBumpProps {
  checkoutId: string;
  lojaId?: string;
}

interface OrderBump {
  id: string;
  id_loja: string;
  nome: string;
  todos_produtos: boolean;
  produtos_aplicados: string[];
  produto_id: string;
  tipo_desconto: 'percentual' | 'fixo';
  valor_desconto: number;
  preco_final: number;
  ativo: boolean;
}

interface Produto {
  id: string;
  name: string;
  price: number;
  image?: string;
}

export const OrderBumpComponent = ({ checkoutId, lojaId: propLojaId }: OrderBumpProps) => {
  const [orderBump, setOrderBump] = useState<OrderBump | null>(null);
  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(false);
  const [lojaId, setLojaId] = useState<string>('');
  const [carrinhoId, setCarrinhoId] = useState<string>('');

  // Buscar informações do checkout para obter o ID da loja
  useEffect(() => {
    const fetchCheckoutInfo = async () => {
      // Se lojaId foi passado como prop, usar diretamente
      if (propLojaId) {
        console.log('OrderBump: Usando lojaId da prop:', propLojaId);
        setLojaId(propLojaId);
        fetchOrderBump(propLojaId);
        return;
      }
      
      if (!checkoutId) {
        console.log('OrderBump: checkoutId não fornecido');
        return;
      }
      
      console.log('OrderBump: Buscando informações do checkout:', checkoutId);
      
      try {
        setLoading(true);
        // Aqui assumimos que temos uma rota para buscar informações do checkout pelo ID
        const response = await fetch(`/api/checkout/${checkoutId}`);
        
        console.log('OrderBump: Response status:', response.status);
        
        if (response.ok) {
          const checkoutInfo = await response.json();
          console.log('OrderBump: Checkout info recebida:', checkoutInfo);
          
          setLojaId(checkoutInfo.lojaId);
          setCarrinhoId(checkoutInfo.id);
          
          // Após obter o ID da loja, buscar os order bumps disponíveis
          if (checkoutInfo.lojaId) {
            console.log('OrderBump: Buscando order bumps para loja:', checkoutInfo.lojaId);
            fetchOrderBump(checkoutInfo.lojaId, checkoutInfo.produtoId);
          } else {
            console.log('OrderBump: lojaId não encontrado no checkout');
          }
        } else {
          console.error('OrderBump: Erro na resposta da API checkout:', response.status);
        }
      } catch (error) {
        console.error('OrderBump: Erro ao buscar informações do checkout:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCheckoutInfo();
  }, [checkoutId, propLojaId]);

  // Buscar Order Bump aplicável
  const fetchOrderBump = async (id_loja: string, produto_id?: string) => {
    if (!id_loja) {
      console.log('OrderBump: id_loja não fornecido');
      return;
    }
    
    console.log('OrderBump: Fazendo requisição para API order-bump:', `/api/marketing/order-bump?id_loja=${id_loja}`);
    
    try {
      setLoading(true);
      const response = await fetch(`/api/marketing/order-bump?id_loja=${id_loja}`);
      
      console.log('OrderBump: Response status da API order-bump:', response.status);
      
      if (response.ok) {
        const orderBumps = await response.json();
        console.log('OrderBump: Order bumps recebidos:', orderBumps);
        
        // Filtrar order bumps ativos
        const activeOrderBumps = orderBumps.filter((ob: OrderBump) => ob.ativo);
        console.log('OrderBump: Order bumps ativos:', activeOrderBumps);
        
        if (activeOrderBumps.length > 0) {
          // Verificar se há um order bump específico para o produto atual
          let applicableOrderBump = null;
          
          if (produto_id) {
            console.log('OrderBump: Procurando order bump específico para produto:', produto_id);
            applicableOrderBump = activeOrderBumps.find(
              (ob: OrderBump) => !ob.todos_produtos && ob.produtos_aplicados.includes(produto_id)
            );
            console.log('OrderBump: Order bump específico encontrado:', applicableOrderBump);
          }
          
          // Se não encontrou específico, procurar um que se aplica a todos os produtos
          if (!applicableOrderBump) {
            console.log('OrderBump: Procurando order bump para todos os produtos');
            applicableOrderBump = activeOrderBumps.find((ob: OrderBump) => ob.todos_produtos);
            console.log('OrderBump: Order bump para todos os produtos encontrado:', applicableOrderBump);
          }
          
          if (applicableOrderBump) {
            console.log('OrderBump: Order bump aplicável encontrado:', applicableOrderBump);
            setOrderBump(applicableOrderBump);
            // Buscar detalhes do produto do order bump
            fetchProduto(id_loja, applicableOrderBump.produto_id);
          } else {
            console.log('OrderBump: Nenhum order bump aplicável encontrado');
          }
        } else {
          console.log('OrderBump: Nenhum order bump ativo encontrado');
        }
      } else {
        console.error('OrderBump: Erro na resposta da API order-bump:', response.status);
        const errorText = await response.text();
        console.error('OrderBump: Detalhes do erro:', errorText);
      }
    } catch (error) {
      console.error('OrderBump: Erro ao buscar order bump:', error);
    } finally {
      setLoading(false);
    }
  };

  // Buscar detalhes do produto
  const fetchProduto = async (id_loja: string, produto_id: string) => {
    if (!id_loja || !produto_id) {
      console.log('OrderBump: id_loja ou produto_id não fornecidos para fetchProduto');
      return;
    }
    
    console.log('OrderBump: Buscando produto:', produto_id, 'da loja:', id_loja);
    
    try {
      const response = await fetch(`/api/products/${produto_id}?id_loja=${id_loja}`);
      
      console.log('OrderBump: Response status da API produto:', response.status);
      
      if (response.ok) {
        const produtoData = await response.json();
        console.log('OrderBump: Produto recebido:', produtoData);
        setProduto(produtoData);
      } else {
        console.error('OrderBump: Erro ao buscar produto:', response.status);
        const errorText = await response.text();
        console.error('OrderBump: Detalhes do erro do produto:', errorText);
      }
    } catch (error) {
      console.error('OrderBump: Erro ao buscar produto:', error);
    }
  };

  // Formatar preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Calcular desconto
  const calculateDiscount = () => {
    if (!orderBump || !produto) return 0;
    
    if (orderBump.tipo_desconto === 'percentual') {
      return produto.price * (orderBump.valor_desconto / 100);
    } else {
      return orderBump.valor_desconto;
    }
  };

  // Calcular preço final
  const calculateFinalPrice = () => {
    if (!orderBump || !produto) return 0;
    
    return produto.price - calculateDiscount();
  };

  // Adicionar ao carrinho quando selecionado
  const handleChange = (checked: boolean) => {
    setSelected(checked);
    
    if (checked && orderBump) {
      handleAddToCart();
    } else if (!checked && orderBump) {
      handleRemoveFromCart();
    }
  };

  // Adicionar produto do Order Bump ao carrinho
  const handleAddToCart = async () => {
    if (!orderBump || !produto || !carrinhoId) return;
    
    try {
      setLoading(true);
      
      // Adicionar produto ao carrinho
      const response = await fetch(`/api/checkout/${carrinhoId}/add-item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          produtoId: orderBump.produto_id,
          quantidade: 1,
          precoUnitario: orderBump.preco_final,
          isOrderBump: true
        }),
      });
      
      if (!response.ok) {
        console.error('Erro ao adicionar produto ao carrinho');
        setSelected(false);
      }
    } catch (error) {
      console.error('Erro ao adicionar produto ao carrinho:', error);
      setSelected(false);
    } finally {
      setLoading(false);
    }
  };
  
  // Remover produto do Order Bump do carrinho
  const handleRemoveFromCart = async () => {
    if (!orderBump || !produto || !carrinhoId) return;
    
    try {
      setLoading(true);
      
      // Remover produto do carrinho
      const response = await fetch(`/api/checkout/${carrinhoId}/remove-item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          produtoId: orderBump.produto_id,
          isOrderBump: true
        }),
      });
      
      if (!response.ok) {
        console.error('Erro ao remover produto do carrinho');
        setSelected(true);
      }
    } catch (error) {
      console.error('Erro ao remover produto do carrinho:', error);
      setSelected(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {loading ? (
        <div className="p-4 text-center">
          <p>Carregando order bump...</p>
        </div>
      ) : orderBump && produto ? (
        <Card className="border-2 border-green-500 mb-4">
          <CardContent className="p-4">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Checkbox 
                  id="order-bump" 
                  checked={selected} 
                  onCheckedChange={handleChange} 
                  disabled={loading}
                />
              </div>
              <div className="flex-grow">
                <Label htmlFor="order-bump" className="font-medium text-green-700 cursor-pointer">
                  {orderBump.nome}
                </Label>
                <div className="flex items-center mt-2">
                  {produto.image && (
                    <img 
                      src={produto.image} 
                      alt={produto.name} 
                      className="w-16 h-16 object-cover rounded mr-3" 
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium">{produto.name}</p>
                    <div className="flex items-center mt-1">
                      <p className="text-sm text-gray-500 line-through mr-2">
                        {formatPrice(produto.price)}
                      </p>
                      <p className="text-sm font-semibold text-green-600">
                        {formatPrice(orderBump.preco_final)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="p-2 text-center text-gray-500 text-sm">
          {/* Debug info - remover em produção */}
          <p>Debug: OrderBump não encontrado</p>
          <p>CheckoutId: {checkoutId}</p>
          <p>LojaId: {lojaId}</p>
          <p>OrderBump: {orderBump ? 'Encontrado' : 'Não encontrado'}</p>
          <p>Produto: {produto ? 'Encontrado' : 'Não encontrado'}</p>
        </div>
      )}
    </div>
  );
}