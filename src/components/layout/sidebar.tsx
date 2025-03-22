'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  LayoutDashboard,
  Phone,
  Users,
  Calendar,
  BarChart,
  Settings,
} from 'lucide-react'

interface SidebarItem {
  title: string
  href: string
  icon: React.ComponentType
}

const sidebarItems: SidebarItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Campaigns',
    href: '/dashboard/campaigns',
    icon: Phone,
  },
  {
    title: 'Contacts',
    href: '/dashboard/contacts',
    icon: Users,
  },
  {
    title: 'Calendar',
    href: '/dashboard/calendar',
    icon: Calendar,
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="h-full py-6">
      <ScrollArea>
        <div className="h-full">
          <nav className="space-y-1 px-3">
            <div className="mb-8 px-3">
              <h2 className="text-xl font-bold">AI Dialer</h2>
            </div>
            {sidebarItems.map((item) => {
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