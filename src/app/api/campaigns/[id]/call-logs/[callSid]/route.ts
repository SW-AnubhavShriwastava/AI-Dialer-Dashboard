import { NextResponse } from 'next/server'

type RouteParams = {
  params: {
    id: string
    callSid: string
  }
}

export async function GET(
  request: Request,
  { params }: RouteParams
) {
  const callSid = params.callSid

  if (!callSid) {
    return NextResponse.json(
      { error: 'Call SID is required' },
      { status: 400 }
    )
  }

  try {
    const response = await fetch(`http://127.0.0.1:8000/transcript/${callSid}`, {
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