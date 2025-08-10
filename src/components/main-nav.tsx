'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingCart,
  CreditCard,
  Package,
  Megaphone,
  Paintbrush,
  Plug,
  BarChart2,
} from "lucide-react"

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/dashboard/adquirentes", label: "Adquirentes", icon: CreditCard },
  { href: "/dashboard/produtos", label: "Produtos", icon: Package },
  { href: "/dashboard/marketing", label: "Marketing", icon: Megaphone },
  { href: "/dashboard/personalizar", label: "Personalizar", icon: Paintbrush },
  { href: "/dashboard/integrations", label: "Integrações", icon: Plug },
  { href: "/dashboard/relatorios", label: "Relatórios", icon: BarChart2 },
]

export function MainNav() {
  const pathname = usePathname()

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname === item.href}
            tooltip={item.label}
            className={cn(
              pathname === item.href && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
            )}
          >
            <Link href={item.href}>
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
