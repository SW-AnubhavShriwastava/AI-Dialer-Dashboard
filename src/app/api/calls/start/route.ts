import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DEFAULT_SYSTEM_MESSAGE = `You are an AI assistant making a phone call. Your role is to be professional, friendly, and helpful.
Key behaviors:
- Speak naturally and conversationally
- Listen carefully and respond appropriately
- Be polite and professional at all times
- Respect the caller's time and preferences
- Handle objections gracefully
- Take notes of important information`

const DEFAULT_INITIAL_MESSAGE = "Hello! This is an AI assistant calling. How are you today?"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { to_number, campaignId } = body

    if (!to_number) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      )
    }

    // Fetch campaign settings
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { settings: true }
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    const aiDialerUrl = process.env.AI_DIALER_URL
    if (!aiDialerUrl) {
      return NextResponse.json(
        { error: 'AI Dialer URL is not configured' },
        { status: 500 }
      )
    }

    // Get settings with defaults
    const settings = campaign.settings as { systemMessage?: string; initialMessage?: string }
    const system_message = settings.systemMessage || DEFAULT_SYSTEM_MESSAGE
    const initial_message = settings.initialMessage || DEFAULT_INITIAL_MESSAGE

    const response = await fetch(`${aiDialerUrl}/start_call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to_number,
        system_message,
        initial_message,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to initiate call: ${error}`)
    }

    const data = await response.json()

    // Create a call log entry
    await prisma.callLog.create({
      data: {
        campaignId,
        contactId: body.contactId,
        callSid: data.call_sid,
        status: 'INITIATED',
      },
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error initiating call:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to initiate call' },
      { status: 500 }
    )
  }
} 