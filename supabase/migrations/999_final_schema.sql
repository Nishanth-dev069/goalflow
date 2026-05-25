--- BLOCK 1: Extensions ---
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

--- BLOCK 2: Drop existing types if re-running (safe) ---
DO $$ BEGIN
  DROP TYPE IF EXISTS user_role CASCADE;
  DROP TYPE IF EXISTS goal_type CASCADE;
  DROP TYPE IF EXISTS goal_scope CASCADE;
  DROP TYPE IF EXISTS goal_status CASCADE;
  DROP TYPE IF EXISTS task_status CASCADE;
  DROP TYPE IF EXISTS task_priority CASCADE;
  DROP TYPE IF EXISTS activity_action CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

--- BLOCK 3: Enums ---
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'employee');
CREATE TYPE goal_type AS ENUM ('weekly', 'monthly', 'yearly', 'long_term');
CREATE TYPE goal_scope AS ENUM ('company', 'department', 'personal');
CREATE TYPE goal_status AS ENUM ('active', 'completed', 'missed', 'paused');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done', 'cancelled');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE activity_action AS ENUM (
  'task_created','task_updated','task_status_changed','task_commented','task_cancelled',
  'goal_created','goal_updated','goal_completed','goal_missed','goal_progress_updated',
  'user_created','user_deactivated','user_reactivated','department_created','department_updated'
);

--- BLOCK 4: Departments table ---
CREATE TABLE IF NOT EXISTS departments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  manager_id  UUID,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--- BLOCK 5: Users table ---
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  avatar_url    TEXT,
  role          user_role NOT NULL DEFAULT 'employee',
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--- BLOCK 6: Add FK from departments to users ---
DO $$ BEGIN
  ALTER TABLE departments ADD CONSTRAINT fk_dept_manager
    FOREIGN KEY (manager_id) REFERENCES public.users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

--- BLOCK 7: Goals table ---
CREATE TABLE IF NOT EXISTS goals (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title               TEXT NOT NULL CHECK (char_length(title) <= 120),
  description         TEXT,
  type                goal_type NOT NULL,
  scope               goal_scope NOT NULL,
  status              goal_status NOT NULL DEFAULT 'active',
  target_value        NUMERIC,
  current_value       NUMERIC NOT NULL DEFAULT 0,
  unit                TEXT,
  assigned_to_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_to_dept_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  start_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date            DATE NOT NULL,
  created_by          UUID NOT NULL REFERENCES public.users(id),
  is_archived         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT goal_scope_check CHECK (
    (scope = 'company'    AND assigned_to_user_id IS NULL AND assigned_to_dept_id IS NULL) OR
    (scope = 'department' AND assigned_to_dept_id IS NOT NULL AND assigned_to_user_id IS NULL) OR
    (scope = 'personal'   AND assigned_to_user_id IS NOT NULL AND assigned_to_dept_id IS NULL)
  )
);

