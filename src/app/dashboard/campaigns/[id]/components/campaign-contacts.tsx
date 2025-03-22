'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Upload, Download, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ContactStatus } from '@prisma/client'
import { useToast } from '@/components/ui/use-toast'

interface Contact {
  id: string
  name: string
  phone: string
  email: string | null
  status: ContactStatus
  lastCalled: string | null
  callAttempts: number
  campaigns: {
    status: string
    lastCalled: string | null
    callAttempts: number
  }[]
}

interface ImportProgress {
  total: number
  processed: number
  successful: number
  failed: number
  errors: string[]
}

interface ContactsResponse {
  contacts: Contact[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

interface CampaignContactsProps {
  campaignId: string
}

export function CampaignContacts({ campaignId }: CampaignContactsProps) {
  const [isAddContactDialogOpen, setIsAddContactDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isSelectContactDialogOpen, setIsSelectContactDialogOpen] = useState(false)
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null)
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    email: '',
  })
  const [selectedContactId, setSelectedContactId] = useState<string>('')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch campaign contacts
  const { data: contacts, isLoading } = useQuery<Contact[]>({
    queryKey: ['campaign-contacts', campaignId],
    queryFn: async () => {
      const response = await fetch(`/api/campaigns/${campaignId}/contacts`)
      if (!response.ok) throw new Error('Failed to fetch contacts')
      return response.json()
    },
  })

  // Fetch all contacts for selection
  const { data: contactsResponse } = useQuery<ContactsResponse>({
    queryKey: ['contacts'],
    queryFn: async () => {
      const response = await fetch('/api/contacts')
      if (!response.ok) throw new Error('Failed to fetch contacts')
      return response.json()
    },
  })

  const allContacts = contactsResponse?.contacts || []

  // Add contact mutation
  const addContactMutation = useMutation({
    mutationFn: async (contact: typeof newContact) => {
      const response = await fetch(`/api/campaigns/${campaignId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact),
      })
      if (!response.ok) throw new Error('Failed to add contact')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-contacts', campaignId] })
      setIsAddContactDialogOpen(false)
      setNewContact({ name: '', phone: '', email: '' })
      toast({
        title: 'Success',
        description: 'Contact added successfully',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add contact',
        variant: 'destructive',
      })
    },
  })

  // Import contacts mutation
  const importContactsMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/campaigns/${campaignId}/contacts/import`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to import contacts')
      }

      // Start polling for import progress
      const progressInterval = setInterval(async () => {
        const progressResponse = await fetch(
          `/api/campaigns/${campaignId}/contacts/import/progress`
        )
        if (progressResponse.ok) {
          const progress = await progressResponse.json()
          setImportProgress(progress)
          if (progress.processed === progress.total) {
            clearInterval(progressInterval)
            // Reset progress after 5 seconds
            setTimeout(() => setImportProgress(null), 5000)
          }
        }
      }, 1000)

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-contacts', campaignId] })
      toast({
        title: 'Success',
        description: 'Import started successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to import contacts',
        variant: 'destructive',
      })
      setImportProgress(null)
    },
  })

  // Export contacts mutation
  const exportContactsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `/api/campaigns/${campaignId}/contacts/export`,
        {
          method: 'GET',
        }
      )
      if (!response.ok) throw new Error('Failed to export contacts')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `campaign-contacts-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Contacts exported successfully',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to export contacts',
        variant: 'destructive',
      })
    },
  })

  // Add existing contact mutation
  const addExistingContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const response = await fetch(`/api/campaigns/${campaignId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId }),
      })
      if (!response.ok) throw new Error('Failed to add contact')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-contacts', campaignId] })
      setIsSelectContactDialogOpen(false)
      setSelectedContactId('')
      toast({
        title: 'Success',
        description: 'Contact added successfully',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add contact',
        variant: 'destructive',
      })
    },
  })

  const handleAddContact = () => {
    if (!newContact.name.trim() || !newContact.phone.trim()) {
      toast({
        title: 'Error',
        description: 'Name and phone are required',
        variant: 'destructive',
      })
      return
    }
    addContactMutation.mutate(newContact)
  }

  const handleImportContacts = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImportProgress({
        total: 0,
        processed: 0,
        successful: 0,
        failed: 0,
        errors: [],
      })
      importContactsMutation.mutate(file)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import Contacts
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Contacts</DialogTitle>
              <DialogDescription>
                Upload a CSV or Excel file containing contacts. The file should have the following columns: name, phone, email (optional).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">Excel/CSV File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleImportContacts}
                  disabled={importContactsMutation.isPending || !!importProgress}
                />
              </div>

              {importProgress && (
                <div className="space-y-4">
                  <Progress
                    value={
                      importProgress.total
                        ? (importProgress.processed / importProgress.total) * 100
                        : 0
                    }
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      Processed: {importProgress.processed}/{importProgress.total}
                    </span>
                    <span>
                      Success: {importProgress.successful} | Failed:{' '}
                      {importProgress.failed}
                    </span>
                  </div>
                  {importProgress.errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Import Errors</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc pl-4">
                          {importProgress.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {!importProgress && importContactsMutation.isSuccess && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Import Complete</AlertTitle>
                  <AlertDescription>
                    All contacts have been imported successfully.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Button
          variant="outline"
          onClick={() => exportContactsMutation.mutate()}
          disabled={exportContactsMutation.isPending}
        >
          <Download className="mr-2 h-4 w-4" />
          Export Contacts
        </Button>

        <Dialog open={isSelectContactDialogOpen} onOpenChange={setIsSelectContactDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Select Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Contact</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Contact</Label>
                <Select
                  value={selectedContactId}
                  onValueChange={setSelectedContactId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {allContacts?.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name} ({contact.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => addExistingContactMutation.mutate(selectedContactId)}
                className="w-full"
                disabled={!selectedContactId || addExistingContactMutation.isPending}
              >
                {addExistingContactMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Contact
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isAddContactDialogOpen} onOpenChange={setIsAddContactDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newContact.name}
                  onChange={(e) =>
                    setNewContact({ ...newContact, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newContact.phone}
                  onChange={(e) =>
                    setNewContact({ ...newContact, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={newContact.email}
                  onChange={(e) =>
                    setNewContact({ ...newContact, email: e.target.value })
                  }
                />
              </div>
              <Button
                onClick={handleAddContact}
                className="w-full"
                disabled={addContactMutation.isPending}
              >
                {addContactMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Contact
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Called</TableHead>
              <TableHead>Call Attempts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts?.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell className="font-medium">{contact.name}</TableCell>
                <TableCell>{contact.phone}</TableCell>
                <TableCell>{contact.email || '-'}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      contact.status === ContactStatus.ACTIVE
                        ? 'default'
                        : contact.status === ContactStatus.INACTIVE
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {contact.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {contact.lastCalled
                    ? format(new Date(contact.lastCalled), 'PPp')
                    : '-'}
                </TableCell>
                <TableCell>{contact.callAttempts}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 