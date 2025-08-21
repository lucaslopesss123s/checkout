'use client';

import { SalesCards } from "@/components/dashboard/sales-cards";
import { ConversionFunnel } from "@/components/dashboard/conversion-funnel";
import { PaymentMethods } from "@/components/dashboard/payment-methods";
import { AiOptimizer } from "@/components/dashboard/ai-optimizer";
import { OnlineUsers } from "@/components/dashboard/online-users";
import { useEffect, useState } from 'react';

interface User {
  id: string;
  username: string;
  name: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

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
  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          {user && (
            <p className="text-muted-foreground">Bem-vindo, {user.name}!</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <a 
            href="/dashboard/profile" 
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Meu Perfil
          </a>
        </div>
      </div>
      <div className="space-y-4">
        <SalesCards />
        <OnlineUsers />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-12 md:col-span-4">
            <ConversionFunnel />
          </div>
          <div className="col-span-12 md:col-span-3">
            <PaymentMethods />
          </div>
        </div>
        <AiOptimizer />
      </div>
    </>
  );
}
