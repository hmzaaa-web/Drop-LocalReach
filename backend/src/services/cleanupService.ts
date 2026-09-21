import mongoose from 'mongoose';
import { FileDrop } from '../models/FileDrop.js';
import { getStorageService } from '../storage/index.js';
import { ensureDatabaseConnected } from '../db/connect.js';

export interface CleanupResult {
  cleanedCount: number;
  abandonedCount: number;
}

/**
 * Cleanup expired and abandoned drops from Backblaze B2 and MongoDB
 */
export async function cleanupExpiredFiles(): Promise<CleanupResult> {
  let cleanedCount = 0;
  let abandonedCount = 0;

  try {
    const isDbConnected = await ensureDatabaseConnected();
    if (!isDbConnected) {
      return { cleanedCount: 0, abandonedCount: 0 };
    }

    const now = new Date();
    const storage = getStorageService();

    // 1. Find all files that are expired or past their expiresAt
    const expiredFiles = await FileDrop.find({
      $or: [
        { expiresAt: { $lte: now } },
        { status: 'expired' },
      ],
      status: { $ne: 'deleted' },
    });

    if (expiredFiles.length > 0) {
      console.log(`[CleanupService] Processing ${expiredFiles.length} expired drop(s)...`);

      for (const file of expiredFiles) {
        try {
          if (file.storageKey) {
            if (storage.deleteAllVersions) {
              await storage.deleteAllVersions(file.storageKey);
            } else {
              await storage.delete(file.storageKey);
            }
          }

          file.status = 'deleted';
          file.storageKey = '';
          file.passcodeHash = '';
          await file.save();

          cleanedCount++;
          console.log(`[CleanupService] Purged expired drop: ${file.fileId}`);
        } catch (err: any) {
          console.error(`[CleanupService] Failed to purge drop ${file.fileId}:`, err?.message || err);
        }
      }
    }

    // 2. Find abandoned pending uploads older than 2 hours
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const abandonedFiles = await FileDrop.find({
      status: 'pending',
      createdAt: { $lte: twoHoursAgo },
    });

    if (abandonedFiles.length > 0) {
      console.log(`[CleanupService] Processing ${abandonedFiles.length} abandoned pending upload(s)...`);

      for (const file of abandonedFiles) {
        try {
          if (file.storageKey) {
            if (storage.deleteAllVersions) {
              await storage.deleteAllVersions(file.storageKey);
            } else {
              await storage.delete(file.storageKey);
            }
          }

          file.status = 'deleted';
          file.storageKey = '';
          file.passcodeHash = '';
          await file.save();

          abandonedCount++;
          console.log(`[CleanupService] Purged abandoned drop: ${file.fileId}`);
        } catch (err: any) {
          console.error(`[CleanupService] Failed to purge abandoned drop ${file.fileId}:`, err?.message || err);
        }
      }
    }

    console.log(
      `[CleanupService] Cleanup complete. Expired purged: ${cleanedCount}, Abandoned purged: ${abandonedCount}`
    );
    return { cleanedCount, abandonedCount };
  } catch (err: any) {
    console.error('[CleanupService] Error during cleanup execution:', err?.message || err);
    return { cleanedCount, abandonedCount };
  }
}

/**
 * Initialize background cleanup scheduler for local development server
 */
export function initCleanupJob(): void {
  // Run hourly
  setInterval(async () => {
    console.log('[CleanupService] Running scheduled hourly cleanup...');
    await cleanupExpiredFiles();
  }, 3600000);

  // Initial check after 10s
  setTimeout(async () => {
    console.log('[CleanupService] Running initial startup cleanup check...');
    await cleanupExpiredFiles();
  }, 10000);
}

