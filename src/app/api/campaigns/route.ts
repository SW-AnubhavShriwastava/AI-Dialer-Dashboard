import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { CampaignStatus } from '@prisma/client'

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

    const campaigns = await prisma.campaign.findMany({
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

    const body = await request.json()
    const validatedData = createCampaignSchema.parse(body)

    const campaign = await prisma.campaign.create({
      data: {
        ...validatedData,
        adminId: session.user.id,
        status: CampaignStatus.ACTIVE,
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

    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating campaign:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
} 