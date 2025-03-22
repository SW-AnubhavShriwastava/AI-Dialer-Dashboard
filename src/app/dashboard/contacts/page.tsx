'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Plus, Search, Upload, Download, AlertCircle } from 'lucide-react'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface Contact {
  id: string
  name: string
  phone: string
  email?: string
  tags: string[]
  customFields: Record<string, any>
  createdAt: string
  updatedAt: string
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

// Form schemas
const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
})

type ContactFormValues = z.infer<typeof contactFormSchema>

// Add debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// Add predefined tag options
const tagOptions = [
  { label: 'Lead', value: 'lead' },
  { label: 'Customer', value: 'customer' },
  { label: 'VIP', value: 'vip' },
  { label: 'Cold', value: 'cold' },
  { label: 'Hot', value: 'hot' },
]

export default function ContactsPage() {
  const [searchInput, setSearchInput] = useState('')
  const search = useDebounce(searchInput, 500)
  const [selectedTagsInput, setSelectedTagsInput] = useState<string[]>([])
  const selectedTags = useDebounce(selectedTagsInput, 500)
  const [pageInput, setPageInput] = useState(1)
  const page = useDebounce(pageInput, 500)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null)
  const queryClient = useQueryClient()
  const [importProgress, setImportProgress] = useState(0)

  // Form hooks
  const addForm = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      tags: [],
    },
  })

  const editForm = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: selectedContact?.name || '',
      phone: selectedContact?.phone || '',
      email: selectedContact?.email || '',
      tags: selectedContact?.tags || [],
    },
  })

  // Reset edit form when selected contact changes
  React.useEffect(() => {
    if (selectedContact) {
      editForm.reset({
        name: selectedContact.name,
        phone: selectedContact.phone,
        email: selectedContact.email || '',
        tags: selectedContact.tags,
      })
    }
  }, [selectedContact, editForm])

  // Fetch contacts
  const { data, isLoading, error } = useQuery<ContactsResponse>({
    queryKey: ['contacts', search, selectedTags, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (selectedTags.length > 0) params.append('tags', selectedTags.join(','))
      params.append('page', page.toString())
      const response = await fetch(`/api/contacts?${params.toString()}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch contacts')
      }
      return response.json()
    },
  })

  // Add contact mutation
  const addContactMutation = useMutation({
    mutationFn: async (values: ContactFormValues) => {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add contact')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      setIsAddDialogOpen(false)
      addForm.reset()
      toast.success('Contact added successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Edit contact mutation
  const editContactMutation = useMutation({
    mutationFn: async (values: ContactFormValues) => {
      if (!selectedContact) throw new Error('No contact selected')
      const response = await fetch(`/api/contacts/${selectedContact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update contact')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      setIsEditDialogOpen(false)
      setSelectedContact(null)
      editForm.reset()
      toast.success('Contact updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete contact')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      toast.success('Contact deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Import contacts mutation
  const importContactsMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)

      // Set initial progress
      setImportProgress(10)

      const response = await fetch('/api/contacts/import', {
        method: 'POST',
        body: formData,
      })

      // Set progress to indicate processing
      setImportProgress(50)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to import contacts')
      }

      // Set progress to indicate completion
      setImportProgress(100)
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      setIsImportDialogOpen(false)
      setImportProgress(0)
      toast.success(`Successfully imported ${data.imported} contacts${data.skipped ? ` (${data.skipped} skipped)` : ''}`)
    },
    onError: (error: Error) => {
      setImportProgress(0)
      toast.error(error.message)
    },
  })

  // Export contacts mutation
  const exportContactsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/contacts/export', {
        method: 'GET',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to export contacts')
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    },
    onSuccess: () => {
      toast.success('Contacts exported successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Contacts</h1>
        <div className="flex items-center gap-4">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={isLoading}>
                <Upload className="mr-2 h-4 w-4" />
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Import'
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Contacts</DialogTitle>
                <DialogDescription>
                  Upload your contacts from a CSV or Excel file. Make sure your file follows the required format.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>File Requirements</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-4 mt-2 space-y-1">
                      <li>Required columns: name, phone</li>
                      <li>Optional columns: email, tags</li>
                      <li>Maximum file size: 5MB</li>
                      <li>Supported formats: .xlsx, .xls, .csv</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                <div className="grid gap-2">
                  <Input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error('File size must be less than 5MB')
                          e.target.value = ''
                          return
                        }
                        if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
                          toast.error('Only Excel and CSV files are allowed')
                          e.target.value = ''
                          return
                        }
                        setImportProgress(0)
                        importContactsMutation.mutate(file)
                      }
                    }}
                    disabled={importContactsMutation.isPending}
                  />
                  {importContactsMutation.isPending && (
                    <div className="space-y-2">
                      <Progress value={importProgress} className="w-full" />
                      <div className="flex items-center justify-center text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing contacts...
                      </div>
                    </div>
                  )}
                  {importContactsMutation.isError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Import Failed</AlertTitle>
                      <AlertDescription>
                        {importContactsMutation.error instanceof Error
                          ? importContactsMutation.error.message
                          : 'Failed to import contacts'}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsImportDialogOpen(false)}
                    disabled={importContactsMutation.isPending}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            onClick={() => exportContactsMutation.mutate()}
            disabled={exportContactsMutation.isPending || isLoading || !data?.contacts.length}
          >
            <Download className="mr-2 h-4 w-4" />
            {exportContactsMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              'Export'
            )}
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={isLoading}>
                <Plus className="mr-2 h-4 w-4" />
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Add Contact'
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Contact</DialogTitle>
              </DialogHeader>
              <Form {...addForm}>
                <form
                  onSubmit={addForm.handleSubmit((values) =>
                    addContactMutation.mutate(values)
                  )}
                  className="grid gap-4"
                >
                  <FormField
                    control={addForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter name"
                            {...field}
                            disabled={addContactMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter phone number"
                            {...field}
                            disabled={addContactMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter email"
                            {...field}
                            disabled={addContactMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <Select
                          value={field.value?.join(',')}
                          onValueChange={(value) => field.onChange(value ? value.split(',') : [])}
                          disabled={addContactMutation.isPending}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white border-input h-10">
                              <SelectValue placeholder="Select tags" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white border shadow-md">
                            {tagOptions.map((tag) => (
                              <SelectItem key={tag.value} value={tag.value} className="hover:bg-accent">
                                {tag.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {addContactMutation.isError && (
                    <div className="text-sm text-destructive">
                      {addContactMutation.error instanceof Error
                        ? addContactMutation.error.message
                        : 'Failed to add contact'}
                    </div>
                  )}
                  <Button
                    type="submit"
                    disabled={addContactMutation.isPending}
                  >
                    {addContactMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Add Contact
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8 max-w-sm"
            disabled={isLoading}
          />
          {isLoading && (
            <div className="absolute right-2 top-2.5">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
        </div>
        <Select
          value={selectedTagsInput.join(',')}
          onValueChange={(value) => setSelectedTagsInput(value ? value.split(',') : [])}
        >
          <SelectTrigger className="w-[200px] bg-white border-input h-10">
            <SelectValue placeholder="Filter by tags" />
          </SelectTrigger>
          <SelectContent className="bg-white border shadow-md">
            {tagOptions.map((tag) => (
              <SelectItem key={tag.value} value={tag.value} className="hover:bg-accent">
                {tag.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-destructive">
                  {error instanceof Error ? error.message : 'An error occurred'}
                </TableCell>
              </TableRow>
            ) : isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : data?.contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No contacts found.
                </TableCell>
              </TableRow>
            ) : (
              data?.contacts.map((contact: Contact) => (
                <TableRow key={contact.id}>
                  <TableCell>{contact.name}</TableCell>
                  <TableCell>{contact.phone}</TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedContact(contact)
                          setIsEditDialogOpen(true)
                        }}
                        disabled={editContactMutation.isPending || deleteContactMutation.isPending}
                      >
                        {editContactMutation.isPending && selectedContact?.id === contact.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setContactToDelete(contact)}
                        disabled={editContactMutation.isPending || deleteContactMutation.isPending}
                      >
                        {deleteContactMutation.isPending && contactToDelete?.id === contact.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            `${data?.pagination.total} contacts found`
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageInput((p) => Math.max(1, p - 1))}
            disabled={isLoading || !data?.pagination.page || data.pagination.page === 1}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Previous'
            )}
          </Button>
          <span className="text-sm">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              `Page ${data?.pagination.page} of ${data?.pagination.totalPages}`
            )}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageInput((p) => Math.min(data?.pagination.totalPages || p, p + 1))}
            disabled={
              isLoading ||
              !data?.pagination.page ||
              data.pagination.page === data.pagination.totalPages
            }
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Next'
            )}
          </Button>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit((values) =>
                editContactMutation.mutate(values)
              )}
              className="grid gap-4"
            >
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter name"
                        {...field}
                        disabled={editContactMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter phone number"
                        {...field}
                        disabled={editContactMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter email"
                        {...field}
                        disabled={editContactMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <Select
                      value={field.value?.join(',')}
                      onValueChange={(value) => field.onChange(value ? value.split(',') : [])}
                      disabled={editContactMutation.isPending}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white border-input h-10">
                          <SelectValue placeholder="Select tags" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white border shadow-md">
                        {tagOptions.map((tag) => (
                          <SelectItem key={tag.value} value={tag.value} className="hover:bg-accent">
                            {tag.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {editContactMutation.isError && (
                <div className="text-sm text-destructive">
                  {editContactMutation.error instanceof Error
                    ? editContactMutation.error.message
                    : 'Failed to update contact'}
                </div>
              )}
              <Button
                type="submit"
                disabled={editContactMutation.isPending}
              >
                {editContactMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Update Contact
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!contactToDelete}
        onOpenChange={(open) => !open && setContactToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to delete {contactToDelete?.name}? This action
              cannot be undone.
            </p>
            {deleteContactMutation.isError && (
              <div className="text-sm text-destructive">
                {deleteContactMutation.error instanceof Error
                  ? deleteContactMutation.error.message
                  : 'Failed to delete contact'}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setContactToDelete(null)}
                disabled={deleteContactMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (contactToDelete) {
                    deleteContactMutation.mutate(contactToDelete.id)
                    setContactToDelete(null)
                  }
                }}
                disabled={deleteContactMutation.isPending}
              >
                {deleteContactMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 