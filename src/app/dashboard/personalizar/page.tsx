"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Palette, Save } from 'lucide-react'
import { useStore } from '@/contexts/store-context'
import { useToast } from '@/hooks/use-toast'

interface CheckoutSettings {
  theme: string
  logo?: string
  favicon?: string
  cor_barra?: string
  cor_botao?: string
  contagem_regressiva: boolean
  barra_texto?: string
}

export default function PersonalizarPage() {
  const { selectedStore } = useStore()
  const { toast } = useToast()
  const [settings, setSettings] = useState<CheckoutSettings>({
    theme: 'default',
    cor_barra: '#0a101a',
    cor_botao: '#10b981',
    contagem_regressiva: false
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (selectedStore) {
      loadExistingSettings()
    }
  }, [selectedStore])

  const loadExistingSettings = async () => {
    if (!selectedStore) return
    
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      // Buscar configurações da loja_config
      const configResponse = await fetch(`/api/loja-config?id_loja=${selectedStore.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (configResponse.ok) {
        const configData = await configResponse.json()
        if (configData.success && configData.config) {
          setSettings({
            theme: 'default',
            logo: configData.config.logo || '',
            favicon: '',
            cor_barra: configData.config.cor_tema || '#0a101a',
            cor_botao: configData.config.cor_botao || '#10b981',
            contagem_regressiva: false,
            barra_texto: configData.config.aviso || ''
          })
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações existentes:', error)
    }
  }

  const handleSettingsChange = (field: keyof CheckoutSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const saveSettings = async () => {
    if (!selectedStore) {
      toast({
        title: "Erro",
        description: "Selecione uma loja primeiro",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast({
          title: "Erro",
          description: "Token de autenticação não encontrado",
          variant: "destructive"
        })
        return
      }
      
      // Salvar configurações na loja_config
      const settingsResponse = await fetch('/api/loja-config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id_loja: selectedStore.id,
          settings: {
            logo: settings.logo,
            cor_barra: settings.cor_barra,
            cor_botao: settings.cor_botao,
            barra_texto: settings.barra_texto
          }
        })
      })
      
      if (!settingsResponse.ok) {
        throw new Error('Erro ao salvar configurações')
      }
      
      toast({
        title: "Sucesso",
        description: "Configurações de personalização salvas com sucesso!"
      })
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Personalizar Checkout</h1>
        <p className="text-muted-foreground">
          Customize a aparência do seu checkout personalizado
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="mr-2 h-5 w-5" />
            Personalização do Checkout
          </CardTitle>
          <CardDescription>
            Ajuste as cores, textos e elementos visuais do seu checkout
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cor_barra">Cor da Barra Superior</Label>
              <Input
                id="cor_barra"
                type="color"
                value={settings.cor_barra}
                onChange={(e) => handleSettingsChange('cor_barra', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="cor_botao">Cor dos Botões</Label>
              <Input
                id="cor_botao"
                type="color"
                value={settings.cor_botao}
                onChange={(e) => handleSettingsChange('cor_botao', e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="logo">URL do Logo</Label>
            <Input
              id="logo"
              placeholder="https://exemplo.com/logo.png"
              value={settings.logo || ''}
              onChange={(e) => handleSettingsChange('logo', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="barra_texto">Texto da Barra Superior</Label>
            <Input
              id="barra_texto"
              placeholder="Frete grátis para todo o Brasil!"
              value={settings.barra_texto || ''}
              onChange={(e) => handleSettingsChange('barra_texto', e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="contagem_regressiva"
              checked={settings.contagem_regressiva}
              onCheckedChange={(checked) => handleSettingsChange('contagem_regressiva', checked)}
            />
            <Label htmlFor="contagem_regressiva">Ativar Contagem Regressiva</Label>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={saveSettings} disabled={loading} size="lg">
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </div>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
