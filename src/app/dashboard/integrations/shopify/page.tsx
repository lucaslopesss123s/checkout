
'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { useStore } from "@/contexts/store-context"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, Download, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

type LojaAdmin = {
  id: string
  Nome: string
  user_id: string
  createdAt: string
  updatedAt: string
}

export default function ShopifyIntegrationPage() {
    const { user } = useAuth();
    const { stores, selectedStore } = useStore();
    const { toast } = useToast();
    const [isImporting, setIsImporting] = useState(false);
    const username = user?.displayName || user?.email?.split('@')[0] || 'Usuário';

    const [formData, setFormData] = useState({
        shopifyDomain: '',
        apiToken: '',
        apiKey: '',
        apiSecret: '',
        skipCart: false,
        importCoupons: false
    });

    // Carregar credenciais da loja selecionada
    const loadCredentials = async () => {
        if (!selectedStore || !user) {
            // Limpar campos se não há loja selecionada
            setFormData({
                shopifyDomain: '',
                apiToken: '',
                apiKey: '',
                apiSecret: '',
                skipCart: false,
                importCoupons: false
            });
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/shopify/credentials?storeId=${selectedStore.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            
            if (response.ok) {
                const credentials = await response.json();
                setFormData({
                    shopifyDomain: credentials.dominio_api || '',
                    apiToken: credentials.token_api || '',
                    apiKey: credentials.chave_api || '',
                    apiSecret: credentials.chave_secreta || '',
                    skipCart: false,
                    importCoupons: false
                });
            } else {
                // Limpar campos se não há credenciais para esta loja
                setFormData({
                    shopifyDomain: '',
                    apiToken: '',
                    apiKey: '',
                    apiSecret: '',
                    skipCart: false,
                    importCoupons: false
                });
            }
        } catch (error) {
            console.error('Erro ao carregar credenciais:', error);
            // Limpar campos em caso de erro
            setFormData({
                shopifyDomain: '',
                apiToken: '',
                apiKey: '',
                apiSecret: '',
                skipCart: false,
                importCoupons: false
            });
        }
    };
    
    useEffect(() => {
        loadCredentials();
    }, [selectedStore, user]);

    const handleSaveCredentials = async () => {
        if (!formData.shopifyDomain || !formData.apiToken || !formData.apiKey || !formData.apiSecret) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Por favor, preencha todos os campos obrigatórios.",
            });
            return;
        }

        if (!selectedStore) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Por favor, selecione uma loja.",
            });
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/shopify/credentials', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    shopifyDomain: formData.shopifyDomain,
                    apiToken: formData.apiToken,
                    apiKey: formData.apiKey,
                    apiSecret: formData.apiSecret,
                    storeId: selectedStore.id
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Falha ao salvar credenciais.');
            }

            toast({
                title: "Sucesso!",
                description: "Credenciais Shopify salvas com sucesso.",
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido';
            toast({
                variant: "destructive",
                title: "Erro ao salvar credenciais",
                description: errorMessage,
            });
        }
    };

    const handleImport = async () => {
        if (!formData.shopifyDomain || !formData.apiToken) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Por favor, preencha o domínio e o token de API.",
            });
            return;
        }

        if (!selectedStore) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Por favor, selecione uma loja para importar os produtos.",
            });
            return;
        }

        setIsImporting(true);
        try {
            const response = await fetch('/api/shopify/import-products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    shopifyDomain: formData.shopifyDomain,
                    apiToken: formData.apiToken,
                    storeId: selectedStore.id
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Falha ao importar produtos.');
            }

            toast({
                title: "Sucesso!",
                description: `${result.count || 0} produtos foram importados. Atualize a página de produtos para vê-los.`,
            });

        } catch (error) {
             const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido';
             toast({
                variant: "destructive",
                title: "Erro na importação",
                description: errorMessage,
             });
        } finally {
            setIsImporting(false);
        }
    }


    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Shopify</h1>
                <p className="text-muted-foreground">Plataforma global de e-commerce.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Olá {username}</CardTitle>
                            <CardDescription>Vamos instalar o checkout transparente da LojaFacil na sua loja Shopify.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="shopify-domain">Domínio MyShopify</Label>
                                <div className="flex items-center">
                                    <Input 
                                        id="shopify-domain" 
                                        placeholder="sua-loja" 
                                        value={formData.shopifyDomain}
                                        onChange={(e) => setFormData({...formData, shopifyDomain: e.target.value})}
                                    />
                                    <span className="ml-2 px-3 py-2 bg-muted text-muted-foreground rounded-r-md border border-l-0 border-input">.myshopify.com</span>
                                </div>
                                <p className="text-xs text-muted-foreground">A URL não pode conter os seguintes valores: myshopify.com www, https://, http://, /, .b</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="api-token">Token de acesso api admin</Label>
                                <Input 
                                    id="api-token" 
                                    type="password" 
                                    value={formData.apiToken}
                                    onChange={(e) => setFormData({...formData, apiToken: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="api-key">Chave de API</Label>
                                <Input 
                                    id="api-key" 
                                    value={formData.apiKey}
                                    onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="api-secret">Chave secreta da api</Label>
                                <Input 
                                    id="api-secret" 
                                    type="password" 
                                    value={formData.apiSecret}
                                    onChange={(e) => setFormData({...formData, apiSecret: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="store-select">Loja Selecionada</Label>
                                <div className="p-3 bg-muted rounded-md">
                                    <p className="font-medium">{selectedStore?.Nome || 'Nenhuma loja selecionada'}</p>
                                    <p className="text-xs text-muted-foreground">Use o seletor de loja no menu superior para alterar a loja.</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="skip-cart" 
                                    checked={formData.skipCart}
                                    onCheckedChange={(checked) => setFormData({...formData, skipCart: !!checked})}
                                />
                                <Label htmlFor="skip-cart" className="font-normal">Pular carrinho</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="import-coupons" 
                                    checked={formData.importCoupons}
                                    onCheckedChange={(checked) => setFormData({...formData, importCoupons: !!checked})}
                                />
                                <Label htmlFor="import-coupons" className="font-normal">Importar cupons da Shopify</Label>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="flex justify-end">
                        <Button onClick={handleSaveCredentials}>Salvar Credenciais</Button>
                    </div>
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Status da integração</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select defaultValue="ativo">
                                <SelectTrigger className="w-full">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <SelectValue placeholder="Selecione o status" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ativo">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            <span>Ativo</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="inativo">Inativo</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Sincronização</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <Button className="w-full" onClick={handleImport} disabled={isImporting}>
                               {isImporting ? (
                                   <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                               ) : (
                                   <Download className="mr-2 h-4 w-4"/>
                               )}
                               Importar Produtos
                           </Button>
                           <p className="text-xs text-muted-foreground">Importe seus produtos cadastrados no Shopify para a LojaFacil.</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Está com dúvidas?</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <Button variant="link" className="p-0">
                                Aprenda como integrar sua loja com o Shopify.
                           </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
