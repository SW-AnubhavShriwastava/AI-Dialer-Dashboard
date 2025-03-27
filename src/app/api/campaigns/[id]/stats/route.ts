import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { subDays, startOfDay, endOfDay } from 'date-fns'
import { Campaign, Contact, CallLog, CampaignContact, Appointment, AppointmentStatus, ContactStatus, UserRole } from '@prisma/client'

interface CampaignWithRelations extends Campaign {
  contacts: CampaignContact[]
  callLogs: (CallLog & { contact: Contact })[]
  appointments: (Appointment & { contact: Contact })[]
}

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    let campaign: CampaignWithRelations | null = null

    if (session.user.role === UserRole.ADMIN) {
      // Admin access - check if campaign belongs to them
      campaign = await prisma.campaign.findFirst({
        where: {
          id,
          adminId: session.user.id,
        },
        include: {
          contacts: true,
          callLogs: {
            include: {
              contact: true,
            },
          },
          appointments: {
            include: {
              contact: true,
            },
          },
        },
      }) as CampaignWithRelations | null
    } else {
      // Employee access - check if they have access to this campaign
      const employee = await prisma.employee.findFirst({
        where: {
          user: {
            id: session.user.id,
          },
        },
        select: {
          id: true,
          permissions: true,
        },
      })

      if (!employee || !(employee.permissions as any).campaigns.view) {
        return NextResponse.json(
          { error: 'No permission to view campaigns' },
          { status: 403 }
        )
      }

      // Check if employee has access to this specific campaign
      campaign = await prisma.campaign.findFirst({
        where: {
          id,
          employees: {
            some: {
              employeeId: employee.id
            }
          }
        },
        include: {
          contacts: true,
          callLogs: {
            include: {
              contact: true,
            },
          },
          appointments: {
            include: {
              contact: true,
            },
          },
        },
      }) as CampaignWithRelations | null
    }

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found or unauthorized' },
        { status: 404 }
      )
    }

    // Calculate basic stats
    const totalContacts = campaign.contacts.length
    const activeContacts = campaign.contacts.filter(
      (contact) => contact.status === ContactStatus.ACTIVE
    ).length
    const totalCalls = campaign.callLogs.length
    const totalDuration = campaign.callLogs.reduce(
      (sum: number, log) => sum + (log.duration || 0),
      0
    )
    const averageCallDuration =
      totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0
    const successfulCalls = campaign.callLogs.filter(
      (log) => log.status === 'COMPLETED'
    ).length
    const successRate =
      totalCalls > 0
        ? Math.round((successfulCalls / totalCalls) * 100)
        : 0

    // Calculate call history (last 7 days)
    const callHistory = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i)
      const dayStart = startOfDay(date)
      const dayEnd = endOfDay(date)
      const dayLogs = campaign.callLogs.filter(
        (log) =>
          new Date(log.startedAt || '') >= dayStart &&
          new Date(log.startedAt || '') <= dayEnd
      )
      const daySuccessful = dayLogs.filter(
        (log) => log.status === 'COMPLETED'
      ).length
      const dayAppointments = campaign.appointments.filter(
        (appointment) =>
          new Date(appointment.createdAt) >= dayStart &&
          new Date(appointment.createdAt) <= dayEnd
      ).length

      return {
        date: date.toISOString(),
        calls: dayLogs.length,
        successRate:
          dayLogs.length > 0
            ? Math.round((daySuccessful / dayLogs.length) * 100)
            : 0,
        appointments: dayAppointments,
      }
    }).reverse()

    // Calculate appointment funnel
    const appointmentFunnel = [
      {
        stage: 'Scheduled',
        count: campaign.appointments.filter(
          (appointment) => appointment.status === AppointmentStatus.SCHEDULED
        ).length,
      },
      {
        stage: 'Completed',
        count: campaign.appointments.filter(
          (appointment) => appointment.status === AppointmentStatus.COMPLETED
        ).length,
      },
      {
        stage: 'Cancelled',
        count: campaign.appointments.filter(
          (appointment) => appointment.status === AppointmentStatus.CANCELLED
        ).length,
      },
      {
        stage: 'No Show',
        count: campaign.appointments.filter(
          (appointment) => appointment.status === AppointmentStatus.NO_SHOW
        ).length,
      },
    ]

    // Get recent activity
    const recentActivity = [
      ...campaign.callLogs.map((log) => ({
        id: log.id,
        type: 'call' as const,
        contact: log.contact.name,
        timestamp: log.startedAt || log.createdAt,
        details: `${log.status} - ${Math.round(
          (log.duration || 0) / 60
        )} minutes`,
      })),
      ...campaign.appointments.map((appointment) => ({
        id: appointment.id,
        type: 'appointment' as const,
        contact: appointment.contact.name,
        timestamp: appointment.appointmentTime,
        details: `${appointment.title} - ${appointment.status}`,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)

    return NextResponse.json({
      totalContacts,
      activeContacts,
      totalCalls,
      totalDuration,
      averageCallDuration,
      successRate,
      appointmentsScheduled: campaign.appointments.filter(
        (appointment) => appointment.status === AppointmentStatus.SCHEDULED
      ).length,
      appointmentsCompleted: campaign.appointments.filter(
        (appointment) => appointment.status === AppointmentStatus.COMPLETED
      ).length,
      callHistory,
      appointmentFunnel,
      recentActivity,
    })
  } catch (error) {
    console.error('Error fetching campaign stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign stats' },
      { status: 500 }
    )
  }
} 