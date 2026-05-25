import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Department } from '@/types'

export const departmentKeys = {
  all: ['departments'] as const,
  lists: () => [...departmentKeys.all, 'list'] as const,
  details: () => [...departmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...departmentKeys.details(), id] as const,
}

// Extends Department with member_count
export type DepartmentWithStats = Department & {
  manager?: { id: string; full_name: string; avatar_url: string | null };
  member_count: number;
}

export function useDepartments() {
  return useQuery({
    queryKey: departmentKeys.lists(),
    queryFn: async () => {
      const res = await fetch('/api/departments')
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch departments')
      }
      const json = await res.json()
      return json.data as DepartmentWithStats[]
    }
  })
}

export function useCreateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create department')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all })
    }
  })
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const res = await fetch(`/api/departments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update department')
      }
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all })
      queryClient.invalidateQueries({ queryKey: departmentKeys.detail(variables.id) })
    }
  })
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/departments/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to deactivate department')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all })
    }
  })
}
