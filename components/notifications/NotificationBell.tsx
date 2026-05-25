'use client'

import React, { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckSquare, MessageCircle, Target } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function NotificationBell({ userId }: { userId: string }) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const supabase = createClient()

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications')
      if (!res.ok) throw new Error('Failed to fetch notifications')
      const json = await res.json()
      return json.data || []
    },
    refetchInterval: 30000 // 30 seconds fallback
  })

  useEffect(() => {
    const channel = supabase.channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        toast('New Notification', { description: payload.new.title })
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, userId, queryClient])

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] })
      queryClient.setQueryData(['notifications'], (old: any) => 
        old?.map((n: any) => n.id === id ? { ...n, is_read: true } : n)
      )
    }
  })

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await fetch(`/api/notifications/read-all`, { method: 'PATCH' })
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] })
      queryClient.setQueryData(['notifications'], (old: any) => 
        old?.map((n: any) => ({ ...n, is_read: true }))
      )
    }
  })

  const handleNotificationClick = (notif: any) => {
    if (!notif.is_read) markReadMutation.mutate(notif.id)
    if (notif.entity_type === 'task') router.push(`/tasks/${notif.entity_id}`)
    else if (notif.entity_type === 'goal') router.push(`/goals/${notif.entity_id}`)
  }

  const unreadCount = notifications.filter((n: any) => !n.is_read).length

  return (
    <Popover>
      <PopoverTrigger className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#1a1a1a] transition-colors outline-none">
        <Bell size={16} className="text-neutral-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0 bg-[#111111] border-[#2a2a2a] overflow-hidden" align="end">
        <div className="flex items-center justify-between p-3 border-b border-[#2a2a2a]">
          <h3 className="text-sm font-semibold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <button 
              onClick={() => markAllReadMutation.mutate()}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-neutral-500">
              <Bell size={24} className="mb-2 opacity-50" />
              <span className="text-sm">No notifications</span>
            </div>
          ) : (
            notifications.map((notif: any) => (
              <div 
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 hover:bg-[#1a1a1a] cursor-pointer transition-colors border-b border-[#1a1a1a] last:border-0",
                  !notif.is_read && "bg-indigo-500/5"
                )}
              >
                <div className="mt-0.5">
                  {notif.type === 'task_assigned' ? <CheckSquare size={16} className="text-indigo-400" /> :
                   notif.type === 'task_commented' ? <MessageCircle size={16} className="text-sky-400" /> :
                   notif.type === 'goal_updated' ? <Target size={16} className="text-emerald-400" /> :
                   <Bell size={16} className="text-neutral-400" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium leading-snug">{notif.title}</p>
                  {notif.body && <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{notif.body}</p>}
                  <p className="text-[11px] text-neutral-600 mt-1">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                  </p>
                </div>

                {!notif.is_read && (
                  <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
