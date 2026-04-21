"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FieldDescription, FieldSeparator } from "@/components/ui/field"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { LoginSchema } from "./login.schema"
import { LoginFormProps, LoginFormValues } from "./login.types"

function postLoginPath(searchParams: ReturnType<typeof useSearchParams>) {
  const next = searchParams.get("next")
  if (next?.startsWith("/") && !next.startsWith("//")) return next
  return "/dashboard"
}



const LoginForm = ({}: LoginFormProps) => {
  const supabase = getSupabaseBrowserClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (error) {
        toast.error(error.message)
        return
      }
      // ** LOGIN SUCCESS **
      // 🔥 NEW: Get user after login
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const accountType = user.user_metadata?.account_type

        // 🔥 If missing → set default
        if (!accountType) {
          const defaultRole = "rentee"

          await Promise.all([
            supabase.auth.updateUser({
              data: {
                account_type: defaultRole,
              },
            }),
            supabase.from("users").upsert({
              id: user.id,
              email: user.email,
              account_type: defaultRole,
            }),
          ])
        }
      }
      // ** LOGIN SUCCESS End Here **
      console.log("Login successful for:", data.email)
      toast.success("Logged in successfully")
      router.replace(postLoginPath(searchParams))
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  async function handleLogInWithGoogle() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(postLoginPath(searchParams))}`,
          skipBrowserRedirect: false,
        },
      })
      if (error) {
        toast.error(error.message)
        return
      }
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  useEffect(() => {
    const error = searchParams.get("error")
    if (error) {
      toast.error(decodeURIComponent(error))
      router.replace("/login", { scroll: false })
    }
  }, [searchParams, router])

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user?.id) {
        // ** LOGIN SUCCESS **
        const user = session.user
        const accountType = user.user_metadata?.account_type

        if (!accountType) {
          const defaultRole = "rentee"

          await Promise.all([
            supabase.auth.updateUser({
              data: { account_type: defaultRole },
            }),
            supabase.from("users").upsert({
              id: user.id,
              email: user.email,
              account_type: defaultRole,
            }),
          ])
        }
        // ** LOGIN SUCCESS End Here **
        router.replace(postLoginPath(searchParams))
        router.refresh()
      }
    })
    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [supabase, router, searchParams])

  return (
    <div className={"flex flex-col md:gap-4 gap-2"}>
      <Card className="overflow-hidden p-0">
        <CardContent className="py-4 md:py-6 px-4 md:px-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              method="post"
              className="flex flex-col gap-4 sm:gap-6"
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <Image
                  src="/images/logo.png"
                  alt="Logo"
                  width={100}
                  height={100}
                  className="w-10 h-10 rounded-md"
                />
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-xs">Login to your Account</p>
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          className="bg-background pr-8"
                          id="password-toggle"
                          placeholder="Enter your password"
                          type={isVisible ? "text" : "password"}
                          {...field}
                        />
                        <Button
                          className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setIsVisible(!isVisible)}
                          size="icon"
                          type="button"
                          variant="ghost"
                        >
                          {isVisible ? (
                            <EyeOff className="text-muted-foreground h-4 w-4" />
                          ) : (
                            <Eye className="text-muted-foreground h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Logging In..." : "Log In"}{" "}
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              </Button>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>
              <Button variant="outline" type="button" onClick={handleLogInWithGoogle}>
                <Image src="/images/google-icon.png" alt="Google" width={20} height={20} />
                <span>Login with Google</span>
              </Button>
              <p className="text-center text-xs">
                Don&apos;t have an account?{" "}
                <Link
                  className="text-primary underline-offset-4 hover:underline"
                  href={"/register"}
                >
                  Sign up
                </Link>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
      <FieldDescription className="text-xs text-center">
        By clicking continue, you agree to our <Link href="#">Terms of Service</Link> and{" "}
        <Link href="#">Privacy Policy</Link>
      </FieldDescription>
    </div>
  )
}

export default LoginForm
