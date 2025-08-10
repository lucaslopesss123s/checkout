'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from '@/components/ui/checkbox'
import { getSuggestions, type AIState } from '@/lib/actions'
import { Wand2, Loader2 } from 'lucide-react'

const initialState: AIState = {
  suggestions: null,
  error: null,
  loading: false,
};

const paymentTypes = [
  { id: 'pix', label: 'PIX' },
  { id: 'credit-card', label: 'Cartão de Crédito' },
  { id: 'boleto', label: 'Boleto' },
];

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Gerando...
        </>
      ) : (
        <>
          <Wand2 className="mr-2 h-4 w-4" />
          Gerar Sugestões
        </>
      )}
    </Button>
  )
}

export function AiOptimizer() {
  const [state, formAction] = useFormState(getSuggestions, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Otimizador de Conversão com IA</CardTitle>
        <CardDescription>
          Receba sugestões de melhoria para o seu funil de checkout com base nos seus dados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Meios de Pagamento Atuais</Label>
              <div className="flex flex-col space-y-2 pt-2">
                {paymentTypes.map((type) => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Checkbox id={type.id} name="paymentTypes" value={type.label} />
                    <Label htmlFor={type.id} className="font-normal">{type.label}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cartSize">Tamanho Médio do Carrinho (Nº de Itens)</Label>
              <Input id="cartSize" name="cartSize" type="number" placeholder="Ex: 3" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="currentCheckoutFunnel">Descrição do Funil de Checkout Atual</Label>
            <Textarea
              id="currentCheckoutFunnel"
              name="currentCheckoutFunnel"
              placeholder="Ex: 1. Carrinho, 2. Dados Pessoais e Endereço, 3. Pagamento, 4. Confirmação"
              rows={4}
            />
          </div>
          <SubmitButton />
        </form>
        {state.error && <p className="mt-4 text-sm text-destructive">{state.error}</p>}
        {state.suggestions && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold">Sugestões Geradas:</h3>
            <div className="mt-2 rounded-md border bg-muted p-4">
                <pre className="whitespace-pre-wrap font-body text-sm">{state.suggestions}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
