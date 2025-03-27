'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PlusIcon } from '@radix-ui/react-icons'
import { AddEmployeeDialog } from './components/add-employee-dialog'
import { EmployeeList } from './components/employee-list'
import { Skeleton } from '@/components/ui/skeleton'

export default function MyTeamPage() {
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false)

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Team</h1>
          <p className="text-sm text-muted-foreground">
            Manage your team members and their permissions.
          </p>
        </div>
        <Button onClick={() => setIsAddEmployeeOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <EmployeeList onAddEmployee={() => setIsAddEmployeeOpen(true)} />

      <AddEmployeeDialog 
        open={isAddEmployeeOpen} 
        onOpenChange={setIsAddEmployeeOpen} 
      />
    </div>
  )
} 