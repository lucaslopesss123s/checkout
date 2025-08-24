"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Trash2, Edit, Plus, Truck } from "lucide-react"
import { useStore } from "@/contexts/store-context"
import { toast } from "sonner"

interface FreteOption {
  id: string
  nome: string
  preco: number
  prazo_minimo: number
  prazo_maximo: number
  ativo: boolean
  frete_gratis_ativo: boolean
  valor_minimo_gratis?: number
}

export default function FretePage() {
  const [freteOptions, setFreteOptions] = useState<FreteOption[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingOption, setEditingOption] = useState<FreteOption | null>(null)
  const { selectedStore } = useStore()

  // Form state
  const [formData, setFormData] = useState({
    nome: "",
    preco: 0,
    prazo_minimo: 1,
    prazo_maximo: 7,
    ativo: true,
    frete_gratis_ativo: false,
    valor_minimo_gratis: 0
  })

  useEffect(() => {
    if (selectedStore) {
      fetchFreteOptions()
    }
  }, [selectedStore])

  const fetchFreteOptions = async () => {
    if (!selectedStore) return

    try {
      const response = await fetch(`/api/frete?id_loja=${selectedStore.id}`)
      if (response.ok) {
        const data = await response.json()
        setFreteOptions(data)
      } else {
        toast.error("Erro ao carregar opções de frete")
      }
    } catch (error) {
      console.error("Erro ao buscar opções de frete:", error)
      toast.error("Erro ao carregar opções de frete")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedStore) {
      toast.error("Nenhuma loja selecionada")
      return
    }

    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório")
      return
    }

    if (formData.prazo_minimo > formData.prazo_maximo) {
      toast.error("Prazo mínimo não pode ser maior que o máximo")
      return
    }

    if (formData.frete_gratis_ativo && formData.valor_minimo_gratis <= 0) {
      toast.error("Valor mínimo para frete grátis deve ser maior que zero")
      return
    }

    try {
      const payload = {
        ...formData,
        id_loja: selectedStore.id,
        valor_minimo_gratis: formData.frete_gratis_ativo ? formData.valor_minimo_gratis : null
      }

      const url = editingOption ? "/api/frete" : "/api/frete"
      const method = editingOption ? "PUT" : "POST"
      
      if (editingOption) {
        payload.id = editingOption.id
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast.success(editingOption ? "Opção de frete atualizada!" : "Opção de frete criada!")
        setIsDialogOpen(false)
        resetForm()
        fetchFreteOptions()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao salvar opção de frete")
      }
    } catch (error) {
      console.error("Erro ao salvar opção de frete:", error)
      toast.error("Erro ao salvar opção de frete")
    }
  }

  const handleEdit = (option: FreteOption) => {
    setEditingOption(option)
    setFormData({
      nome: option.nome,
      preco: option.preco,
      prazo_minimo: option.prazo_minimo,
      prazo_maximo: option.prazo_maximo,
      ativo: option.ativo,
      frete_gratis_ativo: option.frete_gratis_ativo,
      valor_minimo_gratis: option.valor_minimo_gratis || 0
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta opção de frete?")) {
      return
    }

    try {
      const response = await fetch(`/api/frete?id=${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Opção de frete excluída!")
        fetchFreteOptions()
      } else {
        toast.error("Erro ao excluir opção de frete")
      }
    } catch (error) {
      console.error("Erro ao excluir opção de frete:", error)
      toast.error("Erro ao excluir opção de frete")
    }
  }

  const resetForm = () => {
    setFormData({
      nome: "",
      preco: 0,
      prazo_minimo: 1,
      prazo_maximo: 7,
      ativo: true,
      frete_gratis_ativo: false,
      valor_minimo_gratis: 0
    })
    setEditingOption(null)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Frete</h1>
          <p className="text-muted-foreground">Gerencie as opções de frete da sua loja.</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Carregando opções de frete...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Frete</h1>
          <p className="text-muted-foreground">Gerencie as opções de frete da sua loja.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Opção de Frete
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingOption ? "Editar Opção de Frete" : "Nova Opção de Frete"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="nome">Nome da Opção</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Sedex, PAC, Transportadora"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="preco">Preço (R$)</Label>
                  <Input
                    id="preco"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.preco}
                    onChange={(e) => setFormData({ ...formData, preco: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ativo">Ativo</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Switch
                      id="ativo"
                      checked={formData.ativo}
                      onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                    />
                    <Label htmlFor="ativo" className="text-sm">
                      {formData.ativo ? "Ativo" : "Inativo"}
                    </Label>
                  </div>
                </div>
                <div>
                  <Label htmlFor="prazo_minimo">Prazo Mínimo (dias)</Label>
                  <Input
                    id="prazo_minimo"
                    type="number"
                    min="0"
                    value={formData.prazo_minimo}
                    onChange={(e) => setFormData({ ...formData, prazo_minimo: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="prazo_maximo">Prazo Máximo (dias)</Label>
                  <Input
                    id="prazo_maximo"
                    type="number"
                    min="0"
                    value={formData.prazo_maximo}
                    onChange={(e) => setFormData({ ...formData, prazo_maximo: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Switch
                    id="frete_gratis_ativo"
                    checked={formData.frete_gratis_ativo}
                    onCheckedChange={(checked) => setFormData({ ...formData, frete_gratis_ativo: checked })}
                  />
                  <Label htmlFor="frete_gratis_ativo" className="text-sm font-medium">
                    Ativar Frete Grátis
                  </Label>
                </div>
                
                {formData.frete_gratis_ativo && (
                  <div>
                    <Label htmlFor="valor_minimo_gratis">Valor Mínimo para Frete Grátis (R$)</Label>
                    <Input
                      id="valor_minimo_gratis"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.valor_minimo_gratis}
                      onChange={(e) => setFormData({ ...formData, valor_minimo_gratis: parseFloat(e.target.value) || 0 })}
                      placeholder="Ex: 100.00"
                      required={formData.frete_gratis_ativo}
                    />
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingOption ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Opções de Frete
          </CardTitle>
        </CardHeader>
        <CardContent>
          {freteOptions.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma opção de frete cadastrada</h3>
              <p className="text-muted-foreground mb-4">
                Crie sua primeira opção de frete para começar a oferecer diferentes formas de envio.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Opção
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Frete Grátis</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {freteOptions.map((option) => (
                  <TableRow key={option.id}>
                    <TableCell className="font-medium">{option.nome}</TableCell>
                    <TableCell>{formatCurrency(option.preco)}</TableCell>
                    <TableCell>
                      {option.prazo_minimo === option.prazo_maximo 
                        ? `${option.prazo_minimo} dia${option.prazo_minimo > 1 ? 's' : ''}` 
                        : `${option.prazo_minimo} - ${option.prazo_maximo} dias`
                      }
                    </TableCell>
                    <TableCell>
                      {option.frete_gratis_ativo ? (
                        <div className="text-sm">
                          <Badge variant="secondary">Ativo</Badge>
                          <div className="text-muted-foreground mt-1">
                            A partir de {formatCurrency(option.valor_minimo_gratis || 0)}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={option.ativo ? "default" : "secondary"}>
                        {option.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(option)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(option.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}