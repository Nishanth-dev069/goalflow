import React from 'react'
import { SkeletonGoalCard } from '@/components/shared/SkeletonCard'

export default function GoalsLoading() {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1,2,3,4,5,6].map(i => <SkeletonGoalCard key={i} />)}
      </div>
    </div>
  )
}
