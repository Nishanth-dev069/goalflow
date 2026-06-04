'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { CheckSquare, Target, User as UserIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface Props {
  open: boolean
  setOpen: (open: boolean) => void
  query: string
  setQuery: (query: string) => void
}

export function CommandSearch({ open, setOpen, query, setQuery }: Props) {
  const router = useRouter()
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${debouncedQuery}`)
      const json = await res.json()
      return json.data
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000
  })

  const { tasks = [], goals = [], users = [] } = data || {}

  const onSelect = (path: string) => {
    setOpen(false)
    router.push(path)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder="Search tasks, goals, people..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading && debouncedQuery.length >= 2 && (
          <div className="flex items-center justify-center p-4 text-sm text-neutral-500">
            <Loader2 className="animate-spin mr-2" size={16} /> Searching...
          </div>
        )}
        
        {!isLoading && debouncedQuery.length >= 2 && tasks.length === 0 && goals.length === 0 && users.length === 0 && (
          <CommandEmpty>No results found for "{debouncedQuery}".</CommandEmpty>
        )}

        {tasks.length > 0 && (
          <CommandGroup heading="Tasks">
            {tasks.map((task: any) => (
              <CommandItem key={`task-${task.id}`} onSelect={() => onSelect(`/tasks/${task.id}`)}>
                <CheckSquare className="mr-2 h-4 w-4 text-indigo-400" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{task.title}</span>
                  <span className="text-xs text-neutral-500">
                    {task.status.replace('_', ' ')} {task.due_date && ` Â· Due ${format(new Date(task.due_date), 'MMM d')}`}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {goals.length > 0 && (
          <CommandGroup heading="Goals">
            {goals.map((goal: any) => (
              <CommandItem key={`goal-${goal.id}`} onSelect={() => onSelect(`/goals/${goal.id}`)}>
                <Target className="mr-2 h-4 w-4 text-emerald-400" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{goal.title}</span>
                  <span className="text-xs text-neutral-500">{goal.status}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {users.length > 0 && (
          <CommandGroup heading="People">
            {users.map((user: any) => (
              <CommandItem key={`user-${user.id}`} onSelect={() => {
                const isManager = typeof window !== 'undefined' && window.location.pathname.startsWith('/manager')
                onSelect(isManager ? '/manager/users' : '/admin/users')
              }}>
                <UserIcon className="mr-2 h-4 w-4 text-neutral-400" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user.full_name}</span>
                  <span className="text-xs text-neutral-500">{user.email}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
      <div className="py-2 text-center text-xs text-neutral-600 border-t border-[#1a1a1a]">
        <kbd className="font-mono bg-[#1a1a1a] px-1 py-0.5 rounded mr-1 text-[10px]">â†‘â†“</kbd> navigate Â· 
        <kbd className="font-mono bg-[#1a1a1a] px-1 py-0.5 rounded mx-1 text-[10px]">â†µ</kbd> select Â· 
        <kbd className="font-mono bg-[#1a1a1a] px-1 py-0.5 rounded mx-1 text-[10px]">esc</kbd> close
      </div>
    </CommandDialog>
  )
}
