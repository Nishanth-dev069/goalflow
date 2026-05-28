import React from 'react'
import { SkeletonTaskRow } from '@/components/shared/SkeletonCard'
import { Skeleton } from '@/components/ui/skeleton'

export default function TasksLoading() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Skeleton className="h-8 w-48 bg-[#1a1a1a]" />
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-6">
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => <SkeletonTaskRow key={i} />)}
        </div>
      </div>
    </div>
  )
}
