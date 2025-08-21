
"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Search } from "lucide-react"
import { useState, useEffect } from "react"
import { useStore } from "@/contexts/store-context"

interface Product {
  id: string;
  name: string;
  status: string;
  shipping: boolean;
  image?: string;
  inventory: number;
  price: number;
  valordesconto?: number;
  shopify_id?: string;
}

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { selectedStore } = useStore();

  useEffect(() => {
    fetchProducts();
  }, [selectedStore]);

  const fetchProducts = async () => {
    if (!selectedStore) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/products?storeId=${selectedStore.id}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Produtos</h1>
            <p className="text-muted-foreground">
              Gerencie seus produtos e assinaturas.
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Carregando produtos...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                  <Input 
                    placeholder="Procurar produto..." 
                    className="pl-8" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
            </div>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum produto encontrado.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Importe produtos do Shopify ou crie um novo produto.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px] hidden sm:table-cell"></TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Requer Envio</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Valor Anterior</TableHead>
                    <TableHead>
                      <span className="sr-only">Ações</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                        <TableCell className="hidden sm:table-cell">
                            <img src={product.image || "https://placehold.co/40x40.png"} alt={product.name} className="h-10 w-10 rounded-md object-cover" data-ai-hint="product image" />
                        </TableCell>
                      <TableCell className="font-medium">
                        {product.name}
                        {product.shopify_id && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Shopify
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.status === "Ativo" ? "default" : "outline"} className={product.status === "Ativo" ? "bg-green-100 text-green-800 border-green-200" : ""}>
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={product.inventory === 0 ? "text-red-500" : ""}>
                          {product.inventory === Infinity ? 'Ilimitado' : product.inventory}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.shipping ? "default" : "outline"}>
                          {product.shipping ? "Sim" : "Não"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        R$ {product.price.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {product.valordesconto ? (
                          <span className="text-sm text-muted-foreground line-through">
                            R$ {product.valordesconto.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">Gerenciado via Shopify</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-end space-x-2 pt-4">
                  <span className="text-sm text-muted-foreground">Mostrando {filteredProducts.length} de {products.length} produtos</span>
                  <Button variant="outline" size="sm">Anterior</Button>
                  <Button variant="outline" size="sm">Próxima</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
