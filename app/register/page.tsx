import { ScrollArea } from "@/components/ui/scroll-area"
import SignupForm from "@/form/signup"
import { createSupabaseServerClient } from "@/lib/supabase/server-client"
import Image from "next/image"
import { redirect } from "next/navigation"

export default async function RegisterPage() {
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
            <SignupForm />
          </div>
        </div>
      </ScrollArea>
      <div className="relative hidden bg-muted lg:block">
        <Image
          height={1000}
          width={1000}
          src="/images/pexels-ichad-windhiagiri.jpg"
          alt="Image"
          className="w-full h-svh object-cover"
        />
      </div>
    </div>
  )
}
