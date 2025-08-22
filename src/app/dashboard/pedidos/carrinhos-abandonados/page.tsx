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
  customerEmail?: string
  customerName?: string
  items: {
    id: string
    quantity: number
    price: number
    product: {
      name: string
      image?: string
    }
  }[]
  total: number
  abandonedAt: string
  lastActivity: string
  recoveryEmailSent: boolean
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
      // Por enquanto, vamos simular dados de carrinhos abandonados
      // Em uma implementação real, você criaria uma API específica para isso
      const mockData: AbandonedCart[] = [
        {
          id: "cart_001",
          customerEmail: "cliente@email.com",
          customerName: "João Silva",
          items: [
            {
              id: "item_1",
              quantity: 2,
              price: 99.90,
              product: {
                name: "Produto Exemplo 1"
              }
            }
          ],
          total: 199.80,
          abandonedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
          lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          recoveryEmailSent: false
        },
        {
          id: "cart_002",
          customerEmail: "maria@email.com",
          customerName: "Maria Santos",
          items: [
            {
              id: "item_2",
              quantity: 1,
              price: 149.90,
              product: {
                name: "Produto Exemplo 2"
              }
            },
            {
              id: "item_3",
              quantity: 3,
              price: 29.90,
              product: {
                name: "Produto Exemplo 3"
              }
            }
          ],
          total: 239.60,
          abandonedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 dia atrás
          lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          recoveryEmailSent: true
        }
      ]
      
      setAbandonedCarts(mockData)
    } catch (error) {
      console.error('Erro ao buscar carrinhos abandonados:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCarts = abandonedCarts.filter(cart =>
    cart.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cart.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cart.items.some(item => item.product.name.toLowerCase().includes(searchTerm.toLowerCase()))
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
    return filteredCarts.reduce((sum, cart) => sum + cart.total, 0)
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
            <CardTitle className="text-sm font-medium">Emails Enviados</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredCarts.filter(cart => cart.recoveryEmailSent).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Emails de recuperação
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
                        <div className="font-medium">{cart.customerName || 'Cliente Anônimo'}</div>
                        <div className="text-sm text-muted-foreground">{cart.customerEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        {cart.items.map((item, index) => (
                          <div key={item.id} className="text-sm">
                            {item.quantity}x {item.product.name}
                            {index < cart.items.length - 1 && <br />}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(cart.total)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{formatTimeAgo(cart.abandonedAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {cart.recoveryEmailSent ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          Enviado
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          Não enviado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!cart.recoveryEmailSent && (
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