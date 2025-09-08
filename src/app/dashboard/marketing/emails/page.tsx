'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Mail, Plus, Edit, Trash2, Clock, Target, CheckCircle, XCircle, BarChart3, Send, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface EmailTemplate {
  id: string
  tipo: string
  evento: string
  tempo: number
  mensagem: string
  assunto: string
  status: string
  createdAt: string
  updatedAt: string
}

const eventosDisponiveis = [
  { value: 'abandono_carrinho', label: 'Abandono de Carrinho' },
  { value: 'pos_compra', label: 'Pós-Compra' },
  { value: 'boas_vindas', label: 'Boas-vindas' },
  { value: 'aniversario', label: 'Aniversário' },
]

const templatePadrao = {
  abandono_carrinho: {
    assunto: 'Você esqueceu algo no seu carrinho! 🛒',
    mensagem: 'Olá {{nome_cliente}},\n\nNotamos que você deixou alguns itens incríveis no seu carrinho em {{nome_loja}}.\n\nNão perca essa oportunidade! Seus produtos estão esperando por você:\n\n{{lista_produtos}}\n\nTotal: {{valor_total}}\n\nFinalize sua compra agora e garante esses produtos:\n{{link_checkout}}\n\nSe tiver alguma dúvida, estamos aqui para ajudar!\n\nAtenciosamente,\nEquipe {{nome_loja}}'
  }
}

