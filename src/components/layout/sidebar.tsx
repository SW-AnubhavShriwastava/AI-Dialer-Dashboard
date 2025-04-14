'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  LayoutDashboard,
  Phone,
  Users,
  Calendar,
  Settings,
  UserCog,
} from 'lucide-react'
import { UserRole } from '@prisma/client'

interface SidebarItem {
  title: string
  href: string
  icon: React.ElementType
  roles?: UserRole[]
}

const sidebarItems: SidebarItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: [UserRole.ADMIN, UserRole.EMPLOYEE],
  },
  {
    title: 'Campaigns',
    href: '/dashboard/campaigns',
    icon: Phone,
    roles: [UserRole.ADMIN, UserRole.EMPLOYEE],
  },
  {
    title: 'Contacts',
    href: '/dashboard/contacts',
    icon: Users,
    roles: [UserRole.ADMIN, UserRole.EMPLOYEE],
  },
  {
    title: 'Calendar',
    href: '/dashboard/calendar',
    icon: Calendar,
    roles: [UserRole.ADMIN, UserRole.EMPLOYEE],
  },
  {
    title: 'My Team',
    href: '/dashboard/my-team',
    icon: UserCog,
    roles: [UserRole.ADMIN],
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    roles: [UserRole.ADMIN],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = session?.user?.role as UserRole

  // Show all items that are either public (no roles) or match the user's role
  const visibleItems = sidebarItems.filter(
    (item) => !item.roles || (userRole && item.roles.includes(userRole))
  )

  return (
    <div className="h-full py-6">
      <ScrollArea>
        <div className="h-full">
          <nav className="space-y-1 px-3">
            <div className="mb-8 px-3">
              <h2 className="text-xl font-bold">SNB Connect</h2>
            </div>
            {visibleItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-secondary text-secondary-foreground'
                      : 'hover:bg-secondary/50'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              )
            })}
          </nav>
        </div>
      </ScrollArea>
    </div>
  )
} 