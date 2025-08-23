
"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Copy, 
  Download, 
  ExternalLink, 
  Settings, 
  Code, 
  CheckCircle, 
  AlertCircle,
  Zap,
  Globe
} from 'lucide-react'
import { useStore } from '@/contexts/store-context'
import { useToast } from '@/hooks/use-toast'

interface ShopifyConfig {
  id?: string
  chave_api: string
  chave_secreta: string
  token_api: string
  dominio_api: string
  id_loja: string
}

interface CheckoutSettings {
  theme: string
  logo?: string
  favicon?: string
  cor_barra?: string
  cor_botao?: string
  contagem_regressiva: boolean
  barra_texto?: string
}

export default function ShopifyIntegrationPage() {
  const { selectedStore } = useStore()
  const { toast } = useToast()
  const [config, setConfig] = useState<ShopifyConfig>({
    chave_api: '',
    chave_secreta: '',
    token_api: '',
    dominio_api: '',
    id_loja: selectedStore?.id || ''
  })
  const [settings, setSettings] = useState<CheckoutSettings>({
    theme: 'default',
    cor_barra: '#3b82f6',
    cor_botao: '#10b981',
    contagem_regressiva: false
  })
  const [loading, setLoading] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [generatedScript, setGeneratedScript] = useState('')

  useEffect(() => {
    if (selectedStore) {
      setConfig(prev => ({ ...prev, id_loja: selectedStore.id }))
      loadExistingConfig()
    }
  }, [selectedStore])

  const loadExistingConfig = async () => {
    if (!selectedStore) return
    
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      // Buscar configuração Shopify existente
      const shopifyResponse = await fetch(`/api/shopify/stores?storeId=${selectedStore.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (shopifyResponse.ok) {
        const existingConfig = await shopifyResponse.json()
        
        setConfig({
          id: existingConfig.id,
          chave_api: existingConfig.chave_api || '',
          chave_secreta: existingConfig.chave_secreta || '',
          token_api: existingConfig.token_api || '',
          dominio_api: existingConfig.dominio_api || '',
          id_loja: selectedStore.id
        })
        setConnectionStatus('success')
        
        toast({
          title: "Configuração carregada",
          description: "Configuração Shopify existente foi carregada automaticamente",
          variant: "default"
        })
      }

      // Buscar configurações de checkout existentes
      const checkoutResponse = await fetch(`/api/shopify/config?id_loja=${selectedStore.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (checkoutResponse.ok) {
        const checkoutData = await checkoutResponse.json()
        if (checkoutData.checkout_configured && checkoutData.config) {
          setSettings({
            theme: checkoutData.config.Tema || 'default',
            logo: checkoutData.config.Logo || '',
            favicon: checkoutData.config.Favicon || '',
            cor_barra: checkoutData.config.Corbarra || '#3b82f6',
            cor_botao: checkoutData.config.Corbotao || '#10b981',
            contagem_regressiva: checkoutData.config.Contagemregressiva || false,
            barra_texto: checkoutData.config.BarraTexto || ''
          })
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações existentes:', error)
    }
  }

  const handleConfigChange = (field: keyof ShopifyConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  const handleSettingsChange = (field: keyof CheckoutSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const testConnection = async () => {
    if (!config.dominio_api) {
      toast({
        title: "Erro",
        description: "Domínio da API é obrigatório",
        variant: "destructive"
      })
      return
    }

    if (!selectedStore) {
      toast({
        title: "Erro",
        description: "Selecione uma loja primeiro",
        variant: "destructive"
      })
      return
    }

    setTestingConnection(true)
    
    try {
      // Primeiro, salvar as credenciais
      const token = localStorage.getItem('token')
      if (!token) {
        toast({
          title: "Erro",
          description: "Token de autenticação não encontrado",
          variant: "destructive"
        })
        return
      }

      // Salvar configuração temporariamente para teste
      const saveResponse = await fetch('/api/shopify/stores', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...config,
          id_loja: selectedStore.id
        })
      })

      if (!saveResponse.ok) {
        throw new Error('Erro ao salvar configuração para teste')
      }
      
      // Testar conexão
      const response = await fetch(`/api/shopify/config?domain=${config.dominio_api}`)
      const result = await response.json()
      
      if (result.configured) {
        setConnectionStatus('success')
        toast({
          title: "Sucesso",
          description: "Conexão com Shopify estabelecida com sucesso!"
        })
      } else {
        setConnectionStatus('error')
        toast({
          title: "Erro",
          description: "Não foi possível conectar com a loja Shopify",
          variant: "destructive"
        })
      }
    } catch (error) {
      setConnectionStatus('error')
      toast({
        title: "Erro",
        description: "Erro ao testar conexão",
        variant: "destructive"
      })
    } finally {
      setTestingConnection(false)
    }
  }

  const saveConfiguration = async () => {
    if (!selectedStore) {
      toast({
        title: "Erro",
        description: "Selecione uma loja primeiro",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast({
          title: "Erro",
          description: "Token de autenticação não encontrado",
          variant: "destructive"
        })
        return
      }

      // Salvar configuração da loja Shopify
      const shopifyResponse = await fetch('/api/shopify/stores', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...config,
          id_loja: selectedStore.id
        })
      })
      
      if (!shopifyResponse.ok) {
        throw new Error('Erro ao salvar configuração Shopify')
      }
      
      // Salvar configurações do checkout
      const settingsResponse = await fetch('/api/shopify/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: config.dominio_api,
          settings
        })
      })
      
      if (!settingsResponse.ok) {
        throw new Error('Erro ao salvar configurações do checkout')
      }
      
      toast({
        title: "Sucesso",
        description: "Configuração salva com sucesso!"
      })
      
      generateScript()
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configuração",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const generateScript = () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'
    
    const script = `
<!-- Script de Integração Shopify - Checkout Personalizado -->
<script>
(function() {
    'use strict';
    
    // Configurações da integração
    const CHECKOUT_API_URL = '${baseUrl}/api/shopify/checkout';
    const CONFIG_API_URL = '${baseUrl}/api/shopify/config';
    const SHOP_DOMAIN = '${config.dominio_api}';
    
    // Função para obter itens do carrinho
    async function getCartItems() {
        try {
            const response = await fetch('/cart.js');
            const cart = await response.json();
            
            return cart.items.map(item => ({
                id: item.id.toString(),
                product_id: item.product_id.toString(),
                variant_id: item.variant_id.toString(),
                title: item.product_title,
                price: (item.price / 100).toFixed(2),
                quantity: item.quantity,
                image: item.image,
                variant_title: item.variant_title
            }));
        } catch (error) {
            console.error('Erro ao obter carrinho:', error);
            return [];
        }
    }
    
    // Função para redirecionar para checkout personalizado
    async function redirectToCustomCheckout() {
        try {
            const cartItems = await getCartItems();
            
            if (cartItems.length === 0) {
                alert('Seu carrinho está vazio!');
                return;
            }
            
            const checkoutData = {
                shop_domain: SHOP_DOMAIN,
                cart_items: cartItems,
                customer: window.Shopify?.customer || null,
                currency: window.Shopify?.currency?.active || 'BRL'
            };
            
            const response = await fetch(CHECKOUT_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(checkoutData)
            });
            
            const result = await response.json();
            
            if (result.success && result.checkout_url) {
                window.location.href = result.checkout_url;
            } else {
                console.error('Erro no checkout:', result.error);
                alert('Erro ao processar checkout. Tente novamente.');
            }
            
        } catch (error) {
            console.error('Erro ao redirecionar:', error);
            alert('Erro ao processar checkout. Tente novamente.');
        }
    }
    
    // Interceptar botões de checkout
    function interceptCheckoutButtons() {
        const selectors = [
            '.btn--checkout',
            '[data-testid="Checkout-button"]',
            '.cart__checkout-button',
            '.checkout-button',
            'input[type="submit"][value*="checkout" i]'
        ];
        
        selectors.forEach(selector => {
            const buttons = document.querySelectorAll(selector);
            buttons.forEach(button => {
                if (!button.dataset.customCheckout) {
                    button.dataset.customCheckout = 'true';
                    button.addEventListener('click', function(e) {
                        e.preventDefault();
                        redirectToCustomCheckout();
                    });
                }
            });
        });
    }
    
    // Inicializar quando DOM estiver pronto
    function init() {
        interceptCheckoutButtons();
        
        // Observar mudanças no DOM
        const observer = new MutationObserver(() => {
            setTimeout(interceptCheckoutButtons, 100);
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
</script>
<!-- Fim do Script de Integração -->`
    
    setGeneratedScript(script.trim())
  }

  const copyScript = () => {
    navigator.clipboard.writeText(generatedScript)
    toast({
      title: "Copiado!",
      description: "Script copiado para a área de transferência"
    })
  }

  const downloadScript = () => {
    const blob = new Blob([generatedScript], { type: 'text/javascript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'shopify-integration.js'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integração Shopify</h1>
        <p className="text-muted-foreground">
          Configure a integração com sua loja Shopify para redirecionar o checkout
        </p>
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            Configuração
          </TabsTrigger>
          <TabsTrigger value="script" className="flex items-center">
            <Code className="mr-2 h-4 w-4" />
            Script
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex items-center">
            <Globe className="mr-2 h-4 w-4" />
            Documentação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Configurações da Loja Shopify
              </CardTitle>
              <CardDescription>
                Configure as credenciais de acesso à sua loja Shopify
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dominio">Domínio da Loja</Label>
                  <Input
                    id="dominio"
                    placeholder="minha-loja.myshopify.com"
                    value={config.dominio_api}
                    onChange={(e) => handleConfigChange('dominio_api', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="chave_api">Chave da API</Label>
                  <Input
                    id="chave_api"
                    type="password"
                    value={config.chave_api}
                    onChange={(e) => handleConfigChange('chave_api', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="chave_secreta">Chave Secreta</Label>
                  <Input
                    id="chave_secreta"
                    type="password"
                    value={config.chave_secreta}
                    onChange={(e) => handleConfigChange('chave_secreta', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="token_api">Token da API</Label>
                  <Input
                    id="token_api"
                    type="password"
                    value={config.token_api}
                    onChange={(e) => handleConfigChange('token_api', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Button 
                  onClick={testConnection} 
                  disabled={testingConnection || !config.dominio_api}
                  variant="outline"
                >
                  {testingConnection ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Testando...
                    </div>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Testar Conexão
                    </>
                  )}
                </Button>
                
                {connectionStatus === 'success' && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Conectado
                  </Badge>
                )}
                
                {connectionStatus === 'error' && (
                  <Badge variant="destructive">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Erro na Conexão
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="script" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="mr-2 h-5 w-5" />
                Script de Integração
              </CardTitle>
              <CardDescription>
                Copie este script e adicione ao seu tema Shopify
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {generatedScript ? (
                <>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <pre className="text-sm overflow-x-auto max-h-96">
                      <code>{generatedScript}</code>
                    </pre>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button onClick={copyScript}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar Script
                    </Button>
                    <Button onClick={downloadScript} variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Baixar Arquivo
                    </Button>
                  </div>
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Salve a configuração primeiro para gerar o script de integração.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="mr-2 h-5 w-5" />
                Como Instalar
              </CardTitle>
              <CardDescription>
                Siga estes passos para integrar o checkout personalizado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold">1. Configure as Credenciais</h3>
                  <p className="text-sm text-gray-600">
                    Preencha as informações da sua loja Shopify na aba "Configuração"
                  </p>
                </div>
                
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold">2. Personalize o Checkout</h3>
                  <p className="text-sm text-gray-600">
                    Ajuste as cores e textos na aba "Checkout" conforme sua marca
                  </p>
                </div>
                
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold">3. Copie o Script</h3>
                  <p className="text-sm text-gray-600">
                    Gere e copie o script de integração na aba "Script"
                  </p>
                </div>
                
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold">4. Instale no Shopify</h3>
                  <p className="text-sm text-gray-600">
                    Acesse Admin → Temas → Ações → Editar código → theme.liquid
                    <br />Adicione o script antes da tag &lt;/body&gt;
                  </p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold">5. Teste a Integração</h3>
                  <p className="text-sm text-gray-600">
                    Adicione produtos ao carrinho e teste o redirecionamento
                  </p>
                </div>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Importante:</strong> Certifique-se de que os produtos da Shopify 
                  estejam sincronizados com os produtos do seu checkout personalizado.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={saveConfiguration} disabled={loading} size="lg">
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Salvando...
            </div>
          ) : (
            'Salvar Configuração'
          )}
        </Button>
      </div>
    </div>
  )
}
