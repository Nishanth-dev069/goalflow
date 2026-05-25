import { z } from 'zod'

export const CreateTaskSchema = z.object({
  goal_id: z.string().uuid().optional().nullable(),
  title: z.string().min(2),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done', 'cancelled']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assigned_to: z.string().uuid(),
  due_date: z.string().optional().nullable(),
  subtasks: z.array(z.object({
    title: z.string().min(1),
    position: z.number().default(0)
  })).optional(),
})

export const UpdateTaskSchema = CreateTaskSchema.partial().omit({ subtasks: true }).extend({
  is_archived: z.boolean().optional(),
})

export const CreateCommentSchema = z.object({
  content: z.string().min(1),
})
