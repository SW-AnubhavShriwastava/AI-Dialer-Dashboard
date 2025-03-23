import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AppointmentStatus } from '@prisma/client'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { id } = await context.params

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status') as AppointmentStatus | null
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build where clause
    const where = {
      campaignId: id,
      campaign: {
        OR: [
          { adminId: session.user.id },
          {
            employees: {
              some: {
                employee: {
                  adminId: session.user.id
                }
              }
            }
          }
        ]
      },
      ...(startDate && {
        appointmentTime: {
          gte: new Date(startDate)
        }
      }),
      ...(endDate && {
        appointmentTime: {
          lte: new Date(endDate)
        }
      }),
      ...(status && {
        status: status
      })
    }

    // Get total count for pagination
    const total = await prisma.appointment.count({ where })

    // Fetch appointments with pagination
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        contact: {
          select: {
            name: true,
            phone: true,
            email: true
          }
        }
      },
      orderBy: {
        appointmentTime: 'asc'
      },
      skip,
      take: limit
    })

    // Transform the data to match the frontend interface
    const transformedAppointments = appointments.map(appointment => ({
      id: appointment.id,
      title: appointment.title,
      description: appointment.description || '',
      start: appointment.appointmentTime.toISOString(),
      end: new Date(new Date(appointment.appointmentTime).getTime() + 60 * 60 * 1000).toISOString(), // Default 1 hour duration
      status: appointment.status,
      contact: appointment.contact
    }))

    return NextResponse.json({
      data: transformedAppointments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching appointments:', error)
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.name === 'PrismaClientValidationError') {
        return new NextResponse('Invalid query parameters', { status: 400 })
      }
      if (error.name === 'PrismaClientKnownRequestError') {
        return new NextResponse('Database error', { status: 500 })
      }
    }

    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 