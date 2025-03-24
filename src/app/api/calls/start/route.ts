import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { to_number } = body

    if (!to_number) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    const aiDialerUrl = process.env.AI_DIALER_URL
    if (!aiDialerUrl) {
      return NextResponse.json(
        { error: 'AI Dialer URL is not configured' },
        { status: 500 }
      )
    }

    const response = await fetch(`${aiDialerUrl}/start_call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to_number,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to initiate call: ${error}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error initiating call:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to initiate call' },
      { status: 500 }
    )
  }
} 