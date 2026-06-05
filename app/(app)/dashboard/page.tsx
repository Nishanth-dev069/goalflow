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
import { useTranslation } from '@/lib/utils/i18n'
import { BackButton } from '@/components/shared/BackButton'

import { getDashboardDataService } from '@/lib/services/dashboard'
import { AttendanceWidget } from '@/components/attendance/AttendanceWidget'
import { getLatestAttendance } from '@/lib/actions/attendance'

async function getDashboardData() {
  const supabase = await createClient()
  const { data: { user: sessionUser } } = await supabase.auth.getUser()
  const session = sessionUser ? { user: sessionUser } : null
  
  if (!session) {
    redirect('/login')
  }

  const data = await getDashboardDataService(session.user.id)
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

  const latestAttendance = await getLatestAttendance()
  const lang = currentUser?.language_preference || 'en'
  const t = useTranslation(lang as any)

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto min-h-screen pb-32">
      <BackButton />
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">{t('dashboard')}</h1>
        <p className="text-neutral-400 mt-1">Here's what's happening with your goals and tasks today.</p>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <QuoteBanner stats={data.stats} />
          </div>
          <div className="lg:col-span-1">
            <AttendanceWidget 
              lastAction={latestAttendance?.action || null} 
              lastTimestamp={latestAttendance?.timestamp || null} 
            />
          </div>
        </div>

        {data.company_goals && data.company_goals.length > 0 && (
          <CompanyGoalsHero goals={data.company_goals} currentUser={currentUser} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MyGoalsPanel goals={data.my_goals || []} currentUser={currentUser} />
          <TodaysTasks initialData={data.today_tasks || []} lang={lang as any} />
        </div>

        <PrivateGoalsDashboardSection userId={user.id} />

        <ActivityFeed initialData={data.activity_feed || []} />
      </div>
    </div>
  )
}
