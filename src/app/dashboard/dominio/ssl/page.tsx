'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCw, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'
import { toast } from 'sonner'

interface SSLCertificate {
  id: string
  domain: string
  status: string
  provider: string
  expires_at: string
  created_at: string
  renewed_at?: string
  auto_renew: boolean
  days_until_expiry: number
  dominio?: {
    id: string
    dominio: string
    status: string
  }
}

interface Domain {
  id: string
  dominio: string
  status: string
  dns_verificado: boolean
  ssl_ativo: boolean
  ssl_certificate?: SSLCertificate
}

interface CronStatus {
  active: boolean
  schedule: string
  config: {
    daysBeforeExpiry: number
    maxRenewalsPerRun: number
    renewalTimeout: number
  }
}

export default function SSLManagementPage() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [certificates, setCertificates] = useState<SSLCertificate[]>([])
  const [cronStatus, setCronStatus] = useState<CronStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [activatingSSL, setActivatingSSL] = useState<string | null>(null)
  const [renewingSSL, setRenewingSSL] = useState<string | null>(null)
  const [managingCron, setManagingCron] = useState(false)

  // Carregar dados iniciais
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Carregar domínios
      const domainsResponse = await fetch('/api/dominios')
      if (domainsResponse.ok) {
        const domainsData = await domainsResponse.json()
        setDomains(domainsData.dominios || [])
      }
      
      // Carregar certificados SSL
      const certsResponse = await fetch('/api/ssl/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkConnectivity: false })
      })
      if (certsResponse.ok) {
        const certsData = await certsResponse.json()
        setCertificates(certsData.certificates?.map((c: any) => c.certificate) || [])
      }
      
      // Carregar status do cron
      const cronResponse = await fetch('/api/ssl/cron')
      if (cronResponse.ok) {
        const cronData = await cronResponse.json()
        setCronStatus(cronData.cron_status)
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados SSL')
    } finally {
      setLoading(false)
    }
  }

  const activateSSL = async (domainId: string) => {
    try {
      setActivatingSSL(domainId)
      
      const response = await fetch('/api/ssl/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success('SSL ativado com sucesso!')
        loadData() // Recarregar dados
      } else {
        toast.error(data.message || 'Erro ao ativar SSL')
      }
      
    } catch (error) {
      console.error('Erro ao ativar SSL:', error)
      toast.error('Erro ao ativar SSL')
    } finally {
      setActivatingSSL(null)
    }
  }

  const renewSSL = async (certificateId: string) => {
    try {
      setRenewingSSL(certificateId)
      
      const response = await fetch('/api/ssl/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificateId })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success('Certificado renovado com sucesso!')
        loadData() // Recarregar dados
      } else {
        toast.error(data.message || 'Erro ao renovar certificado')
      }
      
    } catch (error) {
      console.error('Erro ao renovar SSL:', error)
      toast.error('Erro ao renovar certificado')
    } finally {
      setRenewingSSL(null)
    }
  }

  const manageCron = async (action: 'start' | 'stop' | 'run_manual') => {
    try {
      setManagingCron(true)
      
      const response = await fetch('/api/ssl/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success(data.message)
        loadData() // Recarregar dados
      } else {
        toast.error(data.message || 'Erro ao gerenciar cron job')
      }
      
    } catch (error) {
      console.error('Erro ao gerenciar cron:', error)
      toast.error('Erro ao gerenciar cron job')
    } finally {
      setManagingCron(false)
    }
  }

  const getStatusBadge = (status: string, daysUntilExpiry?: number) => {
    switch (status) {
      case 'active':
        if (daysUntilExpiry && daysUntilExpiry <= 7) {
          return <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Expirando em {daysUntilExpiry} dias
          </Badge>
        }
        return <Badge variant="default" className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          Ativo
        </Badge>
      case 'expired':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Expirado
        </Badge>
      case 'expiring_soon':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Expirando em breve
        </Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="ml-2">Carregando dados SSL...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Gerenciamento SSL
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie certificados SSL gratuitos para seus domínios personalizados
          </p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="domains" className="space-y-6">
        <TabsList>
          <TabsTrigger value="domains">Domínios</TabsTrigger>
          <TabsTrigger value="certificates">Certificados</TabsTrigger>
          <TabsTrigger value="automation">Automação</TabsTrigger>
        </TabsList>

        <TabsContent value="domains" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Domínios Personalizados</CardTitle>
              <CardDescription>
                Ative SSL gratuito para seus domínios verificados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {domains.length === 0 ? (
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    Nenhum domínio personalizado encontrado. 
                    <a href="/dashboard/dominio" className="underline ml-1">
                      Adicione um domínio primeiro
                    </a>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {domains.map((domain) => (
                    <div key={domain.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="font-medium">checkout.{domain.dominio}</h3>
                          <div className="flex items-center gap-2">
                            {domain.status === 'verified' ? (
                              <Badge variant="default" className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Verificado
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Não verificado</Badge>
                            )}
                            {domain.ssl_ativo ? (
                              <Badge variant="default" className="flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                SSL Ativo
                              </Badge>
                            ) : (
                              <Badge variant="outline">SSL Inativo</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {domain.status === 'verified' && !domain.ssl_ativo && (
                            <Button
                              onClick={() => activateSSL(domain.id)}
                              disabled={activatingSSL === domain.id}
                              size="sm"
                            >
                              {activatingSSL === domain.id ? (
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Shield className="w-4 h-4 mr-2" />
                              )}
                              Ativar SSL
                            </Button>
                          )}
                          {domain.ssl_certificate && (
                            <Button
                              onClick={() => renewSSL(domain.ssl_certificate!.id)}
                              disabled={renewingSSL === domain.ssl_certificate!.id}
                              variant="outline"
                              size="sm"
                            >
                              {renewingSSL === domain.ssl_certificate!.id ? (
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <RotateCcw className="w-4 h-4 mr-2" />
                              )}
                              Renovar
                            </Button>
                          )}
                        </div>
                      </div>
                      {domain.ssl_certificate && (
                        <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="font-medium">Status:</span> {getStatusBadge(domain.ssl_certificate.status, domain.ssl_certificate.days_until_expiry)}
                            </div>
                            <div>
                              <span className="font-medium">Expira em:</span> {formatDate(domain.ssl_certificate.expires_at)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Certificados SSL</CardTitle>
              <CardDescription>
                Visualize e gerencie todos os certificados SSL ativos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {certificates.length === 0 ? (
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    Nenhum certificado SSL encontrado.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {certificates.map((cert) => (
                    <div key={cert.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <h3 className="font-medium">{cert.domain}</h3>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(cert.status, cert.days_until_expiry)}
                            <Badge variant="outline">{cert.provider}</Badge>
                            {cert.auto_renew && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <RefreshCw className="w-3 h-3" />
                                Auto-renovação
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => renewSSL(cert.id)}
                          disabled={renewingSSL === cert.id}
                          variant="outline"
                          size="sm"
                        >
                          {renewingSSL === cert.id ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <RotateCcw className="w-4 h-4 mr-2" />
                          )}
                          Renovar
                        </Button>
                      </div>
                      <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <span className="font-medium">Criado:</span> {formatDate(cert.created_at)}
                          </div>
                          <div>
                            <span className="font-medium">Expira:</span> {formatDate(cert.expires_at)}
                          </div>
                          {cert.renewed_at && (
                            <div>
                              <span className="font-medium">Última renovação:</span> {formatDate(cert.renewed_at)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Renovação Automática</CardTitle>
              <CardDescription>
                Configure a renovação automática de certificados SSL
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {cronStatus && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h3 className="font-medium flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Status do Cron Job
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {cronStatus.active ? 'Ativo' : 'Inativo'} - Executa {cronStatus.schedule}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {cronStatus.active ? (
                        <Button
                          onClick={() => manageCron('stop')}
                          disabled={managingCron}
                          variant="outline"
                          size="sm"
                        >
                          <Pause className="w-4 h-4 mr-2" />
                          Parar
                        </Button>
                      ) : (
                        <Button
                          onClick={() => manageCron('start')}
                          disabled={managingCron}
                          size="sm"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Iniciar
                        </Button>
                      )}
                      <Button
                        onClick={() => manageCron('run_manual')}
                        disabled={managingCron}
                        variant="outline"
                        size="sm"
                      >
                        {managingCron ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <RotateCcw className="w-4 h-4 mr-2" />
                        )}
                        Executar Agora
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Dias antes da expiração</h4>
                      <p className="text-2xl font-bold">{cronStatus.config.daysBeforeExpiry}</p>
                      <p className="text-sm text-muted-foreground">dias</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Máx. renovações por execução</h4>
                      <p className="text-2xl font-bold">{cronStatus.config.maxRenewalsPerRun}</p>
                      <p className="text-sm text-muted-foreground">certificados</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Timeout por renovação</h4>
                      <p className="text-2xl font-bold">{Math.round(cronStatus.config.renewalTimeout / 1000 / 60)}</p>
                      <p className="text-sm text-muted-foreground">minutos</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}