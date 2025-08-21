'use client'
import { AppHeader } from "@/components/app-header"
import { AppSidebar } from "@/components/app-sidebar"
import { Sidebar, SidebarProvider } from "@/components/ui/sidebar"
import { StoreProvider } from "@/contexts/store-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Verificar se o usuário está autenticado usando JWT
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    
    if (!token || !storedUser) {
      router.push('/login');
      return;
    }
    
    try {
      setUser(JSON.parse(storedUser));
    } catch (error) {
      console.error('Erro ao analisar dados do usuário:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
      return;
    }
    
    setLoading(false);
  }, [router]);

  if (loading || !user) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-indigo-600"></div>
              <p className="mt-2">Carregando...</p>
            </div>
        </div>
    )
  }

  return (
    <SidebarProvider>
      <StoreProvider>
        <div className="min-h-screen w-full bg-background text-foreground flex">
          <Sidebar collapsible="icon">
            <AppSidebar />
          </Sidebar>
          <div className="flex flex-col w-full">
            <AppHeader />
            <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
              {children}
            </main>
          </div>
        </div>
      </StoreProvider>
    </SidebarProvider>
  )
}
