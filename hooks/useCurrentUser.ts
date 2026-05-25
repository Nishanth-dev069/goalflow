'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { User, Department } from '@/types'

type CurrentUserResponse = User & { department: Department | null }

export function useCurrentUser() {
  const supabase = createClient()

  const { data: user, isLoading, error } = useQuery<CurrentUserResponse | null>({
    queryKey: ['current_user'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return null

      const { data, error } = await supabase
        .from('users')
        .select('*, department:departments!users_department_id_fkey(*)')
        .eq('id', session.user.id)
        .single()

      if (error || !data) return null
      return data as unknown as CurrentUserResponse
    },
  })

  return {
    user,
    isLoading,
    error,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager',
  }
}
