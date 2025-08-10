
'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Upload } from "lucide-react"

export default function NovoProdutoPage() {
  return (
    <div className="space-y-4">
        <Link href="/dashboard/produtos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Produtos
        </Link>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Criar Novo Produto</h1>
          <p className="text-muted-foreground">
            Preencha os detalhes para cadastrar um novo produto.
          </p>
        </div>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Detalhes do Produto</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="product-name">Nome do Produto</Label>
                            <Input id="product-name" placeholder="Ex: Curso de Design" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="product-description">Descrição</Label>
                            <Textarea id="product-description" placeholder="Descreva seu produto..." />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Imagens</CardTitle>
                        <CardDescription>Adicione imagens para seu produto.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border-2 border-dashed border-muted-foreground/50 rounded-lg p-6 flex flex-col items-center justify-center text-center">
                            <Upload className="h-10 w-10 text-muted-foreground"/>
                            <p className="mt-2 text-sm text-muted-foreground">
                                <span className="font-semibold text-primary">Clique para fazer upload</span> ou arraste e solte
                            </p>
                            <p className="text-xs text-muted-foreground">PNG, JPG, GIF até 10MB</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Preço</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="product-price">Preço</Label>
                            <Input id="product-price" type="number" placeholder="0,00" />
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <Select defaultValue="ativo">
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ativo">Ativo</SelectItem>
                                <SelectItem value="inativo">Inativo</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Envio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="shipping-required" />
                            <Label htmlFor="shipping-required" className="font-normal">Este produto requer envio</Label>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild><Link href="/dashboard/produtos">Cancelar</Link></Button>
        <Button>Salvar Produto</Button>
      </div>
    </div>
  )
}
