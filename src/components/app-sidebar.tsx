import { MainNav } from "@/components/main-nav"
import { SidebarContent, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar"

function Logo() {
  return (
    <div className="flex items-center gap-2 font-semibold text-primary">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
        </svg>
        <span>LojaFacil</span>
    </div>
  )
}

export function AppSidebar() {
  return (
    <>
      <SidebarHeader>
        <div className="group-data-[collapsible=icon]:hidden">
          <Logo />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <MainNav />
      </SidebarContent>
      <SidebarFooter>
        {/* Can add user info or settings link here */}
      </SidebarFooter>
    </>
  )
}
