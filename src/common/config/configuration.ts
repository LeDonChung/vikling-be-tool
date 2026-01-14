export default () => ({
  port: parseInt(process.env.PORT || '7000', 10),
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5000', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres123',
    database: process.env.DB_NAME || 'vikling_db',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '5001', 10),
    password: process.env.REDIS_PASSWORD || 'redis123',
  },
  s3: {
    endpoint:
      process.env.S3_ENDPOINT ||
      'https://0938bbd437005020f65871ba7152bf27.r2.cloudflarestorage.com',
    region: process.env.S3_REGION || 'auto',
    accessKeyId:
      process.env.S3_ACCESS_KEY_ID || 'b379704e7652bb99b109ca9d2ad2445e',
    secretAccessKey:
      process.env.S3_SECRET_ACCESS_KEY ||
      '1051e4f282c8e84ba46dc93e39c71acaca58685829ed0f4e0820e042cde96862',
    bucket: process.env.S3_BUCKET || 'vikling-videos',
    publicUrl:
      process.env.S3_PUBLIC_URL ||
      'https://pub-9a9604e4efdb40359db63e6d1f0d33f0.r2.dev',
  },
});
