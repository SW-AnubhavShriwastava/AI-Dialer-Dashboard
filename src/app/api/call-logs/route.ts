import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Call log creation schema
const createCallLogSchema = z.object({
  campaignId: z.string().cuid(),
  contactId: z.string().cuid(),
  callSid: z.string(),
  status: z.string(),
  duration: z.number().int().optional(),
  recordingUrl: z.string().url().optional(),
  transcriptId: z.string().optional(),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    const contactId = searchParams.get('contactId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause
    const where: any = {
      campaign: {
        adminId: session.user.id,
      },
    }

    if (campaignId) where.campaignId = campaignId
    if (contactId) where.contactId = contactId
    if (startDate) where.startedAt = { gte: new Date(startDate) }
    if (endDate) where.endedAt = { lte: new Date(endDate) }

    const callLogs = await prisma.callLog.findMany({
      where,
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        appointment: {
          select: {
            id: true,
            title: true,
            appointmentTime: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(callLogs)
  } catch (error) {
    console.error('Error fetching call logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch call logs' },
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
    const validatedData = createCallLogSchema.parse(body)

    // Verify campaign and contact belong to the admin
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: validatedData.campaignId,
        adminId: session.user.id,
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found or unauthorized' },
        { status: 404 }
      )
    }

    const contact = await prisma.contact.findFirst({
      where: {
        id: validatedData.contactId,
        adminId: session.user.id,
      },
    })

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found or unauthorized' },
        { status: 404 }
      )
    }

    // Create call log
    const callLog = await prisma.callLog.create({
      data: validatedData,
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    })

    return NextResponse.json(callLog, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating call log:', error)
    return NextResponse.json(
      { error: 'Failed to create call log' },
      { status: 500 }
    )
  }
} 