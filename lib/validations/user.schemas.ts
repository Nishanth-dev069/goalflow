import { z } from 'zod'

export const CreateUserSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2),
  role: z.enum(['admin', 'manager', 'employee']).default('employee'),
  department_id: z.string().uuid().optional().nullable(),
  password: z.string().min(8).optional(),
})

export const UpdateUserSchema = z.object({
  full_name: z.string().min(2).optional(),
  role: z.enum(['admin', 'manager', 'employee']).optional(),
  department_id: z.string().uuid().optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  is_active: z.boolean().optional(),
})
