import { Request, Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { FileDrop } from '../models/FileDrop.js';
import { getStorageService } from '../storage/index.js';
import {
  checkUploadRateLimit,
  checkPasscodeRateLimit,
  createUploadReservation,
  deleteUploadReservation,
  recordFailedPasscodeAttempt,
  isPasscodeLocked,
  clearFailedPasscodeAttempts,
} from '../services/redisService.js';
import {
  generateSecureToken,
  hashToken,
  hashPasscode,
  verifyPasscode,
  generateDownloadAuthTicket,
  verifyDownloadAuthTicket,
  sanitizeFilename,
} from '../utils/crypto.js';

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.toString().split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

/**
 * Step 1: Request presigned B2 upload URL
 * Client sends metadata only: { filename, mimeType, size, passcode }
 */
export async function createUploadUrlHandler(req: Request, res: Response): Promise<void> {
  try {
    const clientIp = getClientIp(req);
    const rateCheck = await checkUploadRateLimit(clientIp);
    if (!rateCheck.success) {
      res.status(429).json({
        error: 'Upload rate limit exceeded. Please try again later.',
      });
      return;
    }

    const { filename, mimeType, size, passcode } = req.body;

    if (!filename || typeof filename !== 'string') {
      res.status(400).json({ error: 'Filename is required' });
      return;
    }

    if (!passcode || typeof passcode !== 'string' || passcode.trim().length < 1) {
      res.status(400).json({ error: 'A passcode is required to protect this file' });
      return;
    }

    const fileSizeNum = Number(size);
    if (isNaN(fileSizeNum) || fileSizeNum <= 0) {
      res.status(400).json({ error: 'Valid file size is required' });
      return;
    }

    const maxBytes = config.maxFileSizeMb * 1024 * 1024;
    if (fileSizeNum > maxBytes) {
      res.status(413).json({
        error: `File exceeds maximum allowed size of ${config.maxFileSizeMb}MB`,
      });
      return;
    }

    const sanitizedName = sanitizeFilename(filename);
    const fileId = crypto.randomUUID();
    const publicToken = generateSecureToken(24);
    const tokenHashValue = hashToken(publicToken);
    const hashedPasscode = await hashPasscode(passcode.trim());

    // Secure, non-colliding storage key: drops/<fileId>/<random8>_<name>
    const randomSuffix = crypto.randomBytes(6).toString('hex');
    const storageKey = `drops/${fileId}/${randomSuffix}_${sanitizedName}`;

    // Get presigned PUT URL from Backblaze B2 storage provider
    const storage = getStorageService();
    const uploadUrl = await storage.getUploadPresignedUrl(
      storageKey,
      mimeType || 'application/octet-stream',
      300
    );

    const createdAt = new Date();
    // Temporary expiration for pending drops (10 days from now)
    const expiresAt = new Date(createdAt.getTime() + config.fileExpirationDays * 24 * 60 * 60 * 1000);

    // Create pending document in MongoDB
    if (mongoose.connection.readyState === 1) {
      const record = new FileDrop({
        fileId,
        tokenHash: tokenHashValue,
        originalName: sanitizedName,
        mimeType: mimeType || 'application/octet-stream',
        size: fileSizeNum,
        storageKey,
        passcodeHash: hashedPasscode,
        createdAt,
        expiresAt,
        status: 'pending',
        downloadCount: 0,
      });

      await record.save();
    }

    // Store temporary reservation in Redis (1-hour TTL)
    await createUploadReservation(
      fileId,
      {
        fileId,
        storageKey,
        expectedSize: fileSizeNum,
        originalName: sanitizedName,
        mimeType: mimeType || 'application/octet-stream',
        tokenHash: tokenHashValue,
        createdAt: Date.now(),
      },
      3600
    );

    res.status(201).json({
      success: true,
      uploadUrl,
      fileId,
      token: publicToken,
      storageKey,
    });
  } catch (err: any) {
    console.error('[UploadUrlHandler] Error creating upload reservation:', err);
    res.status(500).json({ error: 'Failed to create upload authorization' });
  }
}

/**
 * Step 2: Complete and verify upload
 * Client notifies backend after direct B2 PUT: { fileId, token }
 */
export async function completeUploadHandler(req: Request, res: Response): Promise<void> {
  try {
    const { fileId, token } = req.body;

    if (!fileId || !token) {
      res.status(400).json({ error: 'fileId and token are required' });
      return;
    }

    const tokenHashValue = hashToken(token);
    const file = await FileDrop.findOne({ fileId, tokenHash: tokenHashValue });

    if (!file) {
      res.status(404).json({ error: 'Pending upload reservation not found or invalid' });
      return;
    }

    if (file.status === 'active') {
      // Already activated
      res.json({
        success: true,
        token,
        publicUrl: `${config.publicBaseUrl}/f/${token}`,
        file: {
          fileId: file.fileId,
          originalName: file.originalName,
          mimeType: file.mimeType,
          size: file.size,
          createdAt: file.createdAt.toISOString(),
          expiresAt: file.expiresAt.toISOString(),
          expirationDays: config.fileExpirationDays,
        },
      });
      return;
    }

    if (file.status !== 'pending') {
      res.status(409).json({ error: 'This drop cannot be activated' });
      return;
    }

    // Verify actual object presence and size in Backblaze B2
    const storage = getStorageService();
    if (storage.headObject) {
      const head = await storage.headObject(file.storageKey);
      if (!head.exists) {
        res.status(400).json({
          error: 'File not found in storage. Upload may have failed or was cancelled.',
        });
        return;
      }

      if (head.size > 0 && Math.abs(head.size - file.size) > 0) {
        console.warn(`[CompleteUpload] Size mismatch: expected ${file.size}, got ${head.size}`);
      }
    }

    // Activate the drop and set exact expiration to 10 days from now
    const now = new Date();
    file.status = 'active';
    file.createdAt = now;
    file.expiresAt = new Date(now.getTime() + config.fileExpirationDays * 24 * 60 * 60 * 1000);
    await file.save();

    // Clean up Redis reservation
    await deleteUploadReservation(fileId);

    const publicUrl = `${config.publicBaseUrl}/f/${token}`;

    res.json({
      success: true,
      token,
      publicUrl,
      file: {
        fileId: file.fileId,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        createdAt: file.createdAt.toISOString(),
        expiresAt: file.expiresAt.toISOString(),
        expirationDays: config.fileExpirationDays,
      },
    });
  } catch (err: any) {
    console.error('[CompleteUploadHandler] Error activating upload:', err);
    res.status(500).json({ error: 'Failed to finalize upload' });
  }
}

/**
 * Get metadata for public drop access page
 */
export async function getFileMetadataHandler(req: Request, res: Response): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
        error: 'DATABASE NOT CONNECTED',
        message: 'Database is not connected. Please configure MONGODB_URI in backend/.env or Vercel settings.',
      });
      return;
    }

    const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
    if (!token) {
      res.status(400).json({ error: 'Token parameter is required' });
      return;
    }

    const tokenHashValue = hashToken(token);
    const file = await FileDrop.findOne({ tokenHash: tokenHashValue });

    if (!file || file.status === 'deleted') {
      res.status(404).json({
        error: 'DROP NOT FOUND',
        message: 'This link is invalid or no longer available.',
      });
      return;
    }

    if (file.status === 'pending') {
      res.status(404).json({
        error: 'DROP PENDING',
        message: 'This upload has not been finalized.',
      });
      return;
    }

    const now = new Date();
    if (file.status === 'expired' || file.expiresAt <= now) {
      if (file.status === 'active') {
        file.status = 'expired';
        await file.save();
      }

      res.status(410).json({
        error: 'THIS DROP HAS DISAPPEARED.',
        message: `This file was automatically deleted after ${config.fileExpirationDays} days.`,
        isExpired: true,
        expiresAt: file.expiresAt.toISOString(),
      });
      return;
    }

    res.json({
      fileId: file.fileId,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      createdAt: file.createdAt.toISOString(),
      expiresAt: file.expiresAt.toISOString(),
      isExpired: false,
      status: file.status,
    });
  } catch (err: any) {
    console.error('[MetadataHandler] Error retrieving file metadata:', err);
    res.status(500).json({ error: 'Failed to retrieve file details' });
  }
}

