export type UserRole = 'admin' | 'manager' | 'employee';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  department_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type GoalStatus = 'draft' | 'active' | 'completed' | 'cancelled';
export type GoalScope = 'company' | 'department' | 'personal';
export type GoalType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'long_term';

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  status: GoalStatus;
  scope: GoalScope;
  type: GoalType;
  target_value: number | null;
  current_value: number;
  unit: string | null;
  progress: number;
  created_by: string;
  assigned_to_user_id: string | null;
  assigned_to_dept_id: string | null;
  start_date: string;
  end_date: string;
  is_archived: boolean;
  is_private: boolean;
  created_at: string;
  updated_at: string;

  // Derived fields computed by helper
  progress_percentage?: number;
  days_remaining?: number;
  is_overdue?: boolean;

  // Joined relations
  assigned_user?: { id: string; full_name: string; avatar_url: string | null; } | null;
  assigned_dept?: { id: string; name: string; } | null;
  creator?: { id: string; full_name: string; } | null;
  goal_updates?: GoalUpdate[];
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  goal_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string;
  assigned_by: string;
  due_date: string | null;
  is_archived: boolean;
  tags?: string[];
  created_at: string;
  updated_at: string;

  // Derived fields
  is_overdue?: boolean;

  // Joined relations
  assignee?: { id: string; full_name: string; avatar_url: string | null; department?: { id: string; name: string; } | null; } | null;
  subtasks?: Subtask[];
  comments_count?: number;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_done: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface TaskHistory {
  id: string;
  task_id: string;
  changed_by: string;
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
}

export interface GoalUpdate {
  id: string;
  goal_id: string;
  updated_by: string;
  previous_value: number;
  new_value: number;
  note: string | null;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  manager_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Activity Log allows freeform string actions per spec
export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_title: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface AnalyticsOverview {
  tasks_completed: number;
  tasks_completed_trend: number;
  goal_stats: Record<string, number>;
  overdue_tasks: number;
  daily_completions: Array<{ date: string; count: number }>;
  tasks_by_employee: Array<{ id: string; name: string; count: number }>;
  department_health: Array<{
    id: string;
    name: string;
    total_tasks: number;
    completed_tasks: number;
    active_goals: number;
    overdue_tasks: number;
  }>;
}
