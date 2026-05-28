import React, { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { TodaysTasks } from '@/components/dashboard/TodaysTasks'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { MyGoalsPanel } from '@/components/dashboard/MyGoalsPanel'
import { CompanyGoalsHero } from '@/components/dashboard/CompanyGoalsHero'
import { PrivateGoalsDashboardSection } from '@/components/dashboard/PrivateGoalsDashboardSection'
import { QuoteBanner } from '@/components/dashboard/QuoteBanner'

async function getDashboardData() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }

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

  const data = await res.json()
  return { data, user: session.user }
}

export default async function DashboardPage() {
  const { data, user } = await getDashboardData()
  
  // We need to fetch full user info to get the role if it's not in the auth session
  const supabase = await createClient()
  const { data: currentUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="p-6 max-w-[1400px] mx-auto min-h-screen pb-32">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
        <p className="text-neutral-400 mt-1">Here's what's happening with your goals and tasks today.</p>
      </div>

      <div className="space-y-8">
        <QuoteBanner stats={data.stats} />

        {data.company_goals && data.company_goals.length > 0 && (
          <CompanyGoalsHero goals={data.company_goals} currentUser={currentUser} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MyGoalsPanel goals={data.my_goals || []} currentUser={currentUser} />
          <TodaysTasks initialData={data.today_tasks || []} />
        </div>

        <PrivateGoalsDashboardSection userId={user.id} />

        <ActivityFeed initialData={data.activity_feed || []} />
      </div>
    </div>
  )
}
