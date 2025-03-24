import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { to_number, system_message, initial_message } = body

    if (!to_number) {
      return NextResponse.json(
        { error: 'Missing required field: to_number' },
        { status: 400 }
      )
    }

    // Forward the request to the AI-Dialer backend using IPv4 address
    const response = await fetch('http://127.0.0.1:8000/start_call', {
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

    const responseText = await response.text()
    console.log('AI-Dialer response:', responseText)

    try {
      const data = JSON.parse(responseText)
      return NextResponse.json(data, { status: response.status })
    } catch (e) {
      console.error('Failed to parse AI-Dialer response:', responseText)
      return NextResponse.json(
        { error: responseText || 'Invalid response from AI-Dialer' },
        { status: response.status }
      )
    }
  } catch (error) {
    console.error('Error in start_call route:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to initiate call' },
      { status: 500 }
    )
  }
} 