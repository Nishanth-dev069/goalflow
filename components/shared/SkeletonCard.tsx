import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export function SkeletonGoalCard() {
  return (
    <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-16 bg-[#1a1a1a]" />
        <Skeleton className="h-4 w-12 bg-[#1a1a1a]" />
      </div>
      <Skeleton className="h-5 w-3/4 bg-[#1a1a1a]" />
      <Skeleton className="h-3 w-full bg-[#1a1a1a]" />
      <Skeleton className="h-1.5 w-full bg-[#1a1a1a] rounded-full" />
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-3 w-24 bg-[#1a1a1a]" />
        <Skeleton className="h-5 w-16 bg-[#1a1a1a] rounded-full" />
      </div>
    </div>
  )
}

export function SkeletonTaskRow() {
  return (
    <div className="flex items-center gap-3 py-3 px-2">
      <Skeleton className="w-5 h-5 rounded-full bg-[#1a1a1a] flex-shrink-0" />
      <Skeleton className="h-4 flex-1 bg-[#1a1a1a]" />
      <Skeleton className="h-5 w-14 bg-[#1a1a1a] rounded-md" />
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-6">
          <Skeleton className="h-5 w-32 bg-[#1a1a1a] mb-4" />
          {[1,2,3].map(i => <SkeletonTaskRow key={i} />)}
        </div>
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-6">
          <Skeleton className="h-5 w-28 bg-[#1a1a1a] mb-4" />
          {[1,2,3,4].map(i => (
            <div key={i} className="flex items-start gap-3 pb-4">
              <Skeleton className="w-2 h-2 rounded-full bg-[#1a1a1a] mt-1.5" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-3/4 bg-[#1a1a1a]" />
                <Skeleton className="h-3 w-16 bg-[#1a1a1a]" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="lg:col-span-2 space-y-6">
        {[1,2,3].map(i => <SkeletonGoalCard key={i} />)}
      </div>
    </div>
  )
}
