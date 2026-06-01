'use client'

import React, { useState, useEffect } from 'react'
import { Search, Lock, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { TaskDependency, Task } from '@/types'
import { StatusBadge } from '@/components/shared/StatusBadge'
import Link from 'next/link'

export function TaskDependencies({ taskId, currentUser }: { taskId: string, currentUser: any }) {
  const [dependencies, setDependencies] = useState<TaskDependency[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])

  const canEdit = currentUser.role === 'admin' || currentUser.role === 'manager'

  const fetchDependencies = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/dependencies`)
      if (res.ok) {
        const json = await res.json()
        setDependencies(json.data)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDependencies()
  }, [taskId])

  const searchTasks = async (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }
    
    try {
      setIsSearching(true)
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=task`)
      if (res.ok) {
        const json = await res.json()
        setSearchResults(json.data.filter((t: any) => t.id !== taskId))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSearching(false)
    }
  }

  const addDependency = async (dependsOnId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/dependencies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depends_on_id: dependsOnId })
      })
      
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Failed to add dependency')
        return
      }

      const json = await res.json()
      setDependencies(prev => [json.data, ...prev])
      toast.success('Dependency added')
      setSearchQuery('')
      setSearchResults([])
    } catch (err) {
      toast.error('Failed to add dependency')
    }
  }

  const removeDependency = async (dependencyId: string) => {
    if (!confirm('Remove this dependency?')) return
    
    try {
      const res = await fetch(`/api/tasks/${taskId}/dependencies/${dependencyId}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        setDependencies(prev => prev.filter(d => d.id !== dependencyId))
        toast.success('Dependency removed')
      } else {
        toast.error('Failed to remove dependency')
      }
    } catch (err) {
      toast.error('Failed to remove dependency')
    }
  }

  if (isLoading) {
    return <div className="animate-pulse h-24 bg-[#111111] border border-[#2a2a2a] rounded-xl" />
  }

  return (
    <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Lock size={16} className="text-neutral-500" />
        <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-widest">Blocked By</h3>
      </div>
      
      {dependencies.length > 0 ? (
        <div className="space-y-2">
          {dependencies.map(dep => (
            <div key={dep.id} className="flex items-center justify-between bg-[#1a1a1a] border border-[#2a2a2a] p-3 rounded-lg group">
              <Link href={`/tasks/${dep.depends_on_id}`} className="flex-1 min-w-0 pr-3 hover:underline text-sm font-medium text-white truncate block">
                {dep.depends_on?.title}
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={dep.depends_on?.status as any} type="task" />
                {canEdit && (
                  <button 
                    onClick={() => removeDependency(dep.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-rose-400 transition-all"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-neutral-500 italic">No blockers.</p>
      )}

      {canEdit && (
        <div className="relative pt-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => searchTasks(e.target.value)}
              placeholder="Search task to add blocker..."
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-9 pl-9 pr-3 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
            />
          </div>
          
          {searchQuery.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl max-h-[200px] overflow-y-auto z-10">
              {isSearching ? (
                <div className="p-3 text-center text-neutral-500 text-xs">Searching...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((t: any) => (
                  <div
                    key={t.id}
                    onClick={() => addDependency(t.id)}
                    className="flex items-center justify-between p-3 hover:bg-[#2a2a2a] cursor-pointer transition-colors border-b border-[#2a2a2a] last:border-0"
                  >
                    <span className="text-sm text-white truncate pr-2">{t.title}</span>
                    <span className="text-xs text-neutral-500 bg-[#111111] px-1.5 py-0.5 rounded">Add</span>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-neutral-500 text-xs">No tasks found</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
