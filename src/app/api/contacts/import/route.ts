import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { parse } from 'csv-parse/sync'

interface ImportedContact {
  name: string
  phone: string
  email: string | null
  tags: string[]
  adminId: string
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Read file content
    const fileContent = await file.text()
    
    // Parse CSV with case-insensitive headers
    const records = parse(fileContent, {
      columns: (header: string[]) => header.map(col => col.toLowerCase()),
      skip_empty_lines: true,
      trim: true,
    })

    // Validate and transform records
    const contacts = records.map((record: Record<string, string>) => ({
      name: record.name?.trim(),
      phone: record.phone?.trim(),
      email: record.email?.trim() || null,
      tags: record.tags?.split(',').map((tag: string) => tag.trim()).filter(Boolean) || [],
      adminId: session.user.id,
    }))

    // Validate required fields and provide more detailed error messages
    const invalidContacts = contacts.filter((contact: ImportedContact) => {
      const errors = []
      if (!contact.name) errors.push('name is required')
      if (!contact.phone) errors.push('phone is required')
      return errors.length > 0
    })

    if (invalidContacts.length > 0) {
      return NextResponse.json(
        {
          error: 'Invalid contacts found',
          details: invalidContacts.map((contact: ImportedContact, index: number) => ({
            row: index + 2, // +2 because index is 0-based and we skip header row
            contact,
            errors: [
              !contact.name && 'Name is required',
              !contact.phone && 'Phone is required',
            ].filter(Boolean),
          })),
        },
        { status: 400 }
      )
    }

    // Create contacts
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = []
      const skipped = []

      for (const contact of contacts) {
        // Check for existing contact with same phone number
        const existing = await tx.contact.findFirst({
          where: {
            phone: contact.phone,
            adminId: session.user.id,
          },
        })

        if (!existing) {
          const newContact = await tx.contact.create({
            data: contact,
          })
          created.push(newContact)
        } else {
          skipped.push(contact)
        }
      }

      return { created, skipped }
    })

    return NextResponse.json({
      message: 'Contacts imported successfully',
      imported: result.created.length,
      skipped: result.skipped.length,
    })
  } catch (error) {
    console.error('Error importing contacts:', error)
    return NextResponse.json(
      { error: 'Failed to import contacts. Please make sure your CSV file has the required columns: Name, Phone, Email (optional), Tags (optional)' },
      { status: 500 }
    )
  }
} 