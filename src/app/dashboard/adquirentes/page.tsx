'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Settings, CreditCard, CheckCircle, ArrowLeft } from "lucide-react"

export default function AdquirentesPage() {
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [credentials, setCredentials] = useState({
    chaveSecreta: '',
    status: true,
    ativarCartaoCredito: true,
    ativarPix: true,
    utilizarTaxaJurosCustomizada: false
  })

  const handleSaveCredentials = () => {
    // Aqui você implementaria a lógica para salvar as credenciais
    console.log('Salvando credenciais:', credentials)
    setIsConfigModalOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Adquirentes</h1>
          <p className="text-muted-foreground">Gerencie seus adquirentes de pagamento e gateways.</p>
        </div>
      </div>

      {/* Gateways Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Gateways de Pagamento</h2>
          <p className="text-muted-foreground">Configure e gerencie suas integrações com gateways de pagamento.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Braza Pay Gateway */}
          <Card className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Braza Pay</CardTitle>
                    <CardDescription>Gateway de pagamento brasileiro</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Disponível
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>• Pagamentos via PIX, Cartão e Boleto</p>
                <p>• Taxas competitivas</p>
                <p>• Integração simplificada</p>
                <p>• Suporte 24/7</p>
              </div>
              <div className="flex space-x-2">
                 <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
                   <DialogTrigger asChild>
                     <Button size="sm" className="flex-1">
                       <Settings className="h-4 w-4 mr-2" />
                       Configurar
                     </Button>
                   </DialogTrigger>
                   <DialogContent className="sm:max-w-[500px]">
                     <DialogHeader className="space-y-3">
                       <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                           <CreditCard className="h-5 w-5 text-white" />
                         </div>
                         <div>
                           <DialogTitle className="text-xl">BRAZA PAY</DialogTitle>
                           <DialogDescription>Integre sua loja ao gateway Braza Pay</DialogDescription>
                         </div>
                       </div>
                     </DialogHeader>
                     
                     <div className="space-y-6 py-4">
                       <div className="space-y-4">
                         <h3 className="font-semibold text-sm">Informações básicas</h3>
                         
                         <div className="space-y-2">
                           <Label htmlFor="chave-secreta" className="text-sm font-medium">
                             Chave Secreta *
                           </Label>
                           <Input
                             id="chave-secreta"
                             type="password"
                             value={credentials.chaveSecreta}
                             onChange={(e) => setCredentials({...credentials, chaveSecreta: e.target.value})}
                             placeholder="Digite sua chave secreta"
                           />
                         </div>
                       </div>

                       <div className="space-y-4">
                         <div className="flex items-center justify-between">
                           <Label className="text-sm font-medium">Status *</Label>
                           <div className="flex items-center space-x-2">
                             <span className={`text-sm ${credentials.status ? 'text-green-600' : 'text-red-600'}`}>
                               {credentials.status ? 'Inativo' : 'Ativo'}
                             </span>
                             <Switch
                               checked={credentials.status}
                               onCheckedChange={(checked) => setCredentials({...credentials, status: checked})}
                             />
                           </div>
                         </div>
                       </div>

                       <div className="space-y-4">
                         <h3 className="font-semibold text-sm">Regras</h3>
                         
                         <div className="space-y-3">
                           <div className="flex items-center justify-between">
                             <Label className="text-sm">Ativar cartão de crédito</Label>
                             <Switch
                               checked={credentials.ativarCartaoCredito}
                               onCheckedChange={(checked) => setCredentials({...credentials, ativarCartaoCredito: checked})}
                             />
                           </div>
                           
                           <div className="flex items-center justify-between">
                             <Label className="text-sm">Ativar pix</Label>
                             <Switch
                               checked={credentials.ativarPix}
                               onCheckedChange={(checked) => setCredentials({...credentials, ativarPix: checked})}
                             />
                           </div>
                           
                           <div className="flex items-center justify-between">
                             <Label className="text-sm">Utilizar taxa de juros customizada</Label>
                             <Switch
                               checked={credentials.utilizarTaxaJurosCustomizada}
                               onCheckedChange={(checked) => setCredentials({...credentials, utilizarTaxaJurosCustomizada: checked})}
                             />
                           </div>
                         </div>
                       </div>

                       <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                         <div className="flex items-start space-x-2">
                           <div className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0 mt-0.5">
                             <span className="text-white text-xs font-bold flex items-center justify-center w-full h-full">!</span>
                           </div>
                           <div>
                             <p className="text-sm font-medium text-red-800">Está com dúvidas?</p>
                             <p className="text-sm text-red-700">Como integrar a gateway Braza Pay?</p>
                           </div>
                         </div>
                       </div>
                     </div>

                     <div className="flex space-x-3 pt-4">
                       <Button
                         variant="outline"
                         onClick={() => setIsConfigModalOpen(false)}
                         className="flex-1"
                       >
                         Cancelar
                       </Button>
                       <Button
                         onClick={handleSaveCredentials}
                         className="flex-1 bg-pink-500 hover:bg-pink-600"
                       >
                         Salvar
                       </Button>
                     </div>
                   </DialogContent>
                 </Dialog>
                 <Button variant="outline" size="sm">
                   Saiba Mais
                 </Button>
               </div>
            </CardContent>
          </Card>

          {/* Placeholder for future gateways */}
          <Card className="border-dashed border-2 border-muted-foreground/25">
            <CardContent className="flex flex-col items-center justify-center h-full py-8 text-center">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-muted-foreground mb-2">Mais Gateways</h3>
              <p className="text-sm text-muted-foreground mb-4">Novas integrações em breve</p>
              <Badge variant="outline">Em Desenvolvimento</Badge>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Adquirentes Tradicionais Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Adquirentes Tradicionais</h2>
          <p className="text-muted-foreground">Gerencie suas configurações de adquirentes convencionais.</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mb-4">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">Nenhum adquirente configurado</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              Configure seus adquirentes tradicionais para processar pagamentos com cartão de crédito e débito.
            </p>
            <Button variant="outline">
              Adicionar Adquirente
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
