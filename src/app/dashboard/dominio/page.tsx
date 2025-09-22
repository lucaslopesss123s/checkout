'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Globe, CheckCircle, XCircle, AlertTriangle, Copy, ExternalLink, RefreshCw, Code, Trash2, Cloud, Server, Settings } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useStore } from '@/contexts/store-context'
import DNSManager from '@/components/dns-manager'

interface CloudflareZone {
  id: string
  domain: string
  status: 'pending' | 'active' | 'failed'
  nameservers?: string[]
  createdAt: string
  lastChecked?: string
  sslActive?: boolean
  cloudflareZoneId?: string
  dnsConfigured?: boolean
}

export default function DominioPage() {
  const { selectedStore } = useStore()
  const [cloudflareZones, setCloudflareZones] = useState<CloudflareZone[]>([])
  const [newDomain, setNewDomain] = useState('')
  const [isCreatingZone, setIsCreatingZone] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState<string | null>(null)
  const [isDeletingDomain, setIsDeletingDomain] = useState<string | null>(null)
  const { toast } = useToast()

  // Verificar se já atingiu o limite de 1 domínio por loja
  const hasReachedDomainLimit = cloudflareZones.length >= 1

  useEffect(() => {
    if (selectedStore) {
      loadCloudflareZones()
    } else {
      setCloudflareZones([])
    }
  }, [selectedStore])

  const loadCloudflareZones = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('Token não encontrado')
        return
      }

      const response = await fetch('/api/dominios', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const domains = await response.json()
        // Filtrar domínios pela loja selecionada
        const filteredDomains = selectedStore 
          ? domains.filter((d: any) => d.id_loja === selectedStore.id)
          : []
        
        const zones = filteredDomains
          .map((d: any) => ({
            id: d.id,
            domain: d.dominio,
            status: d.status, // Usar o status exato do banco de dados
            nameservers: d.configuracao_dns?.nameservers || d.nameservers || [],
            createdAt: d.createdAt,
            lastChecked: d.ultima_verificacao,
            sslActive: d.ssl_ativo,
            cloudflareZoneId: d.configuracao_dns?.zone_id || d.cloudflare_zone_id,
            dnsConfigured: d.dns_verificado
          }))
        setCloudflareZones(zones)
      } else {
        console.error('Erro ao carregar domínios:', response.statusText)
        if (response.status === 401) {
          toast({
            title: 'Erro de autenticação',
            description: 'Faça login novamente.',
            variant: 'destructive'
          })
        }
      }
    } catch (error) {
      console.error('Erro ao carregar domínios Cloudflare:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar domínios Cloudflare. Tente recarregar a página.',
        variant: 'destructive'
      })
    }
  }

  const createCloudflareZone = async () => {
    if (!newDomain.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um domínio válido.',
        variant: 'destructive'
      })
      return
    }

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

    setIsCreatingZone(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/cloudflare/domains/add', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          domain: newDomain,
          storeId: selectedStore.id
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        const newZone: CloudflareZone = {
          id: data.domain.id,
          domain: data.domain.domain,
          status: data.status === 'pending' ? 'pending' : 'active',
          nameservers: data.name_servers,
          createdAt: data.domain.created_at,
          cloudflareZoneId: data.cloudflareZoneId
        }
        
        setCloudflareZones(prev => [...prev, newZone])
        setNewDomain('')
        
        toast({
          title: 'Zona Cloudflare criada!',
          description: 'Configure os nameservers no seu provedor de domínio para ativar.'
        })
      } else {
        const errorData = await response.json()
        toast({
          title: 'Erro',
          description: errorData.error || 'Erro ao criar zona Cloudflare.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar zona Cloudflare. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setIsCreatingZone(false)
    }
  }

  const addDomain = async () => {
    return createCloudflareZone()
  }

  const checkCloudflareZoneStatus = async (domainId: string) => {
    setIsCheckingStatus(domainId)
    try {
      const zone = cloudflareZones.find(z => z.id === domainId)
      if (!zone) {
        toast({
          title: 'Erro',
          description: 'Domínio não encontrado.',
          variant: 'destructive'
        })
        return
      }

      const token = localStorage.getItem('token')
      const response = await fetch(`/api/cloudflare/domains/status?domain=${zone.domain}&zone_id=${zone.cloudflareZoneId}&store_id=${selectedStore?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Recarregar dados do banco para refletir as mudanças salvas
        await loadCloudflareZones()
        
        if (data.zone.status === 'active') {
          let description = `DNS: ${data.dns.doh_status}, SSL: ${data.ssl.status}, Registros: ${data.dns.records_count}`
          
          // Adicionar informações sobre o checkout se foi criado
          if (data.checkout && data.checkout.subdomain) {
            description += `\n🚀 Checkout: ${data.checkout.subdomain}`
            if (data.checkout.dns_created) {
              description += ' (DNS criado automaticamente)'
            }
          }
          
          toast({
            title: 'Domínio ativo!',
            description: description
          })
        } else {
          toast({
            title: 'Domínio ainda não está ativo',
            description: `Status: ${data.zone.status}. Verifique se os nameservers foram configurados.`,
            variant: 'destructive'
          })
        }
      } else {
        const errorData = await response.json()
        toast({
          title: 'Erro na verificação',
          description: errorData.error || 'Erro ao verificar domínio Cloudflare.',
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
      // Sempre recarregar dados para refletir qualquer mudança salva no banco
      await loadCloudflareZones()
      setIsCheckingStatus(null)
    }
  }

  const verifyDomain = async (domainId: string) => {
    return checkCloudflareZoneStatus(domainId)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copiado!',
      description: 'Valor copiado para a área de transferência.'
    })
  }

  const deleteDomain = async (domainId: string) => {
    if (!confirm('Tem certeza que deseja excluir este domínio? Esta ação não pode ser desfeita.')) {
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

    setIsDeletingDomain(domainId)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast({
          title: 'Erro',
          description: 'Token de autenticação não encontrado',
          variant: 'destructive'
        })
        return
      }

      const response = await fetch(`/api/cloudflare/domains/delete?id=${domainId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast({
          title: 'Sucesso!',
          description: 'Domínio excluído com sucesso.'
        })
        // Recarregar a lista de domínios
        await loadCloudflareZones()
      } else {
        const errorData = await response.json()
        toast({
          title: 'Erro',
          description: errorData.error || 'Erro ao excluir domínio.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir domínio. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setIsDeletingDomain(null)
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
            Adicione e gerencie domínios para suas lojas usando integração Cloudflare
          </p>
        </div>
      </div>

      {!selectedStore && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Selecione uma loja para gerenciar domínios.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-orange-500" />Adicionar Domínio via Cloudflare
          </CardTitle>
          <CardDescription>
            Crie uma zona no Cloudflare para seu domínio com SSL automático
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-orange-50 border-orange-200">
            <Cloud className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Como funciona:</strong><br/>
              1. Inserimos seu domínio no Cloudflare<br/>
              2. Você configura os nameservers no seu provedor<br/>
              3. SSL e DNS são configurados automaticamente
            </AlertDescription>
          </Alert>
          {hasReachedDomainLimit && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Limite atingido:</strong> Cada loja pode ter apenas 1 domínio personalizado. Para adicionar um novo domínio, exclua o domínio existente primeiro.
              </AlertDescription>
            </Alert>
          )}
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="domain">Domínio</Label>
              <Input
                id="domain"
                placeholder={hasReachedDomainLimit ? "Limite de 1 domínio atingido" : "exemplo.com.br"}
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && selectedStore && !hasReachedDomainLimit && addDomain()}
                disabled={!selectedStore || hasReachedDomainLimit}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addDomain} disabled={isCreatingZone || !selectedStore || hasReachedDomainLimit}>
                {isCreatingZone ? 'Criando zona...' : hasReachedDomainLimit ? 'Limite atingido' : 'Criar Zona'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Zonas Cloudflare
          </CardTitle>
          <CardDescription>
            Gerencie suas zonas Cloudflare e nameservers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cloudflareZones.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma zona Cloudflare encontrada. Adicione um domínio para começar.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cloudflareZones.map((zone) => (
                <div key={zone.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-lg">{zone.domain}</h3>
                      <p className="text-sm text-muted-foreground">
                        Domínio: {zone.domain}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {zone.status === 'active' ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : zone.status === 'failed' ? (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Falhou
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Pendente
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => verifyDomain(zone.id)}
                        disabled={isCheckingStatus === zone.id}
                      >
                        {isCheckingStatus === zone.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        {isCheckingStatus === zone.id ? 'Verificando...' : 'Verificar Status'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          deleteDomain(zone.id)
                        }}
                        disabled={isDeletingDomain === zone.id}
                        style={{ pointerEvents: 'auto', zIndex: 9999 }}
                      >
                        {isDeletingDomain === zone.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        {isDeletingDomain === zone.id ? 'Excluindo...' : 'Excluir'}
                      </Button>
                      {zone.sslActive && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          SSL Ativo
                        </Badge>
                      )}
                    </div>
                  </div>

                  {zone.nameservers && zone.status === 'pending' && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Configure estes nameservers no seu provedor de domínio:
                      </h4>
                      <div className="space-y-2">
                        {zone.nameservers.map((ns, index) => (
                          <div key={index} className="flex items-center justify-between bg-white rounded p-2 border">
                            <code className="text-sm font-mono">{ns}</code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(ns)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {zone.status === 'active' && (
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-green-800 font-medium">Domínio ativo!</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a
                            href={`https://checkout.${zone.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            checkout.{zone.domain}
                          </a>
                        </Button>
                        {zone.sslActive && (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            SSL Ativo
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {zone.lastChecked && (
                    <p className="text-xs text-muted-foreground">
                      Última verificação: {new Date(zone.lastChecked).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* DNS Manager - Exibir apenas se houver domínios ativos */}
      {cloudflareZones.some(zone => zone.status === 'active') && (
        <DNSManager className="" selectedStoreId={selectedStore?.id} />
      )}
    </div>
  )
}