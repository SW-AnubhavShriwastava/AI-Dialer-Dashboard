import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      select: {
        systemMessage: true,
        initialMessage: true,
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(campaign)
  } catch (error) {
    console.error('Error fetching campaign settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { systemMessage, initialMessage } = body

    const updatedCampaign = await prisma.campaign.update({
      where: { id: params.id },
      data: {
        systemMessage,
        initialMessage,
      },
      select: {
        systemMessage: true,
        initialMessage: true,
      },
    })

    return NextResponse.json(updatedCampaign)
  } catch (error) {
    console.error('Error updating campaign settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 