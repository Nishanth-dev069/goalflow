import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function WorkspaceLayout({ children, params }: { children: React.ReactNode, params: Promise<{ workspace: string }> }) {
  const { workspace } = await params
  
  if (workspace !== 'admin' && workspace !== 'manager') {
    redirect('/dashboard')
  }

  const supabase = await createClient()

  const { data: { user: sessionUser } } = await supabase.auth.getUser()
  const session = sessionUser ? { user: sessionUser } : null

  if (!session?.user) {
    redirect('/login')
  }

  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!user || user.role !== workspace) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
