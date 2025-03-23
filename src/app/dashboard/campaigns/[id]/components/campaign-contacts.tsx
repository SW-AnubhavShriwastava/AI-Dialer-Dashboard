'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Upload, Download, Loader2, AlertCircle, CheckCircle2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
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
import { UserIcon } from 'lucide-react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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

function EmptyState() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        <UserIcon className="h-10 w-10 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No contacts</h3>
        <p className="mb-4 mt-2 text-sm text-muted-foreground">
          You haven't added any contacts to this campaign yet. Add contacts to start making calls.
        </p>
      </div>
    </div>
  )
}

export function CampaignContacts({ campaignId }: CampaignContactsProps) {
  const [isAddContactDialogOpen, setIsAddContactDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isSelectContactDialogOpen, setIsSelectContactDialogOpen] = useState(false)
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null)
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    email: '',
  })
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

  // Edit contact mutation
  const editContactMutation = useMutation({
    mutationFn: async (contact: typeof newContact & { id: string }) => {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact),
      })
      if (!response.ok) throw new Error('Failed to edit contact')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-contacts', campaignId] })
      setIsAddContactDialogOpen(false)
      setNewContact({ name: '', phone: '', email: '' })
      toast({
        title: 'Success',
        description: 'Contact updated successfully',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update contact',
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

  // Add existing contacts mutation
  const addExistingContactsMutation = useMutation({
    mutationFn: async (contactIds: string[]) => {
      const response = await fetch(`/api/campaigns/${campaignId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactIds }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to add contacts')
      }
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-contacts', campaignId] })
      setIsSelectContactDialogOpen(false)
      setSelectedContactIds([])
      
      // Show summary toast
      const added = data.results.filter((r: any) => r.status === 'added').length
      const skipped = data.results.filter((r: any) => r.status === 'skipped').length
      toast({
        title: 'Contacts Added',
        description: `Successfully added ${added} contact${added !== 1 ? 's' : ''}${skipped ? `, ${skipped} already in campaign` : ''}`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add contacts',
        variant: 'destructive',
      })
    },
  })

  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const response = await fetch(`/api/campaigns/${campaignId}/contacts/${contactId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete contact')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-contacts', campaignId] })
      toast({
        title: 'Success',
        description: 'Contact deleted successfully',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete contact',
        variant: 'destructive',
      })
    },
  })

  const handleAddOrEditContact = () => {
    if (!newContact.name.trim() || !newContact.phone.trim()) {
      toast({
        title: 'Error',
        description: 'Name and phone are required',
        variant: 'destructive',
      })
      return
    }
    
    if ('id' in newContact) {
      editContactMutation.mutate(newContact as typeof newContact & { id: string })
    } else {
      addContactMutation.mutate(newContact)
    }
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

  const filteredContacts = allContacts?.filter(contact => {
    if (!searchTerm) return true
    return (
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import Contacts
          </Button>
          <Button onClick={() => exportContactsMutation.mutate()}>
            <Download className="mr-2 h-4 w-4" />
            Export Contacts
          </Button>
          <Button onClick={() => setIsSelectContactDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Select Contact
          </Button>
        </div>
        <Button onClick={() => {
          setNewContact({ name: '', phone: '', email: '' })
          setIsAddContactDialogOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {contacts?.length === 0 ? (
        <EmptyState />
      ) : (
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
                <TableHead className="w-[50px]"></TableHead>
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
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setNewContact({
                              id: contact.id,
                              name: contact.name,
                              phone: contact.phone,
                              email: contact.email || '',
                            } as any)
                            setIsAddContactDialogOpen(true)
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            if (confirm('Are you sure you want to remove this contact from the campaign?')) {
                              deleteContactMutation.mutate(contact.id)
                            }
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

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

      <Dialog open={isSelectContactDialogOpen} onOpenChange={setIsSelectContactDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Select Contacts</DialogTitle>
            <DialogDescription>
              Select one or more contacts to add to the campaign
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative">
            <div className="flex items-center border rounded-md px-3 mb-4">
              <Search className="h-4 w-4 text-muted-foreground mr-2" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search contacts..."
                className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <ScrollArea className="h-[300px] rounded-md border">
              <div className="p-4">
                {filteredContacts?.length === 0 ? (
                  <div className="flex h-[200px] items-center justify-center">
                    <p className="text-sm text-muted-foreground">No contacts found.</p>
                  </div>
                ) : (
                  filteredContacts?.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => {
                        setSelectedContactIds(prev => {
                          if (prev.includes(contact.id)) {
                            return prev.filter(id => id !== contact.id)
                          }
                          return [...prev, contact.id]
                        })
                      }}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-accent",
                        selectedContactIds.includes(contact.id) && "bg-accent"
                      )}
                    >
                      <div className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-sm border",
                        selectedContactIds.includes(contact.id) 
                          ? "border-primary bg-primary text-primary-foreground" 
                          : "border-input"
                      )}>
                        {selectedContactIds.includes(contact.id) && (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.phone}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-muted-foreground">
              {selectedContactIds.length} contact{selectedContactIds.length !== 1 ? 's' : ''} selected
            </p>
            <Button
              onClick={() => addExistingContactsMutation.mutate(selectedContactIds)}
              disabled={!selectedContactIds.length || addExistingContactsMutation.isPending}
            >
              {addExistingContactsMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Selected Contacts
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddContactDialogOpen} onOpenChange={setIsAddContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{'id' in newContact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
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
              onClick={handleAddOrEditContact}
              className="w-full"
              disabled={addContactMutation.isPending || editContactMutation.isPending}
            >
              {(addContactMutation.isPending || editContactMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {'id' in newContact ? 'Update Contact' : 'Add Contact'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 