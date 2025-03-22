"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
})

type FormData = z.infer<typeof formSchema>

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: FormData) {
    try {
      setIsLoading(true)
      setError(null)

      const signInResult = await signIn("credentials", {
        email: data.email.toLowerCase(),
        password: data.password,
        redirect: false,
      })

      if (!signInResult?.ok) {
        throw new Error("Your email or password is incorrect. Please try again.")
      }

      router.refresh()
      router.push("/dashboard")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[400px] mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-[28px] font-medium text-black">Welcome back</h1>
        <p className="text-[15px] text-[#6B7280] mt-2">Enter your credentials to sign in to your account</p>
      </div>
      {error && (
        <div className="mb-6 text-red-600 text-sm text-center">
          {error}
        </div>
      )}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-[15px] font-medium text-gray-900">
            Email
          </label>
          <Input
            {...form.register("email")}
            id="email"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-[15px] font-medium text-gray-900">
              Password
            </label>
            <Link href="/forgot-password" className="text-[15px] text-[#6B7280] hover:text-gray-900">
              Forgot password?
            </Link>
          </div>
          <Input
            {...form.register("password")}
            id="password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
          />
          {form.formState.errors.password && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.password.message}</p>
          )}
        </div>
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#111827] hover:bg-[#1F2937]"
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      <div className="mt-6 text-center space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E5E7EB]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-[#6B7280]">OR</span>
          </div>
        </div>
        <p className="text-[15px] text-[#6B7280]">
          Don't have an account?{" "}
          <Link href="/signup" className="text-gray-900 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
} 