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
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Input } from "@/components/ui/input"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client"
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, Eye, EyeOff, Info, Loader2, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { SignupSchema } from "./signup.schema"
import { PasswordStrength, SignFormProps, SignFormValues, StrengthScore } from "./signup.types"

// Constants
const PASSWORD_REQUIREMENTS = [
  { regex: /.{6,}/, text: "At least 6 characters" },
  { regex: /[0-9]/, text: "At least 1 number" },
  { regex: /[a-z]/, text: "At least 1 lowercase letter" },
  { regex: /[A-Z]/, text: "At least 1 uppercase letter" },
  { regex: /[@$!%*?&#^()_+=\-{}[\]|:;"'<>,./]/, text: "At least 1 special character" },
] as const

const STRENGTH_CONFIG = {
  colors: {
    0: "bg-border",
    1: "bg-red-500",
    2: "bg-orange-500",
    3: "bg-amber-500",
    4: "bg-amber-700",
    5: "bg-emerald-500",
  } satisfies Record<StrengthScore, string>,
  texts: {
    0: "Enter a password",
    1: "Weak password",
    2: "Medium password!",
    3: "Strong password!!",
    4: "Very strong password!!!",
  } satisfies Record<Exclude<StrengthScore, 5>, string>,
} as const

const SignupForm = ({}: SignFormProps) => {
  const supabase = getSupabaseBrowserClient()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<SignFormValues>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  })

  const onSubmit = async (data: SignFormValues) => {
    setIsLoading(true)
    try {
      const { confirm_password, ...payload } = data
      const { data: signupData, error } = await supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            first_name: payload.first_name,
            last_name: payload.last_name,
          },
        },
      })

      if (error) {
        toast.error(error.message)
        return
      }

      const loginUrl = `/login?email=${encodeURIComponent(payload.email)}`

      // When email confirmation is off, Supabase returns a session immediately.
      // End the session so the user signs in explicitly on the login page.
      if (signupData?.session) {
        await supabase.auth.signOut()
      }

      if (signupData?.session) {
        toast.success("Account created. Sign in with your email and password.")
      } else {
        toast.success("Account created. Check your email to confirm, then sign in.")
      }

      router.replace(loginUrl)
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSignInWithGoogleLogin() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
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
    let cancelled = false
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled && session?.user?.id) {
        router.replace("/dashboard")
        router.refresh()
      }
    })
    return () => {
      cancelled = true
    }
  }, [supabase, router])

  const password = form.watch("password") ?? ""

  const calculateStrength = useMemo((): PasswordStrength => {
    const requirements = PASSWORD_REQUIREMENTS.map((req) => ({
      met: req.regex.test(password),
      text: req.text,
    }))

    return {
      score: requirements.filter((req) => req.met).length as StrengthScore,
      requirements,
    }
  }, [password])

  const strengthTextKey = Math.min(calculateStrength.score, 4) as keyof typeof STRENGTH_CONFIG.texts

  return (
    <div className={"flex flex-col md:gap-4 gap-2"}>
      <Card className="overflow-hidden p-0">
        <CardContent className="py-4 md:py-6 px-4 md:px-6">
          <Form {...form}>
            <form
              method="post"
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-2 sm:gap-4"
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <Image
                  src="/images/logo.png"
                  alt="Logo"
                  width={100}
                  height={100}
                  className="w-10 h-10 rounded-md"
                />
                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="text-muted-foreground text-xs">
                  Enter your email below to create your account
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                {/* First name */}
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your first name"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Last name */}
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your last name" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your email" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              className="bg-background pr-10"
                              id="password"
                              placeholder="Enter your password"
                              type={showPassword ? "text" : "password"}
                              autoComplete="new-password"
                              {...field}
                              disabled={isLoading}
                            />
                            <Button
                              className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowPassword((v) => !v)}
                              size="icon"
                              type="button"
                              variant="ghost"
                              tabIndex={-1}
                            >
                              {showPassword ? (
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
                  {/* Confirm password */}
                  <FormField
                    control={form.control}
                    name="confirm_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              className="bg-background pr-10"
                              id="confirm_password"
                              placeholder="Confirm your password"
                              type={showConfirm ? "text" : "password"}
                              autoComplete="new-password"
                              {...field}
                              disabled={isLoading}
                            />
                            <Button
                              className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowConfirm((v) => !v)}
                              size="icon"
                              type="button"
                              variant="ghost"
                              tabIndex={-1}
                            >
                              {showConfirm ? (
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
                </div>

                {/* Strength meter under PASSWORD (not confirm) */}
                <div>
                  <div
                    className={cn(
                      "h-1 overflow-hidden rounded-full bg-neutral-50 dark:bg-neutral-950 my-2",
                      calculateStrength.score === 0 && "my-0"
                    )}
                    role="progressbar"
                    aria-valuenow={calculateStrength.score}
                    aria-valuemin={0}
                    aria-valuemax={5}
                  >
                    <div
                      className={`h-full ${
                        STRENGTH_CONFIG.colors[calculateStrength.score]
                      } transition-all duration-500`}
                      style={{ width: `${(calculateStrength.score / 5) * 100}%` }}
                    />
                  </div>

                  <p className="flex justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-2 text-xs">
                      Must contain
                      <HoverCard openDelay={200}>
                        <HoverCardTrigger asChild>
                          <button type="button" className="inline-flex items-center">
                            <Info
                              size={18}
                              className={`cursor-pointer ${STRENGTH_CONFIG.colors[
                                calculateStrength.score
                              ].replace("bg-", "text-")} transition-all`}
                            />
                          </button>
                        </HoverCardTrigger>
                        <HoverCardContent className="bg-neutral-50 dark:bg-neutral-950">
                          <ul className="space-y-1.5" aria-label="Password requirements">
                            {calculateStrength.requirements.map((req, index) => (
                              <li key={index} className="flex items-center space-x-2">
                                {req.met ? (
                                  <Check size={16} className="text-emerald-500" />
                                ) : (
                                  <X size={16} className="text-muted-foreground/80" />
                                )}
                                <span
                                  className={`text-xs ${
                                    req.met ? "text-emerald-600" : "text-muted-foreground"
                                  }`}
                                >
                                  {req.text}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </HoverCardContent>
                      </HoverCard>
                    </span>

                    {/* <span>{STRENGTH_CONFIG.texts[strengthTextKey]}</span> */}
                  </p>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing up..." : "Sign up"}
                {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              </Button>

              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>
              <Button type="button" variant={"outline"} onClick={handleSignInWithGoogleLogin}>
                <Image src="/images/google-icon.png" alt="Google" width={20} height={20} />
                <span>Sign Up with Google</span>
              </Button>

              <p className="text-center text-xs">
                Already have an account?{" "}
                <Link className="text-primary underline-offset-4 hover:underline" href={"/login"}>
                  Log in
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

export default SignupForm
