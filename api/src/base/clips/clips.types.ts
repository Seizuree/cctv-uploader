import { z } from 'zod'

export interface ClipResponse {
  id: number
  packing_item_id: number
  camera_id: number
  camera_name: string | null
  storage_path: string
  duration_sec: number | null
  filesize_bytes: number | null
  generated_at: Date
  status: string
  barcode: string | null
}

export interface SignedUrlResponse {
  url: string
  expires_in: number
}
