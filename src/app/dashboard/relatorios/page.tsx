'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar, BarChart3, TrendingUp, Users, ShoppingCart } from "lucide-react";
import { useEffect, useState } from 'react';
import { useStore } from '@/contexts/store-context';

interface User {
  id: string;
  username: string;
  name: string;
}

type DateFilter = 'hoje' | 'ontem' | 'semana' | 'mes' | 'personalizado';
type UtmType = 'utm_source' | 'utm_medium' | 'utm_campaign' | 'utm_term' | 'utm_content';

export default function RelatoriosPage() {
  const [user, setUser] = useState<User | null>(null);
  const { store } = useStore();
  const [selectedUtm, setSelectedUtm] = useState<UtmType>('utm_source');
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter>('hoje');

  useEffect(() => {
    // Obter dados do usuário do localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Erro ao analisar dados do usuário:', error);
      }
    }
  }, []);

  const utmOptions = [
    { value: 'utm_source', label: 'UTM Source' },
    { value: 'utm_medium', label: 'UTM Medium' },
    { value: 'utm_campaign', label: 'UTM Campaign' },
    { value: 'utm_term', label: 'UTM Term' },
    { value: 'utm_content', label: 'UTM Content' }
  ];

  const dateFilterOptions = [
    { value: 'hoje', label: 'Hoje' },
    { value: 'ontem', label: 'Ontem' },
    { value: 'semana', label: 'Semana' },
    { value: 'mes', label: 'Mês' },
    { value: 'personalizado', label: 'Data Personalizada' }
  ];

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
          {user && (
            <p className="text-muted-foreground">Análise de UTMs e performance de marketing</p>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Analisar por UTM:</label>
          <Select value={selectedUtm} onValueChange={(value: UtmType) => setSelectedUtm(value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione o UTM" />
            </SelectTrigger>
            <SelectContent>
              {utmOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Período:</label>
          <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
            {dateFilterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedDateFilter(option.value as DateFilter)}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all ${
                  selectedDateFilter === option.value
                    ? 'h-full bg-primary text-white'
                    : ''
                }`}
              >
                {option.label}
              </button>
            ))}
            <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all">
              <Button variant="ghost" size="sm" className="p-0 h-full w-full">
                <Calendar className="size-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Realizadas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Não há dados suficientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">
              Não há dados suficientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitantes Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Não há dados suficientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 0,00</div>
            <p className="text-xs text-muted-foreground">
              Não há dados suficientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e Tabelas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-12 md:col-span-4">
          <CardHeader>
            <CardTitle>Performance por {utmOptions.find(opt => opt.value === selectedUtm)?.label}</CardTitle>
            <CardDescription>
              Análise detalhada do {utmOptions.find(opt => opt.value === selectedUtm)?.label.toLowerCase()} selecionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Não há dados suficientes para exibir o gráfico</p>
                <p className="text-sm">Configure UTMs em suas campanhas para ver os resultados aqui</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-12 md:col-span-3">
          <CardHeader>
            <CardTitle>Top 5 Fontes de Tráfego</CardTitle>
            <CardDescription>
              Principais origens de visitantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum dado disponível</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Dados Detalhados */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Dados Detalhados</CardTitle>
          <CardDescription>
            Visualização completa dos dados de UTM para o período selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="p-8 text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Nenhum dado encontrado</h3>
              <p>Configure parâmetros UTM em suas campanhas de marketing para começar a coletar dados.</p>
              <p className="text-sm mt-2">Os dados aparecerão aqui assim que os primeiros visitantes chegarem através de links com UTMs.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
