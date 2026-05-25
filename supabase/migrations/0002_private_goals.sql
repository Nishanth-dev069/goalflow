-- 1. Add column if it doesn't exist
ALTER TABLE goals ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;

-- 2. Drop existing goal policies
DROP POLICY IF EXISTS "Users can view their own, their department's, or company goals" ON goals;
DROP POLICY IF EXISTS "Anyone can view company goals" ON goals;

-- 3. Create updated view policy that handles private goals securely
CREATE POLICY "Users can view appropriate goals"
ON goals FOR SELECT
USING (
  -- Admin sees everything EXCEPT other people's private goals
  (
    (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
    AND (is_private = false OR created_by = auth.uid() OR assigned_to_user_id = auth.uid())
  )
  OR
  -- Regular user sees:
  --   1. Any goal assigned to them (private or public)
  --   2. Any goal they created (private or public)
  --   3. Public department goals for their department
  --   4. Public company goals
  (
    assigned_to_user_id = auth.uid()
    OR created_by = auth.uid()
    OR (
      is_private = false AND (
        scope = 'company' 
        OR (scope = 'department' AND assigned_to_dept_id = (SELECT department_id FROM users WHERE id = auth.uid()))
      )
    )
  )
);
