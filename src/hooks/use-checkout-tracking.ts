'use client'

import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/contexts/store-context'

interface CheckoutTrackingData {
  nome?: string
  email?: string
  telefone?: string
  etapa_atual: string
  itens: any[]
  valor_total?: number
}

interface UseCheckoutTrackingOptions {
  sessionId?: string
  autoTrack?: boolean
}

export function useCheckoutTracking(options: UseCheckoutTrackingOptions = {}) {
  // Tentar usar o store context, mas não falhar se não estiver disponível
  let store = null
  try {
    const storeContext = useStore()
    store = storeContext?.store
  } catch (error) {
    // Store context não disponível, usar ID padrão
    console.warn('Store context não disponível, usando ID padrão')
  }
  
  const [sessionId, setSessionId] = useState<string | null>(options.sessionId || null)
  const [isTracking, setIsTracking] = useState(false)
  const trackingDataRef = useRef<CheckoutTrackingData>({
    etapa_atual: 'carrinho',
    itens: []
  })
  const lastUpdateRef = useRef<number>(0)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Gerar session ID único
  const generateSessionId = () => {
    return `checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Obter informações do navegador
  const getBrowserInfo = () => {
    return {
      user_agent: navigator.userAgent,
      ip: null // Será capturado no backend
    }
  }

  // Iniciar rastreamento
  const startTracking = async (initialData?: Partial<CheckoutTrackingData>) => {
    // Usar ID da loja do contexto ou ID padrão para teste
    const lojaId = store?.id || '5d38b556-cb47-4493-8363-4b655b416df9'
    
    if (!lojaId) {
      console.warn('Store ID não encontrado para rastreamento')
      return
    }

    const newSessionId = sessionId || generateSessionId()
    setSessionId(newSessionId)
    setIsTracking(true)

    // Atualizar dados iniciais
    if (initialData) {
      trackingDataRef.current = { ...trackingDataRef.current, ...initialData }
    }

    try {
      const response = await fetch('/api/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id_loja: lojaId,
          session_id: newSessionId,
          action: 'entrada',
          ...trackingDataRef.current,
          ...getBrowserInfo()
        })
      })

      if (!response.ok) {
        throw new Error('Falha ao iniciar rastreamento')
      }

      console.log('Rastreamento iniciado:', newSessionId)
    } catch (error) {
      console.error('Erro ao iniciar rastreamento:', error)
    }
  }

  // Atualizar dados de rastreamento
  const updateTracking = async (data: Partial<CheckoutTrackingData>) => {
    const lojaId = store?.id || '5d38b556-cb47-4493-8363-4b655b416df9'
    if (!isTracking || !sessionId || !lojaId) return

    // Atualizar dados locais
    trackingDataRef.current = { ...trackingDataRef.current, ...data }

    // Debounce para evitar muitas requisições
    const now = Date.now()
    if (now - lastUpdateRef.current < 1000) {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
      
      updateTimeoutRef.current = setTimeout(() => {
        performUpdate()
      }, 1000)
      return
    }

    await performUpdate()
  }

  const performUpdate = async () => {
    const lojaId = store?.id || '5d38b556-cb47-4493-8363-4b655b416df9'
    if (!sessionId || !lojaId) return

    try {
      const response = await fetch('/api/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id_loja: lojaId,
          session_id: sessionId,
          action: 'atualizacao',
          ...trackingDataRef.current,
          ...getBrowserInfo()
        })
      })

      if (!response.ok) {
        throw new Error('Falha ao atualizar rastreamento')
      }

      lastUpdateRef.current = Date.now()
    } catch (error) {
      console.error('Erro ao atualizar rastreamento:', error)
    }
  }

  // Finalizar rastreamento
  const stopTracking = async () => {
    const lojaId = store?.id || '5d38b556-cb47-4493-8363-4b655b416df9'
    if (!isTracking || !sessionId || !lojaId) return

    try {
      await fetch('/api/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id_loja: lojaId,
          session_id: sessionId,
          action: 'saida',
          ...trackingDataRef.current,
          ...getBrowserInfo()
        })
      })

      console.log('Rastreamento finalizado:', sessionId)
    } catch (error) {
      console.error('Erro ao finalizar rastreamento:', error)
    } finally {
      setIsTracking(false)
      setSessionId(null)
    }
  }

  // Atualizar etapa atual
  const updateStep = (etapa: string) => {
    updateTracking({ etapa_atual: etapa })
  }

  // Atualizar dados do cliente
  const updateCustomer = (nome?: string, email?: string, telefone?: string) => {
    updateTracking({ nome, email, telefone })
  }

  // Atualizar itens do carrinho
  const updateItems = (itens: any[], valor_total?: number) => {
    updateTracking({ itens, valor_total })
  }

  // Cleanup ao desmontar componente
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [])

  // Auto-iniciar rastreamento se habilitado
  useEffect(() => {
    const lojaId = store?.id || '5d38b556-cb47-4493-8363-4b655b416df9'
    if (options.autoTrack && lojaId && !isTracking) {
      startTracking()
    }
  }, [store?.id, options.autoTrack])

  // Rastrear saída da página
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isTracking) {
        // Usar sendBeacon para garantir que a requisição seja enviada
        const lojaId = store?.id || '5d38b556-cb47-4493-8363-4b655b416df9'
        navigator.sendBeacon('/api/checkout-session', JSON.stringify({
          id_loja: lojaId,
          session_id: sessionId,
          action: 'saida',
          ...trackingDataRef.current,
          ...getBrowserInfo()
        }))
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isTracking) {
        stopTracking()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isTracking, sessionId, store?.id])

  return {
    sessionId,
    isTracking,
    startTracking,
    updateTracking,
    stopTracking,
    updateStep,
    updateCustomer,
    updateItems,
    trackingData: trackingDataRef.current
  }
}