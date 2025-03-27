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
import { toast } from 'sonner'
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { NoAccess } from './components/no-access'
import { useSession } from 'next-auth/react'
import type { Session } from 'next-auth'

interface AppUser {
  id: string
  email: string
  name: string
  isAdmin: boolean
  employeeProfile?: {
    id: string
    permissions: {
      campaigns?: {
        view: boolean
        create: boolean
        edit: boolean
        delete: boolean
      }
    }
  }
}

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

interface EditCampaignData {
  id: string
  name: string
  description: string
  startDate: string | null
  endDate: string | null
}

export default function CampaignsPage() {
  const { data: session } = useSession()
  const user = session?.user as AppUser | undefined
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    startDate: null as string | null,
    endDate: null as string | null,
  })
  const [editCampaign, setEditCampaign] = useState<EditCampaignData>({
    id: '',
    name: '',
    description: '',
    startDate: null,
    endDate: null,
  })

  // Fetch campaigns
  const { data: campaigns, isLoading, error } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const response = await fetch('/api/campaigns')
      if (!response.ok) {
        const error = await response.json()
        if (response.status === 403) {
          throw new Error('No permission to view campaigns')
        }
        throw new Error(error.error || 'Failed to fetch campaigns')
      }
      return response.json()
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  })

  // Check if user has campaign creation permission
  const canCreateCampaign = user?.isAdmin || 
    (user?.employeeProfile?.permissions?.campaigns?.create === true)

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (campaign: typeof newCampaign) => {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaign),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create campaign')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      setIsCreateDialogOpen(false)
      setNewCampaign({ name: '', description: '', startDate: null, endDate: null })
      toast.success('Campaign Created', {
        description: 'Your new campaign has been created successfully.'
      })
    },
    onError: (error) => {
      toast.error('Creation Failed', {
        description: error instanceof Error ? error.message : 'There was an error creating your campaign. Please try again.'
      })
    },
  })

  // Edit campaign mutation
  const editCampaignMutation = useMutation({
    mutationFn: async (campaign: EditCampaignData) => {
      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaign.name,
          description: campaign.description,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update campaign')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      setIsEditDialogOpen(false)
      setEditCampaign({ id: '', name: '', description: '', startDate: null, endDate: null })
      toast.success('Campaign Updated', {
        description: 'Your campaign has been updated successfully.'
      })
    },
    onError: (error) => {
      toast.error('Update Failed', {
        description: error instanceof Error ? error.message : 'There was an error updating your campaign. Please try again.'
      })
    },
  })

  // Delete campaign mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete campaign')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campaign Deleted', {
        description: 'The campaign has been deleted successfully.'
      })
    },
    onError: (error) => {
      toast.error('Deletion Failed', {
        description: error instanceof Error ? error.message : 'There was an error deleting the campaign. Please try again.'
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
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update campaign status')
      }
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Status Updated', {
        description: `Campaign has been ${status.toLowerCase()} successfully.`
      })
    },
    onError: (error) => {
      toast.error('Status Update Failed', {
        description: error instanceof Error ? error.message : 'There was an error updating the campaign status. Please try again.'
      })
    },
  })

  const handleCreateCampaign = () => {
    // Validate required fields
    if (!newCampaign.name.trim()) {
      toast.error('Missing Required Field', {
        description: 'Please enter a campaign name to continue.'
      })
      return
    }

    // Validate dates
    if (newCampaign.startDate && newCampaign.endDate) {
      const startDate = new Date(newCampaign.startDate)
      const endDate = new Date(newCampaign.endDate)
      if (endDate < startDate) {
        toast.error('Invalid Date Range', {
          description: 'End date must be after the start date.'
        })
        return
      }
    }

    createCampaignMutation.mutate(newCampaign)
  }

  const handleEditCampaign = () => {
    // Validate required fields
    if (!editCampaign.name.trim()) {
      toast.error('Missing Required Field', {
        description: 'Please enter a campaign name to continue.'
      })
      return
    }

    // Validate dates
    if (editCampaign.startDate && editCampaign.endDate) {
      const startDate = new Date(editCampaign.startDate)
      const endDate = new Date(editCampaign.endDate)
      if (endDate < startDate) {
        toast.error('Invalid Date Range', {
          description: 'End date must be after the start date.'
        })
        return
      }
    }

    editCampaignMutation.mutate(editCampaign)
  }

  const handleEditClick = (campaign: Campaign) => {
    setEditCampaign({
      id: campaign.id,
      name: campaign.name,
      description: campaign.description || '',
      startDate: campaign.startDate,
      endDate: campaign.endDate,
    })
    setIsEditDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Show no access component if permission error
  if (error instanceof Error && error.message === 'No permission to view campaigns') {
    return <NoAccess />
  }

  // Show error state for other errors
  if (error) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-center">
        <h2 className="text-xl font-semibold text-red-600">Something went wrong</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : 'Failed to load campaigns'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Campaigns</h1>
          <p className="text-sm text-muted-foreground">
            Manage your campaigns and track their progress.
          </p>
        </div>
        {canCreateCampaign && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Campaign</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <div className="relative">
                      <Input
                        id="start-date"
                        type="date"
                        value={newCampaign.startDate ? new Date(newCampaign.startDate).toISOString().split('T')[0] : ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewCampaign({
                            ...newCampaign,
                            startDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                          })
                        }
                        className={cn(
                          "pl-10",
                          !newCampaign.startDate && "text-muted-foreground"
                        )}
                      />
                      <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <div className="relative">
                      <Input
                        id="end-date"
                        type="date"
                        value={newCampaign.endDate ? new Date(newCampaign.endDate).toISOString().split('T')[0] : ''}
                        min={newCampaign.startDate ? new Date(newCampaign.startDate).toISOString().split('T')[0] : undefined}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewCampaign({
                            ...newCampaign,
                            endDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                          })
                        }
                        className={cn(
                          "pl-10",
                          !newCampaign.endDate && "text-muted-foreground"
                        )}
                      />
                      <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
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
        )}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editCampaign.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditCampaign({ ...editCampaign, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editCampaign.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setEditCampaign({
                    ...editCampaign,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-start-date">Start Date</Label>
                <div className="relative">
                  <Input
                    id="edit-start-date"
                    type="date"
                    value={editCampaign.startDate ? new Date(editCampaign.startDate).toISOString().split('T')[0] : ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditCampaign({
                        ...editCampaign,
                        startDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                      })
                    }
                    className={cn(
                      "pl-10",
                      !editCampaign.startDate && "text-muted-foreground"
                    )}
                  />
                  <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-end-date">End Date</Label>
                <div className="relative">
                  <Input
                    id="edit-end-date"
                    type="date"
                    value={editCampaign.endDate ? new Date(editCampaign.endDate).toISOString().split('T')[0] : ''}
                    min={editCampaign.startDate ? new Date(editCampaign.startDate).toISOString().split('T')[0] : undefined}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditCampaign({
                        ...editCampaign,
                        endDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                      })
                    }
                    className={cn(
                      "pl-10",
                      !editCampaign.endDate && "text-muted-foreground"
                    )}
                  />
                  <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
            <Button
              onClick={handleEditCampaign}
              className="w-full"
              disabled={editCampaignMutation.isPending}
            >
              {editCampaignMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {!campaigns?.length ? (
          <div className="col-span-full flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <FolderPlus className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="mt-6 text-xl font-semibold">No campaigns created</h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {canCreateCampaign 
                ? "You haven't created any campaigns yet. Start by creating your first campaign."
                : "No campaigns available. Contact your administrator to create campaigns."}
            </p>
            {canCreateCampaign && (
              <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-6">
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            )}
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
                    <div className="min-h-[60px]">
                      <CardTitle>{campaign.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1 min-h-[20px]">
                        {campaign.description || "No description provided"}
                      </p>
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
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault()
                            handleEditClick(campaign)
                          }}
                        >
                          Edit Campaign
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