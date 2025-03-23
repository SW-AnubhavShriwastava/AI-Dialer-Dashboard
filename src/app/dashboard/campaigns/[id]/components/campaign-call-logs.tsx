'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Search, Loader2, Sparkles, Phone, Calendar, ArrowUpDown, PhoneCallIcon } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

type SortField = 'name' | 'status' | 'duration' | 'startTime'
type SortOrder = 'asc' | 'desc'

interface CampaignCallLogsProps {
  campaignId: string
}

function EmptyState() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        <PhoneCallIcon className="h-10 w-10 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No call logs</h3>
        <p className="mb-4 mt-2 text-sm text-muted-foreground">
          There are no call logs for this campaign yet. Start making calls to see them here.
        </p>
      </div>
    </div>
  )
}

export function CampaignCallLogs({ campaignId }: CampaignCallLogsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedCallLog, setSelectedCallLog] = useState<CallLog | null>(null)
  const [sortField, setSortField] = useState<SortField>('startTime')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
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

  // Sort function
  const sortCallLogs = (a: CallLog, b: CallLog) => {
    switch (sortField) {
      case 'name':
        return sortOrder === 'asc'
          ? a.contact.name.localeCompare(b.contact.name)
          : b.contact.name.localeCompare(a.contact.name)
      case 'status':
        return sortOrder === 'asc'
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status)
      case 'duration':
        return sortOrder === 'asc'
          ? a.duration - b.duration
          : b.duration - a.duration
      case 'startTime':
        return sortOrder === 'asc'
          ? new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          : new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      default:
        return 0
    }
  }

  // Handle sort click
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // Filter and sort call logs
  const filteredCallLogs = callLogs
    ?.filter((log) => {
      const matchesSearch =
        log.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.contact.phone.includes(searchQuery)
      const matchesStatus = statusFilter === 'all' || log.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort(sortCallLogs)

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

      {!callLogs?.length ? (
        <EmptyState />
      ) : !filteredCallLogs?.length ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <Search className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No results found</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              No call logs match your search criteria. Try adjusting your filters.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-2"
                  >
                    Contact
                    {sortField === 'name' && (
                      <ArrowUpDown className="h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-2"
                  >
                    Status
                    {sortField === 'status' && (
                      <ArrowUpDown className="h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('duration')}
                    className="flex items-center gap-2"
                  >
                    Duration
                    {sortField === 'duration' && (
                      <ArrowUpDown className="h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('startTime')}
                    className="flex items-center gap-2"
                  >
                    Date & Time
                    {sortField === 'startTime' && (
                      <ArrowUpDown className="h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
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
                      <DialogContent className="max-w-4xl h-[80vh]">
                        <DialogHeader>
                          <DialogTitle>Call Details</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="h-full pr-4">
                          <div className="space-y-6">
                            {/* Call Info */}
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

                            {/* Recording */}
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

                            {/* Transcript and Summary */}
                            <Tabs defaultValue="transcript" className="w-full">
                              <TabsList>
                                <TabsTrigger value="transcript">Transcript</TabsTrigger>
                                <TabsTrigger value="summary">AI Summary</TabsTrigger>
                              </TabsList>
                              <TabsContent value="transcript">
                                {log.transcript ? (
                                  <div className="rounded-lg border p-4 mt-2 bg-muted/50">
                                    <pre className="whitespace-pre-wrap font-mono text-sm">
                                      {log.transcript}
                                    </pre>
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    No transcript available
                                  </p>
                                )}
                              </TabsContent>
                              <TabsContent value="summary">
                                {log.summary ? (
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Summary</Label>
                                      <p className="text-sm mt-1">{log.summary}</p>
                                    </div>
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
                                          className="mt-1"
                                        >
                                          {log.sentiment}
                                        </Badge>
                                      </div>
                                    )}
                                    {log.nextAction && (
                                      <div>
                                        <Label>Next Action</Label>
                                        <p className="text-sm mt-1">{log.nextAction}</p>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-center py-4">
                                    <Button
                                      variant="outline"
                                      onClick={() => generateSummaryMutation.mutate(log.id)}
                                      disabled={generateSummaryMutation.isPending}
                                    >
                                      <Sparkles className="mr-2 h-4 w-4" />
                                      Generate AI Summary
                                    </Button>
                                  </div>
                                )}
                              </TabsContent>
                            </Tabs>
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
} 