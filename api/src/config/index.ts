export const config = {
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN
    ? process.env.JWT_EXPIRES_IN.endsWith('m')
      ? parseInt(process.env.JWT_EXPIRES_IN) * 60
      : process.env.JWT_EXPIRES_IN.endsWith('h')
        ? parseInt(process.env.JWT_EXPIRES_IN) * 3600
        : parseInt(process.env.JWT_EXPIRES_IN)
    : 15 * 60, // 15 minutes in seconds
  refreshTokenExpiresIn: 24 * 60 * 60, // 24 hours in seconds
  dbUrl: process.env.DATABASE_URL || 'postgres://cctv:cctv@localhost:5432/cctv',
  saltRounds: 10,
  cameraEncryptionKey: process.env.CAMERA_ENCRYPTION_KEY || '',
  gcs: {
    endpoint: process.env.GCS_ENDPOINT || 'https://storage.googleapis.com',
    bucket: process.env.GCS_BUCKET || '',
    accessKey: process.env.GCS_ACCESS_KEY || '',
    secretKey: process.env.GCS_SECRET_KEY || '',
  },
}
