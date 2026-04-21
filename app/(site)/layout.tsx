import { GlobalSiteLayout } from "@/layout/GlobalSiteLayout"
import React from "react"

const layout = ({ children }: { children: React.ReactNode }) => {
  return <GlobalSiteLayout>{children}</GlobalSiteLayout>
}

export default layout
