'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useAuth } from '@/contexts/auth-context'

type LojaAdmin = {
  id: string
  Nome: string
  user_id: string
  createdAt: string
  updatedAt: string
}

type StoreContextType = {
  stores: LojaAdmin[]
  selectedStore: LojaAdmin | null
  setSelectedStore: (store: LojaAdmin | null) => void
  loadStores: () => Promise<void>
  loading: boolean
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [stores, setStores] = useState<LojaAdmin[]>([])
  const [selectedStore, setSelectedStore] = useState<LojaAdmin | null>(null)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const loadStores = useCallback(async () => {
    if (!user) {
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch('/api/lojas-admin', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const lojasAdmin: LojaAdmin[] = await response.json()
        setStores(lojasAdmin)
        
        // Selecionar a primeira loja se não houver nenhuma selecionada
        if (!selectedStore && lojasAdmin.length > 0) {
          setSelectedStore(lojasAdmin[0])
        }
      }
    } catch (error) {
      console.error('Erro ao carregar lojas:', error)
    } finally {
      setLoading(false)
    }
  }, [user, selectedStore])

  useEffect(() => {
    loadStores()
  }, [user])

  return (
    <StoreContext.Provider value={{
      stores,
      selectedStore,
      setSelectedStore,
      loadStores,
      loading
    }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}