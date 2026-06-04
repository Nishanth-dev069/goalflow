import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { format } from 'date-fns'
import { MapPin, Clock } from 'lucide-react'

export const metadata = {
  title: 'Attendance Logs | GoalFlow',
}

export default async function AttendancePage() {
  const supabase = await createClient()
  const { data: { user: sessionUser } } = await supabase.auth.getUser()
  const session = sessionUser ? { user: sessionUser } : null

  if (!session) redirect('/login')

  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
    redirect('/dashboard')
  }

  const { data: logs, error } = await supabase
    .from('attendance_logs')
    .select(`
      id,
      action,
      timestamp,
      latitude,
      longitude,
      user:users!attendance_logs_user_id_fkey(
        id,
        full_name,
        avatar_url,
        email
      )
    `)
    .order('timestamp', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching attendance logs:', error)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Attendance Logs</h1>
        <p className="text-neutral-400 mt-1">Review team clock-ins and clock-outs</p>
      </div>

      <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-[#0a0a0a]">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-widest border-b border-[#2a2a2a]">Employee</th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-widest border-b border-[#2a2a2a]">Action</th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-widest border-b border-[#2a2a2a]">Time</th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-widest border-b border-[#2a2a2a]">Location</th>
              </tr>
            </thead>
            <tbody>
              {!logs || logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-neutral-600 italic">
                    No attendance logs found
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-[#1a1a1a] transition-colors border-b border-[#1a1a1a] last:border-0">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={log.user} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-white">{log.user?.full_name}</p>
                          <p className="text-xs text-neutral-500">{log.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {log.action === 'clock_in' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                          <Clock className="w-3 h-3" /> Clock In
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 text-xs font-medium border border-rose-500/20">
                          <Clock className="w-3 h-3" /> Clock Out
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-300">
                      {format(new Date(log.timestamp), 'MMM d, yyyy h:mm a')}
                    </td>
                    <td className="px-6 py-4">
                      {log.latitude && log.longitude ? (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${log.latitude},${log.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 hover:underline"
                        >
                          <MapPin className="w-3 h-3" /> View Map
                        </a>
                      ) : (
                        <span className="text-xs text-neutral-600 italic">No location provided</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
