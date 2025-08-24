'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, CreditCard, CheckCircle, ArrowLeft, AlertCircle } from "lucide-react"
import { validateGatewayCredentials, sanitizeCredentials } from "@/lib/gateways/validation"
import { BrazaPayCredentials, FreePayCredentials } from "@/lib/gateways/types"

export default function AdquirentesPage() {
  const [isBrazaPayConfigModalOpen, setIsBrazaPayConfigModalOpen] = useState(false)
  const [isFreePayConfigModalOpen, setIsFreePayConfigModalOpen] = useState(false)
  
  const [brazaPayCredentials, setBrazaPayCredentials] = useState({
    chaveSecreta: '',
    status: true,
    ativarCartaoCredito: true,
    ativarPix: true,
    utilizarTaxaJurosCustomizada: false
  })
  
  const [freePayCredentials, setFreePayCredentials] = useState({
    apiKey: '',
    merchantId: '',
    status: true,
    ativarCartaoCredito: true,
    ativarPix: true,
    ativarBoleto: true,
    ambiente: 'sandbox' // sandbox ou production
  })

  const [brazaPayErrors, setBrazaPayErrors] = useState<string[]>([])
  const [freePayErrors, setFreePayErrors] = useState<string[]>([])
  const [isSavingBrazaPay, setIsSavingBrazaPay] = useState(false)
  const [isSavingFreePay, setIsSavingFreePay] = useState(false)

  const handleSaveBrazaPayCredentials = async () => {
    setIsSavingBrazaPay(true)
    setBrazaPayErrors([])
    
    // Sanitizar e validar credenciais
    const sanitizedCredentials = sanitizeCredentials(brazaPayCredentials)
    const validation = validateGatewayCredentials('brazapay', sanitizedCredentials)
    
    if (!validation.isValid) {
      setBrazaPayErrors(validation.errors)
      setIsSavingBrazaPay(false)
      return
    }
    
    try {
      // Aqui você implementaria a lógica para salvar as credenciais do BrazaPay
      console.log('Salvando credenciais BrazaPay:', sanitizedCredentials)
      
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setIsBrazaPayConfigModalOpen(false)
      setBrazaPayErrors([])
    } catch (error) {
      setBrazaPayErrors(['Erro ao salvar credenciais. Tente novamente.'])
    } finally {
      setIsSavingBrazaPay(false)
    }
  }
  
  const handleSaveFreePayCredentials = async () => {
    setIsSavingFreePay(true)
    setFreePayErrors([])
    
    // Sanitizar e validar credenciais
    const sanitizedCredentials = sanitizeCredentials(freePayCredentials)
    const validation = validateGatewayCredentials('freepay', sanitizedCredentials)
    
    if (!validation.isValid) {
      setFreePayErrors(validation.errors)
      setIsSavingFreePay(false)
      return
    }
    
    try {
      // Aqui você implementaria a lógica para salvar as credenciais do FreePay
      console.log('Salvando credenciais FreePay:', sanitizedCredentials)
      
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setIsFreePayConfigModalOpen(false)
      setFreePayErrors([])
    } catch (error) {
      setFreePayErrors(['Erro ao salvar credenciais. Tente novamente.'])
    } finally {
      setIsSavingFreePay(false)
    }
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
                 <Dialog open={isBrazaPayConfigModalOpen} onOpenChange={setIsBrazaPayConfigModalOpen}>
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
                             value={brazaPayCredentials.chaveSecreta}
                             onChange={(e) => setBrazaPayCredentials({...brazaPayCredentials, chaveSecreta: e.target.value})}
                             placeholder="Digite sua chave secreta"
                           />
                         </div>
                       </div>

                       <div className="space-y-4">
                         <div className="flex items-center justify-between">
                           <Label className="text-sm font-medium">Status *</Label>
                           <div className="flex items-center space-x-2">
                             <span className={`text-sm ${brazaPayCredentials.status ? 'text-green-600' : 'text-red-600'}`}>
                               {brazaPayCredentials.status ? 'Ativo' : 'Inativo'}
                             </span>
                             <Switch
                               checked={brazaPayCredentials.status}
                               onCheckedChange={(checked) => setBrazaPayCredentials({...brazaPayCredentials, status: checked})}
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
                               checked={brazaPayCredentials.ativarCartaoCredito}
                               onCheckedChange={(checked) => setBrazaPayCredentials({...brazaPayCredentials, ativarCartaoCredito: checked})}
                             />
                           </div>
                           
                           <div className="flex items-center justify-between">
                             <Label className="text-sm">Ativar pix</Label>
                             <Switch
                               checked={brazaPayCredentials.ativarPix}
                               onCheckedChange={(checked) => setBrazaPayCredentials({...brazaPayCredentials, ativarPix: checked})}
                             />
                           </div>
                           
                           <div className="flex items-center justify-between">
                             <Label className="text-sm">Utilizar taxa de juros customizada</Label>
                             <Switch
                               checked={brazaPayCredentials.utilizarTaxaJurosCustomizada}
                               onCheckedChange={(checked) => setBrazaPayCredentials({...brazaPayCredentials, utilizarTaxaJurosCustomizada: checked})}
                             />
                           </div>
                         </div>
                       </div>

                       {brazaPayErrors.length > 0 && (
                         <Alert variant="destructive">
                           <AlertCircle className="h-4 w-4" />
                           <AlertDescription>
                             <ul className="list-disc list-inside space-y-1">
                               {brazaPayErrors.map((error, index) => (
                                 <li key={index}>{error}</li>
                               ))}
                             </ul>
                           </AlertDescription>
                         </Alert>
                       )}

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
                         onClick={() => setIsBrazaPayConfigModalOpen(false)}
                         className="flex-1"
                       >
                         Cancelar
                       </Button>
                       <Button
                         onClick={handleSaveBrazaPayCredentials}
                         disabled={isSavingBrazaPay}
                         className="flex-1 bg-pink-500 hover:bg-pink-600"
                       >
                         {isSavingBrazaPay ? 'Salvando...' : 'Salvar'}
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

          {/* FreePay Gateway */}
          <Card className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">FreePay</CardTitle>
                    <CardDescription>Gateway de pagamento moderno</CardDescription>
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
                <p>• API moderna e flexível</p>
                <p>• Sandbox para testes</p>
                <p>• Documentação completa</p>
              </div>
              <div className="flex space-x-2">
                 <Dialog open={isFreePayConfigModalOpen} onOpenChange={setIsFreePayConfigModalOpen}>
                   <DialogTrigger asChild>
                     <Button size="sm" className="flex-1">
                       <Settings className="h-4 w-4 mr-2" />
                       Configurar
                     </Button>
                   </DialogTrigger>
                   <DialogContent className="sm:max-w-[500px]">
                     <DialogHeader className="space-y-3">
                       <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                           <CreditCard className="h-5 w-5 text-white" />
                         </div>
                         <div>
                           <DialogTitle className="text-xl">FREEPAY</DialogTitle>
                           <DialogDescription>Integre sua loja ao gateway FreePay</DialogDescription>
                         </div>
                       </div>
                     </DialogHeader>
                     
                     <div className="space-y-6 py-4">
                       <div className="space-y-4">
                         <h3 className="font-semibold text-sm">Informações básicas</h3>
                         
                         <div className="space-y-2">
                           <Label htmlFor="api-key" className="text-sm font-medium">
                             API Key *
                           </Label>
                           <Input
                             id="api-key"
                             type="password"
                             value={freePayCredentials.apiKey}
                             onChange={(e) => setFreePayCredentials({...freePayCredentials, apiKey: e.target.value})}
                             placeholder="Digite sua API Key"
                           />
                         </div>
                         
                         <div className="space-y-2">
                           <Label htmlFor="merchant-id" className="text-sm font-medium">
                             Merchant ID *
                           </Label>
                           <Input
                             id="merchant-id"
                             type="text"
                             value={freePayCredentials.merchantId}
                             onChange={(e) => setFreePayCredentials({...freePayCredentials, merchantId: e.target.value})}
                             placeholder="Digite seu Merchant ID"
                           />
                         </div>
                       </div>

                       <div className="space-y-4">
                         <div className="flex items-center justify-between">
                           <Label className="text-sm font-medium">Ambiente</Label>
                           <div className="flex items-center space-x-2">
                             <span className={`text-sm ${freePayCredentials.ambiente === 'production' ? 'text-green-600' : 'text-orange-600'}`}>
                               {freePayCredentials.ambiente === 'production' ? 'Produção' : 'Sandbox'}
                             </span>
                             <Switch
                               checked={freePayCredentials.ambiente === 'production'}
                               onCheckedChange={(checked) => setFreePayCredentials({...freePayCredentials, ambiente: checked ? 'production' : 'sandbox'})}
                             />
                           </div>
                         </div>
                         
                         <div className="flex items-center justify-between">
                           <Label className="text-sm font-medium">Status *</Label>
                           <div className="flex items-center space-x-2">
                             <span className={`text-sm ${freePayCredentials.status ? 'text-green-600' : 'text-red-600'}`}>
                               {freePayCredentials.status ? 'Ativo' : 'Inativo'}
                             </span>
                             <Switch
                               checked={freePayCredentials.status}
                               onCheckedChange={(checked) => setFreePayCredentials({...freePayCredentials, status: checked})}
                             />
                           </div>
                         </div>
                       </div>

                       <div className="space-y-4">
                         <h3 className="font-semibold text-sm">Métodos de Pagamento</h3>
                         
                         <div className="space-y-3">
                           <div className="flex items-center justify-between">
                             <Label className="text-sm">Ativar cartão de crédito</Label>
                             <Switch
                               checked={freePayCredentials.ativarCartaoCredito}
                               onCheckedChange={(checked) => setFreePayCredentials({...freePayCredentials, ativarCartaoCredito: checked})}
                             />
                           </div>
                           
                           <div className="flex items-center justify-between">
                             <Label className="text-sm">Ativar PIX</Label>
                             <Switch
                               checked={freePayCredentials.ativarPix}
                               onCheckedChange={(checked) => setFreePayCredentials({...freePayCredentials, ativarPix: checked})}
                             />
                           </div>
                           
                           <div className="flex items-center justify-between">
                             <Label className="text-sm">Ativar boleto</Label>
                             <Switch
                               checked={freePayCredentials.ativarBoleto}
                               onCheckedChange={(checked) => setFreePayCredentials({...freePayCredentials, ativarBoleto: checked})}
                             />
                           </div>
                         </div>
                       </div>

                       {freePayErrors.length > 0 && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              <ul className="list-disc list-inside space-y-1">
                                {freePayErrors.map((error, index) => (
                                  <li key={index}>{error}</li>
                                ))}
                              </ul>
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-start space-x-2">
                            <div className="w-4 h-4 rounded-full bg-blue-500 flex-shrink-0 mt-0.5">
                              <span className="text-white text-xs font-bold flex items-center justify-center w-full h-full">i</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-blue-800">Precisa de ajuda?</p>
                              <p className="text-sm text-blue-700">Consulte a documentação do FreePay para integração.</p>
                            </div>
                          </div>
                        </div>
                     </div>

                     <div className="flex space-x-3 pt-4">
                       <Button
                         variant="outline"
                         onClick={() => setIsFreePayConfigModalOpen(false)}
                         className="flex-1"
                       >
                         Cancelar
                       </Button>
                       <Button
                          onClick={handleSaveFreePayCredentials}
                          disabled={isSavingFreePay}
                          className="flex-1 bg-green-500 hover:bg-green-600"
                        >
                          {isSavingFreePay ? 'Salvando...' : 'Salvar'}
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
