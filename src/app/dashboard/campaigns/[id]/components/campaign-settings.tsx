import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

const DEFAULT_SYSTEM_MESSAGE = `You are an AI assistant making a phone call. Your role is to be professional, friendly, and helpful.
Key behaviors:
- Speak naturally and conversationally
- Listen carefully and respond appropriately
- Be polite and professional at all times
- Respect the caller's time and preferences
- Handle objections gracefully
- Take notes of important information`

const DEFAULT_INITIAL_MESSAGE = "Hello! This is an AI assistant calling. How are you today?"

interface CampaignSettings {
  settings: {
    systemMessage?: string
    initialMessage?: string
    [key: string]: any
  }
}

export function CampaignSettings({ campaignId }: { campaignId: string }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch campaign settings
  const { data: campaign, isLoading } = useQuery<CampaignSettings>({
    queryKey: ['campaign-settings', campaignId],
    queryFn: async () => {
      const response = await fetch(`/api/campaigns/${campaignId}`)
      if (!response.ok) throw new Error('Failed to fetch campaign settings')
      return response.json()
    },
  })

  // Update campaign settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: { systemMessage: string; initialMessage: string }) => {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            ...campaign?.settings,
            ...newSettings,
          },
          employeeAccess: 'ALL',
          selectedEmployees: [],
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update campaign settings')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-settings', campaignId] })
      toast({
        title: 'Success',
        description: 'Campaign settings updated successfully',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update campaign settings',
        variant: 'destructive',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const newSettings = {
      systemMessage: formData.get('systemMessage') as string || DEFAULT_SYSTEM_MESSAGE,
      initialMessage: formData.get('initialMessage') as string || DEFAULT_INITIAL_MESSAGE,
    }
    updateSettingsMutation.mutate(newSettings)
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const currentSettings = campaign?.settings || {}

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Campaign Settings</CardTitle>
          <CardDescription>
            Configure the AI system message and initial message for all calls in this campaign.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="systemMessage">System Message (AI Prompt)</Label>
              <Textarea
                id="systemMessage"
                name="systemMessage"
                placeholder={DEFAULT_SYSTEM_MESSAGE}
                defaultValue={currentSettings.systemMessage || DEFAULT_SYSTEM_MESSAGE}
                className="min-h-[150px] font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground">
                This is the prompt that guides the AI's behavior and responses during calls.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="initialMessage">Initial Message</Label>
              <Textarea
                id="initialMessage"
                name="initialMessage"
                placeholder={DEFAULT_INITIAL_MESSAGE}
                defaultValue={currentSettings.initialMessage || DEFAULT_INITIAL_MESSAGE}
                className="min-h-[100px]"
              />
              <p className="text-sm text-muted-foreground">
                This is the first message the AI will say when the call connects.
              </p>
            </div>

            <Button 
              type="submit" 
              disabled={updateSettingsMutation.isPending}
              className="w-full"
            >
              {updateSettingsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 