/**
 * Verify passcode and issue short-lived access ticket & presigned download URLs
 */
export async function verifyPasscodeHandler(req: Request, res: Response): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
        error: 'DATABASE NOT CONNECTED',
        message: 'Database is not connected. Please configure MONGODB_URI in backend/.env or Vercel settings.',
      });
      return;
    }

    const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
    const { passcode } = req.body;
    const clientIp = getClientIp(req);

    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    if (!passcode || typeof passcode !== 'string') {
      res.status(400).json({ error: 'Passcode is required' });
      return;
    }

    const tokenHashValue = hashToken(token);

    // Redis lockout and rate limit check
    const locked = await isPasscodeLocked(tokenHashValue, clientIp);
    if (locked) {
      res.status(429).json({
        error: 'Too many incorrect attempts. This drop is temporarily locked for 15 minutes.',
      });
      return;
    }

    const rate = await checkPasscodeRateLimit(tokenHashValue, clientIp);
    if (!rate.success) {
      res.status(429).json({
        error: 'Too many attempts. Please try again in 15 minutes.',
      });
      return;
    }

    const file = await FileDrop.findOne({ tokenHash: tokenHashValue });

    if (!file || file.status === 'deleted') {
      res.status(404).json({ error: 'DROP NOT FOUND' });
      return;
    }

    const now = new Date();
    if (file.status !== 'active' || file.expiresAt <= now) {
      res.status(410).json({
        error: 'THIS DROP HAS DISAPPEARED.',
        message: 'This file has expired and is no longer accessible.',
        isExpired: true,
      });
      return;
    }

    const isMatch = await verifyPasscode(passcode.trim(), file.passcodeHash);
    if (!isMatch) {
      const attempts = await recordFailedPasscodeAttempt(tokenHashValue, clientIp);
      const remaining = Math.max(0, 10 - attempts);

      res.status(401).json({
        error: 'Incorrect passcode. Access denied.',
        attemptsRemaining: remaining,
      });
      return;
    }

    // Success - clear failed attempts
    await clearFailedPasscodeAttempts(tokenHashValue, clientIp);

    // Generate short-lived HMAC download ticket
    const ticket = generateDownloadAuthTicket(file.fileId);

    // Generate direct Backblaze B2 presigned download and preview URLs
    const storage = getStorageService();
    const downloadUrl = await storage.getDownloadPresignedUrl(file.storageKey, file.originalName, false, 900);
    const previewUrl = await storage.getDownloadPresignedUrl(file.storageKey, file.originalName, true, 900);

    file.downloadCount += 1;
    await file.save();

    res.json({
      success: true,
      ticket,
      downloadUrl,
      previewUrl,
      file: {
        fileId: file.fileId,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
      },
    });
  } catch (err: any) {
    console.error('[VerifyHandler] Passcode verification error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
}

/**
 * Direct file download endpoint (redirects to B2 presigned GET or streams local file)
 */
export async function downloadFileHandler(req: Request, res: Response): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
        error: 'DATABASE NOT CONNECTED',
        message: 'Database is not connected. Please configure MONGODB_URI in backend/.env or Vercel settings.',
      });
      return;
    }

    const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
    const ticket = (req.query.ticket as string) || (req.headers['x-download-ticket'] as string);

    if (!token || !ticket) {
      res.status(403).json({ error: 'Unauthorized: Passcode verification required' });
      return;
    }

    const tokenHashValue = hashToken(token);
    const file = await FileDrop.findOne({ tokenHash: tokenHashValue });

    if (!file || !file.storageKey) {
      res.status(404).json({ error: 'File not available' });
      return;
    }

    if (file.status !== 'active' || file.expiresAt <= new Date()) {
      res.status(410).json({ error: 'THIS DROP HAS DISAPPEARED.' });
      return;
    }

    const isValidTicket = verifyDownloadAuthTicket(file.fileId, ticket);
    if (!isValidTicket) {
      res.status(403).json({ error: 'Download ticket expired or invalid' });
      return;
    }

    const storage = getStorageService();
    const presignedUrl = await storage.getDownloadPresignedUrl(file.storageKey, file.originalName, false, 900);
    res.redirect(302, presignedUrl);
  } catch (err: any) {
    console.error('[DownloadHandler] Download error:', err);
    res.status(500).json({ error: 'Failed to download file' });
  }
}

