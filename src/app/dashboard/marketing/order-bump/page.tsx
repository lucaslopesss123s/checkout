
'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/contexts/store-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
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

export default function OrderBumpPage() {
  const { selectedStore } = useStore();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orderBumps, setOrderBumps] = useState<OrderBump[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  const [currentOrderBump, setCurrentOrderBump] = useState<OrderBump>({
    id: '',
    id_loja: selectedStore?.id || '',
    nome: '',
    todos_produtos: true,
    produtos_aplicados: [],
    produto_id: '',
    tipo_desconto: 'percentual',
    valor_desconto: 0,
    preco_final: 0,
    ativo: true
  });

  // Buscar produtos da loja
  const fetchProducts = async () => {
    if (!selectedStore) return;
    
    try {
      const response = await fetch(`/api/produtos?id_loja=${selectedStore.id}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os produtos."
      });
    }
  };

  // Buscar Order Bumps existentes
  const fetchOrderBumps = async () => {
    if (!selectedStore) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/marketing/order-bump?id_loja=${selectedStore.id}`);
      if (response.ok) {
        const data = await response.json();
        setOrderBumps(data);
      }
    } catch (error) {
      console.error('Erro ao buscar order bumps:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os order bumps."
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados quando a loja for selecionada
  useEffect(() => {
    if (selectedStore) {
      fetchProducts();
      fetchOrderBumps();
      setCurrentOrderBump(prev => ({ ...prev, id_loja: selectedStore.id }));
    }
  }, [selectedStore]);

  // Calcular preço final com desconto
  const calculateFinalPrice = () => {
    const selectedProduct = products.find(p => p.id === currentOrderBump.produto_id);
    if (!selectedProduct) return 0;
    
    const price = selectedProduct.price;
    if (currentOrderBump.tipo_desconto === 'percentual') {
      return price * (1 - (currentOrderBump.valor_desconto / 100));
    } else {
      return Math.max(0, price - currentOrderBump.valor_desconto);
    }
  };

  // Atualizar preço final quando os valores mudarem
  useEffect(() => {
    if (currentOrderBump.produto_id && currentOrderBump.valor_desconto) {
      const finalPrice = calculateFinalPrice();
      setCurrentOrderBump(prev => ({ ...prev, preco_final: finalPrice }));
    }
  }, [currentOrderBump.produto_id, currentOrderBump.valor_desconto, currentOrderBump.tipo_desconto]);

  // Salvar Order Bump
  const saveOrderBump = async () => {
    if (!selectedStore) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nenhuma loja selecionada."
      });
      return;
    }
    
    if (!currentOrderBump.nome) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, informe um nome para o Order Bump."
      });
      return;
    }
    
    if (!currentOrderBump.produto_id) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, selecione um produto para o Order Bump."
      });
      return;
    }
    
    setSaving(true);
    try {
      const method = currentOrderBump.id ? 'PUT' : 'POST';
      const url = currentOrderBump.id 
        ? `/api/marketing/order-bump/${currentOrderBump.id}` 
        : '/api/marketing/order-bump';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentOrderBump),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Sucesso",
          description: currentOrderBump.id 
            ? "Order Bump atualizado com sucesso!" 
            : "Order Bump criado com sucesso!"
        });
        
        // Atualizar lista de order bumps
        fetchOrderBumps();
        
        // Limpar formulário
        resetForm();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao salvar Order Bump');
      }
    } catch (error: any) {
      console.error('Erro ao salvar order bump:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível salvar o Order Bump."
      });
    } finally {
      setSaving(false);
    }
  };

  // Editar Order Bump existente
  const editOrderBump = (orderBump: OrderBump) => {
    setCurrentOrderBump(orderBump);
    setShowForm(true);
  };

  // Excluir Order Bump
  const deleteOrderBump = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este Order Bump?')) return;
    
    try {
      const response = await fetch(`/api/marketing/order-bump/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Order Bump excluído com sucesso!"
        });
        
        // Atualizar lista de order bumps
        fetchOrderBumps();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao excluir Order Bump');
      }
    } catch (error: any) {
      console.error('Erro ao excluir order bump:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível excluir o Order Bump."
      });
    }
  };

  // Resetar formulário
  const resetForm = () => {
    setCurrentOrderBump({
      id: '',
      id_loja: selectedStore?.id || '',
      nome: '',
      todos_produtos: true,
      produtos_aplicados: [],
      produto_id: '',
      tipo_desconto: 'percentual',
      valor_desconto: 0,
      preco_final: 0,
      ativo: true
    });
    setShowForm(false);
  };

  // Formatar preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Order Bump</h1>
          <p className="text-muted-foreground">
            Configure ofertas adicionais para exibir durante o checkout.
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Order Bump
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{currentOrderBump.id ? 'Editar' : 'Novo'} Order Bump</CardTitle>
            <CardDescription>
              Configure uma oferta adicional para exibir durante o checkout.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Order Bump</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Oferta especial"
                  value={currentOrderBump.nome}
                  onChange={(e) => setCurrentOrderBump(prev => ({ ...prev, nome: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="todos_produtos"
                    checked={currentOrderBump.todos_produtos}
                    onCheckedChange={(checked) => 
                      setCurrentOrderBump(prev => ({ 
                        ...prev, 
                        todos_produtos: checked === true,
                        produtos_aplicados: []
                      }))
                    }
                  />
                  <Label htmlFor="todos_produtos">Aplicar em todos os produtos</Label>
                </div>
              </div>
              
              {!currentOrderBump.todos_produtos && (
                <div className="space-y-2">
                  <Label>Produtos onde será aplicado</Label>
                  <div className="border rounded-md p-4 max-h-40 overflow-y-auto">
                    {products.length > 0 ? (
                      products.map(product => (
                        <div key={product.id} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`product-${product.id}`}
                            checked={currentOrderBump.produtos_aplicados.includes(product.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setCurrentOrderBump(prev => ({
                                  ...prev,
                                  produtos_aplicados: [...prev.produtos_aplicados, product.id]
                                }));
                              } else {
                                setCurrentOrderBump(prev => ({
                                  ...prev,
                                  produtos_aplicados: prev.produtos_aplicados.filter(id => id !== product.id)
                                }));
                              }
                            }}
                          />
                          <Label htmlFor={`product-${product.id}`}>{product.name}</Label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum produto encontrado.</p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="produto_id">Produto do Order Bump</Label>
                <Select
                  value={currentOrderBump.produto_id}
                  onValueChange={(value) => setCurrentOrderBump(prev => ({ ...prev, produto_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - {formatPrice(product.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo_desconto">Tipo de Desconto</Label>
                  <Select
                    value={currentOrderBump.tipo_desconto}
                    onValueChange={(value: 'percentual' | 'fixo') => 
                      setCurrentOrderBump(prev => ({ ...prev, tipo_desconto: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentual">Percentual (%)</SelectItem>
                      <SelectItem value="fixo">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="valor_desconto">
                    {currentOrderBump.tipo_desconto === 'percentual' ? 'Percentual de Desconto' : 'Valor do Desconto'}
                  </Label>
                  <Input
                    id="valor_desconto"
                    type="number"
                    placeholder={currentOrderBump.tipo_desconto === 'percentual' ? "Ex: 10" : "Ex: 15.90"}
                    value={currentOrderBump.valor_desconto || ''}
                    onChange={(e) => setCurrentOrderBump(prev => ({ 
                      ...prev, 
                      valor_desconto: parseFloat(e.target.value) || 0 
                    }))}
                  />
                </div>
              </div>
              
              {currentOrderBump.produto_id && currentOrderBump.valor_desconto > 0 && (
                <div className="p-4 bg-muted rounded-md">
                  <p className="font-medium">Preço final: {formatPrice(currentOrderBump.preco_final)}</p>
                  <p className="text-sm text-muted-foreground">
                    Preço original: {formatPrice(products.find(p => p.id === currentOrderBump.produto_id)?.price || 0)}
                  </p>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={currentOrderBump.ativo}
                  onCheckedChange={(checked) => 
                    setCurrentOrderBump(prev => ({ ...prev, ativo: checked }))
                  }
                />
                <Label htmlFor="ativo">Order Bump ativo</Label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={resetForm}>Cancelar</Button>
            <Button onClick={saveOrderBump} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
          </CardFooter>
        </Card>
      )}

      {!showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Order Bumps Configurados</CardTitle>
            <CardDescription>
              Gerencie suas ofertas adicionais para o checkout.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : orderBumps.length > 0 ? (
              <div className="space-y-4">
                {orderBumps.map(orderBump => (
                  <div key={orderBump.id} className="border rounded-md p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{orderBump.nome}</h3>
                        <p className="text-sm text-muted-foreground">
                          {orderBump.todos_produtos 
                            ? 'Aplicado em todos os produtos' 
                            : `Aplicado em ${orderBump.produtos_aplicados.length} produtos`}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => editOrderBump(orderBump)}>
                          Editar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteOrderBump(orderBump.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Produto: </span>
                        {products.find(p => p.id === orderBump.produto_id)?.name || 'Produto não encontrado'}
                      </div>
                      <div>
                        <span className="font-medium">Preço final: </span>
                        {formatPrice(orderBump.preco_final)}
                      </div>
                      <div>
                        <span className="font-medium">Desconto: </span>
                        {orderBump.tipo_desconto === 'percentual' 
                          ? `${orderBump.valor_desconto}%` 
                          : formatPrice(orderBump.valor_desconto)}
                      </div>
                      <div>
                        <span className="font-medium">Status: </span>
                        <span className={orderBump.ativo ? 'text-green-600' : 'text-red-600'}>
                          {orderBump.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">Nenhum Order Bump configurado.</p>
                <Button className="mt-4" onClick={() => setShowForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Order Bump
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
