import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || '',
  storageProvider: 'b2' as const,
  
  // Backblaze B2 (S3-Compatible Storage)
  b2: {
    endpoint: process.env.B2_ENDPOINT || '',
    region: process.env.B2_REGION || 'us-east-005',
    bucketName: process.env.B2_BUCKET_NAME || 'drop-localreach-storage',
    keyId: process.env.B2_KEY_ID || '',
    applicationKey: process.env.B2_APPLICATION_KEY || '',
  },

  // Upstash Redis Credentials
  redis: {
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  },

  // Vercel Cron Secret
  cronSecret: process.env.CRON_SECRET || '',

  // Optional Contact Email
  contactEmail: process.env.CONTACT_EMAIL || '',

  // Base URL for generated sharing links (e.g. https://drop.localreach.in)
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || 'https://drop.localreach.in').replace(/\/$/, ''),

  // Expiration in days (Default 10 days)
  fileExpirationDays: parseInt(process.env.FILE_EXPIRATION_DAYS || '10', 10),

  // File size limit in MB
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '100', 10),

  // Secret for hash salt or HMAC
  tokenSecret: process.env.TOKEN_SECRET || 'drop_localreach_secret_salt_2026',

  // Allowed CORS origins
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173,https://drop.localreach.in')
    .split(',')
    .map(origin => origin.trim()),

  // Footer Contact link
  contactUrl: process.env.CONTACT_URL || 'https://localreach.in/contact',
};