/**
 * In-browser file preview endpoint
 */
export async function previewFileHandler(req: Request, res: Response): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
        error: 'DATABASE NOT CONNECTED',
        message: 'Database is not connected. Please configure MONGODB_URI in backend/.env or Vercel settings.',
      });
      return;
    }

    const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
    const ticket = (req.query.ticket as string) || (req.headers['x-download-ticket'] as string);

    if (!token || !ticket) {
      res.status(403).json({ error: 'Unauthorized: Passcode verification required' });
      return;
    }

    const tokenHashValue = hashToken(token);
    const file = await FileDrop.findOne({ tokenHash: tokenHashValue });

    if (!file || !file.storageKey) {
      res.status(404).json({ error: 'File not available' });
      return;
    }

    if (file.status !== 'active' || file.expiresAt <= new Date()) {
      res.status(410).json({ error: 'THIS DROP HAS DISAPPEARED.' });
      return;
    }

    const isValidTicket = verifyDownloadAuthTicket(file.fileId, ticket);
    if (!isValidTicket) {
      res.status(403).json({ error: 'Download ticket expired or invalid' });
      return;
    }

    const storage = getStorageService();
    const presignedUrl = await storage.getDownloadPresignedUrl(file.storageKey, file.originalName, true, 900);
    res.redirect(302, presignedUrl);
  } catch (err: any) {
    console.error('[PreviewHandler] Preview error:', err);
    res.status(500).json({ error: 'Failed to preview file' });
  }
}
