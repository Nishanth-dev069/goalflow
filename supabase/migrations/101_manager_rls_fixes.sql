-- 1. USERS TABLE: Restrict managers to only see users in their own department
DROP POLICY IF EXISTS "users_read_as_manager_or_admin" ON public.users;
DROP POLICY IF EXISTS "users_read_as_manager" ON public.users;

CREATE POLICY "users_read_as_manager"
  ON public.users FOR SELECT
  USING (
    auth_user_role() = 'manager' AND
    department_id = auth_user_dept()
  );

-- 2. DEPARTMENTS TABLE: Restrict managers and employees to only see their own department
DROP POLICY IF EXISTS "depts_read_active" ON public.departments;
DROP POLICY IF EXISTS "depts_read_admin" ON public.departments;
DROP POLICY IF EXISTS "depts_read_manager_employee" ON public.departments;

CREATE POLICY "depts_read_admin"
  ON public.departments FOR SELECT
  USING ( is_admin() );

CREATE POLICY "depts_read_manager_employee"
  ON public.departments FOR SELECT
  USING (
    auth_user_role() IN ('manager', 'employee') AND
    id = auth_user_dept()
  );

-- 3. ACTIVITY LOG TABLE: Allow managers to read activity logs only for their department
DROP POLICY IF EXISTS "activity_manager_read_dept" ON public.activity_log;

CREATE POLICY "activity_manager_read_dept"
  ON public.activity_log FOR SELECT
  USING (
    auth_user_role() = 'manager' AND
    user_id IN (SELECT id FROM public.users WHERE department_id = auth_user_dept())
  );

-- 4. TIME ENTRIES TABLE: Restrict managers to reading/updating time entries only for their department
DROP POLICY IF EXISTS "time_read_own" ON time_entries;
DROP POLICY IF EXISTS "time_entries_read_own" ON time_entries;
DROP POLICY IF EXISTS "time_entries_update_own" ON time_entries;

CREATE POLICY "time_entries_read_restricted" ON time_entries FOR SELECT 
USING (
  user_id = auth.uid() 
  OR is_admin() 
  OR (
    auth_user_role() = 'manager' AND 
    user_id IN (SELECT id FROM public.users WHERE department_id = auth_user_dept())
  )
);

CREATE POLICY "time_entries_update_restricted" ON time_entries FOR UPDATE 
USING (
  user_id = auth.uid() 
  OR is_admin() 
  OR (
    auth_user_role() = 'manager' AND 
    user_id IN (SELECT id FROM public.users WHERE department_id = auth_user_dept())
  )
);

-- 5. ATTENDANCE LOGS TABLE: Restrict managers to reading attendance logs only for their department
DROP POLICY IF EXISTS "attendance_read_own" ON attendance_logs;

CREATE POLICY "attendance_read_restricted" ON attendance_logs FOR SELECT 
USING (
  user_id = auth.uid() 
  OR is_admin() 
  OR (
    auth_user_role() = 'manager' AND 
    user_id IN (SELECT id FROM public.users WHERE department_id = auth_user_dept())
  )
);
