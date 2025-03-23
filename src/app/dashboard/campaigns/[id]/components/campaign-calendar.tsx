'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, startOfMonth, endOfMonth, isValid, parseISO, startOfDay, endOfDay, addMonths } from 'date-fns'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { ViewApi, CalendarApi } from '@fullcalendar/core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Loader2, Filter, CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AppointmentStatus } from '@prisma/client'

interface Appointment {
  id: string
  title: string
  description: string
  appointmentTime: string
  endTime: string | null
  status: AppointmentStatus
  contact: {
    name: string
    phone: string
    email: string | null
  }
}

interface CampaignCalendarProps {
  campaignId: string
}

type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'

interface AppointmentResponse {
  data: Appointment[]
}

export function CampaignCalendar({ campaignId }: CampaignCalendarProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus | 'ALL'>('ALL')
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  })
  const calendarRef = useRef<any>(null)
  const isInitialMount = useRef(true)

  const { data, isLoading } = useQuery<AppointmentResponse>({
    queryKey: ['campaign-appointments', campaignId, selectedStatus, dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: async () => {
      const response = await fetch(
        `/api/campaigns/${campaignId}/appointments?` + 
        new URLSearchParams({
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString(),
          ...(selectedStatus !== 'ALL' && { status: selectedStatus }),
          limit: '100'
        })
      )
      if (!response.ok) throw new Error('Failed to fetch appointments')
      return response.json()
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
    retry: false
  })

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.COMPLETED:
        return '#22c55e'
      case AppointmentStatus.CANCELLED:
        return '#ef4444'
      case AppointmentStatus.NO_SHOW:
        return '#f59e0b'
      default:
        return '#3b82f6'
    }
  }

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-'
    try {
      const date = parseISO(dateString)
      if (!isValid(date)) return '-'
      return format(date, 'PPP p')
    } catch {
      return '-'
    }
  }

  const formatTime = (dateString: string | null | undefined): string => {
    if (!dateString) return '-'
    try {
      const date = parseISO(dateString)
      if (!isValid(date)) return '-'
      return format(date, 'p')
    } catch {
      return '-'
    }
  }

  const handleDatesSet = useCallback((args: { start: Date; end: Date; view: { type: string } }) => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    const calendarApi = calendarRef.current?.getApi()
    if (!calendarApi) return

    setDateRange({
      start: args.start,
      end: args.end
    })
  }, [])

  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi()
    if (!calendarApi) return

    // Prevent the calendar from jumping to today's date on data updates
    const currentDate = calendarApi.getDate()
    if (currentDate) {
      calendarApi.gotoDate(currentDate)
    }
  }, [data])

  if (isLoading && isInitialMount.current) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const events = data?.data?.map((appointment: Appointment) => ({
    id: appointment.id,
    title: appointment.title,
    start: appointment.appointmentTime,
    end: appointment.endTime || undefined,
    backgroundColor: getStatusColor(appointment.status),
    allDay: false
  })) || []

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Campaign Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <Select
              value={selectedStatus}
              onValueChange={(value) => setSelectedStatus(value as AppointmentStatus | 'ALL')}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value={AppointmentStatus.SCHEDULED}>Scheduled</SelectItem>
                <SelectItem value={AppointmentStatus.COMPLETED}>Completed</SelectItem>
                <SelectItem value={AppointmentStatus.CANCELLED}>Cancelled</SelectItem>
                <SelectItem value={AppointmentStatus.NO_SHOW}>No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[600px]">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              events={events}
              eventClick={(info) => {
                const appointment = data?.data?.find((a: Appointment) => a.id === info.event.id)
                if (appointment) setSelectedAppointment(appointment)
              }}
              datesSet={handleDatesSet}
              height="100%"
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              firstDay={0}
              nowIndicator={true}
              dayMaxEvents={true}
              weekends={true}
              selectable={true}
              selectMirror={true}
              navLinks={true}
              lazyFetching={true}
              handleWindowResize={false}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedAppointment?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={
                selectedAppointment?.status === AppointmentStatus.COMPLETED ? 'default' : 
                selectedAppointment?.status === AppointmentStatus.CANCELLED ? 'destructive' :
                selectedAppointment?.status === AppointmentStatus.NO_SHOW ? 'secondary' : 'outline'
              }>
                {selectedAppointment?.status}
              </Badge>
            </div>
            <div>
              <h4 className="font-medium">Contact Information</h4>
              <p className="text-sm text-muted-foreground">{selectedAppointment?.contact.name}</p>
              <p className="text-sm text-muted-foreground">{selectedAppointment?.contact.phone}</p>
              <p className="text-sm text-muted-foreground">{selectedAppointment?.contact.email || '-'}</p>
            </div>
            <div>
              <h4 className="font-medium">Time</h4>
              <p className="text-sm text-muted-foreground">
                {formatDate(selectedAppointment?.appointmentTime)}
                {selectedAppointment?.endTime ? ` - ${formatTime(selectedAppointment.endTime)}` : ''}
              </p>
            </div>
            <div>
              <h4 className="font-medium">Description</h4>
              <p className="text-sm text-muted-foreground">{selectedAppointment?.description || '-'}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 