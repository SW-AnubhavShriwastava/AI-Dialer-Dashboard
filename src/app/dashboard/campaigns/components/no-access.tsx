import { ShieldOff } from 'lucide-react'

export function NoAccess() {
  return (
    <div className="flex h-[70vh] flex-col items-center justify-center text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <ShieldOff className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="mt-6 text-xl font-semibold">No Access to Campaigns</h2>
      <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
        You don't have permission to view campaigns. Please contact your administrator if you believe this is a mistake.
      </p>
    </div>
  )
} 