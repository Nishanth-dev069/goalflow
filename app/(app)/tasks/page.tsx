import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EmployeeTasksView } from '@/components/tasks/EmployeeTasksView'

export default async function TasksMainPage() {
  const supabase = await createClient()
  const { data: { user: sessionUser } } = await supabase.auth.getUser()
  const session = sessionUser ? { user: sessionUser } : null

  if (!session) redirect('/login')

  const { data: user } = await supabase.from('users').select('role').eq('id', session.user.id).single()

  if (user?.role === 'employee') {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-8 min-h-screen">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">My Tasks</h1>
          <p className="text-neutral-400 mt-1">Manage and track your daily assignments.</p>
        </div>
        <EmployeeTasksView />
      </div>
    )
  }

  // Admins and Managers use the powerful table view
  redirect(`/${user?.role}/tasks`)
}
