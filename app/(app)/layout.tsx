import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientLayout } from '@/components/layout/ClientLayout'
import { NotificationPermissionBanner } from '@/components/pwa/NotificationPermissionBanner'
import { User, Department } from '@/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user: sessionUser } } = await supabase.auth.getUser()
  const session = sessionUser ? { user: sessionUser } : null

  if (!session?.user) {
    redirect('/login')
  }

  // Query 1: get user row (no join - always succeeds with basic RLS)
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (userError || !userData) {
    return (
      <ClientLayout user={null}>
        {children}
        <NotificationPermissionBanner />
      </ClientLayout>
    )
  }

  // Query 2: if department_id exists, get department separately
  let departmentData = null
  if (userData.department_id) {
    const { data: dept } = await supabase
      .from('departments')
      .select('*')
      .eq('id', userData.department_id)
      .single()
    departmentData = dept
  }

  const currentUser = { ...userData, department: departmentData } as unknown as User & { department: Department | null }

  return (
    <ClientLayout user={currentUser}>
      {children}
      <NotificationPermissionBanner />
    </ClientLayout>
  )
}
