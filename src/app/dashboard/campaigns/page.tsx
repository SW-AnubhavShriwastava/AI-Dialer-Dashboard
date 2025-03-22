'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, MoreHorizontal, Loader2, Phone, Calendar, Users, Clock, FolderPlus } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CampaignStatus } from '@/types/prisma'
import { useToast } from '@/components/ui/use-toast'

interface Campaign {
  id: string
  name: string
  description: string | null
  status: CampaignStatus
  startDate: string | null
  endDate: string | null
  createdAt: string
  contacts: {
    id: string
    status: string
  }[]
  stats?: {
    totalCalls: number
    successRate: number
    appointmentsScheduled: number
  }
}

export default function CampaignsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
  })
  const { toast } = useToast()

  // Fetch campaigns
  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const response = await fetch('/api/campaigns')
      if (!response.ok) throw new Error('Failed to fetch campaigns')
      return response.json()
    },
  })

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (campaign: typeof newCampaign) => {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaign),
      })
      if (!response.ok) throw new Error('Failed to create campaign')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      setIsCreateDialogOpen(false)
      setNewCampaign({ name: '', description: '' })
      toast({
        title: 'Success',
        description: 'Campaign created successfully',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create campaign',
        variant: 'destructive',
      })
    },
  })

  // Delete campaign mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete campaign')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast({
        title: 'Success',
        description: 'Campaign deleted successfully',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete campaign',
        variant: 'destructive',
      })
    },
  })

  // Update campaign status mutation
  const updateCampaignStatusMutation = useMutation({
    mutationFn: async ({
      campaignId,
      status,
    }: {
      campaignId: string
      status: CampaignStatus
    }) => {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error('Failed to update campaign status')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
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

  const handleCreateCampaign = () => {
    if (!newCampaign.name.trim()) {
      toast({
        title: 'Error',
        description: 'Campaign name is required',
        variant: 'destructive',
      })
      return
    }
    createCampaignMutation.mutate(newCampaign)
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Campaigns</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newCampaign.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewCampaign({ ...newCampaign, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newCampaign.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setNewCampaign({
                      ...newCampaign,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <Button
                onClick={handleCreateCampaign}
                className="w-full"
                disabled={createCampaignMutation.isPending}
              >
                {createCampaignMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {!campaigns?.length ? (
          <div className="col-span-full flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <FolderPlus className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="mt-6 text-xl font-semibold">No campaigns created</h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              You haven't created any campaigns yet. Start by creating your first campaign.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-6">
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </div>
        ) : (
          campaigns?.map((campaign) => (
            <Link 
              key={campaign.id} 
              href={`/dashboard/campaigns/${campaign.id}`}
              className="block transition-all hover:scale-[1.02]"
            >
              <Card className="relative overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{campaign.name}</CardTitle>
                      {campaign.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {campaign.description}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault()
                            router.push(`/dashboard/campaigns/${campaign.id}`)
                          }}
                        >
                          View Details
                        </DropdownMenuItem>
                        {campaign.status === CampaignStatus.ACTIVE ? (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault()
                              updateCampaignStatusMutation.mutate({
                                campaignId: campaign.id,
                                status: CampaignStatus.PAUSED,
                              })
                            }}
                          >
                            Pause Campaign
                          </DropdownMenuItem>
                        ) : campaign.status === CampaignStatus.PAUSED ? (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault()
                              updateCampaignStatusMutation.mutate({
                                campaignId: campaign.id,
                                status: CampaignStatus.ACTIVE,
                              })
                            }}
                          >
                            Resume Campaign
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={(e) => {
                            e.preventDefault()
                            if (
                              window.confirm(
                                'Are you sure you want to delete this campaign?'
                              )
                            ) {
                              deleteCampaignMutation.mutate(campaign.id)
                            }
                          }}
                        >
                          Delete Campaign
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Badge
                    variant={
                      campaign.status === CampaignStatus.ACTIVE
                        ? 'default'
                        : campaign.status === CampaignStatus.PAUSED
                        ? 'secondary'
                        : 'outline'
                    }
                    className="absolute top-4 right-12"
                  >
                    {campaign.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{campaign.contacts.length} Contacts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{campaign.stats?.totalCalls || 0} Calls</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{campaign.stats?.appointmentsScheduled || 0} Appointments</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {campaign.startDate
                          ? format(new Date(campaign.startDate), 'MMM d, yyyy')
                          : 'Not started'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
} 