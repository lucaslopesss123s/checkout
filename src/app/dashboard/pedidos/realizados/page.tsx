"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Eye, Download, Filter } from "lucide-react"
import { useState, useEffect } from "react"
import { useStore } from "@/contexts/store-context"

interface Pedido {
  id: number
  numero_pedido: string
  nome: string
  email: string
  telefone: string
  endereco: string
  cidade: string
  estado: string
  itens: {
    nome: string
    quantidade: number
    preco: number
  }[]
  valor_total: number
  metodo_pagamento: string
  status: string
  finalizado_em: string
  created_at: string
}

export default function PedidosRealizadosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { selectedStore } = useStore()

  useEffect(() => {
    fetchPedidos()
  }, [selectedStore])

  const fetchPedidos = async () => {
    // Usar loja ID 1 como fallback se não houver loja selecionada
    const lojaId = selectedStore?.id || 1
    
    try {
      console.log('Buscando pedidos para loja:', lojaId)
      const response = await fetch(`/api/pedidos?loja_id=${lojaId}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Pedidos recebidos:', data)
        setPedidos(data.pedidos || [])
      } else {
        console.error('Erro na resposta da API:', response.status)
      }
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPedidos = pedidos.filter(pedido =>
    pedido.numero_pedido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pedido.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pedido.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pedido.itens.some(item => item.nome.toLowerCase().includes(searchTerm.toLowerCase()))
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

  const totalPedidos = filteredPedidos.reduce((sum, pedido) => sum + pedido.valor_total, 0)

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
                {filteredPedidos.length} pedido(s) realizado(s) • Total: {formatCurrency(totalPedidos)}
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
          {filteredPedidos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum pedido realizado encontrado.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Os pedidos concluídos aparecerão aqui após a finalização no checkout.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número do Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Produtos</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPedidos.map((pedido) => (
                  <TableRow key={pedido.id}>
                    <TableCell className="font-medium">
                      {pedido.numero_pedido}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{pedido.nome}</div>
                        <div className="text-muted-foreground">{pedido.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(pedido.finalizado_em)}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        {pedido.itens.map((item, index) => (
                          <div key={index} className="text-sm">
                            {item.quantidade}x {item.nome}
                            {index < pedido.itens.length - 1 && <br />}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{pedido.metodo_pagamento}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(pedido.valor_total)}
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