--- BLOCK 8: Goal updates ---
CREATE TABLE IF NOT EXISTS goal_updates (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id         UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  updated_by      UUID NOT NULL REFERENCES public.users(id),
  previous_value  NUMERIC NOT NULL DEFAULT 0,
  new_value       NUMERIC NOT NULL,
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--- BLOCK 9: Tasks ---
CREATE TABLE IF NOT EXISTS tasks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT NOT NULL CHECK (char_length(title) <= 200),
  description   TEXT,
  status        task_status NOT NULL DEFAULT 'todo',
  priority      task_priority NOT NULL DEFAULT 'medium',
  assigned_to   UUID NOT NULL REFERENCES public.users(id),
  assigned_by   UUID NOT NULL REFERENCES public.users(id),
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  due_date      DATE NOT NULL,
  tags          TEXT[] DEFAULT '{}',
  is_archived   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--- BLOCK 10: Subtasks ---
CREATE TABLE IF NOT EXISTS subtasks (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  is_done    BOOLEAN NOT NULL DEFAULT FALSE,
  position   SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--- BLOCK 11: Task comments ---
CREATE TABLE IF NOT EXISTS task_comments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id),
  content    TEXT NOT NULL,
  is_edited  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--- BLOCK 12: Task history ---
CREATE TABLE IF NOT EXISTS task_history (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id       UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  changed_by    UUID NOT NULL REFERENCES public.users(id),
  field_changed TEXT NOT NULL,
  old_value     TEXT,
  new_value     TEXT,
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--- BLOCK 13: Activity log ---
CREATE TABLE IF NOT EXISTS activity_log (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id),
  action       activity_action NOT NULL,
  entity_type  TEXT NOT NULL,
  entity_id    UUID,
  entity_title TEXT,
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--- BLOCK 14: Notifications ---
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT,
  type       TEXT NOT NULL,
  entity_id  UUID,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--- BLOCK 15: All indexes ---
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to    ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date        ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status          ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_dept            ON tasks(department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_status ON tasks(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_status      ON tasks(due_date, status);
CREATE INDEX IF NOT EXISTS idx_goals_scope           ON goals(scope);
CREATE INDEX IF NOT EXISTS idx_goals_status          ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_user            ON goals(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_goals_dept            ON goals(assigned_to_dept_id);
CREATE INDEX IF NOT EXISTS idx_goals_type            ON goals(type);
CREATE INDEX IF NOT EXISTS idx_goals_archived        ON goals(is_archived);
CREATE INDEX IF NOT EXISTS idx_activity_user         ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created      ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_entity       ON activity_log(entity_id);
CREATE INDEX IF NOT EXISTS idx_notifs_user_read      ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_task_history_task     ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_goal_updates_goal     ON goal_updates(goal_id);
CREATE INDEX IF NOT EXISTS idx_comments_task         ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_task         ON subtasks(task_id, position);
CREATE INDEX IF NOT EXISTS idx_users_dept            ON public.users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_active          ON public.users(is_active);

--- BLOCK 16: updated_at trigger function ---
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

--- BLOCK 17: updated_at triggers ---
DO $$ BEGIN
  CREATE TRIGGER trg_users_upd    BEFORE UPDATE ON public.users    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_depts_upd   BEFORE UPDATE ON departments      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_goals_upd   BEFORE UPDATE ON goals            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_tasks_upd   BEFORE UPDATE ON tasks            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_comments_upd BEFORE UPDATE ON task_comments   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

--- BLOCK 18: Auto-create user profile trigger ---
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

--- BLOCK 19: Enable RLS on all tables ---
ALTER TABLE public.users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_updates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_history    ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications   ENABLE ROW LEVEL SECURITY;

--- BLOCK 20: RLS helper functions ---
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid() AND is_active = TRUE;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth_user_dept()
RETURNS UUID AS $$
  SELECT department_id FROM public.users WHERE id = auth.uid() AND is_active = TRUE;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT auth_user_role() = 'admin';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_manager_of(dept_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM departments WHERE id = dept_id AND manager_id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER STABLE;

--- BLOCK 21: Drop all existing policies (clean slate) ---
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE FORMAT('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

--- BLOCK 22: RLS Policies — USERS ---
CREATE POLICY "users_read_own"
  ON public.users FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_read_as_manager_or_admin"
  ON public.users FOR SELECT
  USING (auth_user_role() IN ('admin', 'manager'));

CREATE POLICY "users_admin_all"
  ON public.users FOR ALL USING (is_admin());

CREATE POLICY "users_self_update"
  ON public.users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    role = (SELECT role FROM public.users WHERE id = auth.uid())
  );

--- BLOCK 23: RLS Policies — DEPARTMENTS ---
CREATE POLICY "depts_read_active"
  ON departments FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = TRUE);

CREATE POLICY "depts_admin_all"
  ON departments FOR ALL USING (is_admin());

--- BLOCK 24: RLS Policies — GOALS ---
CREATE POLICY "goals_company_read"
  ON goals FOR SELECT
  USING (auth.uid() IS NOT NULL AND scope = 'company' AND NOT is_archived);

CREATE POLICY "goals_personal_read"
  ON goals FOR SELECT
  USING (assigned_to_user_id = auth.uid());

CREATE POLICY "goals_dept_read"
  ON goals FOR SELECT
  USING (
    scope = 'department' AND
    assigned_to_dept_id = auth_user_dept()
  );

CREATE POLICY "goals_admin_all"
  ON goals FOR ALL USING (is_admin());

CREATE POLICY "goals_manager_create"
  ON goals FOR INSERT
  WITH CHECK (
    auth_user_role() = 'manager' AND (
      (scope = 'department' AND assigned_to_dept_id = auth_user_dept()) OR
      scope = 'personal'
    )
  );

CREATE POLICY "goals_manager_update_dept"
  ON goals FOR UPDATE
  USING (
    auth_user_role() = 'manager' AND
    assigned_to_dept_id = auth_user_dept()
  );

--- BLOCK 25: RLS Policies — GOAL UPDATES ---
CREATE POLICY "goal_updates_read"
  ON goal_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM goals g WHERE g.id = goal_id AND (
        g.scope = 'company' OR
        g.assigned_to_user_id = auth.uid() OR
        g.assigned_to_dept_id = auth_user_dept() OR
        is_admin()
      )
    )
  );

CREATE POLICY "goal_updates_insert"
  ON goal_updates FOR INSERT
  WITH CHECK (
    updated_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM goals g WHERE g.id = goal_id AND (
        g.assigned_to_user_id = auth.uid() OR
        g.assigned_to_dept_id = auth_user_dept() OR
        is_admin()
      )
    )
  );

--- BLOCK 26: RLS Policies — TASKS ---
CREATE POLICY "tasks_read_own"
  ON tasks FOR SELECT USING (assigned_to = auth.uid());

CREATE POLICY "tasks_read_assigned_by"
  ON tasks FOR SELECT USING (assigned_by = auth.uid());

CREATE POLICY "tasks_manager_read_dept"
  ON tasks FOR SELECT
  USING (auth_user_role() = 'manager' AND department_id = auth_user_dept());

CREATE POLICY "tasks_admin_all"
  ON tasks FOR ALL USING (is_admin());

CREATE POLICY "tasks_employee_update_status"
  ON tasks FOR UPDATE
  USING (assigned_to = auth.uid());

CREATE POLICY "tasks_manager_create"
  ON tasks FOR INSERT
  WITH CHECK (
    auth_user_role() IN ('admin', 'manager') AND
    (is_admin() OR department_id = auth_user_dept())
  );

--- BLOCK 27: RLS Policies — SUBTASKS ---
CREATE POLICY "subtasks_read"
  ON subtasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks t WHERE t.id = task_id AND (
        t.assigned_to = auth.uid() OR
        t.assigned_by = auth.uid() OR
        is_admin() OR
        (auth_user_role() = 'manager' AND t.department_id = auth_user_dept())
      )
    )
  );

