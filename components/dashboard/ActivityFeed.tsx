'use client'

import React from 'react'
import Link from 'next/link'
import { ActivityLog } from '@/types'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { formatDistanceToNow } from 'date-fns'

function actionToReadable(action: string, entityTitle?: string | null) {
  const map: Record<string, string> = {
    goal_created: 'created a new goal',
    goal_updated: 'updated goal',
    goal_completed: 'completed goal',
    task_created: 'assigned a task',
    task_completed: 'completed task',
    task_updated: 'updated task',
    comment_added: 'commented on',
  }
  return map[action] || 'updated'
}

export function ActivityFeed({ initialData }: { initialData: ActivityLog[] }) {
  // We can useQuery here if we want it to refresh, but passing initialData + realtime invalidations handles it well.

  return (
    <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold text-white">Recent Activity</h2>
        {/* <Link href="/history" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">View all â†’</Link> */}
      </div>

      <div className="relative pl-2">
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-[#2a2a2a]" />
        
        {initialData.length === 0 ? (
          <div className="text-sm text-neutral-500 py-4 pl-4">No recent activity.</div>
        ) : (
          initialData.map((entry, idx) => {
            const isDone = entry.action.includes('completed')
            const isComment = entry.action.includes('comment')
            const dotColor = isDone ? 'bg-emerald-500' : isComment ? 'bg-sky-500' : 'bg-[#3a3a3a]'

            return (
              <div key={entry.id} className="flex items-start gap-4 pb-6 last:pb-0 relative">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 z-10 relative ml-[5px] ${dotColor} ring-4 ring-[#111111]`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-300 leading-snug">
                    <span className="font-medium text-white">{(entry as any).user?.full_name || 'Someone'}</span>{' '}
                    {actionToReadable(entry.action, entry.entity_title)}
                    {entry.entity_title && (
                      <span className="text-indigo-400 font-medium ml-1">
                        {entry.entity_title}
                      </span>
                    )}
                  </p>
                  <div className="text-xs text-neutral-600 mt-1">
                    {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
