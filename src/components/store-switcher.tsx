'use client'

import * as React from 'react'
import { PlusCircle, Check, ChevronsUpDown } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useStore } from '@/contexts/store-context'
import { useToast } from '@/hooks/use-toast'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

type LojaAdmin = {
  id: string
  Nome: string
  user_id: string
  createdAt: string
  updatedAt: string
}

type Store = {
  label: string
  value: string
  id?: string
}

export function StoreSwitcher() {
  const [open, setOpen] = React.useState(false)
  const [showNewStoreDialog, setShowNewStoreDialog] = React.useState(false)
  const [newStoreName, setNewStoreName] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const { user } = useAuth()
  const { stores: contextStores, selectedStore: contextSelectedStore, setSelectedStore: setContextSelectedStore, loadStores } = useStore()
  const { toast } = useToast()

  // Converter stores do contexto para o formato local
  const stores: Store[] = contextStores.map(store => ({
    id: store.id,
    label: store.Nome,
    value: store.id,
  }))

  const selectedStore = contextSelectedStore ? {
    id: contextSelectedStore.id,
    label: contextSelectedStore.Nome,
    value: contextSelectedStore.id,
  } : null

  // Usar a função loadStores do contexto
  React.useEffect(() => {
    if (user) {
      loadStores()
    }
  }, [user, loadStores])

  React.useEffect(() => {
    // Verificar se o usuário já possui lojas cadastradas no banco de dados
    if (user && contextStores.length === 0) {
      // Aguardar o carregamento das lojas antes de decidir se mostra o popup
      const checkTimer = setTimeout(() => {
        if (contextStores.length === 0) {
          setShowNewStoreDialog(true)
        }
      }, 1000) // Aguarda 1 segundo para garantir que as lojas foram carregadas
      
      return () => clearTimeout(checkTimer)
    }
  }, [user, contextStores])

  const handleCreateStore = async () => {
    if (!newStoreName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Nome da loja é obrigatório',
      })
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/lojas-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ Nome: newStoreName.trim() }),
      })

      if (response.ok) {
        const novaLoja: LojaAdmin = await response.json()
        // Recarregar lojas do contexto
        await loadStores()
        
        // Selecionar a nova loja criada
        const novaLojaFromContext = contextStores.find(store => store.id === novaLoja.id)
        if (novaLojaFromContext) {
          setContextSelectedStore(novaLojaFromContext)
        }
        
        setShowNewStoreDialog(false)
        setNewStoreName('')
        
        toast({
          title: 'Sucesso',
          description: 'Loja criada com sucesso!',
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar loja')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Erro ao criar loja',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Selecione uma loja"
            className="w-[200px] justify-between"
          >
            {selectedStore?.label || 'Selecione uma loja'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <div className="p-2">
            <div className="text-xs font-medium text-muted-foreground px-2 py-1.5">Lojas</div>
            <div className="space-y-1">
              {stores.length === 0 ? (
                <div className="text-sm text-muted-foreground px-2 py-1.5">Nenhuma loja encontrada.</div>
              ) : (
                stores.map((store) => (
                  <Button
                    key={store.value}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between h-8 px-2 text-sm"
                    onClick={() => {
                      const storeFromContext = contextStores.find(s => s.id === store.id)
                      if (storeFromContext) {
                        setContextSelectedStore(storeFromContext)
                      }
                      setOpen(false)
                    }}
                  >
                    {store.label}
                    <Check
                      className={cn(
                        'h-4 w-4',
                        selectedStore?.value === store.value
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                  </Button>
                ))
              )}
            </div>
          </div>
          <div className="border-t p-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-8 px-2"
              onClick={() => {
                setOpen(false)
                setShowNewStoreDialog(true)
              }}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Criar Loja
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <Dialog open={showNewStoreDialog} onOpenChange={setShowNewStoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar nova loja</DialogTitle>
            <DialogDescription>
              Dê um nome para sua nova loja para começar a vender.
            </DialogDescription>
          </DialogHeader>
          <div>
            <div className="space-y-4 py-2 pb-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da loja</Label>
                <Input 
                  id="name" 
                  placeholder="Minha Loja de Roupas" 
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateStore()
                    }
                  }}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowNewStoreDialog(false)
                setNewStoreName('')
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              onClick={handleCreateStore}
              disabled={loading || !newStoreName.trim()}
            >
              {loading ? 'Criando...' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
