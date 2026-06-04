--- BLOCK 1: Create attendance logs
CREATE TABLE IF NOT EXISTS attendance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('clock_in', 'clock_out')),
  latitude NUMERIC,
  longitude NUMERIC,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--- BLOCK 2: Create time entries
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  note TEXT,
  is_manual BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

--- BLOCK 3: RLS and policies
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance_read_own" ON attendance_logs FOR SELECT USING (user_id = auth.uid() OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'manager'));
CREATE POLICY "attendance_insert_own" ON attendance_logs FOR INSERT WITH CHECK (user_id = auth.uid());

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "time_entries_read_own" ON time_entries FOR SELECT USING (user_id = auth.uid() OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'manager'));
CREATE POLICY "time_entries_insert_own" ON time_entries FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "time_entries_update_own" ON time_entries FOR UPDATE USING (user_id = auth.uid() OR (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'manager'));
