-- 002_api_schema.sql
-- Missing schema definitions required by the GoalFlow API Handlers

-- Change ENUMs
-- We need to alter existing enums or change columns to TEXT. Since altering ENUM types in use can be tricky,
-- and the API spec defines arbitrary strings, it's safer to change action and entity_type in activity_log to TEXT.
ALTER TABLE activity_log ALTER COLUMN action TYPE TEXT;
ALTER TABLE activity_log ALTER COLUMN entity_type TYPE TEXT;
DROP TYPE IF EXISTS action_type CASCADE;
DROP TYPE IF EXISTS entity_type CASCADE;

-- ALTER USERS AND DEPARTMENTS
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE departments ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- ALTER GOALS TABLE
CREATE TYPE goal_scope AS ENUM ('company', 'department', 'personal');

-- Rename owner_id to creator_id for clarity
ALTER TABLE goals RENAME COLUMN owner_id TO creator_id;
ALTER TABLE goals ADD COLUMN assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE goals ADD COLUMN assigned_to_dept_id UUID REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE goals ADD COLUMN target_value NUMERIC;
ALTER TABLE goals ADD COLUMN current_value NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE goals ADD COLUMN scope goal_scope NOT NULL DEFAULT 'personal';
ALTER TABLE goals ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT false;

-- ALTER TASKS TABLE
ALTER TABLE tasks ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT false;

-- ALTER ACTIVITY LOG TABLE
ALTER TABLE activity_log ADD COLUMN entity_title TEXT;
ALTER TABLE activity_log RENAME COLUMN details TO metadata;

-- NEW TABLE: SUBTASKS
CREATE TABLE subtasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER update_subtasks_modtime BEFORE UPDATE ON subtasks FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- NEW TABLE: TASK COMMENTS
CREATE TABLE task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- NEW TABLE: TASK HISTORY
CREATE TABLE task_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    changed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    field_changed TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- NEW TABLE: GOAL UPDATES
CREATE TABLE goal_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    updated_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    previous_value NUMERIC NOT NULL,
    new_value NUMERIC NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- NEW TABLE: NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    entity_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS POLICIES FOR NEW TABLES

ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON subtasks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins and Managers can manage subtasks" ON subtasks FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')));
CREATE POLICY "Assignees can manage subtasks" ON subtasks FOR ALL USING (EXISTS (SELECT 1 FROM tasks WHERE tasks.id = subtasks.task_id AND tasks.assignee_id = auth.uid()));

ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON task_comments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert comments" ON task_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON task_history FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "System can insert history" ON task_history FOR INSERT WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE goal_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON goal_updates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "System can insert goal updates" ON goal_updates FOR INSERT WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
