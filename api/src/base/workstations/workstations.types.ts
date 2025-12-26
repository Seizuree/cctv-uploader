import { z } from 'zod'

export const CreateWorkstationSchema = z.object({
  name: z.string().optional(),
  camera_id: z.number().int().positive('Camera ID is required'),
  is_active: z.boolean().optional().default(true),
})

export const UpdateWorkstationSchema = z.object({
  name: z.string().optional(),
  camera_id: z.number().int().positive().optional(),
  is_active: z.boolean().optional(),
})

export type CreateWorkstationRequest = z.infer<typeof CreateWorkstationSchema>
export type UpdateWorkstationRequest = z.infer<typeof UpdateWorkstationSchema>

export interface WorkstationResponse {
  id: number
  name: string | null
  camera_id: number
  camera_name: string | null
  is_active: boolean
  created_at: Date
  updated_at: Date
}
