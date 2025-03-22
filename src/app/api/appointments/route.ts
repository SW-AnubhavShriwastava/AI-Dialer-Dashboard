import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { AppointmentStatus } from '@prisma/client'

// Appointment creation schema
const createAppointmentSchema = z.object({
  campaignId: z.string().cuid(),
  contactId: z.string().cuid(),
  callLogId: z.string().cuid().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  appointmentTime: z.string().datetime(),
  status: z.nativeEnum(AppointmentStatus).optional(),
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
    const status = searchParams.get('status')

    // Build where clause
    const where: any = {
      campaign: {
        adminId: session.user.id,
      },
    }

    if (campaignId) where.campaignId = campaignId
    if (contactId) where.contactId = contactId
    if (status) where.status = status
    if (startDate) where.appointmentTime = { gte: new Date(startDate) }
    if (endDate) where.appointmentTime = { ...where.appointmentTime, lte: new Date(endDate) }

    const appointments = await prisma.appointment.findMany({
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
        callLog: {
          select: {
            id: true,
            status: true,
            duration: true,
            recordingUrl: true,
          },
        },
      },
      orderBy: {
        appointmentTime: 'asc',
      },
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
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
    const validatedData = createAppointmentSchema.parse(body)

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

    // If callLogId is provided, verify it belongs to the same campaign and contact
    if (validatedData.callLogId) {
      const callLog = await prisma.callLog.findFirst({
        where: {
          id: validatedData.callLogId,
          campaignId: validatedData.campaignId,
          contactId: validatedData.contactId,
        },
      })

      if (!callLog) {
        return NextResponse.json(
          { error: 'Call log not found or does not match campaign/contact' },
          { status: 400 }
        )
      }
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        ...validatedData,
        status: validatedData.status || AppointmentStatus.SCHEDULED,
      },
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
        callLog: {
          select: {
            id: true,
            status: true,
            duration: true,
            recordingUrl: true,
          },
        },
      },
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating appointment:', error)
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    )
  }
} 