'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

const data = [
  { name: 'Pix', total: 825, fill: 'hsl(var(--chart-1))' },
  { name: 'Cartão', total: 530, fill: 'hsl(var(--chart-2))' },
  { name: 'Boleto', total: 120, fill: 'hsl(var(--chart-3))' },
]

export function PaymentMethods() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Meios de Pagamento</CardTitle>
        <CardDescription>
          Distribuição de vendas por meio de pagamento.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                stroke="hsl(var(--foreground))"
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                contentStyle={{
                  background: "hsl(var(--background))",
                  borderColor: "hsl(var(--border))",
                }}
              />
              <Bar dataKey="total" radius={[4, 4, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
