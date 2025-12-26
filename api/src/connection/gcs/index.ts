import { S3Client } from '@aws-sdk/client-s3'
import { config } from '../../config'

export const s3Client = new S3Client({
  endpoint: config.gcs.endpoint,
  region: 'auto',
  credentials: {
    accessKeyId: config.gcs.accessKey,
    secretAccessKey: config.gcs.secretKey,
  },
  forcePathStyle: true,
})

export { config as gcsConfig } from '../../config'
