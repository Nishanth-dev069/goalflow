import React from 'react'
import { SkeletonDashboard } from '@/components/shared/SkeletonCard'

export default function DashboardLoading() {
  return (
    <div className="p-6">
      <SkeletonDashboard />
    </div>
  )
}
