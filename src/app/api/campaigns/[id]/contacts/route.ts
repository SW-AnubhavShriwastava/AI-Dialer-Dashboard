import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { ContactStatus } from '@prisma/client'

// Contact creation schema
const createContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
})

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const contacts = await prisma.contact.findMany({
      where: {
        campaigns: {
          some: {
            campaignId: id,
          },
        },
        adminId: session.user.id,
      },
      include: {
        campaigns: {
          where: {
            campaignId: id,
          },
          select: {
            status: true,
            lastCalled: true,
            callAttempts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(contacts)
  } catch (error) {
    console.error('Error fetching campaign contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign contacts' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()
    const validatedData = createContactSchema.parse(body)

    // Check if contact already exists with the same phone number
    const existingContact = await prisma.contact.findFirst({
      where: {
        phone: validatedData.phone,
        adminId: session.user.id,
      },
    })

    if (existingContact) {
      // If contact exists, add to campaign
      const contact = await prisma.contact.update({
        where: {
          id: existingContact.id,
        },
        data: {
          campaigns: {
            create: {
              campaignId: id,
              status: ContactStatus.ACTIVE,
            },
          },
        },
        include: {
          campaigns: {
            where: {
              campaignId: id,
            },
            select: {
              status: true,
              lastCalled: true,
              callAttempts: true,
            },
          },
        },
      })

      return NextResponse.json(contact, { status: 200 })
    }

    // Create new contact and add to campaign
    const contact = await prisma.contact.create({
      data: {
        ...validatedData,
        adminId: session.user.id,
        campaigns: {
          create: {
            campaignId: id,
            status: ContactStatus.ACTIVE,
          },
        },
      },
      include: {
        campaigns: {
          where: {
            campaignId: id,
          },
          select: {
            status: true,
            lastCalled: true,
            callAttempts: true,
          },
        },
      },
    })

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating campaign contact:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign contact' },
      { status: 500 }
    )
  }
} 