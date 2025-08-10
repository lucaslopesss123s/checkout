'use client'
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

function CopyButton({ textToCopy }: { textToCopy: string }) {
  const [hasCopied, setHasCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setHasCopied(true);
      toast({ title: "Copiado!", description: "O conteúdo foi copiado para a área de transferência." });
      setTimeout(() => setHasCopied(false), 2000);
    }, (err) => {
      toast({ variant: "destructive", title: "Erro!", description: "Não foi possível copiar." });
    });
  };

  return (
    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={copyToClipboard}>
      {hasCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

const webhookSnippet = `
fetch('https://api.lojafacil.com/v1/webhooks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer SEU_TOKEN_SECRETO'
  },
  body: JSON.stringify({
    url: 'https://sua-api.com/webhook-receiver',
    events: ['payment.paid', 'payment.failed']
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
`;

export default function IntegrationsPage() {
  const apiKey = "pk_live_********************";
  const secretKey = "sk_live_********************";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrações</h1>
        <p className="text-muted-foreground">Conecte a LojaFacil com suas ferramentas.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chaves de API</CardTitle>
          <CardDescription>Use estas chaves para autenticar suas requisições na API.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">Chave Pública</Label>
            <div className="flex items-center gap-2">
              <Input id="api-key" value={apiKey} readOnly />
              <CopyButton textToCopy={apiKey} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="secret-key">Chave Secreta</Label>
            <div className="flex items-center gap-2">
              <Input id="secret-key" value={secretKey} readOnly />
              <CopyButton textToCopy={secretKey} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>Seja notificado sobre eventos em tempo real.</CardDescription>
            </div>
            <CopyButton textToCopy={webhookSnippet} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-4 font-code text-sm overflow-x-auto">
            <pre><code>{webhookSnippet.trim()}</code></pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
