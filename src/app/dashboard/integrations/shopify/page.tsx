
'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { CheckCircle } from "lucide-react"

export default function ShopifyIntegrationPage() {
    const { user } = useAuth();
    const username = user?.displayName || user?.email?.split('@')[0] || 'Usuário';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Shopify</h1>
                <p className="text-muted-foreground">Plataforma global de e-commerce.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Olá {username}</CardTitle>
                            <CardDescription>Vamos instalar o checkout transparente da LojaFacil na sua loja Shopify.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="shopify-domain">Domínio MyShopify</Label>
                                <div className="flex items-center">
                                    <Input id="shopify-domain" placeholder="sua-loja" />
                                    <span className="ml-2 px-3 py-2 bg-muted text-muted-foreground rounded-r-md border border-l-0 border-input">.myshopify.com</span>
                                </div>
                                <p className="text-xs text-muted-foreground">A URL não pode conter os seguintes valores: myshopify.com www, https://, http://, /, .b</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="api-token">Token de acesso api admin</Label>
                                <Input id="api-token" type="password" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="api-key">Chave de API</Label>
                                <Input id="api-key" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="api-secret">Chave secreta da api</Label>
                                <Input id="api-secret" type="password" />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox id="skip-cart" />
                                <Label htmlFor="skip-cart" className="font-normal">Pular carrinho</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="import-coupons" />
                                <Label htmlFor="import-coupons" className="font-normal">Importar cupons da Shopify</Label>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="flex justify-end">
                        <Button>Salvar</Button>
                    </div>
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Status da integração</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select defaultValue="ativo">
                                <SelectTrigger className="w-full">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <SelectValue placeholder="Selecione o status" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ativo">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            <span>Ativo</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="inativo">Inativo</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Está com dúvidas?</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <Button variant="link" className="p-0">
                                Aprenda como integrar sua loja com o Shopify.
                           </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
