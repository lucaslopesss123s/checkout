'use client'
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

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

function ShopifyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="40" height="40">
      <path fill="#558061" d="M65.6 20.8c-2.4-1.6-5.6-2.4-8.8-2.4h-32c-3.2 0-6.4.8-8.8 2.4-1.6 1.6-2.4 4-2.4 6.4v30.4c0 2.4 1.6 4.8 3.2 5.6 2.4 1.6 5.6 2.4 8.8 2.4h32c3.2 0 6.4-.8 8.8-2.4 1.6-1.6 2.4-4 2.4-6.4V27.2c-.8-2.4-2.4-4.8-4-6.4zm-28.8 39.2c-7.2 0-12.8-5.6-12.8-12.8s5.6-12.8 12.8-12.8c2.4 0 4.8 1.6 6.4 2.4 2.4-.8 4-2.4 6.4-2.4 7.2 0 12.8 5.6 12.8 12.8s-5.6 12.8-12.8 12.8h-12.8z" />
    </svg>
  );
}

function WooCommerceIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="40" height="40">
        <path fill="#96588a" d="M63.3,16.7H16.7c-2.8,0-5,2.2-5,5v36.7c0,2.8,2.2,5,5,5h46.7c2.8,0,5-2.2,5-5V21.7C68.3,18.9,66.1,16.7,63.3,16.7z M43.3,50L40,56.7l-3.3-6.7H25l15-28.3L55,50H43.3z" />
    </svg>
  );
}

export default function IntegrationsPage() {
  const apiKey = "pk_live_********************";
  const secretKey = "sk_live_********************";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Integrações</h1>
        <p className="text-muted-foreground">Conecte a LojaFacil com suas ferramentas.</p>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Plataformas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Link href="/dashboard/integrations/shopify" className="col-span-1">
            <Card className="h-full">
              <CardContent className="flex items-center justify-between p-4 h-full">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">Shopify</CardTitle>
                    <Badge>Instalar</Badge>
                  </div>
                  <CardDescription className="text-xs">Plataforma global de e-commerce.</CardDescription>
                </div>
                <ShopifyIcon />
              </CardContent>
            </Card>
          </Link>
          <Card className="col-span-1">
            <CardContent className="flex items-center justify-between p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">WooCommerce</CardTitle>
                  <Badge>Instalar</Badge>
                </div>
                <CardDescription className="text-xs">Plataforma global de e-commerce.</CardDescription>
              </div>
              <WooCommerceIcon />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-6">
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
    </div>
  )
}
