import { useSession } from "next-auth/react"
import { UserRole } from "@prisma/client"

interface ContactPermissions {
  view: boolean
  create: boolean
  edit: boolean
  delete: boolean
  import: boolean
  export: boolean
  accessType: 'ALL' | 'ASSIGNED'
}

interface CampaignPermissions {
  view: boolean
  create: boolean
  edit: boolean
  delete: boolean
}

interface CallLogPermissions {
  view: boolean
  download: boolean
}

interface AISummaryPermissions {
  view: boolean
}

interface Permissions {
  contacts: ContactPermissions
  campaigns: CampaignPermissions
  callLogs: CallLogPermissions
  aiSummary: AISummaryPermissions
}

export function usePermissions() {
  const { data: session } = useSession()

  // Admins have all permissions
  if (session?.user?.role === UserRole.ADMIN) {
    return {
      contacts: {
        view: true,
        create: true,
        edit: true,
        delete: true,
        import: true,
        export: true,
        accessType: 'ALL' as const,
      },
      campaigns: {
        view: true,
        create: true,
        edit: true,
        delete: true,
      },
      callLogs: {
        view: true,
        download: true,
      },
      aiSummary: {
        view: true,
      },
    }
  }

  // Return employee permissions from their profile
  return session?.user?.employeeProfile?.permissions as Permissions || {
    contacts: {
      view: false,
      create: false,
      edit: false,
      delete: false,
      import: false,
      export: false,
      accessType: 'ASSIGNED' as const,
    },
    campaigns: {
      view: false,
      create: false,
      edit: false,
      delete: false,
    },
    callLogs: {
      view: false,
      download: false,
    },
    aiSummary: {
      view: false,
    },
  }
} 