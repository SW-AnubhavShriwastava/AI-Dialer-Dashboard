import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface ContactExport {
  name: string
  phone: string
  email: string | null
  tags: string[]
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contacts = await prisma.contact.findMany({
      where: {
        adminId: session.user.id,
      },
      select: {
        name: true,
        phone: true,
        email: true,
        tags: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Convert contacts to CSV format
    const headers = ['name', 'phone', 'email', 'tags']
    const rows = contacts.map((contact: ContactExport) => [
      contact.name,
      contact.phone,
      contact.email || '',
      contact.tags.join(',')
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row: string[]) => row.join(','))
    ].join('\n')

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="contacts-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting contacts:', error)
    return NextResponse.json(
      { error: 'Failed to export contacts' },
      { status: 500 }
    )
  }
} 