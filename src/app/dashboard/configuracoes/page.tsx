'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Trash2, Settings } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { useStore } from '@/contexts/store-context'

export default function ConfiguracoesPage() {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { selectedStore, loadStores } = useStore()

  const handleDeleteStore = async () => {
    if (!selectedStore) {
      toast({
        title: 'Erro',
        description: 'Nenhuma loja selecionada',
        variant: 'destructive'
      })
      return
    }

    const lojaId = selectedStore.id

    setIsDeleting(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast({
          title: 'Erro',
          description: 'Token de autenticação não encontrado',
          variant: 'destructive'
        })
        return
      }

      const response = await fetch(`/api/stores/${lojaId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao deletar loja')
      }

      toast({
        title: 'Sucesso',
        description: 'Loja deletada com sucesso'
      })

      // Recarregar as lojas e redirecionar
      await loadStores()
      router.push('/dashboard')
    } catch (error) {
      console.error('Erro ao deletar loja:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao deletar loja. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Configurações do Checkout</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Zona de Perigo</CardTitle>
            <CardDescription>
              Ações irreversíveis que afetam permanentemente sua loja.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
              <div>
                <h3 className="font-semibold text-red-800">Deletar Loja</h3>
                <p className="text-sm text-red-600">
                  {selectedStore 
                    ? `Remove permanentemente a loja "${selectedStore.Nome}" e todos os dados associados (produtos, pedidos, configurações).`
                    : 'Selecione uma loja para poder deletá-la. Remove permanentemente a loja e todos os dados associados.'
                  }
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="gap-2"
                    disabled={!selectedStore}
                  >
                    <Trash2 className="h-4 w-4" />
                    Deletar Loja
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Isso irá deletar permanentemente a loja
                      <strong> "{selectedStore?.Nome}" </strong>
                      e remover todos os dados dos nossos servidores, incluindo:
                      <br /><br />
                      • Todos os produtos
                      • Histórico de pedidos
                      • Configurações de checkout
                      • Integrações configuradas
                      • Dados de marketing
                      • Carrinhos abandonados
                      • Sessões de checkout
                      • Domínios personalizados
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteStore}
                      disabled={isDeleting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isDeleting ? 'Deletando...' : 'Sim, deletar permanentemente'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outras Configurações</CardTitle>
            <CardDescription>
              Configurações gerais do checkout e da loja.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Mais opções de configuração serão adicionadas em breve.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}