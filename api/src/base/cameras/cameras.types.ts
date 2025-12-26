import { z } from 'zod'

export const BaseCameraSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  base_url: z.url('Invalid URL format'),
  cam_username: z.string().min(1, 'Username is required'),
  cam_password: z.string().min(1, 'Password is required'),
})

export const CreateCameraSchema = BaseCameraSchema.extend({
  created_by: z.uuid().optional(),
})

export const UpdateCameraSchema = BaseCameraSchema.partial().extend({
  updated_at: z.date(),
  updated_by: z.uuid(),
})

export const DeleteCameraSchema = z.object({
  id: z.uuid('Camera ID must be a valid UUID'),
})

export type CreateCameraRequest = z.infer<typeof CreateCameraSchema>
export type UpdateCameraRequest = z.infer<typeof UpdateCameraSchema>
export type DeleteCameraRequest = z.infer<typeof DeleteCameraSchema>
