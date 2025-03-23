import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{ id: string; contactId: string }> | { id: string; contactId: string }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, contactId } = context.params instanceof Promise ? await context.params : context.params

    // Remove the contact from the campaign
    await prisma.campaignContact.delete({
      where: {
        campaignId_contactId: {
          campaignId: id,
          contactId: contactId,
        },
      },
    })

    return NextResponse.json({ message: 'Contact removed from campaign successfully' })
  } catch (error) {
    console.error('Error removing contact from campaign:', error)
    return NextResponse.json(
      { error: 'Failed to remove contact from campaign' },
      { status: 500 }
    )
  }
} 