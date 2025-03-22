import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { AppointmentStatus } from '@prisma/client'

// Appointment update schema
const updateAppointmentSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  appointmentTime: z.string().datetime().optional(),
  status: z.nativeEnum(AppointmentStatus).optional(),
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

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        campaign: {
          adminId: session.user.id,
        },
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

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found or unauthorized' },
        { status: 404 }
      )
    }

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Error fetching appointment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointment' },
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
    const validatedData = updateAppointmentSchema.parse(body)

    // Verify appointment belongs to the admin
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        campaign: {
          adminId: session.user.id,
        },
      },
    })

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found or unauthorized' },
        { status: 404 }
      )
    }

    const appointment = await prisma.appointment.update({
      where: {
        id: params.id,
      },
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

    return NextResponse.json(appointment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating appointment:', error)
    return NextResponse.json(
      { error: 'Failed to update appointment' },
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

    // Verify appointment belongs to the admin
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        campaign: {
          adminId: session.user.id,
        },
      },
    })

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found or unauthorized' },
        { status: 404 }
      )
    }

    await prisma.appointment.delete({
      where: {
        id: params.id,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting appointment:', error)
    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    )
  }
} 