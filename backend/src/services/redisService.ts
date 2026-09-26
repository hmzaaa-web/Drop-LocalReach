import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { config } from '../config/index.js';

let redisInstance: Redis | null = null;
let uploadRatelimit: Ratelimit | null = null;
let passcodeRatelimit: Ratelimit | null = null;
let qrRatelimit: Ratelimit | null = null;

/**
 * Get or initialize the Upstash Redis client.
 * Returns null if credentials are not configured (graceful local fallback).
 */
export function getRedisClient(): Redis | null {
  if (!redisInstance && config.redis.url && config.redis.token) {
    try {
      redisInstance = new Redis({
        url: config.redis.url,
        token: config.redis.token,
      });
    } catch (err) {
      console.warn('[Redis] Failed to initialize Upstash Redis client:', err);
      redisInstance = null;
    }
  }
  return redisInstance;
}

let adminLoginRatelimit: Ratelimit | null = null;
let passwordResetRatelimit: Ratelimit | null = null;

/**
 * Initialize Upstash Rate Limiters
 */
function getRateLimiters() {
  const redis = getRedisClient();
  if (!redis) return null;

  if (!uploadRatelimit) {
    uploadRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(40, '1 h'),
      prefix: 'rate:upload',
      analytics: false,
    });
  }

  if (!passcodeRatelimit) {
    passcodeRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '15 m'),
      prefix: 'rate:verify',
      analytics: false,
    });
  }

  if (!qrRatelimit) {
    qrRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, '15 m'),
      prefix: 'rate:qr',
      analytics: false,
    });
  }

  if (!adminLoginRatelimit) {
    adminLoginRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      prefix: 'rate:admin_login',
      analytics: false,
    });
  }

  if (!passwordResetRatelimit) {
    passwordResetRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1 h'),
      prefix: 'rate:password_reset',
      analytics: false,
    });
  }

  return { uploadRatelimit, passcodeRatelimit, qrRatelimit, adminLoginRatelimit, passwordResetRatelimit };
}

/**
 * Check rate limit for upload requests (40 / hour / IP)
 */
export async function checkUploadRateLimit(ip: string): Promise<{ success: boolean; remaining: number }> {
  try {
    const limiters = getRateLimiters();
    if (!limiters) {
      // Fallback: allow if Redis is not configured in local development
      return { success: true, remaining: 40 };
    }
    const res = await limiters.uploadRatelimit.limit(ip);
    return { success: res.success, remaining: res.remaining };
  } catch (err) {
    console.error('[Redis RateLimit] Upload limit check failed, failing safely:', err);
    return { success: true, remaining: 1 };
  }
}

/**
 * Check rate limit for passcode verification (10 attempts / 15 min per tokenHash + IP)
 */
export async function checkPasscodeRateLimit(
  tokenHash: string,
  ip: string
): Promise<{ success: boolean; remaining: number }> {
  try {
    const limiters = getRateLimiters();
    if (!limiters) {
      return { success: true, remaining: 10 };
    }
    const identifier = `${tokenHash}:${ip}`;
    const res = await limiters.passcodeRatelimit.limit(identifier);
    return { success: res.success, remaining: res.remaining };
  } catch (err) {
    console.error('[Redis RateLimit] Passcode limit check failed, failing safely:', err);
    return { success: true, remaining: 1 };
  }
}

/**
 * Check rate limit for QR generation/scan requests (60 / 15 min / IP)
 */
export async function checkQrRateLimit(ip: string): Promise<{ success: boolean; remaining: number }> {
  try {
    const limiters = getRateLimiters();
    if (!limiters) {
      return { success: true, remaining: 60 };
    }
    const res = await limiters.qrRatelimit.limit(ip);
    return { success: res.success, remaining: res.remaining };
  } catch (err) {
    console.error('[Redis RateLimit] QR limit check failed, failing safely:', err);
    return { success: true, remaining: 1 };
  }
}

/**
 * Check rate limit for admin login attempts (5 attempts / 15 min per IP)
 */
export async function checkAdminLoginRateLimit(ip: string): Promise<{ success: boolean; remaining: number }> {
  try {
    const limiters = getRateLimiters();
    if (!limiters || !limiters.adminLoginRatelimit) {
      return { success: true, remaining: 5 };
    }
    const res = await limiters.adminLoginRatelimit.limit(ip);
    return { success: res.success, remaining: res.remaining };
  } catch (err) {
    console.error('[Redis RateLimit] Admin login limit check failed, failing safely:', err);
    return { success: true, remaining: 1 };
  }
}

/**
 * Check rate limit for admin password reset requests (3 attempts / 1 hour per IP)
 */
export async function checkPasswordResetRateLimit(ip: string): Promise<{ success: boolean; remaining: number }> {
  try {
    const limiters = getRateLimiters();
    if (!limiters || !limiters.passwordResetRatelimit) {
      return { success: true, remaining: 3 };
    }
    const res = await limiters.passwordResetRatelimit.limit(ip);
    return { success: res.success, remaining: res.remaining };
  } catch (err) {
    console.error('[Redis RateLimit] Password reset limit check failed, failing safely:', err);
    return { success: true, remaining: 1 };
  }
}


/**
 * Temporary Upload Reservation
 * Stores non-sensitive metadata for pending uploads with a 1-hour TTL.
 */
export interface UploadReservation {
  fileId: string;
  storageKey: string;
  expectedSize: number;
  originalName: string;
  mimeType: string;
  tokenHash: string;
  createdAt: number;
}

export async function createUploadReservation(
  fileId: string,
  reservation: UploadReservation,
  ttlSeconds: number = 3600
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.set(`upload:${fileId}`, JSON.stringify(reservation), { ex: ttlSeconds });
  } catch (err) {
    console.error('[Redis] Failed to create upload reservation:', err);
  }
}

export async function getUploadReservation(fileId: string): Promise<UploadReservation | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const data = await redis.get<string | UploadReservation>(`upload:${fileId}`);
    if (!data) return null;
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (err) {
    console.error('[Redis] Failed to get upload reservation:', err);
    return null;
  }
}

export async function deleteUploadReservation(fileId: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.del(`upload:${fileId}`);
  } catch (err) {
    console.error('[Redis] Failed to delete upload reservation:', err);
  }
}

/**
 * Security: Track and lock out brute force passcode attempts
 */
export async function recordFailedPasscodeAttempt(tokenHash: string, ip: string): Promise<number> {
  const redis = getRedisClient();
  if (!redis) return 1;

  try {
    const key = `lockout:${tokenHash}:${ip}`;
    const attempts = await redis.incr(key);
    if (attempts === 1) {
      await redis.expire(key, 900); // 15-minute window
    }
    return attempts;
  } catch (err) {
    console.error('[Redis] Failed to record failed passcode attempt:', err);
    return 1;
  }
}

export async function isPasscodeLocked(tokenHash: string, ip: string): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;

  try {
    const key = `lockout:${tokenHash}:${ip}`;
    const attempts = await redis.get<number>(key);
    return Boolean(attempts && attempts >= 10);
  } catch (err) {
    return false;
  }
}

export async function clearFailedPasscodeAttempts(tokenHash: string, ip: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.del(`lockout:${tokenHash}:${ip}`);
  } catch (err) {
    console.error('[Redis] Failed to clear failed passcode attempts:', err);
  }
}
