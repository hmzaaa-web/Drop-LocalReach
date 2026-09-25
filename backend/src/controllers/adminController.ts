import { Request, Response } from 'express';
import {
  verifyAdminPassword,
  createSessionToken,
  setAdminSessionCookie,
  clearAdminSessionCookie,
  verifySessionToken,
  ADMIN_COOKIE_NAME,
} from '../utils/adminAuth.js';
import { parseCookies } from '../utils/cookies.js';
import { checkAdminLoginRateLimit } from '../services/redisService.js';
import { getB2StorageStats } from '../services/b2AdminService.js';
import { getMongoStorageStats, getDropStats } from '../services/mongoAdminService.js';
import { getRedisStorageStats } from '../services/redisAdminService.js';
import { getVercelAnalyticsStats } from '../services/vercelAnalyticsService.js';
import { getSystemHealthReport } from '../services/healthService.js';

/**
 * Handle admin login with rate limiting and secure HttpOnly cookie creation
 */
export async function login(req: Request, res: Response): Promise<void> {
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || '127.0.0.1';

  // 1. Check rate limit
  const rateLimitResult = await checkAdminLoginRateLimit(clientIp);
  if (!rateLimitResult.success) {
    res.status(429).json({
      error: 'Too many login attempts. Please wait 15 minutes before trying again.',
      remaining: 0,
    });
    return;
  }

  const { password } = req.body;
  if (!password || typeof password !== 'string') {
    res.status(400).json({ error: 'Password is required' });
    return;
  }

  // 2. Verify password with constant-time comparison
  const isValid = verifyAdminPassword(password);
  if (!isValid) {
    res.status(401).json({
      error: 'Invalid admin credentials',
      remaining: rateLimitResult.remaining,
    });
    return;
  }

  // 3. Issue cryptographically signed session cookie
  const sessionToken = createSessionToken();
  setAdminSessionCookie(res, sessionToken);

  res.json({
    success: true,
    message: 'Admin authenticated successfully',
  });
}

/**
 * Handle admin logout by clearing the session cookie
 */
export async function logout(_req: Request, res: Response): Promise<void> {
  clearAdminSessionCookie(res);
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
}

/**
 * Check current session validity
 */
export async function getSession(req: Request, res: Response): Promise<void> {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[ADMIN_COOKIE_NAME];
  const authenticated = verifySessionToken(token);

  res.json({
    authenticated,
  });
}

/**
 * Retrieve dashboard overview statistics (Vercel Analytics + MongoDB FileDrop metrics)
 */
export async function getOverview(_req: Request, res: Response): Promise<void> {
  try {
    const [analytics, drops] = await Promise.all([
      getVercelAnalyticsStats(),
      getDropStats(),
    ]);

    res.json({
      analytics,
      drops,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[AdminController] Failed to get overview stats:', err);
    res.status(500).json({
      error: 'Failed to retrieve overview statistics',
      message: err?.message || 'Internal server error',
    });
  }
}

/**
 * Retrieve real storage metrics across Backblaze B2, MongoDB Atlas, and Upstash Redis
 */
export async function getStorage(req: Request, res: Response): Promise<void> {
  try {
    const forceRefresh = req.query.refresh === 'true';

    const [b2, mongo, redis] = await Promise.all([
      getB2StorageStats(forceRefresh),
      getMongoStorageStats(),
      getRedisStorageStats(),
    ]);

    res.json({
      b2,
      mongo,
      redis,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[AdminController] Failed to get storage stats:', err);
    res.status(500).json({
      error: 'Failed to retrieve storage statistics',
      message: err?.message || 'Internal server error',
    });
  }
}

/**
 * Retrieve real service connectivity and response times
 */
export async function getHealth(_req: Request, res: Response): Promise<void> {
  try {
    const report = await getSystemHealthReport();
    res.json(report);
  } catch (err: any) {
    console.error('[AdminController] Failed to get health report:', err);
    res.status(500).json({
      error: 'Failed to retrieve service health',
      message: err?.message || 'Internal server error',
    });
  }
}
