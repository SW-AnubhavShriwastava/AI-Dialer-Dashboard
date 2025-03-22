'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Search, Loader2, Sparkles, Phone, Calendar } from 'lucide-react'
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

interface CallLog {
  id: string
  contact: {
    id: string
    name: string
    phone: string
  }
  duration: number
  status: 'COMPLETED' | 'MISSED' | 'FAILED'
  startTime: string
  endTime: string | null
  recordingUrl: string | null
  transcript: string | null
  summary: string | null
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | null
  nextAction: string | null
}

interface CampaignCallLogsProps {
  campaignId: string
}

export function CampaignCallLogs({ campaignId }: CampaignCallLogsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedCallLog, setSelectedCallLog] = useState<CallLog | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch call logs
  const { data: callLogs, isLoading } = useQuery<CallLog[]>({
    queryKey: ['campaign-call-logs', campaignId],
    queryFn: async () => {
      const response = await fetch(`/api/campaigns/${campaignId}/call-logs`)
      if (!response.ok) throw new Error('Failed to fetch call logs')
      return response.json()
    },
  })

  // Generate AI summary mutation
  const generateSummaryMutation = useMutation({
    mutationFn: async (callLogId: string) => {
      const response = await fetch(`/api/call-logs/${callLogId}/summary`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to generate summary')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-call-logs', campaignId] })
      toast({
        title: 'Success',
        description: 'AI summary generated successfully',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to generate AI summary',
        variant: 'destructive',
      })
    },
  })

  // Filter and sort call logs
  const filteredCallLogs = callLogs?.filter((log) => {
    const matchesSearch =
      log.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.contact.phone.includes(searchQuery)
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter
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
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="MISSED">Missed</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Call Logs Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCallLogs?.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium">{log.contact.name}</TableCell>
                <TableCell>{log.contact.phone}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      log.status === 'COMPLETED'
                        ? 'default'
                        : log.status === 'MISSED'
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {log.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {log.duration ? `${Math.round(log.duration / 60)}m ${log.duration % 60}s` : '-'}
                </TableCell>
                <TableCell>
                  {format(new Date(log.startTime), 'PPP p')}
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCallLog(log)}
                      >
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Call Details</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Contact</Label>
                            <p className="text-sm">{log.contact.name}</p>
                          </div>
                          <div>
                            <Label>Phone</Label>
                            <p className="text-sm">{log.contact.phone}</p>
                          </div>
                          <div>
                            <Label>Status</Label>
                            <Badge
                              variant={
                                log.status === 'COMPLETED'
                                  ? 'default'
                                  : log.status === 'MISSED'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                            >
                              {log.status}
                            </Badge>
                          </div>
                          <div>
                            <Label>Duration</Label>
                            <p className="text-sm">
                              {log.duration
                                ? `${Math.round(log.duration / 60)}m ${log.duration % 60}s`
                                : '-'}
                            </p>
                          </div>
                          <div>
                            <Label>Start Time</Label>
                            <p className="text-sm">
                              {format(new Date(log.startTime), 'PPP p')}
                            </p>
                          </div>
                          <div>
                            <Label>End Time</Label>
                            <p className="text-sm">
                              {log.endTime
                                ? format(new Date(log.endTime), 'PPP p')
                                : '-'}
                            </p>
                          </div>
                        </div>

                        {log.recordingUrl && (
                          <div>
                            <Label>Recording</Label>
                            <audio
                              controls
                              className="mt-2 w-full"
                              src={log.recordingUrl}
                            />
                          </div>
                        )}

                        {log.transcript && (
                          <div>
                            <Label>Transcript</Label>
                            <ScrollArea className="h-[200px] rounded-md border p-4">
                              <p className="text-sm">{log.transcript}</p>
                            </ScrollArea>
                          </div>
                        )}

                        {log.summary ? (
                          <div>
                            <Label>AI Summary</Label>
                            <ScrollArea className="h-[100px] rounded-md border p-4">
                              <p className="text-sm">{log.summary}</p>
                            </ScrollArea>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => generateSummaryMutation.mutate(log.id)}
                            disabled={generateSummaryMutation.isPending}
                          >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate AI Summary
                          </Button>
                        )}

                        {log.sentiment && (
                          <div>
                            <Label>Sentiment</Label>
                            <Badge
                              variant={
                                log.sentiment === 'POSITIVE'
                                  ? 'default'
                                  : log.sentiment === 'NEUTRAL'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                            >
                              {log.sentiment}
                            </Badge>
                          </div>
                        )}

                        {log.nextAction && (
                          <div>
                            <Label>Next Action</Label>
                            <p className="text-sm">{log.nextAction}</p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 