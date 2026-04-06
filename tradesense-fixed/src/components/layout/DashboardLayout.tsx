import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet } from "react-router-dom";
import { TradesProvider } from "@/contexts/TradesContext";
import { useTrades } from "@/contexts/TradesContext";
import { Badge } from "@/components/ui/badge";

function DashboardHeader() {
  const { isDemo } = useTrades();
  return (
    <header className="h-14 flex items-center border-b border-border px-4 gap-3 shrink-0">
      <SidebarTrigger />
      <div className="flex items-center gap-3 ml-auto">
        {isDemo && <Badge variant="secondary" className="text-xs">Demo Mode</Badge>}
      </div>
    </header>
  );
}

export function DashboardLayout() {
  return (
    <TradesProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <DashboardHeader />
            <main className="flex-1 overflow-auto p-4 md:p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </TradesProvider>
  );
}
