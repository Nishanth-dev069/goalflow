import { z } from 'zod'

export const CreateGoalSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'completed', 'cancelled']).default('draft'),
  scope: z.enum(['company', 'department', 'personal']).default('personal'),
  type: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'long_term']).default('monthly'),
  target_value: z.number().optional().nullable(),
  assigned_to_user_id: z.union([z.string().uuid(), z.literal('')]).optional().nullable().transform(val => val === '' ? null : val),
  assigned_to_dept_id: z.union([z.string().uuid(), z.literal('')]).optional().nullable().transform(val => val === '' ? null : val),
  start_date: z.string(),
  end_date: z.string(),
  is_private: z.boolean().default(false),
})

export const UpdateGoalSchema = CreateGoalSchema.partial().extend({
  current_value: z.number().optional(),
  is_archived: z.boolean().optional(),
})

export const GoalUpdateSchema = z.object({
  new_value: z.number(),
  note: z.string().optional(),
})
