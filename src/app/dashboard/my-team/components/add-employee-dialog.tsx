'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const employeeFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  permissions: z.object({
    contacts: z.object({
      view: z.boolean(),
      create: z.boolean(),
      edit: z.boolean(),
      delete: z.boolean(),
      import: z.boolean(),
      export: z.boolean(),
      accessType: z.enum(['ALL', 'CAMPAIGN_ONLY']),
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

type EmployeeFormValues = z.infer<typeof employeeFormSchema>

const defaultPermissions = {
  contacts: {
    view: false,
    create: false,
    edit: false,
    delete: false,
    import: false,
    export: false,
    accessType: 'ALL' as const,
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

type PermissionKey = keyof typeof defaultPermissions.contacts | keyof typeof defaultPermissions.campaigns | keyof typeof defaultPermissions.callLogs | keyof typeof defaultPermissions.aiSummary

type PermissionPath = 
  | `permissions.contacts.${keyof typeof defaultPermissions.contacts}`
  | `permissions.campaigns.${keyof typeof defaultPermissions.campaigns}`
  | `permissions.callLogs.${keyof typeof defaultPermissions.callLogs}`
  | `permissions.aiSummary.${keyof typeof defaultPermissions.aiSummary}`

interface AddEmployeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddEmployeeDialog({ open, onOpenChange }: AddEmployeeDialogProps) {
  const [activeTab, setActiveTab] = useState('account')
  const queryClient = useQueryClient()

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      permissions: defaultPermissions,
    },
  })

  const createEmployee = useMutation({
    mutationFn: async (values: EmployeeFormValues) => {
      console.log('Submitting values:', values)
      const response = await fetch('/api/team/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!response.ok) {
        const error = await response.json()
        console.error('Server error:', error)
        throw new Error(error.error || error.message || 'Failed to create employee')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      onOpenChange(false)
      form.reset()
      toast.success('Employee created successfully')
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error)
      toast.error(error.message)
    },
  })

  function onSubmit(values: EmployeeFormValues) {
    console.log('Form values:', values)
    createEmployee.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Employee</DialogTitle>
          <DialogDescription>
            Create a new employee account and set their permissions.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="account">Account Details</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
              </TabsList>

              <TabsContent value="account" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter name" {...field} />
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
                        <Input placeholder="Enter email" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter password"
                          type="password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="permissions" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Contacts</h3>
                  <div className="grid gap-4">
                    <FormField
                      control={form.control}
                      name="permissions.contacts.accessType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Access Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select access type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ALL">All Contacts</SelectItem>
                              <SelectItem value="CAMPAIGN_ONLY">Campaign Contacts Only</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      {(Object.keys(defaultPermissions.contacts) as Array<keyof typeof defaultPermissions.contacts>)
                        .filter(key => key !== 'accessType')
                        .map((key) => {
                          const fieldName = `permissions.contacts.${key}` as PermissionPath
                          return (
                            <FormField
                              key={key}
                              control={form.control}
                              name={fieldName}
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value as boolean}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="!mt-0">
                                    {key.charAt(0).toUpperCase() + key.slice(1)}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          )
                        })}
                    </div>
                  </div>

                  <h3 className="text-lg font-medium">Campaigns</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {(Object.keys(defaultPermissions.campaigns) as Array<keyof typeof defaultPermissions.campaigns>).map((key) => {
                      const fieldName = `permissions.campaigns.${key}` as PermissionPath
                      return (
                        <FormField
                          key={key}
                          control={form.control}
                          name={fieldName}
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value as boolean}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="!mt-0">
                                {key.charAt(0).toUpperCase() + key.slice(1)}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      )
                    })}
                  </div>

                  <h3 className="text-lg font-medium">Call Logs</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {(Object.keys(defaultPermissions.callLogs) as Array<keyof typeof defaultPermissions.callLogs>).map((key) => {
                      const fieldName = `permissions.callLogs.${key}` as PermissionPath
                      return (
                        <FormField
                          key={key}
                          control={form.control}
                          name={fieldName}
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value as boolean}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="!mt-0">
                                {key.charAt(0).toUpperCase() + key.slice(1)}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      )
                    })}
                  </div>

                  <h3 className="text-lg font-medium">AI Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {(Object.keys(defaultPermissions.aiSummary) as Array<keyof typeof defaultPermissions.aiSummary>).map((key) => {
                      const fieldName = `permissions.aiSummary.${key}` as PermissionPath
                      return (
                        <FormField
                          key={key}
                          control={form.control}
                          name={fieldName}
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value as boolean}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="!mt-0">
                                {key.charAt(0).toUpperCase() + key.slice(1)}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      )
                    })}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createEmployee.isPending}>
                {createEmployee.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Employee
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 