import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ContactStatus } from '@prisma/client'

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

    // Verify campaign belongs to the admin
    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        adminId: session.user.id,
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found or unauthorized' },
        { status: 404 }
      )
    }

    // Get leads (contacts with appointments) for the campaign
    const leads = await prisma.contact.findMany({
      where: {
        campaigns: {
          some: {
            campaignId: id,
          },
        },
        appointments: {
          some: {
            campaignId: id,
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
        appointments: {
          where: {
            campaignId: id,
          },
          orderBy: {
            appointmentTime: 'desc',
          },
          take: 1,
        },
        callLogs: {
          where: {
            campaignId: id,
          },
          orderBy: {
            startedAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        appointments: {
          _count: 'desc',
        },
      },
    })

    return NextResponse.json(leads)
  } catch (error) {
    console.error('Error fetching campaign leads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign leads' },
      { status: 500 }
    )
  }
} 