CREATE POLICY "subtasks_update"
  ON subtasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tasks t WHERE t.id = task_id AND (
        t.assigned_to = auth.uid() OR is_admin() OR
        (auth_user_role() = 'manager' AND t.department_id = auth_user_dept())
      )
    )
  );

CREATE POLICY "subtasks_insert"
  ON subtasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t WHERE t.id = task_id AND (
        is_admin() OR
        (auth_user_role() = 'manager' AND t.department_id = auth_user_dept())
      )
    )
  );

--- BLOCK 28: RLS Policies — TASK COMMENTS ---
CREATE POLICY "comments_read"
  ON task_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks t WHERE t.id = task_id AND (
        t.assigned_to = auth.uid() OR t.assigned_by = auth.uid() OR
        is_admin() OR
        (auth_user_role() = 'manager' AND t.department_id = auth_user_dept())
      )
    )
  );

CREATE POLICY "comments_insert"
  ON task_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM tasks t WHERE t.id = task_id AND (
        t.assigned_to = auth.uid() OR t.assigned_by = auth.uid() OR
        is_admin() OR
        (auth_user_role() = 'manager' AND t.department_id = auth_user_dept())
      )
    )
  );

CREATE POLICY "comments_update_own"
  ON task_comments FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

--- BLOCK 29: RLS Policies — TASK HISTORY ---
CREATE POLICY "task_history_read"
  ON task_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks t WHERE t.id = task_id AND (
        t.assigned_to = auth.uid() OR t.assigned_by = auth.uid() OR
        is_admin() OR
        (auth_user_role() = 'manager' AND t.department_id = auth_user_dept())
      )
    )
  );

--- BLOCK 30: RLS Policies — ACTIVITY LOG ---
CREATE POLICY "activity_read_own"
  ON activity_log FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "activity_admin_read_all"
  ON activity_log FOR SELECT USING (is_admin());

--- BLOCK 31: RLS Policies — NOTIFICATIONS ---
CREATE POLICY "notifs_read_own"
  ON notifications FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifs_update_own"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

--- BLOCK 32: Enable Realtime on key tables ---
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE goals;
