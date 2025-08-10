import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, CalendarDays } from "lucide-react"

export function SalesCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Vendas Aprovadas (Dia)
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">R$ 1,250.00</div>
          <p className="text-xs text-muted-foreground">
            +15.2% em relação a ontem
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Vendas Aprovadas (Últimos 30 dias)
          </CardTitle>
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">R$ 45,231.89</div>
          <p className="text-xs text-muted-foreground">
            +20.1% em relação ao mês passado
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
