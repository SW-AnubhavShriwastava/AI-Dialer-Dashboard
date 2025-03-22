'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
})

type FormData = z.infer<typeof formSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema)
  })

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Something went wrong')
      }

      setSuccess(true)
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
          <h1 className="text-[28px] font-medium text-black">Forgot password?</h1>
          <p className="text-[15px] text-[#6B7280] mt-2">
            Enter your email address and we'll send you instructions to reset your password
          </p>
        </div>
        {error && (
          <div className="mb-6 text-red-600 text-sm text-center">
            {error}
          </div>
        )}
        {success ? (
          <div className="text-center">
            <div className="mb-6 text-green-600 text-[15px]">
              Check your email for password reset instructions
            </div>
            <Link href="/login" className="text-gray-900 hover:underline text-[15px]">
              Return to login
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-[15px] font-medium text-gray-900">
                  Email
                </label>
                <Input
                  {...register('email')}
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                )}
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#111827] hover:bg-[#1F2937]"
              >
                {isLoading ? 'Sending instructions...' : 'Send instructions'}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <Link href="/login" className="text-[15px] text-[#6B7280] hover:text-gray-900">
                Back to login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
} 