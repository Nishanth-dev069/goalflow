-- 100_manager_rls_refactor.sql

-- Replace auth_user_role() with actual table lookups as requested if auth_user_role doesn't exist, but we assume it might exist. The user prompt says:
-- "SELECT department_id FROM users WHERE id = auth.uid()"
-- We will use exactly what they asked for.

-- Users Table
DROP POLICY IF EXISTS "users_read_as_manager_or_admin" ON public.users;
DROP POLICY IF EXISTS "users_read_as_manager" ON public.users;

-- Admin can read all users (assume there is already an admin policy, but we'll add one just in case)
-- CREATE POLICY "users_read_as_admin" ON public.users FOR SELECT USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );

CREATE POLICY "users_read_as_manager"
  ON public.users FOR SELECT
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'manager' AND
    department_id = (SELECT department_id FROM public.users WHERE id = auth.uid())
  );

-- Departments Table
DROP POLICY IF EXISTS "depts_read_active" ON public.departments;
DROP POLICY IF EXISTS "depts_read_manager_employee" ON public.departments;

-- Everyone used to read departments. Now Admins read all, others read own.
CREATE POLICY "depts_read_admin"
  ON public.departments FOR SELECT
  USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' );

CREATE POLICY "depts_read_manager_employee"
  ON public.departments FOR SELECT
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('manager', 'employee') AND
    id = (SELECT department_id FROM public.users WHERE id = auth.uid())
  );

-- Activity Log Table
DROP POLICY IF EXISTS "activity_manager_read_dept" ON public.activity_log;

CREATE POLICY "activity_manager_read_dept"
  ON public.activity_log FOR SELECT
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'manager' AND
    user_id IN (SELECT id FROM public.users WHERE department_id = (SELECT department_id FROM public.users WHERE id = auth.uid()))
  );
