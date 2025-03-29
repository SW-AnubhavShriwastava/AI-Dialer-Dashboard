import { ShieldOff } from 'lucide-react'

interface NoAccessProps {
  title?: string
  message?: string
}

export function NoAccess({ 
  title = "No Access",
  message = "You don't have permission to access this resource. Please contact your administrator if you believe this is a mistake."
}: NoAccessProps) {
  return (
    <div className="flex h-[70vh] flex-col items-center justify-center text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <ShieldOff className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="mt-6 text-xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  )
} 