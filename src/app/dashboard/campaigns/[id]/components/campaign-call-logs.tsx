'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { FileText, Disc, Phone } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EmptyState } from '@/components/empty-state'

interface CallLog {
  id: string
  callSid: string
  phoneNumber: string
  timestamp: string
  status: string
  duration: string
  hasRecording: boolean
  hasTranscript: boolean
}

interface Transcript {
  role: string
  content: string
  timestamp?: string
}

export function CampaignCallLogs() {
  const params = useParams()
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [selectedCallSid, setSelectedCallSid] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<Transcript[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCallLogs()
  }, [params.id])

  const fetchCallLogs = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/campaigns/${params.id}/call-logs`)
      if (!response.ok) throw new Error('Failed to fetch call logs')
      const data = await response.json()
      setCallLogs(data.callLogs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch call logs')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTranscript = async (callSid: string) => {
    try {
      const response = await fetch(`/api/campaigns/${params.id}/call-logs/${callSid}`)
      if (!response.ok) throw new Error('Failed to fetch transcript')
      const data = await response.json()
      setTranscript(data.transcript)
      setSelectedCallSid(callSid)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transcript')
    }
  }

  if (isLoading) return <div>Loading call logs...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="space-y-4">
      {callLogs.length === 0 ? (
        <EmptyState
          icon={Phone}
          title="No Call Logs Yet"
          description="Start making calls to see your call logs here."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phone Number</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {callLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{log.phoneNumber}</TableCell>
                <TableCell>
                  {format(new Date(log.timestamp), 'MMM d, yyyy h:mm a')}
                </TableCell>
                <TableCell>{log.status}</TableCell>
                <TableCell>{log.duration}</TableCell>
                <TableCell className="space-x-2">
                  {log.hasTranscript && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => fetchTranscript(log.callSid)}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  )}
                  {log.hasRecording && (
                    <Button variant="outline" size="icon">
                      <Disc className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!selectedCallSid} onOpenChange={() => setSelectedCallSid(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Call Transcript</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[500px] w-full rounded-md border p-4">
            <div className="space-y-4">
              {transcript.map((entry, index) => (
                <div
                  key={index}
                  className={`flex ${
                    entry.role === 'assistant' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      entry.role === 'assistant'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{entry.content}</p>
                    {entry.timestamp && (
                      <p className="mt-1 text-xs opacity-70">
                        {format(new Date(entry.timestamp), 'h:mm a')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
} 