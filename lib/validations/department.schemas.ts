import { z } from 'zod'

export const DepartmentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  manager_id: z.string().uuid().optional().nullable(),
})

export const UpdateDepartmentSchema = DepartmentSchema.partial()
