import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env (supporting root cwd, backend/.env, or relative paths)
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });
try {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
} catch {}


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

  // Base URL for generated sharing links (canonical: https://drop.localreach.in)
  publicBaseUrl: (() => {
    const raw = (process.env.PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '');
    if (!raw || raw.includes('localhost') || raw.includes('127.0.0.1')) {
      return 'https://drop.localreach.in';
    }
    return raw;
  })(),

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

  // Resend Email API (Free tier for admin alerts and recovery)
  resend: {
    apiKey: process.env.RESEND_API_KEY || '',
    fromEmail: process.env.RESEND_FROM_EMAIL || 'DROP Admin <noreply@localreach.in>',
  },

  // Admin authentication
  admin: {
    password: process.env.ADMIN_PASSWORD || '',
    sessionSecret: process.env.ADMIN_SESSION_SECRET || 'drop_admin_session_secret_default_2026',
    recoveryEmail: process.env.ADMIN_RECOVERY_EMAIL || 'mdhamza0612@gmail.com',
  },

  // Vercel Web Analytics API
  vercel: {
    token: process.env.VERCEL_TOKEN || '',
    projectId: process.env.VERCEL_PROJECT_ID || '',
    teamId: process.env.VERCEL_TEAM_ID || '',
  },
};

