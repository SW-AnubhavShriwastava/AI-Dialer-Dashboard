import { UserRole, UserStatus } from "@prisma/client"
import "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    name: string
    email: string
    username: string
    role: UserRole
    status: UserStatus
    employeeProfile?: {
      id: string
      adminId: string
      permissions: {
        contacts: {
          view: boolean
          create: boolean
          edit: boolean
          delete: boolean
          import: boolean
          export: boolean
          accessType: 'ALL' | 'ASSIGNED'
        }
        campaigns: {
          view: boolean
          create: boolean
          edit: boolean
          delete: boolean
        }
        callLogs: {
          view: boolean
          download: boolean
        }
        aiSummary: {
          view: boolean
        }
      }
    }
  }

  interface Session {
    user: User
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    name: string
    username: string
  }
} 