import { z } from 'zod'

export const BaseRoleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
})

export const CreateRoleSchema = BaseRoleSchema.extend({
  created_by: z.uuid().optional(),
})

export const UpdateRoleSchema = BaseRoleSchema.partial().extend({
  updated_at: z.date(),
  updated_by: z.uuid(),
})

export const DeleteRoleSchema = z.object({
  id: z.uuid('Role ID must be a valid UUID'),
})

export type CreateRoleRequest = z.infer<typeof CreateRoleSchema>
export type UpdateRoleRequest = z.infer<typeof UpdateRoleSchema>
export type DeleteRoleRequest = z.infer<typeof DeleteRoleSchema>
