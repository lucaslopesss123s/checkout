'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingBag, ExternalLink, Settings, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useStore } from '@/contexts/store-context'
import { useState, useEffect } from 'react'

interface Integration {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  href: string
  status: 'connected' | 'disconnected' | 'error'
  category: 'payment' | 'domain' | 'ecommerce' | 'analytics'
}

export default function IntegracaoPage() {
  const { selectedStore } = useStore()
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'shopify',
      name: 'Shopify',
      description: 'Integração com sua loja Shopify para sincronização de produtos e pedidos.',
      icon: <ShoppingBag className="h-8 w-8 text-green-600" />,
      href: '/dashboard/integracoes/shopify',
      status: 'disconnected',
      category: 'ecommerce'
    }
  ])

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (selectedStore) {
      checkIntegrationsStatus()
    }
  }, [selectedStore])

  const checkIntegrationsStatus = async () => {
    if (!selectedStore) return

    try {
      setLoading(true)
      
      // Verificar status do Shopify
      const shopifyResponse = await fetch(`/api/shopify/credentials?storeId=${selectedStore.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      let shopifyConfigured = false
      
      if (shopifyResponse.ok) {
        const shopifyData = await shopifyResponse.json()
        // Se a API retornou dados, significa que a configuração existe
        shopifyConfigured = !!(shopifyData.id && shopifyData.dominio_api)
      }
      
      setIntegrations(prev => prev.map(integration => {
        if (integration.id === 'shopify') {
          return {
            ...integration,
            status: shopifyConfigured ? 'connected' : 'disconnected'
          }
        }
        return integration
      }))
      
    } catch (error) {
      console.error('Erro ao verificar status das integrações:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Settings className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800">Conectado</Badge>
      case 'error':
        return <Badge variant="destructive">Erro</Badge>
      default:
        return <Badge variant="secondary">Não configurado</Badge>
    }
  }

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'domain':
        return 'Domínios & DNS'
      case 'ecommerce':
        return 'E-commerce'
      case 'payment':
        return 'Pagamentos'
      case 'analytics':
        return 'Analytics'
      default:
        return 'Outros'
    }
  }

  const groupedIntegrations = integrations.reduce((acc, integration) => {
    const category = integration.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(integration)
    return acc
  }, {} as Record<string, Integration[]>)

  if (!selectedStore) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Selecione uma loja</h2>
          <p className="text-gray-600">Escolha uma loja para gerenciar suas integrações.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Integrações</h1>
        <p className="text-gray-600">
          Conecte sua loja com serviços externos para automatizar processos e melhorar a experiência do cliente.
        </p>
      </div>

      {Object.entries(groupedIntegrations).map(([category, categoryIntegrations]) => (
        <div key={category} className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {getCategoryName(category)}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryIntegrations.map((integration) => (
              <Card key={integration.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {integration.icon}
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(integration.status)}
                          {getStatusBadge(integration.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="mb-4">
                    {integration.description}
                  </CardDescription>
                  
                  <Link href={integration.href}>
                    <Button className="w-full" variant={integration.status === 'connected' ? 'outline' : 'default'}>
                      {integration.status === 'connected' ? (
                        <>
                          <Settings className="h-4 w-4 mr-2" />
                          Gerenciar
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Configurar
                        </>
                      )}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Seção de ajuda */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Precisa de ajuda?</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-blue-700 mb-3">
            Consulte nossa documentação para configurar suas integrações corretamente.
          </CardDescription>
          <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver Documentação
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}