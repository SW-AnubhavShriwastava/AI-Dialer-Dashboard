import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string; callSid: string } }
) {
  try {
    const response = await fetch(`http://127.0.0.1:8000/transcript/${params.callSid}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch transcript')
    }

    const data = await response.json()
    const transcript = Array.isArray(data.transcript) ? data.transcript : JSON.parse(data.transcript)

    return NextResponse.json({ transcript }, { status: 200 })
  } catch (error) {
    console.error('Error fetching transcript:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch transcript' },
      { status: 500 }
    )
  }
} 