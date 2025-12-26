import { z } from 'zod'

export interface BatchJobResponse {
  id: number
  started_at: Date
  finished_at: Date | null
  status: string
  total_items: number
  success_items: number
  failed_items: number
  error_message: string | null
}

export interface BatchJobItemResponse {
  id: number
  batch_job_id: number
  packing_item_id: number
  status: string
  error_message: string | null
  started_at: Date | null
  finished_at: Date | null
  barcode: string | null
}

export interface BatchJobWithItems extends BatchJobResponse {
  items: BatchJobItemResponse[]
}
