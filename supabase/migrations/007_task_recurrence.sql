-- Add recurrence columns to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS recurrence text CHECK (recurrence IN ('daily', 'weekly', 'biweekly', 'monthly')),
ADD COLUMN IF NOT EXISTS recurrence_parent_id uuid REFERENCES tasks(id) ON DELETE SET NULL;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
