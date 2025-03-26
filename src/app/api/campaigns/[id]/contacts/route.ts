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
  email: z.string().email().optional().or(z.literal('')).nullable(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
})

// Schema for adding existing contacts
const addExistingContactsSchema = z.object({
  contactIds: z.array(z.string()).min(1, 'At least one contact must be selected')
})

type RouteContext = {
  params: Promise<{ id: string }> | { id: string }
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = context.params instanceof Promise ? await context.params : context.params

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

    const { id } = context.params instanceof Promise ? await context.params : context.params
    const body = await request.json()

    // Check if we're adding existing contacts or creating new ones
    if (body.contactIds) {
      // Validate contact IDs
      const { contactIds } = addExistingContactsSchema.parse(body)

      // Add multiple existing contacts to campaign
      const results = await Promise.all(
        contactIds.map(async (contactId) => {
          // Check if contact is already in campaign
          const existingCampaignContact = await prisma.campaignContact.findUnique({
            where: {
              campaignId_contactId: {
                campaignId: id,
                contactId: contactId
              }
            }
          })

          if (existingCampaignContact) {
            return {
              contactId,
              status: 'skipped',
              message: 'Contact already in campaign'
            }
          }

          // Add contact to campaign
          await prisma.campaignContact.create({
            data: {
              campaignId: id,
              contactId: contactId,
              status: ContactStatus.ACTIVE
            }
          })

          return {
            contactId,
            status: 'added',
            message: 'Contact added successfully'
          }
        })
      )

      return NextResponse.json({ results })
    } else {
      // Handle single contact creation
      const validatedData = createContactSchema.parse(body)

      // Check if contact already exists with the same phone number
      const existingContact = await prisma.contact.findFirst({
        where: {
          phone: validatedData.phone,
          adminId: session.user.id,
        },
      })

      if (existingContact) {
        // If contact exists, add to campaign if not already added
        const existingCampaignContact = await prisma.campaignContact.findUnique({
          where: {
            campaignId_contactId: {
              campaignId: id,
              contactId: existingContact.id
            }
          }
        })

        if (existingCampaignContact) {
          return NextResponse.json(
            { error: 'Contact already exists in this campaign' },
            { status: 400 }
          )
        }

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

        return NextResponse.json(contact)
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

      return NextResponse.json(contact)
    }
  } catch (error) {
    console.error('Error adding contacts to campaign:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data provided', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to add contacts to campaign' },
      { status: 500 }
    )
  }
} 