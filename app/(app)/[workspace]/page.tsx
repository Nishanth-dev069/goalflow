import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { format, subDays } from 'date-fns';
import { Users, CheckSquare, Target, TrendingUp } from 'lucide-react';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { RelativeTime } from '@/components/shared/RelativeTime';
import { DeadlineTriggerButton } from '@/components/admin/DeadlineTriggerButton';

export const metadata = {
  title: 'Admin Overview | GoalFlow',
};

// Helper to format actions nicely
function actionToReadable(action: string): string {
  const map: Record<string, string> = {
    'user_created': 'created a new user',
    'role_changed': 'changed a user role',
    'user_deactivated': 'deactivated a user',
    'department_created': 'created a department',
    'department_updated': 'updated a department',
    'department_deactivated': 'deactivated a department',
    'goal_created': 'created a goal',
    'goal_updated': 'updated a goal',
    'goal_completed': 'completed a goal',
    'goal_archived': 'archived a goal',
    'task_created': 'created a task',
    'task_status_changed': 'updated a task status',
    'task_completed': 'completed a task',
    'task_cancelled': 'cancelled a task',
    'task_commented': 'commented on a task',
  };
  return map[action] || action.replace(/_/g, ' ');
}

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const { data: { user: sessionUser } } = await supabase.auth.getUser()
  const session = sessionUser ? { user: sessionUser } : null;
  
  if (!session) redirect('/login');

  const { data: currentUser } = await supabase.from('users').select('*').eq('id', session.user.id).single();
  if (!currentUser) {
    redirect('/dashboard');
  }

  // Calculate Dates
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const thirtyDaysAgoStr = format(subDays(today, 30), 'yyyy-MM-dd');
  const firstOfMonthStr = format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd');

  // We fetch data directly in RSC to avoid absolute URL fetching complexities
  // Apply manager filtering directly to these queries
  let userIdsInDept: string[] = []
  if (currentUser.role === 'manager' && currentUser.department_id) {
    const { data: deptUsers } = await supabase.from('users').select('id').eq('department_id', currentUser.department_id)
    userIdsInDept = (deptUsers || []).map(u => u.id)
    if (userIdsInDept.length === 0) userIdsInDept = ['00000000-0000-0000-0000-000000000000']
  }

  let qUsers = supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true)
  if (currentUser.role === 'manager') qUsers = qUsers.eq('department_id', currentUser.department_id)

  let qActiveTasks = supabase.from('tasks').select('*', { count: 'exact', head: true }).in('status', ['todo', 'in_progress']).eq('is_archived', false)
  if (currentUser.role === 'manager') qActiveTasks = qActiveTasks.in('assigned_to', userIdsInDept)

  let qActiveGoals = supabase.from('goals').select('*', { count: 'exact', head: true }).eq('status', 'active').eq('is_archived', false)
  if (currentUser.role === 'manager') qActiveGoals = qActiveGoals.eq('assigned_to_dept_id', currentUser.department_id)

  let qTasksCompleted = supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'done').gte('updated_at', firstOfMonthStr)
  if (currentUser.role === 'manager') qTasksCompleted = qTasksCompleted.in('assigned_to', userIdsInDept)

  let qTotalTasks = supabase.from('tasks').select('*', { count: 'exact', head: true }).gte('created_at', firstOfMonthStr).eq('is_archived', false)
  if (currentUser.role === 'manager') qTotalTasks = qTotalTasks.in('assigned_to', userIdsInDept)

  let qActivity = supabase.from('activity_log').select(`*, user:users!activity_log_user_id_fkey(id, full_name, avatar_url)`).order('created_at', { ascending: false }).limit(10)
  if (currentUser.role === 'manager') qActivity = qActivity.in('user_id', userIdsInDept)

  let qOverdue = supabase.from('tasks').select('assigned_to, user:users!tasks_assigned_to_fkey(id, full_name, avatar_url)').lt('due_date', todayStr).not('status', 'in', '("done","cancelled")')
  if (currentUser.role === 'manager') qOverdue = qOverdue.in('assigned_to', userIdsInDept)

  const [
    { count: totalMembersCount },
    { count: activeTasksCount },
    { count: activeGoalsCount },
    { count: tasksCompletedThisMonth },
    { count: totalTasksThisMonth },
    { data: recentActivity },
    { data: overdueTasksRaw }
  ] = await Promise.all([
    qUsers,
    qActiveTasks,
    qActiveGoals,
    qTasksCompleted,
    qTotalTasks,
    qActivity,
    qOverdue
  ]);

  const completionRate = totalTasksThisMonth && totalTasksThisMonth > 0
    ? Math.round(((tasksCompletedThisMonth || 0) / totalTasksThisMonth) * 100)
    : 0;

  let trendColor = "text-neutral-500";
  if (completionRate > 70) trendColor = "text-emerald-500";
  else if (completionRate >= 40) trendColor = "text-amber-500";
  else if (totalTasksThisMonth && totalTasksThisMonth > 0) trendColor = "text-rose-500";

  // Group overdue tasks by user
  const overdueData = (overdueTasksRaw || []).reduce((acc: any, task: any) => {
    if (!task.assigned_to || !task.user) return acc;
    if (!acc[task.assigned_to]) {
      acc[task.assigned_to] = { user: task.user, overdueCount: 0 };
    }
    acc[task.assigned_to].overdueCount += 1;
    return acc;
  }, {});

  const atRiskUsers = Object.values(overdueData)
    .sort((a: any, b: any) => b.overdueCount - a.overdueCount)
    .slice(0, 5);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight capitalize">{currentUser.role} Overview</h1>
          <p className="text-neutral-400 mt-1">Platform statistics and recent activity.</p>
        </div>
        <DeadlineTriggerButton />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5">
          <div className="flex justify-between items-start">
            <h3 className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Total Team Members</h3>
            <Users size={14} className="text-neutral-600" />
          </div>
          <div className="text-3xl font-bold text-white mt-2 mb-1">{totalMembersCount || 0}</div>
          <p className="text-xs text-neutral-500">Active accounts</p>
        </div>

        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5">
          <div className="flex justify-between items-start">
            <h3 className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Active Tasks</h3>
            <CheckSquare size={14} className="text-neutral-600" />
          </div>
          <div className="text-3xl font-bold text-white mt-2 mb-1">{activeTasksCount || 0}</div>
          <p className="text-xs text-neutral-500">To do or in progress</p>
        </div>

        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5">
          <div className="flex justify-between items-start">
            <h3 className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Goals In Progress</h3>
            <Target size={14} className="text-neutral-600" />
          </div>
          <div className="text-3xl font-bold text-white mt-2 mb-1">{activeGoalsCount || 0}</div>
          <p className="text-xs text-neutral-500">Currently active</p>
        </div>

        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-5">
          <div className="flex justify-between items-start">
            <h3 className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Completion Rate</h3>
            <TrendingUp size={14} className="text-neutral-600" />
          </div>
          <div className="text-3xl font-bold text-white mt-2 mb-1">{completionRate}%</div>
          <p className={`text-xs font-medium ${trendColor}`}>This month</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-4">Recent Activity</h2>
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl overflow-hidden">
          {(recentActivity || []).length === 0 ? (
            <div className="p-8 text-center text-neutral-500 text-sm">
              No recent activity found.
            </div>
          ) : (
            <div className="flex flex-col">
              {(recentActivity || []).map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 py-3 px-5 border-b border-[#1a1a1a] last:border-0 hover:bg-[#1a1a1a]/50 transition-colors">
                  <UserAvatar
                    user={{
                      full_name: log.user?.full_name || 'Unknown',
                      avatar_url: log.user?.avatar_url
                    } as any}
                    className="w-6 h-6 mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-neutral-300">
                      <span className="font-medium text-white mr-1">{log.user?.full_name || 'Unknown User'}</span>
                      {actionToReadable(log.action)}
                      {log.entity_title && (
                        <span className="text-indigo-400 ml-1 font-medium cursor-pointer hover:underline">
                          {log.entity_title}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-xs text-neutral-600 whitespace-nowrap">
                    <RelativeTime date={log.created_at} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Team Progress / At Risk Users */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-4">Team Progress (At-Risk)</h2>
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl overflow-hidden">
          {atRiskUsers.length === 0 ? (
            <div className="p-8 text-center text-emerald-500 text-sm">
              All good! No users currently have overdue tasks.
            </div>
          ) : (
            <div className="flex flex-col">
              {atRiskUsers.map((item: any) => (
                <div key={item.user.id} className="flex items-center gap-3 py-3 px-5 border-b border-[#1a1a1a] last:border-0 hover:bg-[#1a1a1a]/50 transition-colors">
                  <UserAvatar
                    user={{
                      full_name: item.user.full_name || 'Unknown',
                      avatar_url: item.user.avatar_url
                    } as any}
                    className="w-8 h-8"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{item.user.full_name}</p>
                    <p className="text-xs text-neutral-500">Action needed to clear backlog</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-rose-500/10 text-rose-400 text-xs font-bold px-2 py-1 rounded">
                      {item.overdueCount} Overdue {item.overdueCount === 1 ? 'Task' : 'Tasks'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
