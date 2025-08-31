'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useStore } from '@/contexts/store-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Plus, ExternalLink, Copy, CheckCircle, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CloudflareZone {
  id: string;
  cloudflare_id: string;
  name: string;
  status: string;
  paused: boolean;
  name_servers: string[];
  created_on: string;
  activated_on: string | null;
  dns_records: any[];
  domain_info?: {
    status: string;
    dns_verificado: boolean;
    ssl_ativo: boolean;
    ultima_verificacao: string;
  };
  checkout_url?: string;
}

interface ZoneSummary {
  total: number;
  active: number;
  pending: number;
  with_ssl: number;
}

export default function CloudflarePage() {
  const { user } = useAuth();
  const { selectedStore } = useStore();
  const [zones, setZones] = useState<CloudflareZone[]>([]);
  const [summary, setSummary] = useState<ZoneSummary>({ total: 0, active: 0, pending: 0, with_ssl: 0 });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedZone, setSelectedZone] = useState<CloudflareZone | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const fetchZones = async () => {
    if (!selectedStore?.id) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/cloudflare/zones/status?id_loja=${selectedStore.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setZones(data.zones || []);
        setSummary(data.summary || { total: 0, active: 0, pending: 0, with_ssl: 0 });
      } else {
        console.error('Erro ao carregar zonas');
      }
    } catch (error) {
      console.error('Erro ao carregar zonas:', error);
    } finally {
      setLoading(false);
    }
  };

  const createZone = async () => {
    if (!newDomain.trim() || !selectedStore?.id) return;

    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/cloudflare/zones/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          domain: newDomain.trim(),
          id_loja: selectedStore.id
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Zona criada com sucesso!',
          description: 'Configure os nameservers para ativar o domínio.',
        });
        setNewDomain('');
        setShowAddDialog(false);
        setSelectedZone(data.zone);
        setShowInstructions(true);
        fetchZones();
      } else {
        toast({
          title: 'Erro ao criar zona',
          description: data.error || 'Erro desconhecido',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao criar zona',
        description: 'Erro de conexão',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  const checkZoneStatus = async (zoneId: string) => {
    if (!selectedStore?.id) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/cloudflare/zones/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          zone_id: zoneId,
          id_loja: selectedStore.id
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Status atualizado',
          description: data.message,
        });
        fetchZones();
      } else {
        toast({
          title: 'Erro ao verificar status',
          description: data.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao verificar status',
        description: 'Erro de conexão',
        variant: 'destructive'
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: 'Texto copiado para a área de transferência.',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Ativo</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800"><AlertCircle className="w-3 h-3 mr-1" />{status}</Badge>;
    }
  };

  useEffect(() => {
    fetchZones();
  }, [selectedStore]);

  if (!selectedStore) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Selecione uma loja para gerenciar domínios Cloudflare.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cloudflare DNS</h1>
          <p className="text-muted-foreground">
            Gerencie domínios personalizados com SSL automático via Cloudflare
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchZones} variant="outline" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Domínio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Domínio</DialogTitle>
                <DialogDescription>
                  Digite o domínio que você deseja configurar no Cloudflare.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="domain">Domínio</Label>
                  <Input
                    id="domain"
                    placeholder="exemplo: meusite.com.br"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={createZone} disabled={creating || !newDomain.trim()}>
                    {creating ? 'Criando...' : 'Criar Zona'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Domínios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summary.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Com SSL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary.with_ssl}</div>
          </CardContent>
        </Card>
      </div>

      {/* Zones List */}
      <Card>
        <CardHeader>
          <CardTitle>Domínios Configurados</CardTitle>
          <CardDescription>
            Lista de todos os domínios configurados no Cloudflare
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
          ) : zones.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum domínio configurado ainda.</p>
              <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Domínio
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {zones.map((zone) => (
                <Card key={zone.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{zone.name}</h3>
                          {getStatusBadge(zone.status)}
                          {zone.domain_info?.ssl_ativo && (
                            <Badge className="bg-blue-100 text-blue-800">SSL Ativo</Badge>
                          )}
                        </div>
                        
                        {zone.checkout_url && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">URL do Checkout:</span>
                            <a 
                              href={zone.checkout_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              {zone.checkout_url}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}

                        <div className="text-sm text-muted-foreground">
                          <p>Nameservers:</p>
                          <div className="mt-1 space-y-1">
                            {zone.name_servers?.map((ns, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <code className="bg-gray-100 px-2 py-1 rounded text-xs">{ns}</code>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => copyToClipboard(ns)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => checkZoneStatus(zone.id)}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Verificar
                        </Button>
                        {zone.status === 'pending' && (
                          <Button 
                            size="sm" 
                            onClick={() => {
                              setSelectedZone(zone);
                              setShowInstructions(true);
                            }}
                          >
                            Ver Instruções
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions Dialog */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configurar Nameservers</DialogTitle>
            <DialogDescription>
              Siga estas instruções para ativar seu domínio no Cloudflare
            </DialogDescription>
          </DialogHeader>
          
          {selectedZone && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Domínio:</strong> {selectedZone.name}
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="font-semibold">Passo 1: Acesse seu provedor de domínio</h4>
                <p className="text-sm text-muted-foreground">
                  Entre no painel de controle onde você registrou seu domínio (Registro.br, GoDaddy, Hostgator, etc.)
                </p>

                <h4 className="font-semibold">Passo 2: Altere os nameservers</h4>
                <p className="text-sm text-muted-foreground">
                  Substitua os nameservers atuais pelos nameservers do Cloudflare:
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  {selectedZone.name_servers?.map((ns, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <code className="bg-white px-3 py-2 rounded border">{ns}</code>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(ns)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                <h4 className="font-semibold">Passo 3: Aguarde a propagação</h4>
                <p className="text-sm text-muted-foreground">
                  A propagação DNS pode levar de alguns minutos até 24 horas. Após a ativação:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Seu domínio será automaticamente configurado</li>
                  <li>Um registro DNS A será criado apontando para nosso servidor</li>
                  <li>O SSL Universal será ativado automaticamente</li>
                  <li>Seu checkout ficará disponível em: <strong>https://checkout.{selectedZone.name}</strong></li>
                </ul>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Você pode fechar esta janela e verificar o status periodicamente clicando em "Verificar" na lista de domínios.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}