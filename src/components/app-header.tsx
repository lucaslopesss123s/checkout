import { SidebarTrigger } from "@/components/ui/sidebar"
import { StoreSwitcher } from "@/components/store-switcher"
import { UserNav } from "@/components/user-nav"

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <div className="flex w-full items-center gap-4">
        <StoreSwitcher />
        <div className="ml-auto">
          <UserNav />
        </div>
      </div>
    </header>
  )
}
