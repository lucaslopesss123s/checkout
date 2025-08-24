
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
  ChevronDown,
  Target,
  ArrowUp,
  ArrowDown,
  Ticket,
  CheckCircle,
  ShoppingBag,
  Globe,
  Truck
} from "lucide-react"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import React from "react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    label: "Pedidos",
    icon: ShoppingCart,
    subItems: [
      { href: "/dashboard/pedidos/realizados", label: "Pedidos Realizados", icon: CheckCircle },
      { href: "/dashboard/pedidos/carrinhos-abandonados", label: "Carrinhos Abandonados", icon: ShoppingBag },
    ],
  },
  { href: "/dashboard/adquirentes", label: "Adquirentes", icon: CreditCard },
  { href: "/dashboard/produtos", label: "Produtos", icon: Package },
  { href: "/dashboard/frete", label: "Frete", icon: Truck },
  { href: "/dashboard/dominio", label: "Domínio", icon: Globe },
  {
    label: "Marketing",
    icon: Megaphone,
    subItems: [
      { href: "/dashboard/marketing/pixels", label: "Pixels", icon: Target },
      { href: "/dashboard/marketing/order-bump", label: "Order Bump", icon: ArrowUp },
      { href: "/dashboard/marketing/upsell", label: "Upsell", icon: ArrowDown },
      { href: "/dashboard/marketing/cupons", label: "Cupons", icon: Ticket },
    ],
  },
  { href: "/dashboard/personalizar", label: "Personalizar", icon: Paintbrush },
  { href: "/dashboard/integrations", label: "Integrações", icon: Plug },
  { href: "/dashboard/relatorios", label: "Relatórios", icon: BarChart2 },
]

export function MainNav() {
  const pathname = usePathname()
  const [openMarketing, setOpenMarketing] = React.useState(false);
  const [openPedidos, setOpenPedidos] = React.useState(false);

  React.useEffect(() => {
    if (pathname.startsWith('/dashboard/marketing')) {
        setOpenMarketing(true);
    }
    if (pathname.startsWith('/dashboard/pedidos')) {
        setOpenPedidos(true);
    }
  }, [pathname]);

  return (
    <SidebarMenu>
      {navItems.map((item, index) => (
        item.subItems ? (
            <Collapsible 
                key={index} 
                open={item.label === 'Marketing' ? openMarketing : openPedidos} 
                onOpenChange={item.label === 'Marketing' ? setOpenMarketing : setOpenPedidos}
            >
                <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                            variant="default"
                            className="w-full justify-between"
                            isActive={item.label === 'Marketing' ? pathname.startsWith('/dashboard/marketing') : pathname.startsWith('/dashboard/pedidos')}
                        >
                            <div className="flex items-center gap-2">
                                <item.icon className="h-4 w-4" />
                                <span>{item.label}</span>
                            </div>
                            <ChevronDown className={cn("h-4 w-4 transition-transform", (item.label === 'Marketing' ? openMarketing : openPedidos) && "rotate-180")} />
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                </SidebarMenuItem>
                <CollapsibleContent>
                    <SidebarMenuSub>
                        {item.subItems.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.href}>
                                <SidebarMenuSubButton asChild isActive={pathname === subItem.href}>
                                    <Link href={subItem.href}>
                                        <subItem.icon className="h-4 w-4" />
                                        <span>{subItem.label}</span>
                                    </Link>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </Collapsible>
        ) : (
            <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                    className={cn(
                    pathname === item.href && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                    )}
                >
                    <Link href={item.href!}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        )
      ))}
    </SidebarMenu>
  )
}
