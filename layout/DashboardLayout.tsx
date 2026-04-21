import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { AppSidebarInset } from "@/components/sidebar/app-sidebar-inset";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cookies } from "next/headers";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export async function DashboardLayout({ children }: DashboardLayoutProps) {
  const cookieStore = await cookies();
  const sidebarState = cookieStore.get("sidebar:state")?.value;
  let defaultOpen = true;

  if (sidebarState) {
    defaultOpen = sidebarState === "true";
  }

  return (
    
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar>
          <AppSidebarInset>{children}</AppSidebarInset>
        </AppSidebar>
      </SidebarProvider>

  );
}
