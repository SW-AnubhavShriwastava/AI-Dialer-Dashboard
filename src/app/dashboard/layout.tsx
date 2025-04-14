'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Sidebar } from '@/components/layout/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Get the current page title from the pathname
  const getPageTitle = () => {
    const pathParts = pathname.split('/')
    const path = pathParts.pop()
    
    // If we're in a campaign details page
    if (pathParts.includes('campaigns') && path && path.length > 20) {
      return 'Campaign Details'
    }
    
    if (!path) return 'Dashboard'
    return path.charAt(0).toUpperCase() + path.slice(1)
  }

  return (
    <div className="flex h-screen">
      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="fixed left-4 top-4 z-40 lg:hidden inline-flex items-center justify-center whitespace-nowrap rounded-[6px] bg-[#111111] text-white hover:bg-[#333333] h-11 px-4 py-2 text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50"
          >
            <Menu className="h-6 w-6" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[240px] flex-col border-r">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        <header className="h-16 border-b bg-white flex items-center px-6">
          <h1 className="text-2xl font-semibold">
            {getPageTitle()}
          </h1>
        </header>
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
} 