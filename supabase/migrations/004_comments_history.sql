-- Task Comments
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task History
CREATE TABLE task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goal Updates
CREATE TABLE goal_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  updated_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  previous_value NUMERIC NOT NULL,
  new_value NUMERIC NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_updates ENABLE ROW LEVEL SECURITY;

-- Setup basic RLS policies (everyone can read for now based on app-level auth, admin/manager logic will be enforced at API level)
CREATE POLICY "Enable read access for all authenticated users" ON task_comments FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON task_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable read access for all authenticated users" ON task_history FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON task_history FOR INSERT WITH CHECK (auth.uid() = changed_by);

CREATE POLICY "Enable read access for all authenticated users" ON goal_updates FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON goal_updates FOR INSERT WITH CHECK (auth.uid() = updated_by);
