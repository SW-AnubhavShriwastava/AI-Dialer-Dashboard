import { NextResponse } from 'next/server'
import { z } from 'zod'
import { generateOTP, storeOTP, verifyOTP } from '@/lib/verification'
import { emailQueue } from '@/lib/email-queue'
import { storePendingUser, getPendingUser, removePendingUser } from '@/lib/temp-user'
import { createUser } from '@/lib/auth'
import { db } from '@/lib/db'

// Validation schema for signup data
const signupSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(8),
})

// Validation schema for OTP verification
const verifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, username, password } = signupSchema.parse(body)

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
        ],
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 400 }
      )
    }

    // Generate and store OTP
    const otp = generateOTP()
    storeOTP(email, otp)

    // Store user data temporarily
    storePendingUser({ name, email, username, password })

    // Add email to queue instead of sending directly
    await emailQueue.addToQueue({
      to: email,
      otp,
      type: 'verification',
      retries: 0
    })

    return NextResponse.json({ 
      message: 'Verification code sent',
      queueLength: emailQueue.getQueueLength()
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { email, otp } = verifySchema.parse(body)

    // Verify OTP
    const isValid = verifyOTP(email, otp)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      )
    }

    // Get pending user data
    const userData = getPendingUser(email)
    if (!userData) {
      return NextResponse.json(
        { error: 'Registration session expired' },
        { status: 400 }
      )
    }

    // Create verified user
    const user = await createUser(userData)

    // Clean up
    removePendingUser(email)

    return NextResponse.json({ 
      message: 'Email verified successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
      }
    })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    )
  }
} 