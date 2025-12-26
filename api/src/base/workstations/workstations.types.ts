import { z } from 'zod'

export const BaseWorkstationSchema = z.object({
  name: z.string().optional(),
  camera_id: z.uuid('Camera ID is required'),
})

export const CreateWorkstationSchema = BaseWorkstationSchema.extend({
  created_by: z.uuid().optional(),
})

export const UpdateWorkstationSchema = BaseWorkstationSchema.partial().extend({
  updated_at: z.date(),
  updated_by: z.uuid(),
})

export const DeleteWorkstationSchema = z.object({
  id: z.uuid('Workstation ID must be a valid UUID'),
})

export type CreateWorkstationRequest = z.infer<typeof CreateWorkstationSchema>
export type UpdateWorkstationRequest = z.infer<typeof UpdateWorkstationSchema>
export type DeleteWorkstationRequest = z.infer<typeof DeleteWorkstationSchema>
