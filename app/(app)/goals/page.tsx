import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EmployeeGoalsView from '@/components/goals/EmployeeGoalsView'

export default async function GoalsMainPage() {
  const supabase = await createClient()
  const { data: { user: sessionUser } } = await supabase.auth.getUser()
  const session = sessionUser ? { user: sessionUser } : null

  if (!session) redirect('/login')

  const { data: user } = await supabase.from('users').select('role').eq('id', session.user.id).single()

  if (user?.role === 'employee') {
    return <EmployeeGoalsView />
  }

  // Admins and Managers use the powerful table view
  redirect(`/${user?.role}/goals`)
}
