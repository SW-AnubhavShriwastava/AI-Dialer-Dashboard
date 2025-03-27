'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { AddEmployeeDialog } from './components/add-employee-dialog'
import { EmployeeList } from './components/employee-list'

export default function MyTeamPage() {
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false)

  useEffect(() => {
    const handleAddEmployee = () => setIsAddEmployeeOpen(true)
    window.document.addEventListener('add-employee', handleAddEmployee)
    return () => window.document.removeEventListener('add-employee', handleAddEmployee)
  }, [])

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Team</h1>
          <p className="text-muted-foreground">
            Manage your team members and their permissions.
          </p>
        </div>
        <Button onClick={() => setIsAddEmployeeOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <EmployeeList />

      <AddEmployeeDialog
        open={isAddEmployeeOpen}
        onOpenChange={setIsAddEmployeeOpen}
      />
    </div>
  )
} 