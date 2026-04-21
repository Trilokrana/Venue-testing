import { ScrollArea } from "@/components/ui/scroll-area"
import LoginForm from "@/form/login"
import { createSupabaseServerClient } from "@/lib/supabase/server-client"
import Image from "next/image"
import { redirect } from "next/navigation"
import { Suspense } from "react"

const LoginPage = async () => {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="grid h-svh lg:grid-cols-2 min-h-0">
      <ScrollArea className="h-full min-h-0">
        <div className="flex min-h-svh flex-col justify-center p-6 md:p-10 lg:p-4">
          <div className="mx-auto w-full max-w-md py-6">
            <Suspense
              fallback={<p className="text-center text-sm text-muted-foreground">Loading…</p>}
            >
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </ScrollArea>
      <div className="relative hidden bg-muted lg:block">
        <Image
          height={1000}
          width={1000}
          src="/images/pexels-quin-bridal.jpg"
          alt="Image"
          className="w-full h-svh object-cover"
        />
      </div>
    </div>
  )
}

export default LoginPage
