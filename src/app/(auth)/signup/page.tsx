'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

const otpSchema = z.object({
  otp: z.string().length(6, 'Verification code must be 6 characters')
})

type SignUpForm = z.infer<typeof signUpSchema>
type OTPForm = z.infer<typeof otpSchema>

export default function SignUpPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showOTPInput, setShowOTPInput] = useState(false)
  const [signupData, setSignupData] = useState<SignUpForm | null>(null)

  const { register: registerSignup, handleSubmit: handleSignupSubmit, formState: { errors: signupErrors } } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema)
  })

  const { register: registerOTP, handleSubmit: handleOTPSubmit, formState: { errors: otpErrors }, reset: resetOTP } = useForm<OTPForm>({
    resolver: zodResolver(otpSchema)
  })

  const onSignupSubmit = async (data: SignUpForm) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          username: data.username,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Something went wrong')
      }

      setSignupData(data)
      setShowOTPInput(true)
      resetOTP() // Reset OTP form when showing it
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const onOTPSubmit = async (data: OTPForm) => {
    if (!signupData) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/auth/signup', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: signupData.email,
          otp: data.otp,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Something went wrong')
      }

      // Show success message and redirect to login
      toast.success('Account created successfully! Please sign in to continue.')
      router.push('/login')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const resendOTP = async () => {
    if (!signupData) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: signupData.name,
          email: signupData.email,
          username: signupData.username,
          password: signupData.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Something went wrong')
      }

      toast.success('Verification code resent!')
      resetOTP() // Reset OTP form when resending
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-medium text-black">
            {showOTPInput ? 'Verify your email' : 'Create an account'}
          </h1>
          <p className="text-[15px] text-[#6B7280] mt-2">
            {showOTPInput 
              ? `We've sent a verification code to ${signupData?.email}` 
              : 'Enter your details below to create your account'}
          </p>
        </div>

        {error && (
          <div className="mb-6 text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        {!showOTPInput ? (
          <form onSubmit={handleSignupSubmit(onSignupSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-[15px] font-medium text-gray-900">
                Name
              </label>
              <Input
                {...registerSignup('name')}
                id="name"
                type="text"
                placeholder="John Doe"
                autoComplete="name"
              />
              {signupErrors.name && (
                <p className="text-sm text-red-600 mt-1">{signupErrors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-[15px] font-medium text-gray-900">
                Email
              </label>
              <Input
                {...registerSignup('email')}
                id="email"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
              />
              {signupErrors.email && (
                <p className="text-sm text-red-600 mt-1">{signupErrors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="username" className="block text-[15px] font-medium text-gray-900">
                Username
              </label>
              <Input
                {...registerSignup('username')}
                id="username"
                type="text"
                placeholder="johndoe"
                autoComplete="username"
              />
              {signupErrors.username && (
                <p className="text-sm text-red-600 mt-1">{signupErrors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-[15px] font-medium text-gray-900">
                Password
              </label>
              <Input
                {...registerSignup('password')}
                id="password"
                type="password"
                placeholder="Enter your password"
                autoComplete="new-password"
              />
              {signupErrors.password && (
                <p className="text-sm text-red-600 mt-1">{signupErrors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-[15px] font-medium text-gray-900">
                Confirm Password
              </label>
              <Input
                {...registerSignup('confirmPassword')}
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                autoComplete="new-password"
              />
              {signupErrors.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">{signupErrors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#111827] hover:bg-[#1F2937]"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleOTPSubmit(onOTPSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="otp" className="block text-[15px] font-medium text-gray-900">
                Verification Code
              </label>
              <Input
                {...registerOTP('otp')}
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="text-center tracking-[0.5em] font-mono text-lg"
              />
              {otpErrors.otp && (
                <p className="text-sm text-red-600 mt-1">{otpErrors.otp.message}</p>
              )}
              <p className="text-sm text-[#6B7280] mt-2">
                Enter the 6-digit code sent to your email. You can also use the master code if provided.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#111827] hover:bg-[#1F2937]"
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={resendOTP}
                disabled={isLoading}
                className="text-[15px] text-[#111827] hover:underline"
              >
                Didn't receive the code? Click to resend
              </button>
            </div>
          </form>
        )}

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
            Already have an account?{' '}
            <Link href="/login" className="text-gray-900 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 