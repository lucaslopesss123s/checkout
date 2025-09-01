'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield, ShieldCheck, ShieldX, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface Zone {
  id: string
  cloudflare_id: string
  name: string
  status: string
  ssl_enabled: boolean
  ssl_mode: string | null
  ssl_activated_at: string | null
  always_use_https: boolean
  createdAt: string
  updatedAt: string
}

interface SSLStats {
  total: number
  sslEnabled: number
  sslDisabled: number
  activeZones: number
  pendingZones: number
}

interface SSLManagerProps {
  storeId: string
  token: string
}

export default function SSLManager({ storeId, token }: SSLManagerProps) {
  const [zones, setZones] = useState<Zone[]>([])
  const [stats, setStats] = useState<SSLStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSSLStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/cloudflare/zones/ssl-check?storeId=${storeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao buscar status SSL')
      }

      const data = await response.json()
      setZones(data.zones)
      setStats(data.statistics)
    } catch (error: any) {
      console.error('Erro ao buscar status SSL:', error)
      setError(error.message)
      toast.error('Erro ao carregar status SSL')
    } finally {
      setLoading(false)
    }
  }

  const checkAndActivateSSL = async () => {
    try {
      setChecking(true)
      
      const response = await fetch('/api/cloudflare/zones/ssl-check', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ storeId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao verificar SSL')
      }

      const data = await response.json()
      
      if (data.summary.successful > 0) {
        toast.success(`SSL configurado para ${data.summary.successful} zona(s)`)
      }
      
      if (data.summary.failed > 0) {
        toast.warning(`${data.summary.failed} zona(s) não puderam ser configuradas`)
      }
      
      // Recarregar dados
      await fetchSSLStatus()
    } catch (error: any) {
      console.error('Erro ao verificar SSL:', error)
      toast.error('Erro ao verificar SSL: ' + error.message)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    fetchSSLStatus()
  }, [storeId])

  const getStatusIcon = (zone: Zone) => {
    if (zone.ssl_enabled) {
      return <ShieldCheck className="h-4 w-4 text-green-500" />
    } else if (zone.status === 'active') {
      return <ShieldX className="h-4 w-4 text-red-500" />
    } else {
      return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (zone: Zone) => {
    if (zone.ssl_enabled) {
      return <Badge variant="default" className="bg-green-100 text-green-800">SSL Ativo</Badge>
    } else if (zone.status === 'active') {
      return <Badge variant="destructive">SSL Inativo</Badge>
    } else {
      return <Badge variant="secondary">Pendente</Badge>
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('pt-BR')
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Carregando status SSL...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2"
            onClick={fetchSSLStatus}
          >
            Tentar Novamente
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total de Zonas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.sslEnabled}</div>
              <div className="text-sm text-muted-foreground">SSL Ativo</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.sslDisabled}</div>
              <div className="text-sm text-muted-foreground">SSL Inativo</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.activeZones}</div>
              <div className="text-sm text-muted-foreground">Zonas Ativas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingZones}</div>
              <div className="text-sm text-muted-foreground">Pendentes</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gerenciamento SSL Automático
          </CardTitle>
          <CardDescription>
            Configure SSL automaticamente para todas as zonas ativas do Cloudflare
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button 
              onClick={checkAndActivateSSL}
              disabled={checking}
              className="flex items-center gap-2"
            >
              {checking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {checking ? 'Verificando...' : 'Verificar e Ativar SSL'}
            </Button>
            <Button 
              variant="outline" 
              onClick={fetchSSLStatus}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Zonas */}
      <Card>
        <CardHeader>
          <CardTitle>Status das Zonas</CardTitle>
          <CardDescription>
            Status SSL de todas as zonas configuradas no Cloudflare
          </CardDescription>
        </CardHeader>
        <CardContent>
          {zones.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma zona encontrada
            </div>
          ) : (
            <div className="space-y-4">
              {zones.map((zone) => (
                <div key={zone.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(zone)}
                    <div>
                      <div className="font-medium">{zone.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Status: {zone.status} • Modo SSL: {zone.ssl_mode || 'N/A'}
                      </div>
                      {zone.ssl_activated_at && (
                        <div className="text-xs text-muted-foreground">
                          SSL ativado em: {formatDate(zone.ssl_activated_at)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(zone)}
                    {zone.always_use_https && (
                      <Badge variant="outline" className="text-xs">
                        HTTPS Forçado
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}