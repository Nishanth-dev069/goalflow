import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Goal } from '@/types'

async function fetchGoals(params: { scope?: string, status?: string, page?: number }) {
  const url = new URL('/api/goals', window.location.origin)
  if (params.scope && params.scope !== 'all') url.searchParams.set('scope', params.scope)
  if (params.status && params.status !== 'all') url.searchParams.set('status', params.status)
  if (params.page) url.searchParams.set('page', params.page.toString())
  
  const res = await fetch(url.toString())
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to fetch goals')
  }
  return res.json()
}

export function useGoals(params: { scope?: string, status?: string, page?: number } = {}) {
  return useQuery({
    queryKey: ['goals', params],
    queryFn: () => fetchGoals(params),
  })
}

export function useGoal(id: string) {
  return useQuery({
    queryKey: ['goals', id],
    queryFn: async () => {
      const res = await fetch(`/api/goals/${id}`)
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch goal')
      }
      const json = await res.json()
      return json.data as Goal
    },
    enabled: !!id,
  })
}

export function useCreateGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create goal')
      }
      const json = await res.json()
      return json.data as Goal
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
  })
}

export function useUpdateGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update goal')
      }
      const json = await res.json()
      return json.data as Goal
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['goals', variables.id] })
    },
  })
}

export function useArchiveGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to archive goal')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
  })
}

export function usePrivateGoals(params: { status?: string, page?: number } = {}) {
  return useQuery({
    queryKey: ['private-goals', params],
    queryFn: async () => {
      const url = new URL('/api/goals/private', window.location.origin)
      if (params.status && params.status !== 'all') url.searchParams.set('status', params.status)
      if (params.page) url.searchParams.set('page', params.page.toString())
      
      const res = await fetch(url.toString())
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch private goals')
      }
      return res.json()
    },
  })
}

export function useCreatePrivateGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/goals/private', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create private goal')
      }
      const json = await res.json()
      return json.data as Goal
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['private-goals'] })
      // Dashboard might show stats, but usually private goals are separate
    },
  })
}
