'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Search, Loader2, Plus, Calendar, Phone, User } from 'lucide-react'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/components/ui/use-toast'
import { AppointmentStatus } from '@prisma/client'

interface Lead {
  id: string
  contact: {
    id: string
    name: string
    phone: string
  }
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST'
  source: string
  notes: string | null
  createdAt: string
  updatedAt: string
  appointments: Appointment[]
}

interface Appointment {
  id: string
  title: string
  description: string | null
  appointmentTime: string
  status: AppointmentStatus
  createdAt: string
  updatedAt: string
}

interface CampaignLeadsProps {
  campaignId: string
}

export function CampaignLeads({ campaignId }: CampaignLeadsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isAddLeadDialogOpen, setIsAddLeadDialogOpen] = useState(false)
  const [isAddAppointmentDialogOpen, setIsAddAppointmentDialogOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [newLead, setNewLead] = useState({
    contactId: '',
    source: '',
    notes: '',
  })
  const [newAppointment, setNewAppointment] = useState({
    title: '',
    description: '',
    appointmentTime: '',
    status: AppointmentStatus.SCHEDULED,
  })
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch leads
  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ['campaign-leads', campaignId],
    queryFn: async () => {
      const response = await fetch(`/api/campaigns/${campaignId}/leads`)
      if (!response.ok) throw new Error('Failed to fetch leads')
      return response.json()
    },
  })

  // Fetch contacts for lead creation
  const { data: contacts } = useQuery({
    queryKey: ['campaign-contacts', campaignId],
    queryFn: async () => {
      const response = await fetch(`/api/campaigns/${campaignId}/contacts`)
      if (!response.ok) throw new Error('Failed to fetch contacts')
      return response.json()
    },
  })

  // Add lead mutation
  const addLeadMutation = useMutation({
    mutationFn: async (lead: typeof newLead) => {
      const response = await fetch(`/api/campaigns/${campaignId}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      })
      if (!response.ok) throw new Error('Failed to add lead')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-leads', campaignId] })
      setIsAddLeadDialogOpen(false)
      setNewLead({ contactId: '', source: '', notes: '' })
      toast({
        title: 'Success',
        description: 'Lead added successfully',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add lead',
        variant: 'destructive',
      })
    },
  })

  // Add appointment mutation
  const addAppointmentMutation = useMutation({
    mutationFn: async (appointment: typeof newAppointment) => {
      const response = await fetch(`/api/campaigns/${campaignId}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...appointment,
          contactId: selectedLead?.contact.id,
        }),
      })
      if (!response.ok) throw new Error('Failed to add appointment')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-leads', campaignId] })
      setIsAddAppointmentDialogOpen(false)
      setNewAppointment({
        title: '',
        description: '',
        appointmentTime: '',
        status: AppointmentStatus.SCHEDULED,
      })
      toast({
        title: 'Success',
        description: 'Appointment added successfully',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add appointment',
        variant: 'destructive',
      })
    },
  })

  // Filter leads
  const filteredLeads = leads?.filter((lead) => {
    const matchesSearch =
      lead.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contact.phone.includes(searchQuery)
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
    return matchesSearch && matchesStatus
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
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="NEW">New</SelectItem>
            <SelectItem value="CONTACTED">Contacted</SelectItem>
            <SelectItem value="QUALIFIED">Qualified</SelectItem>
            <SelectItem value="LOST">Lost</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setIsAddLeadDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Lead
        </Button>
      </div>

      {/* Leads Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads?.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.contact.name}</TableCell>
                <TableCell>{lead.contact.phone}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      lead.status === 'NEW'
                        ? 'default'
                        : lead.status === 'CONTACTED'
                        ? 'secondary'
                        : lead.status === 'QUALIFIED'
                        ? 'success'
                        : 'destructive'
                    }
                  >
                    {lead.status}
                  </Badge>
                </TableCell>
                <TableCell>{lead.source}</TableCell>
                <TableCell>
                  {format(new Date(lead.createdAt), 'PPP')}
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLead(lead)}
                      >
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Lead Details</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Contact</Label>
                            <p className="text-sm">{lead.contact.name}</p>
                          </div>
                          <div>
                            <Label>Phone</Label>
                            <p className="text-sm">{lead.contact.phone}</p>
                          </div>
                          <div>
                            <Label>Status</Label>
                            <Badge
                              variant={
                                lead.status === 'NEW'
                                  ? 'default'
                                  : lead.status === 'CONTACTED'
                                  ? 'secondary'
                                  : lead.status === 'QUALIFIED'
                                  ? 'success'
                                  : 'destructive'
                              }
                            >
                              {lead.status}
                            </Badge>
                          </div>
                          <div>
                            <Label>Source</Label>
                            <p className="text-sm">{lead.source}</p>
                          </div>
                          <div>
                            <Label>Created</Label>
                            <p className="text-sm">
                              {format(new Date(lead.createdAt), 'PPP p')}
                            </p>
                          </div>
                          <div>
                            <Label>Last Updated</Label>
                            <p className="text-sm">
                              {format(new Date(lead.updatedAt), 'PPP p')}
                            </p>
                          </div>
                        </div>

                        {lead.notes && (
                          <div>
                            <Label>Notes</Label>
                            <ScrollArea className="h-[100px] rounded-md border p-4">
                              <p className="text-sm">{lead.notes}</p>
                            </ScrollArea>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">Appointments</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsAddAppointmentDialogOpen(true)}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            Add Appointment
                          </Button>
                        </div>

                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {lead.appointments.map((appointment) => (
                                <TableRow key={appointment.id}>
                                  <TableCell className="font-medium">
                                    {appointment.title}
                                  </TableCell>
                                  <TableCell>
                                    {format(
                                      new Date(appointment.appointmentTime),
                                      'PPP p'
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        appointment.status ===
                                        AppointmentStatus.SCHEDULED
                                          ? 'default'
                                          : appointment.status ===
                                            AppointmentStatus.COMPLETED
                                          ? 'success'
                                          : appointment.status ===
                                            AppointmentStatus.CANCELLED
                                          ? 'destructive'
                                          : 'secondary'
                                      }
                                    >
                                      {appointment.status}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add Lead Dialog */}
      <Dialog open={isAddLeadDialogOpen} onOpenChange={setIsAddLeadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Contact</Label>
              <Select
                value={newLead.contactId}
                onValueChange={(value) =>
                  setNewLead({ ...newLead, contactId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts?.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name} ({contact.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Input
                value={newLead.source}
                onChange={(e) =>
                  setNewLead({ ...newLead, source: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={newLead.notes}
                onChange={(e) =>
                  setNewLead({ ...newLead, notes: e.target.value })
                }
              />
            </div>
            <Button
              onClick={() => addLeadMutation.mutate(newLead)}
              className="w-full"
              disabled={addLeadMutation.isPending}
            >
              {addLeadMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Lead
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Appointment Dialog */}
      <Dialog
        open={isAddAppointmentDialogOpen}
        onOpenChange={setIsAddAppointmentDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Appointment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={newAppointment.title}
                onChange={(e) =>
                  setNewAppointment({
                    ...newAppointment,
                    title: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={newAppointment.description}
                onChange={(e) =>
                  setNewAppointment({
                    ...newAppointment,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Date & Time</Label>
              <Input
                type="datetime-local"
                value={newAppointment.appointmentTime}
                onChange={(e) =>
                  setNewAppointment({
                    ...newAppointment,
                    appointmentTime: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={newAppointment.status}
                onValueChange={(value) =>
                  setNewAppointment({
                    ...newAppointment,
                    status: value as AppointmentStatus,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AppointmentStatus.SCHEDULED}>
                    Scheduled
                  </SelectItem>
                  <SelectItem value={AppointmentStatus.COMPLETED}>
                    Completed
                  </SelectItem>
                  <SelectItem value={AppointmentStatus.CANCELLED}>
                    Cancelled
                  </SelectItem>
                  <SelectItem value={AppointmentStatus.NO_SHOW}>
                    No Show
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => addAppointmentMutation.mutate(newAppointment)}
              className="w-full"
              disabled={addAppointmentMutation.isPending}
            >
              {addAppointmentMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Appointment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 