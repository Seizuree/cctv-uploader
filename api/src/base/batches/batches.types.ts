import { z } from 'zod'

// Status enum sesuai database schema
export const BatchJobStatusSchema = z.enum([
  'RUNNING',
  'SUCCESS',
  'PARTIAL_SUCCESS',
  'FAILED',
])

export type BatchJobStatus = z.infer<typeof BatchJobStatusSchema>

// Filter schema untuk query parameters
export const BatchFilterSchema = z.object({
  status: BatchJobStatusSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export type BatchFilter = z.infer<typeof BatchFilterSchema>
