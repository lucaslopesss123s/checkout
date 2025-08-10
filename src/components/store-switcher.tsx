'use client'

import * as React from 'react'
import { PlusCircle, Check, ChevronsUpDown } from 'lucide-react'

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

type Store = {
  label: string
  value: string
}

const stores = [
  {
    label: 'Loja Principal',
    value: 'loja-principal',
  },
]

export function StoreSwitcher() {
  const [open, setOpen] = React.useState(false)
  const [showNewStoreDialog, setShowNewStoreDialog] = React.useState(false)
  const [selectedStore, setSelectedStore] = React.useState<Store>(stores[0])

  React.useEffect(() => {
    const hasCreatedStore = localStorage.getItem('hasCreatedFirstStore')
    if (!hasCreatedStore) {
      setShowNewStoreDialog(true)
    }
  }, [])

  const handleCreateStore = () => {
    setShowNewStoreDialog(false);
    localStorage.setItem('hasCreatedFirstStore', 'true');
    // In a real app, you would add the new store to the list and select it.
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
            {selectedStore.label}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandList>
              <CommandInput placeholder="Procurar loja..." />
              <CommandEmpty>Nenhuma loja encontrada.</CommandEmpty>
              <CommandGroup heading="Lojas">
                {stores.map((store) => (
                  <CommandItem
                    key={store.value}
                    onSelect={() => {
                      setSelectedStore(store)
                      setOpen(false)
                    }}
                    className="text-sm"
                  >
                    {store.label}
                    <Check
                      className={cn(
                        'ml-auto h-4 w-4',
                        selectedStore.value === store.value
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false)
                    setShowNewStoreDialog(true)
                  }}
                >
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Criar Loja
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
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
                <Input id="name" placeholder="Minha Loja de Roupas" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewStoreDialog(false)}>
              Cancelar
            </Button>
            <Button type="submit" onClick={handleCreateStore}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
