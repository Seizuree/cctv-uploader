import z from 'zod'

export const BaseUserSchema = z.object({
  name: z.string().nonempty('Name is required'),
  email: z
    .string({
      error: 'Email is required',
    })
    .email({
      message: 'Invalid email address',
    })
    .max(50, {
      message: 'Email must be 50 characters or fewer',
    }),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role_id: z.string().uuid('Role ID must be a valid UUID'),
})

export const CreateUserSchema = BaseUserSchema.extend({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  created_by: z.uuid().optional(),
})

export const UpdateUserSchema = BaseUserSchema.partial().extend({
  updated_at: z.date().optional(),
  updated_by: z.uuid().optional(),
})

export const DeleteUserSchema = z.object({
  id: z.uuid('User ID must be a valid UUID'),
})

export type CreateUserRequest = z.infer<typeof CreateUserSchema>
export type UpdateUserRequest = z.infer<typeof UpdateUserSchema>
export type DeleteUserRequest = z.infer<typeof DeleteUserSchema>
