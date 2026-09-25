import { Request, Response, NextFunction } from 'express';
import { parseCookies } from '../utils/cookies.js';
import { ADMIN_COOKIE_NAME, verifySessionToken } from '../utils/adminAuth.js';

/**
 * Express middleware to protect all /api/admin/* endpoints
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const cookies = parseCookies(req.headers.cookie);
  const sessionToken = cookies[ADMIN_COOKIE_NAME];

  if (!sessionToken || !verifySessionToken(sessionToken)) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Admin session is invalid or expired. Please sign in again.',
    });
    return;
  }

  next();
}
