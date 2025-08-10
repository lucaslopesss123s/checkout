
'use client'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, PlusCircle, Search, Trash2, Pencil } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const products = [
  {
    id: "1",
    name: "Curso de Next.js",
    status: "Ativo",
    shipping: "Não",
    image: "https://placehold.co/40x40.png",
  },
  {
    id: "2",
    name: "Ebook de Tailwind CSS",
    status: "Inativo",
    shipping: "Não",
    image: "https://placehold.co/40x40.png",
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
            <CardTitle>Seus Produtos</CardTitle>
            <CardDescription>Visualize e gerencie todos os seus produtos cadastrados.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Procurar produto..." className="pl-8" />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requer Envio</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                        <img src={product.image} alt={product.name} className="h-10 w-10 rounded-md object-cover" data-ai-hint="product image" />
                        <span>{product.name}</span>
                    </div>
                    </TableCell>
                  <TableCell>
                    <Badge variant={product.status === "Ativo" ? "default" : "outline"}>
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{product.shipping}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem>
                            <Pencil className="mr-2 h-4 w-4"/>
                            Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4"/>
                            Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-end space-x-2 pt-4">
              <Button variant="outline" size="sm">Anterior</Button>
              <Button variant="outline" size="sm">Próxima</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
