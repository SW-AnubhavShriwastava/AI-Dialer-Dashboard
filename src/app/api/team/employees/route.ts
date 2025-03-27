import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { hash } from 'bcrypt'
import { UserRole, UserStatus } from '@prisma/client'

const createEmployeeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  permissions: z.object({
    contacts: z.object({
      view: z.boolean(),
      create: z.boolean(),
      edit: z.boolean(),
      delete: z.boolean(),
      import: z.boolean(),
      export: z.boolean(),
      accessType: z.enum(['ALL', 'CAMPAIGN_ONLY']),
    }),
    campaigns: z.object({
      view: z.boolean(),
      create: z.boolean(),
      edit: z.boolean(),
      delete: z.boolean(),
    }),
    callLogs: z.object({
      view: z.boolean(),
      download: z.boolean(),
    }),
    aiSummary: z.object({
      view: z.boolean(),
    }),
  }),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can create employees
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Only admins can create employees' },
        { status: 403 }
      )
    }

    const json = await request.json()
    console.log('Received request body:', json) // Debug log

    try {
      const body = createEmployeeSchema.parse(json)
      console.log('Validated body:', body) // Debug log

      // Check if email is already taken
      const existingUser = await prisma.user.findUnique({
        where: { email: body.email },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        )
      }

      // Create user with employee role
      const hashedPassword = await hash(body.password, 10)
      const user = await prisma.user.create({
        data: {
          name: body.name,
          email: body.email,
          username: body.email, // Using email as username
          password: hashedPassword,
          role: UserRole.EMPLOYEE,
          status: UserStatus.ACTIVE,
          employeeProfile: {
            create: {
              adminId: session.user.id,
              permissions: body.permissions,
            },
          },
        },
        include: {
          employeeProfile: true,
        },
      })

      return NextResponse.json({
        id: user.employeeProfile?.id,
        userId: user.id,
        adminId: session.user.id,
        permissions: user.employeeProfile?.permissions,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
        },
      })
    } catch (validationError) {
      console.error('Validation error:', validationError) // Debug log
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: validationError.errors },
          { status: 400 }
        )
      }
      throw validationError
    }
  } catch (error) {
    console.error('Error creating employee:', error) // Debug log
    return NextResponse.json(
      { error: 'Failed to create employee', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can view their employees
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Only admins can view employees' },
        { status: 403 }
      )
    }

    const employees = await prisma.employee.findMany({
      where: {
        adminId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
          },
        },
      },
    })

    return NextResponse.json(employees)
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    )
  }
} 