'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { MoreHorizontal, Plus, Phone, Calendar } from 'lucide-react'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CampaignStatus, ContactStatus } from '@prisma/client'
import { useToast } from '@/components/ui/use-toast'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { CampaignDashboard } from './components/campaign-dashboard'
import { CampaignContacts } from './components/campaign-contacts'
import { CampaignCallLogs } from './components/campaign-call-logs'
import { CampaignLeads } from './components/campaign-leads'
import { CampaignCalendar } from './components/campaign-calendar'

interface Contact {
  id: string
  name: string
  phone: string
  email: string | null
  campaigns: {
    status: ContactStatus
    lastCalled: string | null
    callAttempts: number
  }[]
}

interface Campaign {
  id: string
  name: string
  description: string | null
  status: CampaignStatus
  startDate: string | null
  endDate: string | null
  createdAt: string
  contacts: Contact[]
}

export default function CampaignDetailsPage() {
  const params = useParams()
  const campaignId = params.id as string
  const [isAddContactDialogOpen, setIsAddContactDialogOpen] = useState(false)
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    email: '',
  })
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch campaign details
  const { data: campaign, isLoading } = useQuery<Campaign>({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const response = await fetch(`/api/campaigns/${campaignId}`)
      if (!response.ok) throw new Error('Failed to fetch campaign')
      return response.json()
    },
  })

  // Update campaign status
  const updateStatusMutation = useMutation({
    mutationFn: async (status: CampaignStatus) => {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error('Failed to update campaign status')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] })
      toast({
        title: 'Success',
        description: 'Campaign status updated successfully',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update campaign status',
        variant: 'destructive',
      })
    },
  })

  // Add contact to campaign
  const addContactMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/campaigns/${campaignId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact),
      })
      if (!response.ok) throw new Error('Failed to add contact')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] })
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

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-lg text-gray-500">Campaign not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      {/* Campaign Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{campaign.name}</h1>
            <p className="text-gray-500 mt-1">{campaign.description}</p>
          </div>
          <Badge
            variant={
              campaign.status === CampaignStatus.ACTIVE
                ? 'default'
                : campaign.status === CampaignStatus.PAUSED
                ? 'secondary'
                : 'outline'
            }
          >
            {campaign.status}
          </Badge>
        </div>
        <div className="mt-4 flex gap-4 text-sm text-gray-500">
          <div>
            <span className="font-medium">Start Date:</span>{' '}
            {campaign.startDate
              ? format(new Date(campaign.startDate), 'PPP')
              : 'Not set'}
          </div>
          <div>
            <span className="font-medium">End Date:</span>{' '}
            {campaign.endDate
              ? format(new Date(campaign.endDate), 'PPP')
              : 'Not set'}
          </div>
          <div>
            <span className="font-medium">Created:</span>{' '}
            {format(new Date(campaign.createdAt), 'PPP')}
          </div>
          <div>
            <span className="font-medium">Contacts:</span>{' '}
            {campaign.contacts.length}
          </div>
        </div>
      </div>

      {/* Campaign Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="call-logs">Call Logs</TabsTrigger>
          <TabsTrigger value="leads">Leads & Appointments</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <CampaignDashboard campaignId={campaignId} />
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <CampaignContacts campaignId={campaignId} />
        </TabsContent>

        <TabsContent value="call-logs" className="space-y-4">
          <CampaignCallLogs campaignId={campaignId} />
        </TabsContent>

        <TabsContent value="leads" className="space-y-4">
          <CampaignLeads campaignId={campaignId} />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <CampaignCalendar campaignId={campaignId} />
        </TabsContent>
      </Tabs>
    </div>
  )
} 