export default function EmailsPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [estatisticas, setEstatisticas] = useState<any>(null)
  const [proximosEmails, setProximosEmails] = useState<any[]>([])
  const [formData, setFormData] = useState({
    evento: '',
    tempo: 60,
    assunto: '',
    mensagem: '',
    status: 'ativo'
  })

  useEffect(() => {
    fetchTemplates()
    fetchEstatisticas()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/marketing/emails')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Erro ao buscar templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEstatisticas = async () => {
    try {
      const response = await fetch('/api/marketing/emails/stats')
      if (response.ok) {
        const data = await response.json()
        setEstatisticas(data.estatisticas)
        setProximosEmails(data.proximos_emails || [])
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    }
  }

  const processarEmails = async () => {
    try {
      toast.info('Processando emails...')
      const response = await fetch('/api/marketing/process-emails', {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        toast.success(`${data.emails_enviados} emails enviados com sucesso!`)
        if (data.emails_com_erro > 0) {
          toast.warning(`${data.emails_com_erro} emails falharam`)
        }
        fetchEstatisticas() // Atualizar estatísticas
      } else {
        toast.error('Erro ao processar emails')
      }
    } catch (error) {
      console.error('Erro ao processar emails:', error)
      toast.error('Erro ao processar emails')
    }
  }

  const handleEventoChange = (evento: string) => {
    setFormData(prev => ({
      ...prev,
      evento,
      assunto: templatePadrao[evento as keyof typeof templatePadrao]?.assunto || '',
      mensagem: templatePadrao[evento as keyof typeof templatePadrao]?.mensagem || ''
    }))
  }

  const handleSave = async () => {
    try {
      const url = editingTemplate 
        ? `/api/marketing/emails/${editingTemplate.id}`
        : '/api/marketing/emails'
      
      const method = editingTemplate ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success(`Template ${editingTemplate ? 'atualizado' : 'criado'} com sucesso!`)
        setIsModalOpen(false)
        setEditingTemplate(null)
        setFormData({ evento: '', tempo: 60, assunto: '', mensagem: '', status: 'ativo' })
        fetchTemplates()
      } else {
        throw new Error('Erro ao salvar template')
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Não foi possível salvar o template.')
    }
  }

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template)
    setFormData({
      evento: template.evento,
      tempo: template.tempo,
      assunto: template.assunto,
      mensagem: template.mensagem,
      status: template.status
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return

    try {
      const response = await fetch(`/api/marketing/emails/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Template excluído com sucesso!')
        fetchTemplates()
      } else {
        throw new Error('Erro ao excluir template')
      }
    } catch (error) {
      console.error('Erro ao excluir:', error)
      toast.error('Não foi possível excluir o template.')
    }
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo'
      const response = await fetch(`/api/marketing/emails/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        toast.success(`Template ${newStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso!`)
        fetchTemplates()
      } else {
        throw new Error('Erro ao alterar status')
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      toast.error('Não foi possível alterar o status do template.')
    }
  }

  const formatTempo = (minutos: number) => {
    if (minutos < 60) return `${minutos} min`
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60
    return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`
  }

  const getEventoLabel = (evento: string) => {
    return eventosDisponiveis.find(e => e.value === evento)?.label || evento
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Marketing</h1>
          <p className="text-muted-foreground">
            Configure templates de email para diferentes eventos da sua loja
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={processarEmails}>
            <Send className="h-4 w-4 mr-2" />
            Processar Emails
          </Button>
          <Button onClick={() => {
            setEditingTemplate(null)
            setFormData({ evento: '', tempo: 60, assunto: '', mensagem: '', status: 'ativo' })
            setIsModalOpen(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        </div>
      </div>

      {estatisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {estatisticas.map((stat: any) => {
            const getIcon = () => {
              switch (stat.evento) {
                case 'abandono_carrinho': return <Mail className="h-4 w-4" />
                case 'pos_compra': return <CheckCircle className="h-4 w-4" />
                case 'boas_vindas': return <Target className="h-4 w-4" />
                default: return <BarChart3 className="h-4 w-4" />
              }
            }

            return (
              <Card key={stat.evento}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {getEventoLabel(stat.evento)}
                  </CardTitle>
                  {getIcon()}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.total_enviados}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.taxa_abertura}% taxa de abertura
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <div>Enviados: {stat.total_enviados}</div>
                    <div>Abertos: {stat.total_abertos}</div>
                    <div>Cliques: {stat.total_cliques}</div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {proximosEmails.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Próximos Emails Agendados
            </CardTitle>
            <CardDescription>
              Emails que serão enviados em breve
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {proximosEmails.slice(0, 5).map((email: any) => (
                <div key={email.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">{email.template.assunto}</p>
                    <p className="text-sm text-muted-foreground">
                      {email.email_cliente} • {email.template.evento}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {new Date(email.agendado_para).toLocaleString('pt-BR')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Editar Template' : 'Novo Template de Email'}
            </DialogTitle>
            <DialogDescription>
              Configure quando e como os emails serão enviados para seus clientes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="evento">Evento</Label>
                <Select value={formData.evento} onValueChange={handleEventoChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o evento" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventosDisponiveis.map(evento => (
                      <SelectItem key={evento.value} value={evento.value}>
                        {evento.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tempo">Tempo de Disparo (minutos)</Label>
                <Input
                  id="tempo"
                  type="number"
                  value={formData.tempo}
                  onChange={(e) => setFormData(prev => ({ ...prev, tempo: parseInt(e.target.value) || 0 }))}
                  placeholder="60"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assunto">Assunto do Email</Label>
              <Input
                id="assunto"
                value={formData.assunto}
                onChange={(e) => setFormData(prev => ({ ...prev, assunto: e.target.value }))}
                placeholder="Digite o assunto do email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mensagem">Mensagem</Label>
              <Textarea
                id="mensagem"
                value={formData.mensagem}
                onChange={(e) => setFormData(prev => ({ ...prev, mensagem: e.target.value }))}
                placeholder="Digite a mensagem do email"
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                Variáveis disponíveis: {{nome_cliente}}, {{nome_loja}}, {{lista_produtos}}, {{valor_total}}, {{link_checkout}}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="status"
                checked={formData.status === 'ativo'}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, status: checked ? 'ativo' : 'inativo' }))}
              />
              <Label htmlFor="status">Template ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingTemplate ? 'Atualizar' : 'Criar'} Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Templates de Email
          </CardTitle>
          <CardDescription>
            Gerencie os templates de email que serão enviados automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Nenhum template de email configurado</p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Template
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Tempo</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">
                      Email
                    </TableCell>
                    <TableCell>
                      {getEventoLabel(template.evento)}
                    </TableCell>
                    <TableCell>
                      {formatTempo(template.tempo)}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={template.mensagem}>
                        {template.mensagem.length > 50 
                          ? `${template.mensagem.substring(0, 50)}...` 
                          : template.mensagem
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={template.status === 'ativo'}
                          onCheckedChange={() => toggleStatus(template.id, template.status)}
                          className="data-[state=checked]:bg-green-500"
                        />
                        <Badge 
                          variant={template.status === 'ativo' ? 'default' : 'secondary'}
                          className={template.status === 'ativo' ? 'bg-green-500 hover:bg-green-600' : ''}
                        >
                          {template.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(template)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}