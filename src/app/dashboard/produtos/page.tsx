
'use client'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Search, Trash2, Pencil } from "lucide-react"

const products = [
  {
    id: "1",
    name: "T-Shirt Clássica de Algodão",
    status: "Ativo",
    shipping: "Sim",
    image: "https://placehold.co/40x40.png",
    inventory: 150,
  },
  {
    id: "2",
    name: "Calça Jeans Slim Fit",
    status: "Ativo",
    shipping: "Sim",
    image: "https://placehold.co/40x40.png",
    inventory: 80,
  },
  {
    id: "3",
    name: "Moletom com Capuz Essencial",
    status: "Ativo",
    shipping: "Sim",
    image: "https://placehold.co/40x40.png",
    inventory: 45,
  },
   {
    id: "4",
    name: "Tênis Casual Urbano",
    status: "Inativo",
    shipping: "Sim",
    image: "https://placehold.co/40x40.png",
    inventory: 0,
  },
   {
    id: "5",
    name: "Óculos de Sol Aviador",
    status: "Ativo",
    shipping: "Sim",
    image: "https://placehold.co/40x40.png",
    inventory: 60,
  },
  {
    id: "6",
    name: "Gift Card Digital",
    status: "Ativo",
    shipping: "Não",
    image: "https://placehold.co/40x40.png",
    inventory: Infinity,
  },
];

export default function ProdutosPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie seus produtos e assinaturas.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/produtos/novo">
            <PlusCircle className="mr-2 h-4 w-4" /> Criar Produto
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                 <div>
                    <CardTitle>Seus Produtos</CardTitle>
                    <CardDescription>Visualize e gerencie todos os seus produtos cadastrados.</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Procurar produto..." className="pl-8" />
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] hidden sm:table-cell"></TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Requer Envio</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                    <TableCell className="hidden sm:table-cell">
                        <img src={product.image} alt={product.name} className="h-10 w-10 rounded-md object-cover" data-ai-hint="product image" />
                    </TableCell>
                  <TableCell className="font-medium">
                    {product.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.status === "Ativo" ? "default" : "outline"} className={product.status === "Ativo" ? "bg-green-100 text-green-800 border-green-200" : ""}>
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{product.inventory === Infinity ? 'Ilimitado' : product.inventory}</TableCell>
                  <TableCell>{product.shipping}</TableCell>
                  <TableCell>
                     <div className="flex items-center gap-2">
                        <Button size="icon" variant="outline" className="h-8 w-8">
                            <Pencil className="h-4 w-4"/>
                            <span className="sr-only">Editar</span>
                        </Button>
                         <Button size="icon" variant="outline" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4"/>
                            <span className="sr-only">Excluir</span>
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-end space-x-2 pt-4">
              <span className="text-sm text-muted-foreground">Mostrando {products.length} de {products.length} produtos</span>
              <Button variant="outline" size="sm">Anterior</Button>
              <Button variant="outline" size="sm">Próxima</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
