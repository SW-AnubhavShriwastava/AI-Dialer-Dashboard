import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Call log update schema
const updateCallLogSchema = z.object({
  status: z.string().optional(),
  duration: z.number().int().optional(),
  recordingUrl: z.string().url().optional(),
  transcriptId: z.string().optional(),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
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

    const callLog = await prisma.callLog.findFirst({
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
        appointment: {
          select: {
            id: true,
            title: true,
            appointmentTime: true,
            status: true,
          },
        },
      },
    })

    if (!callLog) {
      return NextResponse.json(
        { error: 'Call log not found or unauthorized' },
        { status: 404 }
      )
    }

    return NextResponse.json(callLog)
  } catch (error) {
    console.error('Error fetching call log:', error)
    return NextResponse.json(
      { error: 'Failed to fetch call log' },
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
    const validatedData = updateCallLogSchema.parse(body)

    // Verify call log belongs to the admin
    const existingCallLog = await prisma.callLog.findFirst({
      where: {
        id: params.id,
        campaign: {
          adminId: session.user.id,
        },
      },
    })

    if (!existingCallLog) {
      return NextResponse.json(
        { error: 'Call log not found or unauthorized' },
        { status: 404 }
      )
    }

    const callLog = await prisma.callLog.update({
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
      },
    })

    return NextResponse.json(callLog)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating call log:', error)
    return NextResponse.json(
      { error: 'Failed to update call log' },
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

    // Verify call log belongs to the admin
    const existingCallLog = await prisma.callLog.findFirst({
      where: {
        id: params.id,
        campaign: {
          adminId: session.user.id,
        },
      },
    })

    if (!existingCallLog) {
      return NextResponse.json(
        { error: 'Call log not found or unauthorized' },
        { status: 404 }
      )
    }

    await prisma.callLog.delete({
      where: {
        id: params.id,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting call log:', error)
    return NextResponse.json(
      { error: 'Failed to delete call log' },
      { status: 500 }
    )
  }
} 