import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import {
  verifyAdminPasswordAsync,
  createSessionToken,
  setAdminSessionCookie,
  clearAdminSessionCookie,
  verifySessionToken,
  ADMIN_COOKIE_NAME,
} from '../utils/adminAuth.js';
import { parseCookies } from '../utils/cookies.js';
import { checkAdminLoginRateLimit, checkPasswordResetRateLimit } from '../services/redisService.js';
import { getB2StorageStats } from '../services/b2AdminService.js';
import { getMongoStorageStats, getDropStats } from '../services/mongoAdminService.js';
import { getRedisStorageStats } from '../services/redisAdminService.js';
import { getVercelAnalyticsStats } from '../services/vercelAnalyticsService.js';
import { getSystemHealthReport } from '../services/healthService.js';
import { AdminCredential } from '../models/AdminCredential.js';
import { AdminPasswordReset } from '../models/AdminPasswordReset.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

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

  // 2. Verify password (checks DB credential first, then bootstrap env password)
  const isValid = await verifyAdminPasswordAsync(password);
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

/**
 * Request a single-use password reset link dispatched via email
 */
export async function requestPasswordReset(req: Request, res: Response): Promise<void> {
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || '127.0.0.1';

  // 1. Enforce strict rate limit (3 attempts per hour per IP)
  const rateLimitResult = await checkPasswordResetRateLimit(clientIp);
  if (!rateLimitResult.success) {
    res.status(429).json({
      error: 'Too many password reset requests. Please wait an hour before trying again.',
      remaining: 0,
    });
    return;
  }

  try {
    // 2. Generate 32-byte cryptographically secure random token (64 hex chars)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15-minute window

    // 3. Invalidate previous pending reset tokens and store new token hash
    await AdminPasswordReset.updateMany({ used: false }, { $set: { used: true } });
    await AdminPasswordReset.create({
      tokenHash,
      expiresAt,
      used: false,
    });

    // 4. Dispatch email via Resend
    await sendPasswordResetEmail(rawToken, expiresAt);

    // 5. Always return generic success to prevent account or email enumeration
    res.json({
      success: true,
      message: 'If an admin recovery address is configured, a password reset link has been dispatched.',
    });
  } catch (err: any) {
    console.error('[AdminController] Failed to process password reset request:', err);
    res.status(500).json({
      error: 'Failed to process password reset request',
      message: err?.message || 'Internal server error',
    });
  }
}

/**
 * Verify if a password reset token is valid, unused, and within the 15-minute window
 */
export async function verifyResetToken(req: Request, res: Response): Promise<void> {
  const token = req.query.token;
  if (!token || typeof token !== 'string') {
    res.status(400).json({ valid: false, message: 'Reset token is required.' });
    return;
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const record = await AdminPasswordReset.findOne({
      tokenHash,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      res.status(400).json({ valid: false, message: 'Password reset link is invalid or has expired.' });
      return;
    }

    res.json({ valid: true });
  } catch (err: any) {
    console.error('[AdminController] Failed to verify reset token:', err);
    res.status(500).json({ valid: false, message: 'Failed to verify token' });
  }
}

/**
 * Confirm password reset and update credentials in MongoDB
 */
export async function confirmPasswordReset(req: Request, res: Response): Promise<void> {
  const { token, newPassword } = req.body;

  if (!token || typeof token !== 'string') {
    res.status(400).json({ error: 'Valid reset token is required' });
    return;
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters long' });
    return;
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const record = await AdminPasswordReset.findOne({
      tokenHash,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      res.status(400).json({ error: 'Password reset link is invalid or has expired.' });
      return;
    }

    // Hash new password using bcrypt (work factor 12)
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Persist new credential into MongoDB
    await AdminCredential.findOneAndUpdate(
      { role: 'admin' },
      { role: 'admin', passwordHash, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    // Invalidate reset token immediately to guarantee single-use
    record.used = true;
    await record.save();

    res.json({
      success: true,
      message: 'Admin password has been reset successfully. You may now log in.',
    });
  } catch (err: any) {
    console.error('[AdminController] Failed to confirm password reset:', err);
    res.status(500).json({
      error: 'Failed to reset admin password',
      message: err?.message || 'Internal server error',
    });
  }
}
