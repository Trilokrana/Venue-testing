import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "../mode-toggle";

export function AppSidebarInset({ children }: { children: React.ReactNode }) {
  return (
    <SidebarInset className="flex flex-col h-screen overflow-hidden">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b h-14 flex items-center justify-between px-4">
              <SidebarTrigger />
              <ModeToggle />
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">{children}</div>
    </SidebarInset>
  );
}
