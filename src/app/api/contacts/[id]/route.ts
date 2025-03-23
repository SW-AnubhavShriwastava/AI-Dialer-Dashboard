import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Contact update schema
const updateContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email().optional().nullable(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
})

type RouteContext = {
  params: Promise<{ id: string }> | { id: string }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = context.params instanceof Promise ? await context.params : context.params
    const body = await request.json()
    const validatedData = updateContactSchema.parse(body)

    // Check if contact exists and belongs to user
    const existingContact = await prisma.contact.findFirst({
      where: {
        id,
        adminId: session.user.id,
      },
    })

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // Check if phone number is already taken by another contact
    if (validatedData.phone !== existingContact.phone) {
      const phoneTaken = await prisma.contact.findFirst({
        where: {
          phone: validatedData.phone,
          adminId: session.user.id,
          NOT: {
            id,
          },
        },
      })

      if (phoneTaken) {
        return NextResponse.json(
          { error: 'Phone number already taken by another contact' },
          { status: 400 }
        )
      }
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: validatedData,
    })

    return NextResponse.json(contact)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating contact:', error)
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = context.params instanceof Promise ? await context.params : context.params

    // Check if contact exists and belongs to user
    const existingContact = await prisma.contact.findFirst({
      where: {
        id,
        adminId: session.user.id,
      },
    })

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    // Delete contact
    await prisma.contact.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Contact deleted successfully' })
  } catch (error) {
    console.error('Error deleting contact:', error)
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = context.params instanceof Promise ? await context.params : context.params
    const body = await request.json()

    // Validate request body
    const validatedData = updateContactSchema.parse(body)

    // Update the contact
    const updatedContact = await prisma.contact.update({
      where: { id },
      data: {
        name: validatedData.name,
        phone: validatedData.phone,
        email: validatedData.email,
      },
    })

    return NextResponse.json(updatedContact)
  } catch (error) {
    console.error('Error updating contact:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data provided', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    )
  }
} 