import { GlobalFooter } from "@/components/ui/global-footer"
import { GlobalHeader } from "@/components/ui/global-header"

type GlobalSiteLayoutProps = {
  children: React.ReactNode
}

export async function GlobalSiteLayout({ children }: GlobalSiteLayoutProps) {
  return (
    <div className="flex-1 flex-col min-h-screen">
      <GlobalHeader />
      {children}
      <GlobalFooter />
    </div>
  )
}
