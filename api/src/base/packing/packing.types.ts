import { z } from 'zod'

export const ScanRequestSchema = z.object({
  barcode: z.string().min(1, 'Barcode is required'),
  action: z.enum(['START', 'END']),
  workstation_id: z.number().int().positive('Workstation ID is required'),
})

export type ScanRequest = z.infer<typeof ScanRequestSchema>

export interface PackingItemResponse {
  id: number
  barcode: string
  operator_id: number
  operator_username: string | null
  workstation_id: number
  workstation_name: string | null
  start_time: Date | null
  end_time: Date | null
  status: string
  created_at: Date
  updated_at: Date
}
