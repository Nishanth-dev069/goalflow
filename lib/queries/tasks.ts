import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Task } from '@/types'
import { useRouter } from 'next/navigation'

async function fetchTasks(params: { status?: string, priority?: string, department_id?: string, assigned_to?: string, page?: number }) {
  const url = new URL('/api/tasks', typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
  if (params.status && params.status !== 'all') url.searchParams.set('status', params.status)
  if (params.priority && params.priority !== 'all') url.searchParams.set('priority', params.priority)
  if (params.department_id) url.searchParams.set('department_id', params.department_id)
  if (params.assigned_to) url.searchParams.set('assigned_to', params.assigned_to)
  if (params.page) url.searchParams.set('page', params.page.toString())
  
  const res = await fetch(url.pathname + url.search, { cache: 'no-store' })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to fetch tasks')
  }
  return res.json()
}

export function useTasks(params: { status?: string, priority?: string, department_id?: string, assigned_to?: string, page?: number } = {}) {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => fetchTasks(params),
  })
}

import { useInfiniteQuery } from '@tanstack/react-query'

export function useInfiniteTasks(params: { status?: string, priority?: string, department_id?: string, assigned_to?: string } = {}) {
  return useInfiniteQuery({
    queryKey: ['tasks-infinite', params],
    queryFn: ({ pageParam = 1 }) => fetchTasks({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.has_more ? lastPage.page + 1 : undefined,
  })
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${id}`, { cache: 'no-store' })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch task')
      }
      const json = await res.json()
      return json.data as Task
    },
    enabled: !!id,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create task')
      }
      const json = await res.json()
      return json.data as Task
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tasks-infinite'] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update task')
      }
      const json = await res.json()
      return json.data as Task
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tasks-infinite'] })
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.id] })
    },
  })
}

// Custom bulk hook since the API doesn't have a single bulk endpoint, we do a Promise.all
export function useBulkUpdateTasks() {
  const queryClient = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: async ({ ids, data }: { ids: string[]; data: any }) => {
      const updates = ids.map(id => 
        fetch(`/api/tasks/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).then(res => {
          if (!res.ok) throw new Error(`Failed to update task ${id}`)
          return res.json()
        })
      )
      return Promise.all(updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
