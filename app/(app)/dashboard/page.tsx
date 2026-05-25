import React, { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { TodaysTasks } from '@/components/dashboard/TodaysTasks'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { MyGoalsPanel } from '@/components/dashboard/MyGoalsPanel'
import { CompanyGoalsPanel } from '@/components/dashboard/CompanyGoalsPanel'
import { PrivateGoalsSection } from '@/components/goals/PrivateGoalsSection'
import { QuoteBanner } from '@/components/dashboard/QuoteBanner'

async function getDashboardData() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }

  // Fetch from the API using absolute URL and passing along cookies
  const headersList = await headers()
  const host = headersList.get('host')
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  
  const res = await fetch(`${protocol}://${host}/api/dashboard`, {
    headers: {
      cookie: headersList.get('cookie') || '',
    },
    cache: 'no-store'
  })

  if (!res.ok) {
    throw new Error('Failed to fetch dashboard data')
  }

  return res.json()
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <div className="p-6 max-w-[1400px] mx-auto min-h-screen pb-32">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
        <p className="text-neutral-400 mt-1">Here's what's happening with your goals and tasks today.</p>
      </div>

      <QuoteBanner stats={data.stats} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Tasks + Activity */}
        <div className="lg:col-span-3 space-y-6">
          <Suspense fallback={<div className="h-[400px] bg-[#111111] border border-[#2a2a2a] rounded-xl animate-pulse" />}>
            <TodaysTasks initialData={data.today_tasks} />
          </Suspense>

          <Suspense fallback={<div className="h-[400px] bg-[#111111] border border-[#2a2a2a] rounded-xl animate-pulse" />}>
            <ActivityFeed initialData={data.activity_feed} />
          </Suspense>
        </div>

        {/* Right Column: Goals */}
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<div className="h-[300px] bg-[#111111] border border-[#2a2a2a] rounded-xl animate-pulse" />}>
            <MyGoalsPanel initialData={data.my_goals} />
          </Suspense>

          <Suspense fallback={<div className="h-[300px] bg-[#111111] border border-[#2a2a2a] rounded-xl animate-pulse" />}>
            <CompanyGoalsPanel initialData={data.company_goals} />
          </Suspense>

          <Suspense fallback={<div className="h-[300px] bg-[#111111] border border-[#2a2a2a] rounded-xl animate-pulse" />}>
            <PrivateGoalsSection />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
