import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import path from 'path';
import { config } from '../config/index.js';

/**
 * Generate cryptographically random, URL-safe access token
 */
export function generateSecureToken(byteLength = 24): string {
  return crypto.randomBytes(byteLength).toString('base64url');
}

/**
 * Compute SHA-256 hash of public token for storage in DB
 */
export function hashToken(token: string): string {
  return crypto
    .createHmac('sha256', config.tokenSecret)
    .update(token)
    .digest('hex');
}

/**
 * Hash a passcode using bcrypt
 */
export async function hashPasscode(passcode: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(passcode, salt);
}

/**
 * Verify passcode against bcrypt hash
 */
export async function verifyPasscode(passcode: string, hash: string): Promise<boolean> {
  return bcrypt.compare(passcode, hash);
}

/**
 * Generate a short-lived download authorization ticket / token
 */
export function generateDownloadAuthTicket(fileId: string): string {
  const timestamp = Date.now();
  const data = `${fileId}:${timestamp}`;
  const signature = crypto
    .createHmac('sha256', config.tokenSecret)
    .update(data)
    .digest('hex');
  return Buffer.from(`${data}:${signature}`).toString('base64url');
}

/**
 * Validate download authorization ticket (valid for 1 hour)
 */
export function verifyDownloadAuthTicket(fileId: string, ticket: string): boolean {
  try {
    const decoded = Buffer.from(ticket, 'base64url').toString('utf8');
    const [ticketFileId, timestampStr, signature] = decoded.split(':');
    if (ticketFileId !== fileId) return false;

    const timestamp = parseInt(timestampStr, 10);
    const maxAgeMs = 60 * 60 * 1000; // 1 hour
    if (Date.now() - timestamp > maxAgeMs) return false;

    const expectedSignature = crypto
      .createHmac('sha256', config.tokenSecret)
      .update(`${ticketFileId}:${timestampStr}`)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * Sanitize filename to prevent directory traversal and null byte injections
 */
export function sanitizeFilename(rawName: string): string {
  if (!rawName) return 'unnamed_file';
  // Remove path traversal and control characters
  let clean = path.basename(rawName).replace(/[\0\x00-\x1f\x7f-\x9f]/g, '');
  // Remove any remaining dangerous characters
  clean = clean.replace(/[/\\?%*:|"<>]/g, '_');
  // Trim spaces and limit length
  clean = clean.trim().slice(0, 200);
  return clean || 'unnamed_file';
}
