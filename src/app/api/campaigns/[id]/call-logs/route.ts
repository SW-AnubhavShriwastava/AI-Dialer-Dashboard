import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    // Get call logs for the campaign
    const callLogs = await prisma.callLog.findMany({
      where: {
        campaignId: id,
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    })

    return NextResponse.json(callLogs)
  } catch (error) {
    console.error('Error fetching campaign call logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign call logs' },
      { status: 500 }
    )
  }
} 