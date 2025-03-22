'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface CampaignStats {
  totalContacts: number
  activeContacts: number
  totalCalls: number
  totalDuration: number
  averageCallDuration: number
  successRate: number
  appointmentsScheduled: number
  leadsGenerated: number
}

interface CampaignDashboardProps {
  campaignId: string
}

export function CampaignDashboard({ campaignId }: CampaignDashboardProps) {
  // Fetch campaign statistics
  const { data: stats, isLoading } = useQuery<CampaignStats>({
    queryKey: ['campaign-stats', campaignId],
    queryFn: async () => {
      const response = await fetch(`/api/campaigns/${campaignId}/stats`)
      if (!response.ok) throw new Error('Failed to fetch campaign stats')
      return response.json()
    },
  })

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-lg text-gray-500">No statistics available</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalContacts}</div>
          <p className="text-xs text-gray-500">
            {stats.activeContacts} active contacts
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalCalls}</div>
          <p className="text-xs text-gray-500">
            {Math.round(stats.averageCallDuration / 60)} min average duration
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.successRate}%</div>
          <p className="text-xs text-gray-500">
            {stats.totalDuration} minutes total duration
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Leads & Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.leadsGenerated}</div>
          <p className="text-xs text-gray-500">
            {stats.appointmentsScheduled} appointments scheduled
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 