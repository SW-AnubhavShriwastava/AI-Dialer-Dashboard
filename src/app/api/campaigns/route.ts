import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { CampaignStatus, UserRole } from '@prisma/client'

// Campaign creation schema
const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.nativeEnum(CampaignStatus).optional(),
  settings: z.record(z.any()).optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let campaigns
    if (session.user.role === UserRole.ADMIN) {
      // Admin sees all their campaigns
      campaigns = await prisma.campaign.findMany({
        where: {
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
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    } else {
      // Employee sees only assigned campaigns
      const employee = await prisma.employee.findFirst({
        where: {
          user: {
            id: session.user.id,
          },
        },
        select: {
          permissions: true,
        },
      })

      if (!employee || !(employee.permissions as any).campaigns.view) {
        return NextResponse.json(
          { error: 'No permission to view campaigns' },
          { status: 403 }
        )
      }

      campaigns = await prisma.campaign.findMany({
        where: {
          employees: {
            some: {
              employee: {
                user: {
                  id: session.user.id,
                },
              },
            },
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
          contacts: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    }

    return NextResponse.json(campaigns)
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
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

    // Only admins can create campaigns
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Only admins can create campaigns' },
        { status: 403 }
      )
    }

    const json = await request.json()
    const body = createCampaignSchema.parse(json)

    const campaign = await prisma.campaign.create({
      data: {
        name: body.name,
        description: body.description,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        status: body.status || CampaignStatus.ACTIVE,
        settings: body.settings || {},
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
      },
    })

    return NextResponse.json(campaign)
  } catch (error) {
    console.error('Error creating campaign:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
} 