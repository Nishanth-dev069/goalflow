'use client'

import React, { useState } from 'react'
import { TaskComment, User } from '@/types'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function TaskComments({ taskId, currentUser }: { taskId: string, currentUser: User }) {
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['task_comments', taskId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}/comments`)
      if (!res.ok) throw new Error('Failed to fetch comments')
      const json = await res.json()
      return json.data as (TaskComment & { user: User })[]
    }
  })

  const postMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text })
      })
      if (!res.ok) throw new Error('Failed to post comment')
      return res.json()
    },
    onMutate: async (text) => {
      await queryClient.cancelQueries({ queryKey: ['task_comments', taskId] })
      const prev = queryClient.getQueryData(['task_comments', taskId])
      
      const optimisticComment = {
        id: 'temp-' + Date.now(),
        task_id: taskId,
        user_id: currentUser.id,
        content: text,
        created_at: new Date().toISOString(),
        user: currentUser
      }
      
      queryClient.setQueryData(['task_comments', taskId], (old: any) => {
        return [...(old || []), optimisticComment]
      })
      
      setContent('')
      return { prev }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_comments', taskId] })
    },
    onError: (err, variables, context) => {
      if (context?.prev) queryClient.setQueryData(['task_comments', taskId], context.prev)
      setContent(variables)
      toast.error(err.message)
    }
  })

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!content.trim()) return
    postMutation.mutate(content.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit()
    }
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-widest">
          Comments ({comments.length})
        </h3>
      </div>

      <div className="space-y-6 mb-6">
        {isLoading ? (
          <div className="flex justify-center"><Loader2 className="animate-spin text-neutral-600" /></div>
        ) : comments.length === 0 ? (
          <div className="text-sm text-neutral-600 py-4 italic">No comments yet.</div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="flex items-start gap-4">
              <UserAvatar user={comment.user} className="w-8 h-8" />
              <div className="flex-1 bg-[#111111] border border-[#2a2a2a] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-white">{comment.user?.full_name}</span>
                  <span className="text-xs text-neutral-600">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                <div className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="flex items-start gap-4">
        <UserAvatar user={currentUser} className="w-8 h-8" />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a comment... (Cmd/Ctrl + Enter to send)"
            className="w-full bg-[#111111] border border-[#2a2a2a] rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none transition-colors min-h-[80px] resize-y"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || postMutation.isPending}
              className="bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#3a3a3a] disabled:opacity-50 disabled:cursor-not-allowed text-white h-8 px-4 text-xs font-medium rounded-lg transition-colors flex items-center"
            >
              {postMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Comment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
