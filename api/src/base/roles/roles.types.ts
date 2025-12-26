import { z } from 'zod'

export const CreateRoleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
})

export const UpdateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
})

export type CreateRoleRequest = z.infer<typeof CreateRoleSchema>
export type UpdateRoleRequest = z.infer<typeof UpdateRoleSchema>

export interface RoleResponse {
  id: number
  name: string
  description: string | null
  created_at: Date
  updated_at: Date
}
