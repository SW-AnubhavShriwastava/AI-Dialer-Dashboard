'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, startOfMonth, endOfMonth, isValid, parseISO } from 'date-fns'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Loader2, Filter } from 'lucide-react'
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

export function CampaignCalendar({ campaignId }: CampaignCalendarProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus | 'ALL'>('ALL')
  const [currentDate, setCurrentDate] = useState<Date>(new Date())

  const { data, isLoading } = useQuery({
    queryKey: ['campaign-appointments', campaignId, selectedStatus, currentDate],
    queryFn: async () => {
      const startDate = startOfMonth(currentDate).toISOString()
      const endDate = endOfMonth(currentDate).toISOString()
      const status = selectedStatus === 'ALL' ? null : selectedStatus
      
      const response = await fetch(
        `/api/campaigns/${campaignId}/appointments?` + 
        new URLSearchParams({
          startDate,
          endDate,
          ...(status && { status }),
          limit: '100' // Increased limit for calendar view
        })
      )
      if (!response.ok) throw new Error('Failed to fetch appointments')
      return response.json()
    }
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

  const events = data?.data?.map((appointment: Appointment) => ({
    id: appointment.id,
    title: appointment.title,
    start: appointment.appointmentTime,
    end: appointment.endTime || undefined,
    backgroundColor: getStatusColor(appointment.status),
    allDay: false
  })) || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

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
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              events={events}
              eventClick={(info) => {
                const appointment = data.data.find((a: Appointment) => a.id === info.event.id)
                if (appointment) setSelectedAppointment(appointment)
              }}
              datesSet={(dateInfo) => {
                setCurrentDate(dateInfo.start)
              }}
              height="100%"
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
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