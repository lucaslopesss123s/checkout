'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
  Tooltip,
} from 'recharts'

const data = [
  { value: 1200, name: 'Visitas ao Checkout', fill: 'hsl(var(--chart-1))' },
  { value: 950, name: 'Visitas Etapa 2', fill: 'hsl(var(--chart-2))' },
  { value: 680, name: 'Visitas Etapa 3', fill: 'hsl(var(--chart-3))' },
  { value: 450, name: 'Vendas', fill: 'hsl(var(--chart-4))' },
]

export function ConversionFunnel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Funil de Conversão (Hoje)</CardTitle>
        <CardDescription>
          Performance do seu checkout em tempo real.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--background))",
                  borderColor: "hsl(var(--border))",
                }}
              />
              <Funnel dataKey="value" data={data} isAnimationActive>
                <LabelList
                  position="right"
                  fill="hsl(var(--foreground))"
                  stroke="none"
                  dataKey="name"
                  formatter={(value: string) => value}
                />
                 <LabelList
                  position="center"
                  fill="#fff"
                  stroke="none"
                  dataKey="value"
                  className="font-bold"
                />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
