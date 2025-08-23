"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Mail, Eye, Clock, ShoppingBag } from "lucide-react"
import { useState, useEffect } from "react"
import { useStore } from "@/contexts/store-context"

interface AbandonedCart {
  id: string
  nome?: string
  email?: string
  telefone?: string
  valor_total?: number
  itens: any[] // Array de produtos do carrinho
  status: string
  primeira_etapa_em?: string
  ultima_atividade: string
  createdAt: string
}

export default function CarrinhosAbandonadosPage() {
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { selectedStore } = useStore()

  useEffect(() => {
    fetchAbandonedCarts()
  }, [selectedStore])

  const fetchAbandonedCarts = async () => {
    if (!selectedStore) {
      setLoading(false)
      return
    }

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('Token de autenticação não encontrado')
        setLoading(false)
        return
      }

      // Buscar carrinhos abandonados da API
      const response = await fetch(`/api/carrinho?id_loja=${selectedStore.id}&status=abandonado&page=1&limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAbandonedCarts(data.carrinhos)
        } else {
          console.error('Erro ao buscar carrinhos:', data.error)
          setAbandonedCarts([])
        }
      } else {
        console.error('Erro na requisição:', response.status)
        setAbandonedCarts([])
      }
    } catch (error) {
      console.error('Erro ao buscar carrinhos abandonados:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCarts = abandonedCarts.filter(cart =>
    cart.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cart.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cart.itens.some((item: any) => item.title?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Há menos de 1 hora'
    } else if (diffInHours < 24) {
      return `Há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `Há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`
    }
  }

  const sendRecoveryEmail = async (cartId: string) => {
    // Implementar lógica de envio de email de recuperação
    console.log('Enviando email de recuperação para carrinho:', cartId)
    
    // Atualizar o estado local
    setAbandonedCarts(carts => 
      carts.map(cart => 
        cart.id === cartId 
          ? { ...cart, recoveryEmailSent: true }
          : cart
      )
    )
  }

  const getTotalValue = () => {
    return filteredCarts.reduce((sum, cart) => sum + (cart.valor_total || 0), 0)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Carrinhos Abandonados</h1>
            <p className="text-muted-foreground">
              Recupere vendas perdidas com estratégias de remarketing.
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Carregando carrinhos abandonados...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Carrinhos Abandonados</h1>
          <p className="text-muted-foreground">
            Recupere vendas perdidas com estratégias de remarketing.
          </p>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Carrinhos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredCarts.length}</div>
            <p className="text-xs text-muted-foreground">
              Carrinhos abandonados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getTotalValue())}</div>
            <p className="text-xs text-muted-foreground">
              Em vendas potenciais
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Identificação</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredCarts.filter(cart => cart.primeira_etapa_em).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Completaram identificação
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Carrinhos Abandonados</CardTitle>
              <CardDescription>
                {filteredCarts.length} carrinho(s) abandonado(s) encontrado(s).
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por cliente ou produto..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCarts.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum carrinho abandonado encontrado.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Os carrinhos abandonados aparecerão aqui para você recuperar as vendas.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Produtos</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Abandonado</TableHead>
                  <TableHead>Status Email</TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCarts.map((cart) => (
                  <TableRow key={cart.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{cart.nome || 'Cliente Anônimo'}</div>
                        <div className="text-sm text-muted-foreground">{cart.email || cart.telefone || 'Sem contato'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        {cart.itens.map((item: any, index: number) => (
                          <div key={index} className="text-sm">
                            {item.quantity}x {item.title}
                            {index < cart.itens.length - 1 && <br />}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(cart.valor_total || 0)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{formatTimeAgo(cart.ultima_atividade)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {cart.primeira_etapa_em ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          Identificado
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          Sem identificação
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {cart.email && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => sendRecoveryEmail(cart.id)}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        )}
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