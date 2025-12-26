import { z } from 'zod'

export interface PaginationQuery {
  page?: number
  limit?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  search?: string
}

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
})

export type PaginationRequest = z.infer<typeof PaginationSchema>
