'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Trash2, Copy, Globe, AlertTriangle } from 'lucide-react'
import { maskSensitiveIPs } from '@/lib/ip-mask'

interface DNSRecord {
  id: string
  type: string
  name: string
  content: string
  proxied: boolean
  ttl: number
  priority?: number
  created_on: string
  modified_on: string
}

interface DNSManagerProps {
  className?: string
  selectedStoreId?: string
}

export default function DNSManager({ className, selectedStoreId }: DNSManagerProps) {
  const [records, setRecords] = useState<DNSRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [domain, setDomain] = useState<string>('')
  const [zoneId, setZoneId] = useState<string>('')
  const [isAddingRecord, setIsAddingRecord] = useState(false)
  const [isDeletingRecord, setIsDeletingRecord] = useState<string | null>(null)
  
  // Form states
  const [newRecord, setNewRecord] = useState({
    type: 'A',
    name: '',
    content: '',
    proxied: false,
    ttl: 1,
    priority: undefined as number | undefined
  })
  
  const { toast } = useToast()

  useEffect(() => {
    loadDNSRecords()
  }, [selectedStoreId])

  const loadDNSRecords = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        toast({
          title: 'Erro',
          description: 'Token de autenticação não encontrado',
          variant: 'destructive'
        })
        return
      }

      const url = selectedStoreId 
        ? `/api/dns/records?store_id=${selectedStoreId}`
        : '/api/dns/records'

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          // Domínio não configurado
          setRecords([])
          return
        }
        throw new Error('Erro ao carregar registros DNS')
      }

      const data = await response.json()
      setRecords(data.records || [])
      setDomain(data.domain || '')
      setZoneId(data.zone_id || '')
      
    } catch (error) {
      console.error('Erro ao carregar registros DNS:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar registros DNS',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const addDNSRecord = async () => {
    if (!newRecord.name || !newRecord.content) {
      toast({
        title: 'Erro',
        description: 'Nome e conteúdo são obrigatórios',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsAddingRecord(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/dns/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newRecord)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao adicionar registro DNS')
      }

      const data = await response.json()
      setRecords(prev => [...prev, data.record])
      
      // Reset form
      setNewRecord({
        type: 'A',
        name: '',
        content: '',
        proxied: false,
        ttl: 1,
        priority: undefined
      })
      
      toast({
        title: 'Sucesso',
        description: 'Registro DNS adicionado com sucesso'
      })
      
    } catch (error) {
      console.error('Erro ao adicionar registro DNS:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao adicionar registro DNS',
        variant: 'destructive'
      })
    } finally {
      setIsAddingRecord(false)
    }
  }

  const deleteDNSRecord = async (recordId: string) => {
    try {
      setIsDeletingRecord(recordId)
      const token = localStorage.getItem('token')
      
      const response = await fetch(`/api/dns/records?id=${recordId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao deletar registro DNS')
      }

      setRecords(prev => prev.filter(record => record.id !== recordId))
      
      toast({
        title: 'Sucesso',
        description: 'Registro DNS deletado com sucesso'
      })
      
    } catch (error) {
      console.error('Erro ao deletar registro DNS:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao deletar registro DNS',
        variant: 'destructive'
      })
    } finally {
      setIsDeletingRecord(null)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copiado',
      description: 'Conteúdo copiado para a área de transferência'
    })
  }

  const formatRecordName = (name: string) => {
    if (!domain) return name
    return name.replace(`.${domain}`, '') || '@'
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando registros DNS...</span>
        </CardContent>
      </Card>
    )
  }

  if (!domain) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Gerenciador de DNS
          </CardTitle>
          <CardDescription>
            Configure os registros DNS do seu domínio via Cloudflare
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Nenhum domínio configurado. Adicione um domínio primeiro na página de domínios.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Gerenciador de DNS - {domain}
        </CardTitle>
        <CardDescription>
          Configure os registros DNS do seu domínio via Cloudflare
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulário para adicionar registro */}
        <div className="border rounded-lg p-4 space-y-4">
          <h3 className="font-semibold">Adicionar Novo Registro</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Select value={newRecord.type} onValueChange={(value) => setNewRecord(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="AAAA">AAAA</SelectItem>
                  <SelectItem value="CNAME">CNAME</SelectItem>
                  <SelectItem value="TXT">TXT</SelectItem>
                  <SelectItem value="MX">MX</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Input
                placeholder="Nome (ex: www, @, checkout)"
                value={newRecord.name}
                onChange={(e) => setNewRecord(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <Input
                placeholder="Conteúdo (IP, domínio, etc.)"
                value={newRecord.content}
                onChange={(e) => setNewRecord(prev => ({ ...prev, content: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                checked={newRecord.proxied}
                onCheckedChange={(checked) => setNewRecord(prev => ({ ...prev, proxied: checked }))}
              />
              <span className="text-sm">Proxy Cloudflare</span>
            </div>
            <Button onClick={addDNSRecord} disabled={isAddingRecord}>
              {isAddingRecord ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Adicionar
            </Button>
          </div>
        </div>

        {/* Tabela de registros */}
        <div className="border rounded-lg">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-left p-3 font-medium">Tipo</th>
                  <th className="text-left p-3 font-medium">Nome</th>
                  <th className="text-left p-3 font-medium">Conteúdo</th>
                  <th className="text-left p-3 font-medium">Proxy</th>
                  <th className="text-left p-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum registro DNS encontrado
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record.id} className="border-t hover:bg-muted/25">
                      <td className="p-3">
                        <Badge variant="outline">{record.type}</Badge>
                      </td>
                      <td className="p-3 font-mono text-sm">
                        {formatRecordName(record.name)}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm truncate max-w-xs" title={maskSensitiveIPs(record.content)}>
                            {maskSensitiveIPs(record.content)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(record.content)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant={record.proxied ? "default" : "secondary"}>
                          {record.proxied ? "Ativo" : "Desativo"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDNSRecord(record.id)}
                          disabled={isDeletingRecord === record.id}
                        >
                          {isDeletingRecord === record.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {records.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Total de {records.length} registro{records.length !== 1 ? 's' : ''} DNS
          </div>
        )}
      </CardContent>
    </Card>
  )
}