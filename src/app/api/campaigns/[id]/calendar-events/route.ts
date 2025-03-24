import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { QueryResult } from 'pg'

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  type: 'appointment' | 'scheduled_call'
  phone_number: string
  backgroundColor: string
  borderColor: string
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    if (!start || !end) {
      return NextResponse.json(
        { error: 'Start and end dates are required' },
        { status: 400 }
      )
    }

    const pool = await getPool()

    // Set the search path to ensure we're using the correct schema
    await pool.query('SET search_path TO public')

    // Get appointments
    const appointmentsQuery = `
      SELECT 
        a.booking_id as id,
        a.name as title,
        a.appointment_datetime as start,
        a.appointment_datetime + interval '30 minutes' as end,
        'appointment' as type,
        a.phone_number
      FROM public.appointments a
      WHERE a.appointment_datetime BETWEEN $1 AND $2
    `

    // Get scheduled calls
    const scheduledCallsQuery = `
      SELECT 
        sc.call_sid as id,
        'Scheduled Call: ' || sc.phone as title,
        sc.scheduled_datetime as start,
        sc.scheduled_datetime + interval '30 minutes' as end,
        'scheduled_call' as type,
        sc.phone as phone_number
      FROM public.scheduled_calls sc
      WHERE sc.scheduled_datetime BETWEEN $1 AND $2
    `

    try {
      const [appointmentsRes, scheduledCallsRes]: [QueryResult, QueryResult] = await Promise.all([
        pool.query(appointmentsQuery, [start, end]),
        pool.query(scheduledCallsQuery, [start, end])
      ])

      const events: CalendarEvent[] = [
        ...appointmentsRes.rows.map((event: any) => ({
          ...event,
          backgroundColor: '#10B981', // Emerald-500 for appointments
          borderColor: '#059669', // Emerald-600
        })),
        ...scheduledCallsRes.rows.map((event: any) => ({
          ...event,
          backgroundColor: '#6366F1', // Indigo-500 for scheduled calls
          borderColor: '#4F46E5', // Indigo-600
        }))
      ]

      return NextResponse.json({ events })
    } catch (dbError: any) {
      console.error('Database query error:', dbError)
      return NextResponse.json(
        { error: `Database error: ${dbError.message || 'Unknown error'}` },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error fetching calendar events:', error)
    return NextResponse.json(
      { error: `Failed to fetch calendar events: ${error.message || 'Unknown error'}` },
      { status: 500 }
    )
  }
} 