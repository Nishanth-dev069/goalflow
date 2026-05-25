import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientLayout } from '@/components/layout/ClientLayout'
import { User, Department } from '@/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    redirect('/login')
  }

  // Fetch current user with their department
  const { data: userData, error } = await supabase
    .from('users')
    .select('*, department:departments!users_department_id_fkey(*)')
    .eq('id', session.user.id)
    .single()

  if (error || !userData) {
    // If user profile row is missing (e.g., trigger hasn't fired yet for new auth user),
    // pass null instead of redirecting — the layout handles null user gracefully
    return <ClientLayout user={null}>{children}</ClientLayout>
  }
  const user = userData as unknown as User & { department: Department | null }

  return <ClientLayout user={user}>{children}</ClientLayout>
}
