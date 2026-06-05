import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EmployeeTasksView } from '@/components/tasks/EmployeeTasksView'
import Link from 'next/link'

export default async function TasksMainPage() {
  const supabase = await createClient()
  const { data: { user: sessionUser } } = await supabase.auth.getUser()
  const session = sessionUser ? { user: sessionUser } : null

  if (!session) redirect('/login')

  const { data: user } = await supabase.from('users').select('role').eq('id', session.user.id).single()

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">My Tasks</h1>
          <p className="text-neutral-400 mt-1">Manage and track your daily assignments.</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <Link 
            href={`/${user.role}/tasks`}
            className="inline-flex items-center justify-center h-10 px-4 bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-[#3a3a3a] hover:border-[#4a4a4a] text-white rounded-lg text-sm font-medium transition-colors"
          >
            Manage Tasks
          </Link>
        )}
      </div>
      <EmployeeTasksView />
    </div>
  )
}
