import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { UserRole, Prisma } from '@prisma/client'

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

// Helper function to check permissions
function checkPermissions(session: any, operation: 'view' | 'create' | 'edit' | 'delete' | 'import' | 'export') {
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  // Admins have all permissions
  if (session.user.role === UserRole.ADMIN) {
    return true
  }

  // Check employee permissions
  const permissions = session.user.employeeProfile?.permissions?.contacts
  if (!permissions?.[operation]) {
    throw new Error(`You don't have permission to ${operation} contacts`)
  }

  return true
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const hasPermission = session.user.role === UserRole.ADMIN || 
      session.user.employeeProfile?.permissions?.contacts?.view === true

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'No permission to view contacts' },
        { status: 403 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const tags = searchParams.get('tags')?.split(',')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 10

    // Build where clause
    let where: Prisma.ContactWhereInput = {}

    // Add access control
    if (session.user.role === UserRole.ADMIN) {
      where.adminId = session.user.id
    } else if (session.user.employeeProfile?.permissions?.contacts?.accessType === 'ALL') {
      where.adminId = session.user.employeeProfile.adminId
    } else {
      where.campaigns = {
        some: {
          campaign: {
            employees: {
              some: {
                employeeId: session.user.employeeProfile?.id
              }
            }
          }
        }
      }
    }

    // Add search conditions
    if (search) {
      where.OR = [
        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { phone: { contains: search } },
        { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ]
    }

    // Add tags condition
    if (tags?.length) {
      where.tags = { hasEvery: tags }
    }

    // Get total count
    const total = await db.contact.count({ where })
    const totalPages = Math.ceil(total / limit)

    // Get contacts
    const contacts = await db.contact.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      contacts,
      pagination: {
        total,
        page,
        limit,
        totalPages,
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
    checkPermissions(session, 'create')

    if (!session?.user) {
      throw new Error('Unauthorized')
    }

    const json = await request.json()

    // Set admin ID based on role
    const adminId = session.user.role === UserRole.ADMIN
      ? session.user.id
      : session.user.employeeProfile?.adminId

    if (!adminId) {
      throw new Error('Could not determine admin ID')
    }

    const contact = await db.contact.create({
      data: {
        ...json,
        adminId,
      },
    })

    return NextResponse.json(contact)
  } catch (error) {
    console.error('Error creating contact:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create contact' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    checkPermissions(session, 'edit')

    if (!session?.user) {
      throw new Error('Unauthorized')
    }

    const json = await request.json()
    const { id, ...data } = json

    // Check if user has access to this contact
    const contact = await db.contact.findUnique({
      where: { id },
      include: {
        campaigns: {
          include: {
            campaign: {
              include: {
                employees: true
              }
            }
          }
        }
      }
    })

    if (!contact) {
      throw new Error('Contact not found')
    }

    if (session.user.role === UserRole.EMPLOYEE) {
      const accessType = session.user.employeeProfile?.permissions?.contacts?.accessType
      const employeeId = session.user.employeeProfile?.id

      if (accessType === 'ALL') {
        // Check if contact belongs to employee's admin
        if (contact.adminId !== session.user.employeeProfile?.adminId) {
          throw new Error('You can only edit contacts from your organization')
        }
      } else {
        // Check if contact is in any of employee's campaigns
        const hasAccess = contact.campaigns.some(cc => 
          cc.campaign.employees.some(e => e.employeeId === employeeId)
        )
        if (!hasAccess) {
          throw new Error('You can only edit contacts from your campaigns')
        }
      }
    } else if (session.user.role === UserRole.ADMIN) {
      // Admins can only edit their own contacts
      if (contact.adminId !== session.user.id) {
        throw new Error('You can only edit your own contacts')
      }
    }

    const updatedContact = await db.contact.update({
      where: { id },
      data,
    })

    return NextResponse.json(updatedContact)
  } catch (error) {
    console.error('Error updating contact:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update contact' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    checkPermissions(session, 'delete')

    if (!session?.user) {
      throw new Error('Unauthorized')
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 })
    }

    // Check if user has access to this contact
    const contact = await db.contact.findUnique({
      where: { id },
      include: {
        campaigns: {
          include: {
            campaign: {
              include: {
                employees: true
              }
            }
          }
        }
      }
    })

    if (!contact) {
      throw new Error('Contact not found')
    }

    if (session.user.role === UserRole.EMPLOYEE) {
      const accessType = session.user.employeeProfile?.permissions?.contacts?.accessType
      const employeeId = session.user.employeeProfile?.id

      if (accessType === 'ALL') {
        // Check if contact belongs to employee's admin
        if (contact.adminId !== session.user.employeeProfile?.adminId) {
          throw new Error('You can only delete contacts from your organization')
        }
      } else {
        // Check if contact is in any of employee's campaigns
        const hasAccess = contact.campaigns.some(cc => 
          cc.campaign.employees.some(e => e.employeeId === employeeId)
        )
        if (!hasAccess) {
          throw new Error('You can only delete contacts from your campaigns')
        }
      }
    } else if (session.user.role === UserRole.ADMIN) {
      // Admins can only delete their own contacts
      if (contact.adminId !== session.user.id) {
        throw new Error('You can only delete your own contacts')
      }
    }

    await db.contact.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting contact:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete contact' },
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500 }
    )
  }
} 