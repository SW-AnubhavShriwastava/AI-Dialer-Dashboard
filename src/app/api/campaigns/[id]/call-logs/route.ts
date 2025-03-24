import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get all transcripts from the AI-Dialer backend
    const response = await fetch('http://127.0.0.1:8000/all_transcripts', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch transcripts')
    }

    const data = await response.json()
    const transcripts = data.transcripts || []

    // Format the transcripts into call logs
    const callLogs = transcripts.map((transcript: any) => {
      const lastUpdated = new Date(transcript.last_updated)
      return {
        id: transcript.id,
        callSid: transcript.call_sid,
        phoneNumber: transcript.phone_number,
        timestamp: lastUpdated.toISOString(),
        status: 'completed', // We can enhance this by fetching actual status if needed
        duration: '00:00', // We can enhance this by calculating actual duration if needed
        hasRecording: true, // We can enhance this by checking if recording exists
        hasTranscript: true
      }
    })

    // Sort by timestamp descending (most recent first)
    callLogs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({ callLogs }, { status: 200 })
  } catch (error) {
    console.error('Error fetching call logs:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch call logs' },
      { status: 500 }
    )
  }
} 