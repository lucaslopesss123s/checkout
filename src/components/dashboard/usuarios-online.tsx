'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { User, ShoppingCart, CreditCard, MapPin, Eye, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CheckoutSession {
  id: string
  nome: string
  email?: string
  telefone?: string
  etapa_atual: string
  itens: any[]
  valor_total?: number
  entrada_em: string
  ultima_atividade: string
}

interface UsuariosOnlineProps {
  id_loja: string
}

const etapaLabels: Record<string, { label: string; color: string; icon: any }> = {
  carrinho: { label: 'Carrinho', color: 'bg-blue-500', icon: ShoppingCart },
  dados_pessoais: { label: 'Dados Pessoais', color: 'bg-yellow-500', icon: User },
  endereco: { label: 'Endereço', color: 'bg-orange-500', icon: MapPin },
  pagamento: { label: 'Pagamento', color: 'bg-green-500', icon: CreditCard },
  revisao: { label: 'Revisão', color: 'bg-purple-500', icon: Eye },
  finalizado: { label: 'Finalizado', color: 'bg-gray-500', icon: Clock }
}

export function UsuariosOnline({ id_loja }: UsuariosOnlineProps) {
  const [sessions, setSessions] = useState<CheckoutSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id_loja) return

    let eventSource: EventSource | null = null

    const connectToRealtime = () => {
      try {
        // Conectar ao endpoint de tempo real
        eventSource = new EventSource(`/api/checkout-session/realtime?id_loja=${id_loja}`)

        eventSource.onopen = () => {
          setError(null)
          setLoading(false)
        }

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            if (data.type === 'sessions_update') {
              setSessions(data.data || [])
            } else if (data.type === 'error') {
              setError(data.message)
            }
          } catch (err) {
            console.error('Erro ao processar dados em tempo real:', err)
          }
        }

        eventSource.onerror = (event) => {
          console.error('Erro na conexão SSE:', event)
          setError('Erro na conexão em tempo real')
          setLoading(false)
          
          // Tentar reconectar após 5 segundos
          setTimeout(() => {
            if (eventSource) {
              eventSource.close()
            }
            connectToRealtime()
          }, 5000)
        }
      } catch (err) {
        console.error('Erro ao conectar:', err)
        setError('Erro ao conectar ao servidor')
        setLoading(false)
      }
    }

    connectToRealtime()

    // Cleanup
    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [id_loja])

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getEtapaInfo = (etapa: string) => {
    return etapaLabels[etapa] || etapaLabels.carrinho
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            <CardTitle>Usuários Online no Checkout</CardTitle>
          </div>
          <CardDescription>Carregando dados em tempo real...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
            </span>
            <CardTitle>Usuários Online no Checkout</CardTitle>
          </div>
          <CardDescription>Conectando ao sistema de tempo real... 0 usuários online.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="font-medium mb-2">Nenhum usuário online no momento</p>
            <p className="text-sm">Os clientes que entrarem no checkout aparecerão aqui em tempo real</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <CardTitle>Usuários Online no Checkout</CardTitle>
        </div>
        <CardDescription>
          Acompanhe em tempo real quem está finalizando uma compra. {sessions.length} usuário{sessions.length !== 1 ? 's' : ''} online.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="font-medium mb-2">Nenhum usuário online no momento</p>
            <p className="text-sm">Os clientes que entrarem no checkout aparecerão aqui em tempo real</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {sessions.map((session, index) => {
                const etapaInfo = getEtapaInfo(session.etapa_atual)
                const IconComponent = etapaInfo.icon
                
                return (
                  <div key={session.id}>
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10">
                          {getInitials(session.nome)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{session.nome}</p>
                            {session.email && (
                              <p className="text-sm text-muted-foreground">{session.email}</p>
                            )}
                            {session.telefone && (
                              <p className="text-sm text-muted-foreground">{session.telefone}</p>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <Badge 
                              variant="secondary" 
                              className={`${etapaInfo.color} text-white`}
                            >
                              <IconComponent className="w-3 h-3 mr-1" />
                              {etapaInfo.label}
                            </Badge>
                            {session.valor_total && (
                              <p className="text-sm font-medium mt-1">
                                {formatCurrency(session.valor_total)}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {session.itens && session.itens.length > 0 && (
                          <div className="text-sm text-muted-foreground">
                            <p className="font-medium mb-1">Produtos no carrinho:</p>
                            <div className="space-y-1">
                              {session.itens.slice(0, 3).map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between">
                                  <span>{item.nome || item.title || 'Produto'}</span>
                                  <span>Qtd: {item.quantidade || item.quantity || 1}</span>
                                </div>
                              ))}
                              {session.itens.length > 3 && (
                                <p className="text-xs">+{session.itens.length - 3} outros produtos</p>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            Entrou: {formatDistanceToNow(new Date(session.entrada_em), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </span>
                          <span>
                            Última atividade: {formatDistanceToNow(new Date(session.ultima_atividade), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {index < sessions.length - 1 && <Separator className="mt-4" />}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}