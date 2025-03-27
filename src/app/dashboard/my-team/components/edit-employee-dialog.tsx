import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const editEmployeeFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  permissions: z.object({
    contacts: z.object({
      view: z.boolean(),
      create: z.boolean(),
      edit: z.boolean(),
      delete: z.boolean(),
      import: z.boolean(),
      export: z.boolean(),
      accessType: z.enum(['ALL', 'ASSIGNED']),
    }),
    campaigns: z.object({
      view: z.boolean(),
      create: z.boolean(),
      edit: z.boolean(),
      delete: z.boolean(),
    }),
    callLogs: z.object({
      view: z.boolean(),
      download: z.boolean(),
    }),
    aiSummary: z.object({
      view: z.boolean(),
    }),
  }),
})

type EditEmployeeFormValues = z.infer<typeof editEmployeeFormSchema>

interface EditEmployeeDialogProps {
  employee: {
    id: string
    name: string
    email: string
    permissions: EditEmployeeFormValues['permissions']
  }
  trigger: React.ReactNode
}

type PermissionSections = {
  contacts: ('view' | 'create' | 'edit' | 'delete' | 'import' | 'export')[]
  campaigns: ('view' | 'create' | 'edit' | 'delete')[]
  callLogs: ('view' | 'download')[]
  aiSummary: ('view')[]
}

const permissionSections: PermissionSections = {
  contacts: ['view', 'create', 'edit', 'delete', 'import', 'export'],
  campaigns: ['view', 'create', 'edit', 'delete'],
  callLogs: ['view', 'download'],
  aiSummary: ['view'],
}

export function EditEmployeeDialog({ employee, trigger }: EditEmployeeDialogProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<EditEmployeeFormValues>({
    resolver: zodResolver(editEmployeeFormSchema),
    defaultValues: {
      name: employee.name,
      email: employee.email,
      permissions: employee.permissions,
    },
  })

  const updateEmployee = useMutation({
    mutationFn: async (values: EditEmployeeFormValues) => {
      const response = await fetch(`/api/team/employees/${employee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update employee')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Employee updated successfully')
      setOpen(false)
      form.reset()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  function onSubmit(values: EditEmployeeFormValues) {
    updateEmployee.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h3 className="font-medium">Permissions</h3>
              
              {/* Contacts Permissions */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Contacts</h4>
                <FormField
                  control={form.control}
                  name="permissions.contacts.accessType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select access type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ALL">All Contacts</SelectItem>
                          <SelectItem value="ASSIGNED">Assigned Contacts Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-2">
                  {permissionSections.contacts.map((permission) => (
                    <FormField
                      key={permission}
                      control={form.control}
                      name={`permissions.contacts.${permission}` as const}
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="capitalize">{permission}</FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Campaigns Permissions */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Campaigns</h4>
                <div className="grid grid-cols-2 gap-2">
                  {permissionSections.campaigns.map((permission) => (
                    <FormField
                      key={permission}
                      control={form.control}
                      name={`permissions.campaigns.${permission}` as const}
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="capitalize">{permission}</FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Call Logs Permissions */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Call Logs</h4>
                <div className="grid grid-cols-2 gap-2">
                  {permissionSections.callLogs.map((permission) => (
                    <FormField
                      key={permission}
                      control={form.control}
                      name={`permissions.callLogs.${permission}` as const}
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="capitalize">{permission}</FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* AI Summary Permissions */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">AI Summary</h4>
                <div className="grid grid-cols-2 gap-2">
                  {permissionSections.aiSummary.map((permission) => (
                    <FormField
                      key={permission}
                      control={form.control}
                      name={`permissions.aiSummary.${permission}` as const}
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>View</FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateEmployee.isPending}>
                {updateEmployee.isPending ? 'Updating...' : 'Update Employee'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 