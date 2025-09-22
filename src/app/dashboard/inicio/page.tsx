'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle, Globe, CreditCard, Truck, Package } from "lucide-react"

export default function InicioPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Início</h1>
          <p className="text-muted-foreground">
            Siga os passos abaixo para configurar seu checkout completo
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 gap-x-4 md:gap-x-8">
        {/* Etapa 1 - Domínio */}
        <div className="rounded-xs border bg-card text-card-foreground">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="leading-none tracking-tight font-semibold mb-4 text-cyan-950">Domínio</h3>
          </div>
          <div className="p-6 pt-0 text-gray-500">
            <div className="mb-5 min-h-16 md:min-h-24">
              Configure o domínio da sua loja, ideal é que seja o mesmo da sua loja no Shopify.
            </div>
            <div>
              <Button className="w-full">
                <Link className="w-full" href="/dashboard/dominio">
                  Configurar
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Etapa 2 - Gateway */}
        <div className="rounded-xs border bg-card text-card-foreground">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="leading-none tracking-tight font-semibold mb-4 text-cyan-950">Gateway</h3>
          </div>
          <div className="p-6 pt-0 text-gray-500">
            <div className="mb-5 min-h-16 md:min-h-24">
              Configure os meios de pagamentos que serão exibidos em sua loja.
            </div>
            <div>
              <Button className="w-full">
                <Link className="w-full" href="/dashboard/adquirentes">
                  Configurar
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Etapa 3 - Frete */}
        <div className="rounded-xs border bg-card text-card-foreground">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="leading-none tracking-tight font-semibold mb-4 text-cyan-950">Frete</h3>
          </div>
          <div className="p-6 pt-0 text-gray-500">
            <div className="mb-5 min-h-16 md:min-h-24">
              Configure um método de envio para entrega dos pedidos
            </div>
            <div>
              <Button className="w-full">
                <Link className="w-full" href="/dashboard/frete">
                  Configurar
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Etapa 4 - Landing Page */}
        <div className="rounded-xs border bg-card text-card-foreground">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="leading-none tracking-tight font-semibold mb-4 text-cyan-950">Landing Page</h3>
          </div>
          <div className="p-6 pt-0 text-gray-500">
            <div className="mb-5 min-h-16 md:min-h-24">
              Crie produtos para começar a usar o checkout.
            </div>
            <div>
              <Button className="w-full">
                <Link className="w-full" href="/dashboard/produtos">
                  Configurar
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Seção adicional com informações */}
      <div className="mt-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Próximos Passos
                </h3>
                <p className="text-gray-600 mb-4">
                  Após configurar todos os itens acima, seu checkout estará pronto para receber pedidos. 
                  Você pode personalizar ainda mais sua loja nas outras seções do painel.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/produtos">
                      <Package className="h-4 w-4 mr-2" />
                      Gerenciar Produtos
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/personalizar">
                      <Globe className="h-4 w-4 mr-2" />
                      Personalizar Loja
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}