'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, MoreVertical, Pencil, Trash2, UserPlus, Users } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface Employee {
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
  user: {
    id: string
    name: string
    email: string
    role: string
    status: string
    createdAt: string
  }
}

export function EmployeeList() {
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null)
  const queryClient = useQueryClient()

  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await fetch('/api/team/employees')
      if (!response.ok) throw new Error('Failed to fetch employees')
      return response.json()
    },
  })

  const deleteEmployee = useMutation({
    mutationFn: async (employeeId: string) => {
      const response = await fetch(`/api/team/employees/${employeeId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete employee')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Employee deleted successfully')
      setEmployeeToDelete(null)
    },
    onError: (error) => {
      toast.error('Failed to delete employee')
      console.error('Delete error:', error)
    },
  })

  const handleEdit = (employee: Employee) => {
    // Dispatch edit event to open dialog with employee data
    window.document.dispatchEvent(
      new CustomEvent('edit-employee', { detail: employee })
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!employees?.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex h-[400px] flex-col items-center justify-center gap-4 p-6">
          <div className="rounded-full bg-muted p-6">
            <Users className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">No team members yet</h3>
          <p className="text-center text-muted-foreground">
            Get started by adding your first team member. They'll be able to help manage contacts,
            campaigns, and more.
          </p>
          <Button onClick={() => window.document.dispatchEvent(new CustomEvent('add-employee'))}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add First Employee
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="rounded-md border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="w-[200px] font-semibold py-4 pl-6">Name</TableHead>
              <TableHead className="w-[250px] font-semibold py-4">Email</TableHead>
              <TableHead className="w-[100px] font-semibold py-4">Status</TableHead>
              <TableHead className="w-[120px] font-semibold py-4">Added</TableHead>
              <TableHead className="font-semibold py-4">Permissions</TableHead>
              <TableHead className="w-[50px] py-4 pr-6"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow 
                key={employee.id}
                className="group hover:bg-gray-50/50 transition-colors"
              >
                <TableCell className="font-medium py-4 pl-6">{employee.user.name}</TableCell>
                <TableCell className="text-gray-600 py-4">{employee.user.email}</TableCell>
                <TableCell className="py-4">
                  <Badge 
                    variant={employee.user.status === 'ACTIVE' ? 'default' : 'secondary'}
                    className={employee.user.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-700 hover:bg-green-100 hover:text-green-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-100 hover:text-gray-700'}
                  >
                    {employee.user.status.toLowerCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-600 py-4">
                  {format(new Date(employee.user.createdAt), 'MMM d, yyyy')}
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {employee.permissions.contacts.view && (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 hover:text-blue-700">
                        Contacts
                      </Badge>
                    )}
                    {employee.permissions.campaigns.view && (
                      <Badge variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-50 hover:text-purple-700">
                        Campaigns
                      </Badge>
                    )}
                    {employee.permissions.callLogs.view && (
                      <Badge variant="secondary" className="bg-orange-50 text-orange-700 hover:bg-orange-50 hover:text-orange-700">
                        Call Logs
                      </Badge>
                    )}
                    {employee.permissions.aiSummary.view && (
                      <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-50 hover:text-teal-700">
                        AI Summary
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-4 pr-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(employee)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => setEmployeeToDelete(employee)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!employeeToDelete} onOpenChange={() => setEmployeeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {employeeToDelete?.user.name}'s account and remove their access to the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => employeeToDelete && deleteEmployee.mutate(employeeToDelete.id)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 