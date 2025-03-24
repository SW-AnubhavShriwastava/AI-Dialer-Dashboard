import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { to_number } = body

    if (!to_number) {
      return NextResponse.json(
        { error: 'Missing required field: to_number' },
        { status: 400 }
      )
    }

    // Read the Hindi prompt file using absolute path
    const promptPath = path.join(process.cwd(), '..', 'AI-Dialer', 'prompt', 'hindi_prompt.txt')
    let system_message
    try {
      system_message = await fs.readFile(promptPath, 'utf8')
      if (!system_message) {
        throw new Error('Empty prompt file')
      }
      console.log('Successfully loaded Hindi prompt')
    } catch (error) {
      console.error('Error reading hindi_prompt.txt:', error)
      return NextResponse.json(
        { error: 'Failed to load system prompt. Please ensure the hindi_prompt.txt file exists.' },
        { status: 500 }
      )
    }

    console.log('Initiating call with system message length:', system_message.length)

    // Forward the request to the AI-Dialer backend using IPv4 address
    const response = await fetch('http://127.0.0.1:8000/start_call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to_number,
        system_message,
        initial_message: "Hello, this is Riya from Shivalik Group. Can I take your one minute?"
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI-Dialer error:', errorText)
      return NextResponse.json(
        { error: 'Failed to initiate call with AI-Dialer' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Error in start_call route:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to initiate call' },
      { status: 500 }
    )
  }
} 