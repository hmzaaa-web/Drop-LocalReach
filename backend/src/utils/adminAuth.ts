import crypto from 'crypto';
import { Response } from 'express';
import { config } from '../config/index.js';

export const ADMIN_COOKIE_NAME = 'drop_admin_session';
export const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Constant-time password check to prevent timing analysis attacks
 */
export function verifyAdminPassword(inputPassword: string): boolean {
  if (!config.admin.password || !inputPassword) {
    return false;
  }

  const inputHash = crypto.createHash('sha256').update(String(inputPassword)).digest();
  const expectedHash = crypto.createHash('sha256').update(String(config.admin.password)).digest();

  return crypto.timingSafeEqual(inputHash, expectedHash);
}

/**
 * Generate a cryptographically signed, stateless session token
 */
export function createSessionToken(): string {
  const timestamp = Date.now().toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = `${timestamp}.${nonce}`;

  const signature = crypto
    .createHmac('sha256', config.admin.sessionSecret)
    .update(payload)
    .digest('hex');

  return `${payload}.${signature}`;
}

/**
 * Verify a session token's cryptographic signature and freshness
 */
export function verifySessionToken(token?: string): boolean {
  if (!token) return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [timestampStr, nonce, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);

  if (isNaN(timestamp)) return false;

  // Check expiration (24h)
  const age = Date.now() - timestamp;
  if (age < 0 || age > SESSION_MAX_AGE_MS) {
    return false;
  }

  // Recompute HMAC signature
  const payload = `${timestampStr}.${nonce}`;
  const expectedSignature = crypto
    .createHmac('sha256', config.admin.sessionSecret)
    .update(payload)
    .digest('hex');

  const sigBuffer = Buffer.from(signature, 'hex');
  const expectedSigBuffer = Buffer.from(expectedSignature, 'hex');

  if (sigBuffer.length !== expectedSigBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuffer, expectedSigBuffer);
}

/**
 * Attach the secure HttpOnly admin session cookie to the response
 */
export function setAdminSessionCookie(res: Response, token: string): void {
  const isProduction = config.nodeEnv === 'production';

  res.cookie(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_MAX_AGE_MS,
  });
}

/**
 * Clear the admin session cookie on logout
 */
export function clearAdminSessionCookie(res: Response): void {
  const isProduction = config.nodeEnv === 'production';

  res.clearCookie(ADMIN_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
  });
}
