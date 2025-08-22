"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, ShoppingBag, ArrowRight, TrendingUp, Clock } from "lucide-react"
import { useState, useEffect } from "react"
import { useStore } from "@/contexts/store-context"

export default function PedidosPage() {
  const [stats, setStats] = useState({
    completedOrders: 0,
    abandonedCarts: 0,
    totalRevenue: 0,
    conversionRate: 0
  })
  const { selectedStore } = useStore()

  useEffect(() => {
    fetchStats()
  }, [selectedStore])

  const fetchStats = async () => {
    // Por enquanto, vamos simular dados estatísticos
    // Em uma implementação real, você criaria APIs específicas para essas métricas
    setStats({
      completedOrders: 127,
      abandonedCarts: 23,
      totalRevenue: 15420.50,
      conversionRate: 84.7
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pedidos</h1>
        <p className="text-muted-foreground">Gerencie seus pedidos e acompanhe o desempenho das vendas.</p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Realizados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedOrders}</div>
            <p className="text-xs text-muted-foreground">
              Pedidos concluídos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carrinhos Abandonados</CardTitle>
            <ShoppingBag className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.abandonedCarts}</div>
            <p className="text-xs text-muted-foreground">
              Oportunidades de recuperação
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Vendas realizadas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Visitantes que compraram
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards de navegação para subáreas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Pedidos Realizados</CardTitle>
                <CardDescription>
                  Visualize e gerencie todos os pedidos concluídos com sucesso
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.completedOrders}</p>
                <p className="text-sm text-muted-foreground">Pedidos concluídos</p>
              </div>
              <Button asChild>
                <Link href="/dashboard/pedidos/realizados">
                  Ver Pedidos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Carrinhos Abandonados</CardTitle>
                <CardDescription>
                  Recupere vendas perdidas com estratégias de remarketing
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">{stats.abandonedCarts}</p>
                <p className="text-sm text-muted-foreground">Carrinhos abandonados</p>
              </div>
              <Button asChild variant="outline">
                <Link href="/dashboard/pedidos/carrinhos-abandonados">
                  Recuperar Vendas
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção de ações rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesse rapidamente as funcionalidades mais utilizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/dashboard/pedidos/realizados">
                <CheckCircle className="mr-2 h-4 w-4" />
                Ver Todos os Pedidos
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/pedidos/carrinhos-abandonados">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Recuperar Carrinhos
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/relatorios">
                <TrendingUp className="mr-2 h-4 w-4" />
                Ver Relatórios
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
