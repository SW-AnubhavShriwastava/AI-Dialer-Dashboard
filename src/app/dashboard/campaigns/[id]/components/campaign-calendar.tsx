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
import { Loader2, Filter, CalendarIcon, Phone, Clock, Calendar as CalendarIcon2, User, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  type: 'appointment' | 'scheduled_call'
  phone_number: string
  backgroundColor: string
  borderColor: string
}

export function CampaignCalendar() {
  const params = useParams<{ id: string }>()
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar-events', params.id],
    queryFn: async ({ queryKey }) => {
      const [_, campaignId] = queryKey
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const response = await fetch(
        `/api/campaigns/${campaignId}/calendar-events?start=${start.toISOString()}&end=${end.toISOString()}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch calendar events')
      }

      const data = await response.json()
      return data.events.map((event: CalendarEvent) => ({
        ...event,
        display: 'block',
        classNames: [event.type === 'appointment' ? 'appointment-event' : 'scheduled-call-event'],
      }))
    },
  })

  const handleEventClick = (info: { event: any }) => {
    const event = events.find((e: CalendarEvent) => e.id === info.event.id)
    if (event) {
      setSelectedEvent(event)
    }
  }

  const handleCallClick = async () => {
    if (!selectedEvent?.phone_number) return

    try {
      const response = await fetch(`/api/calls/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to_number: selectedEvent.phone_number,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to initiate call')
      }

      toast.success('Call initiated successfully')
      setSelectedEvent(null)
    } catch (error) {
      console.error('Error initiating call:', error)
      toast.error('Failed to initiate call')
    }
  }

  if (isLoading) {
    return <div>Loading calendar...</div>
  }

  return (
    <Card className="col-span-4 lg:col-span-3">
      <CardContent className="p-6">
        <style jsx global>{`
          .appointment-event {
            background-color: #10B981 !important;
            border-color: #059669 !important;
            color: white !important;
            padding: 4px 8px !important;
            border-radius: 4px !important;
            font-size: 0.875rem !important;
            margin-bottom: 2px !important;
          }
          .scheduled-call-event {
            background-color: #6366F1 !important;
            border-color: #4F46E5 !important;
            color: white !important;
            padding: 4px 8px !important;
            border-radius: 4px !important;
            font-size: 0.875rem !important;
            margin-bottom: 2px !important;
          }
          .fc-event {
            cursor: pointer !important;
          }
          .fc-event-time {
            font-weight: 500 !important;
          }
          .fc-event-title {
            font-weight: 400 !important;
          }
          .fc-daygrid-day-events {
            max-height: 120px !important;
            overflow-y: auto !important;
            scrollbar-width: thin !important;
          }
          .fc-daygrid-day-events::-webkit-scrollbar {
            width: 4px !important;
          }
          .fc-daygrid-day-events::-webkit-scrollbar-track {
            background: #f1f1f1 !important;
          }
          .fc-daygrid-day-events::-webkit-scrollbar-thumb {
            background: #888 !important;
            border-radius: 4px !important;
          }
          .fc-daygrid-day-events::-webkit-scrollbar-thumb:hover {
            background: #555 !important;
          }
          .fc-daygrid-more-link {
            font-size: 0.75rem !important;
            color: #6B7280 !important;
          }
        `}</style>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          events={events}
          eventClick={handleEventClick}
          height="auto"
          aspectRatio={1.5}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: 'short'
          }}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: 'short'
          }}
          dayMaxEvents={false}
          moreLinkClick="popover"
        />
      </CardContent>

      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              {selectedEvent?.type === 'appointment' ? (
                <CalendarIcon2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <Phone className="h-5 w-5 text-indigo-500" />
              )}
              {selectedEvent?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                <Hash className="h-4 w-4" />
                ID
              </div>
              <p className="text-sm font-mono">{selectedEvent?.id}</p>
            </div>
            <Separator />
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                <Clock className="h-4 w-4" />
                Date & Time
              </div>
              <div className="space-y-1">
                <p className="text-sm">
                  {selectedEvent?.start &&
                    format(new Date(selectedEvent.start), 'PPP')}
                </p>
                <p className="text-sm font-medium">
                  {selectedEvent?.start &&
                    format(new Date(selectedEvent.start), 'p')}
                  {selectedEvent?.end &&
                    ` - ${format(new Date(selectedEvent.end), 'p')}`}
                </p>
              </div>
            </div>
            <Separator />
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                <User className="h-4 w-4" />
                Contact Details
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{selectedEvent?.phone_number}</p>
              </div>
            </div>
            <Separator />
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
                <CalendarIcon className="h-4 w-4" />
                Event Type
              </div>
              <Badge variant={selectedEvent?.type === 'appointment' ? 'default' : 'secondary'}>
                {selectedEvent?.type === 'appointment' ? 'Appointment' : 'Scheduled Call'}
              </Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
} 