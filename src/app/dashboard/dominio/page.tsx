'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Globe, CheckCircle, XCircle, AlertTriangle, Copy, ExternalLink, RefreshCw, Code, Trash2, Shield } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useStore } from '@/contexts/store-context'
import Link from 'next/link'

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
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isActivatingSSL, setIsActivatingSSL] = useState<string | null>(null)

  useEffect(() => {
    if (selectedStore) {
      loadDomains()
    } else {
      // Limpar domínios quando não há loja selecionada
      setDomains([])
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

  const activateSSL = async (domainId: string) => {
    setIsActivatingSSL(domainId)
    try {
      const response = await fetch('/api/ssl/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: 'SSL Ativado',
          description: 'Certificado SSL ativado com sucesso!'
        })
        loadDomains() // Recarregar domínios
      } else {
        toast({
          title: 'Erro',
          description: data.message || 'Erro ao ativar SSL',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Erro ao ativar SSL:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao ativar SSL. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setIsActivatingSSL(null)
    }
  }

  const deleteDomain = async (domainId: string) => {
    if (!selectedStore) {
      toast({
        title: 'Erro',
        description: 'Nenhuma loja selecionada.',
        variant: 'destructive'
      })
      return
    }

    if (!confirm('Tem certeza que deseja excluir este domínio?')) {
      return
    }

    setIsDeleting(domainId)
    try {
      const response = await fetch(`/api/dominios?id=${domainId}&id_loja=${selectedStore.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setDomains(prev => prev.filter(domain => domain.id !== domainId))
        toast({
          title: 'Domínio removido',
          description: 'Domínio removido com sucesso.'
        })
      } else {
        const errorData = await response.json()
        toast({
          title: 'Erro',
          description: errorData.error || 'Erro ao remover domínio.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao remover domínio. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(null)
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="h-8 w-8" />
            Gerenciar Domínios
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure seus domínios personalizados para o checkout
          </p>
        </div>

      </div>

      {!selectedStore && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Selecione uma loja</strong><br/>
            Para gerenciar domínios, você precisa selecionar uma loja no menu superior.
          </AlertDescription>
        </Alert>
      )}

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
                onKeyPress={(e) => e.key === 'Enter' && selectedStore && addDomain()}
                disabled={!selectedStore}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addDomain} disabled={isLoading || !selectedStore}>
                {isLoading ? 'Adicionando...' : 'Adicionar'}
              </Button>
            </div>
          </div>
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
                      {domain.status === 'verified' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => activateSSL(domain.id)}
                          disabled={isActivatingSSL === domain.id}
                        >
                          {isActivatingSSL === domain.id ? (
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Shield className="h-3 w-3 mr-1" />
                          )}
                          {isActivatingSSL === domain.id ? 'Ativando...' : 'Ativar SSL'}
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteDomain(domain.id)}
                        disabled={isDeleting === domain.id}
                      >
                        {isDeleting === domain.id ? (
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3 mr-1" />
                        )}
                        {isDeleting === domain.id ? 'Removendo...' : 'Excluir'}
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
                        <p className="text-sm text-green-700 mb-3">
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