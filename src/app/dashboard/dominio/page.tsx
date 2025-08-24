'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Globe, CheckCircle, XCircle, AlertTriangle, Copy, ExternalLink, RefreshCw, Code } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useStore } from '@/contexts/store-context'

interface Domain {
  id: string
  domain: string
  status: 'pending' | 'verified' | 'failed'
  createdAt: string
  lastChecked?: string
  dnsRecords?: {
    type: string
    value: string
    verified: boolean
  }[]
}

export default function DominioPage() {
  const { selectedStore } = useStore()
  const [domains, setDomains] = useState<Domain[]>([])
  const [newDomain, setNewDomain] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (selectedStore) {
      loadDomains()
    }
  }, [selectedStore])

  const loadDomains = async () => {
    if (!selectedStore) {
      console.log('Nenhuma loja selecionada')
      return
    }
    
    try {
      const response = await fetch(`/api/dominios?id_loja=${selectedStore.id}`)
      if (response.ok) {
        const data = await response.json()
        // Converter formato da API para o formato esperado pelo componente
        const domainsFormatted = data.map((d: any) => ({
          id: d.id,
          domain: d.dominio,
          status: d.status,
          createdAt: d.createdAt,
          lastChecked: d.ultima_verificacao,
          dnsRecords: d.configuracao_dns?.ultimo_resultado ? [
            {
              type: d.configuracao_dns.ultimo_resultado.tipo || 'CNAME',
              value: d.configuracao_dns.ultimo_resultado.valor || 'checkout.lojafacil.com',
              verified: d.dns_verificado
            }
          ] : []
        }))
        setDomains(domainsFormatted)
      } else {
        console.error('Erro ao carregar domínios:', response.statusText)
      }
    } catch (error) {
      console.error('Erro ao carregar domínios:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar domínios. Tente recarregar a página.',
        variant: 'destructive'
      })
    }
  }

  const addDomain = async () => {
    if (!newDomain.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um domínio válido.',
        variant: 'destructive'
      })
      return
    }

    // Validar formato do domínio
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/
    if (!domainRegex.test(newDomain)) {
      toast({
        title: 'Domínio inválido',
        description: 'Por favor, insira um domínio válido (ex: meusite.com.br).',
        variant: 'destructive'
      })
      return
    }

    if (!selectedStore) {
      toast({
        title: 'Erro',
        description: 'Nenhuma loja selecionada.',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/dominios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dominio: newDomain,
          id_loja: selectedStore.id,
          subdominio: 'checkout'
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        const newDomainObj: Domain = {
          id: data.id,
          domain: data.dominio,
          status: data.status,
          createdAt: data.createdAt
        }
        
        setDomains(prev => [...prev, newDomainObj])
        setNewDomain('')
        
        toast({
          title: 'Domínio adicionado',
          description: 'Domínio adicionado com sucesso. Configure o DNS conforme as instruções.'
        })
      } else {
        const errorData = await response.json()
        toast({
          title: 'Erro',
          description: errorData.error || 'Erro ao adicionar domínio.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar domínio. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const verifyDomain = async (domainId: string) => {
    setIsVerifying(domainId)
    try {
      const response = await fetch(`/api/dominios/${domainId}/verificar`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        const { dominio, verificacao } = data
        
        // Atualizar o domínio na lista local
        setDomains(prev => prev.map(domain => 
          domain.id === domainId 
            ? { 
                ...domain, 
                status: dominio.status,
                lastChecked: dominio.ultima_verificacao,
                dnsRecords: verificacao.tipo ? [{
                  type: verificacao.tipo,
                  value: verificacao.valor || 'checkout.lojafacil.com',
                  verified: verificacao.verificado
                }] : []
              }
            : domain
        ))
        
        if (verificacao.verificado) {
          toast({
            title: 'Verificação bem-sucedida!',
            description: 'Domínio verificado e configurado corretamente.'
          })
        } else {
          toast({
            title: 'Verificação falhou',
            description: verificacao.erro || 'Erro na verificação DNS.',
            variant: 'destructive'
          })
        }
      } else {
        const errorData = await response.json()
        toast({
          title: 'Erro na verificação',
          description: errorData.error || 'Erro ao verificar domínio.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro na verificação',
        description: 'Erro ao verificar domínio. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setIsVerifying(null)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copiado!',
      description: 'Valor copiado para a área de transferência.'
    })
  }

  const getStatusBadge = (status: Domain['status']) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" />Verificado</Badge>
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Falhou</Badge>
      case 'pending':
      default:
        return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />Pendente</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Globe className="h-8 w-8" />
          Gerenciar Domínios
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure seus domínios personalizados para o checkout
        </p>
      </div>

      {/* Adicionar novo domínio */}
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Novo Domínio</CardTitle>
          <CardDescription>
            Adicione um domínio personalizado para seu checkout
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="domain">Domínio</Label>
              <Input
                id="domain"
                placeholder="meusite.com.br"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addDomain()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addDomain} disabled={isLoading}>
                {isLoading ? 'Adicionando...' : 'Adicionar'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instruções de configuração DNS */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração DNS</CardTitle>
          <CardDescription>
            Escolha uma das opções abaixo para configurar seu domínio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Configure os registros DNS no seu provedor de domínio antes de verificar.
            </AlertDescription>
          </Alert>
          
          {/* Opção 1: CNAME */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Opção 1 - CNAME (Recomendado)
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Tipo de Registro</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-muted px-2 py-1 rounded text-sm">CNAME</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('CNAME')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Nome/Host</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-muted px-2 py-1 rounded text-sm">checkout</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('checkout')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Valor/Destino</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-muted px-2 py-1 rounded text-sm">checkout.lojafacil.com</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('checkout.lojafacil.com')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded">
              <p><strong>Exemplo:</strong> Para o domínio "meusite.com.br", crie um registro CNAME:</p>
              <p className="mt-1">• <strong>Nome:</strong> checkout</p>
              <p>• <strong>Valor:</strong> checkout.lojafacil.com</p>
              <p className="mt-2">Resultado: <strong>checkout.meusite.com.br</strong></p>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          {/* Opção 2: Registro A */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Opção 2 - Registro A
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Tipo de Registro</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-muted px-2 py-1 rounded text-sm">A</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('A')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Nome/Host</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-muted px-2 py-1 rounded text-sm">checkout</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('checkout')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Valor/IP</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-muted px-2 py-1 rounded text-sm">181.41.200.99</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('181.41.200.99')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  * IP da VPS onde o sistema está hospedado
                </p>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground bg-green-50 p-3 rounded">
              <p><strong>Exemplo:</strong> Para o domínio "meusite.com.br", crie um registro A:</p>
              <p className="mt-1">• <strong>Nome:</strong> checkout</p>
              <p>• <strong>Valor:</strong> 181.41.200.99 (IP da VPS)</p>
              <p className="mt-2">Resultado: <strong>checkout.meusite.com.br</strong></p>
            </div>
          </div>
          
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Qual opção escolher?</strong><br/>
              • <strong>CNAME (Recomendado):</strong> Mais fácil de configurar e mantém a configuração automática<br/>
              • <strong>Registro A:</strong> Use apenas se seu provedor DNS não suportar CNAME ou por preferência técnica
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Lista de domínios */}
      <Card>
        <CardHeader>
          <CardTitle>Domínios Configurados</CardTitle>
          <CardDescription>
            Gerencie seus domínios personalizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {domains.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum domínio configurado ainda.</p>
              <p className="text-sm">Adicione seu primeiro domínio acima.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {domains.map((domain) => (
                <div key={domain.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-medium">{domain.domain}</h3>
                        <p className="text-sm text-muted-foreground">
                          Adicionado em {new Date(domain.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(domain.status)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => verifyDomain(domain.id)}
                        disabled={isVerifying === domain.id}
                      >
                        {isVerifying === domain.id ? (
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3 mr-1" />
                        )}
                        {isVerifying === domain.id ? 'Verificando...' : 'Verificar'}
                      </Button>
                    </div>
                  </div>
                  
                  {domain.status === 'verified' && (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded p-3">
                        <div className="flex items-center gap-2 text-green-800 mb-2">
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-medium">Domínio verificado com sucesso!</span>
                        </div>
                        <p className="text-sm text-green-700">
                          Seu checkout está disponível em: 
                          <a 
                            href={`https://checkout.${domain.domain}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium underline ml-1 inline-flex items-center gap-1"
                          >
                            checkout.{domain.domain}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </p>
                      </div>
                      
                      {/* Script de Integração Shopify */}
                      <div className="bg-blue-50 border border-blue-200 rounded p-4">
                        <div className="flex items-center gap-2 text-blue-800 mb-3">
                          <Code className="h-4 w-4" />
                          <span className="font-medium">Script de Integração Shopify</span>
                        </div>
                        <p className="text-sm text-blue-700 mb-3">
                          Use este script personalizado em sua loja Shopify para redirecionar o checkout para seu domínio personalizado.
                        </p>
                        
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium text-blue-800">URL do Script</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <code className="bg-white px-2 py-1 rounded text-sm border flex-1 text-blue-900">
                                {`${window.location.origin}/api/shopify/script?domain=${domain.domain}`}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(`${window.location.origin}/api/shopify/script?domain=${domain.domain}`)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium text-blue-800">Código para adicionar no theme.liquid</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <code className="bg-white px-2 py-1 rounded text-sm border flex-1 text-blue-900 font-mono">
                                {`<script src="${window.location.origin}/api/shopify/script?domain=${domain.domain}"></script>`}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(`<script src="${window.location.origin}/api/shopify/script?domain=${domain.domain}"></script>`)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded mt-3">
                          <p><strong>Instruções:</strong></p>
                          <p>1. Acesse Admin > Temas > Ações > Editar código</p>
                          <p>2. Abra o arquivo theme.liquid</p>
                          <p>3. Adicione o código acima antes da tag &lt;/body&gt;</p>
                          <p>4. Salve as alterações</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {domain.status === 'failed' && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        Falha na verificação. Verifique se os registros DNS estão configurados corretamente e tente novamente.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {domain.lastChecked && (
                    <p className="text-xs text-muted-foreground">
                      Última verificação: {new Date(domain.lastChecked).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}