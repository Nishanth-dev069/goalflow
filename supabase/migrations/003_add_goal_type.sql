-- Add goal_type to goals table
ALTER TABLE goals
ADD COLUMN goal_type text NOT NULL DEFAULT 'monthly'
CHECK (goal_type IN ('weekly', 'monthly', 'yearly', 'long_term'));

-- In the future, we could drop the default, but it's safe to keep 'monthly' as the fallback.
