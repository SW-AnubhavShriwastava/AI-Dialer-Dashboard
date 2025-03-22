import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { CampaignStatus } from '@prisma/client'

// Campaign update schema
const updateCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').optional(),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.nativeEnum(CampaignStatus).optional(),
  settings: z.record(z.any()).optional(),
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: params.id,
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
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found or unauthorized' },
        { status: 404 }
      )
    }

    return NextResponse.json(campaign)
  } catch (error) {
    console.error('Error fetching campaign:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    )
  }
}

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
    const validatedData = updateCampaignSchema.parse(body)

    // Verify campaign belongs to the admin
    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        id: params.id,
        adminId: session.user.id,
      },
    })

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found or unauthorized' },
        { status: 404 }
      )
    }

    const campaign = await prisma.campaign.update({
      where: {
        id: params.id,
      },
      data: validatedData,
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify campaign belongs to the admin
    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        id: params.id,
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
        id: params.id,
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