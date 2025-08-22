"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Eye, Download, Filter } from "lucide-react"
import { useState, useEffect } from "react"
import { useStore } from "@/contexts/store-context"

interface Order {
  id: string
  status: string
  total: number
  createdAt: string
  items: {
    id: string
    quantity: number
    price: number
    product: {
      name: string
    }
  }[]
}

export default function PedidosRealizadosPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { selectedStore } = useStore()

  useEffect(() => {
    fetchOrders()
  }, [selectedStore])

  const fetchOrders = async () => {
    if (!selectedStore) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/orders?storeId=${selectedStore.id}`)
      if (response.ok) {
        const data = await response.json()
        // Filtrar apenas pedidos completados
        const completedOrders = data.filter((order: Order) => order.status === 'completed')
        setOrders(completedOrders)
      }
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.items.some(item => item.product.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Concluído</Badge>
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Processando</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Pedidos Realizados</h1>
            <p className="text-muted-foreground">
              Visualize todos os pedidos concluídos com sucesso.
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Carregando pedidos...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pedidos Realizados</h1>
          <p className="text-muted-foreground">
            Visualize todos os pedidos concluídos com sucesso.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" /> Filtros
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pedidos Concluídos</CardTitle>
              <CardDescription>
                {filteredOrders.length} pedido(s) realizado(s) com sucesso.
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar pedidos..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum pedido realizado encontrado.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Os pedidos concluídos aparecerão aqui.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID do Pedido</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Produtos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      #{order.id.slice(-8).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        {order.items.map((item, index) => (
                          <div key={item.id} className="text-sm">
                            {item.quantity}x {item.product.name}
                            {index < order.items.length - 1 && <br />}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(order.total)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
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