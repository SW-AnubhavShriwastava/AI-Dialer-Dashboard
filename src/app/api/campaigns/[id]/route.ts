import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { CampaignStatus, UserRole } from '@prisma/client'

// Campaign update schema
const updateCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').optional(),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.nativeEnum(CampaignStatus).optional(),
  settings: z.record(z.any()).optional(),
  employeeAccess: z.enum(['NONE', 'ALL', 'SELECTED']),
  selectedEmployees: z.array(z.string()),
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

    // Different queries for admin and employee
    if (session.user.role === UserRole.ADMIN) {
      // Admin access - check if campaign belongs to them
      const campaign = await prisma.campaign.findFirst({
        where: {
          id,
          adminId: session.user.id,
        },
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          contacts: {
            select: {
              id: true,
              status: true,
              lastCalled: true,
              callAttempts: true,
            },
          },
          employees: {
            select: {
              employeeId: true,
              employee: {
                select: {
                  user: {
                    select: {
                      name: true,
                      email: true,
                    }
                  }
                }
              }
            },
          },
        },
      })

      if (!campaign) {
        return NextResponse.json(
          { error: 'Campaign not found or unauthorized' },
          { status: 404 }
        )
      }

      return NextResponse.json(campaign)
    } else {
      // Employee access - check if they have access to this campaign
      const employee = await prisma.employee.findFirst({
        where: {
          user: {
            id: session.user.id,
          },
        },
        select: {
          id: true,
          permissions: true,
        },
      })

      if (!employee || !(employee.permissions as any).campaigns.view) {
        return NextResponse.json(
          { error: 'No permission to view campaigns' },
          { status: 403 }
        )
      }

      // Check if employee has access to this specific campaign
      const campaign = await prisma.campaign.findFirst({
        where: {
          id,
          employees: {
            some: {
              employeeId: employee.id
            }
          }
        },
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          contacts: {
            select: {
              id: true,
              status: true,
              lastCalled: true,
              callAttempts: true,
            },
          },
          employees: {
            select: {
              employeeId: true,
              employee: {
                select: {
                  user: {
                    select: {
                      name: true,
                      email: true,
                    }
                  }
                }
              }
            },
          },
        },
      })

      if (!campaign) {
        return NextResponse.json(
          { error: 'Campaign not found or unauthorized' },
          { status: 404 }
        )
      }

      return NextResponse.json(campaign)
    }
  } catch (error) {
    console.error('Error fetching campaign:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()
    const validatedData = updateCampaignSchema.parse(body)

    // Verify campaign belongs to the admin
    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        id,
        adminId: session.user.id,
      },
      include: {
        employees: true,
      },
    })

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found or unauthorized' },
        { status: 404 }
      )
    }

    // Get all employees if employeeAccess is ALL
    let employeeIds: string[] = []
    if (validatedData.employeeAccess === 'ALL') {
      const employees = await prisma.employee.findMany({
        where: {
          adminId: session.user.id,
        },
        select: {
          id: true,
        },
      })
      employeeIds = employees.map(e => e.id)
    } else if (validatedData.employeeAccess === 'SELECTED') {
      // Verify all selected employees belong to the admin
      const employees = await prisma.employee.findMany({
        where: {
          id: {
            in: validatedData.selectedEmployees,
          },
          adminId: session.user.id,
        },
        select: {
          id: true,
        },
      })
      employeeIds = employees.map(e => e.id)
    }

    // Update campaign with new employee assignments
    const campaign = await prisma.campaign.update({
      where: {
        id,
      },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
        status: validatedData.status,
        settings: validatedData.settings,
        employees: {
          deleteMany: {}, // Remove all existing employee assignments
          create: employeeIds.map(employeeId => ({
            employeeId,
            permissions: {},
          })),
        },
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        employees: {
          select: {
            employeeId: true,
          },
        },
      },
    })

    return NextResponse.json(campaign)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating campaign:', error)
    return NextResponse.json(
      { error: 'Failed to update campaign' },
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

    const { id } = await context.params

    // Verify campaign belongs to the admin
    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        id,
        adminId: session.user.id,
      },
    })

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found or unauthorized' },
        { status: 404 }
      )
    }

    await prisma.campaign.delete({
      where: {
        id,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    )
  }
} 