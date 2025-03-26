import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// Contact creation schema
const createContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email().optional().or(z.literal('')).nullable(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
})

// Contact update schema
const updateContactSchema = createContactSchema.partial()

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const tags = searchParams.get('tags')?.split(',') || []
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.ContactWhereInput = {
      adminId: session.user.id,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { phone: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ]
    }

    if (tags.length > 0) {
      where.tags = {
        hasEvery: tags,
      }
    }

    // Get total count
    const total = await prisma.contact.count({ where })

    // Get contacts
    const contacts = await prisma.contact.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      contacts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createContactSchema.parse(body)

    // Check if phone number is already taken
    const existingContact = await prisma.contact.findFirst({
      where: {
        phone: validatedData.phone,
        adminId: session.user.id,
      },
    })

    if (existingContact) {
      return NextResponse.json(
        { error: 'Phone number already taken' },
        { status: 400 }
      )
    }

    const contact = await prisma.contact.create({
      data: {
        ...validatedData,
        adminId: session.user.id,
      },
    })

    return NextResponse.json(contact)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating contact:', error)
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    )
  }
} 