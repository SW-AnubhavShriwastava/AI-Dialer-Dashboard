import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Contact update schema
const updateContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
})

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateContactSchema.parse(body)

    // Check if contact exists and belongs to user
    const existingContact = await prisma.contact.findFirst({
      where: {
        id: params.id,
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
            id: params.id,
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
      where: {
        id: params.id,
      },
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if contact exists and belongs to user
    const existingContact = await prisma.contact.findFirst({
      where: {
        id: params.id,
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
      where: {
        id: params.id,
      },
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