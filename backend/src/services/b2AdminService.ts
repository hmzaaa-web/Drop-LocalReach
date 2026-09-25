import { getStorageService } from '../storage/index.js';
import { config } from '../config/index.js';

export interface B2StorageStats {
  status: 'CONNECTED' | 'ERROR';
  usedBytes: number;
  limitBytes: number;
  remainingBytes: number;
  percentage: number;
  objectCount: number;
  bucketName: string;
  cached: boolean;
  lastUpdated: string;
  error?: string;
}

export const B2_FREE_PLAN_LIMIT_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

let memoryCache: {
  stats: B2StorageStats;
  timestamp: number;
} | null = null;

/**
 * Get real Backblaze B2 storage statistics from actual objects in the bucket.
 * Caches the calculated value for 3 minutes to avoid excessive B2 API calls.
 */
export async function getB2StorageStats(forceRefresh: boolean = false): Promise<B2StorageStats> {
  const now = Date.now();

  if (!forceRefresh && memoryCache && now - memoryCache.timestamp < CACHE_TTL_MS) {
    return {
      ...memoryCache.stats,
      cached: true,
    };
  }

  try {
    const storageService = getStorageService();
    const { totalBytes, objectCount } = await storageService.calculateStorageUsage();

    const remainingBytes = Math.max(0, B2_FREE_PLAN_LIMIT_BYTES - totalBytes);
    const percentage = Number(((totalBytes / B2_FREE_PLAN_LIMIT_BYTES) * 100).toFixed(2));

    const stats: B2StorageStats = {
      status: 'CONNECTED',
      usedBytes: totalBytes,
      limitBytes: B2_FREE_PLAN_LIMIT_BYTES,
      remainingBytes,
      percentage,
      objectCount,
      bucketName: config.b2.bucketName,
      cached: false,
      lastUpdated: new Date().toISOString(),
    };

    memoryCache = {
      stats,
      timestamp: now,
    };

    return stats;
  } catch (err: any) {
    console.error('[B2AdminService] Failed to calculate B2 storage usage:', err);
    return {
      status: 'ERROR',
      usedBytes: memoryCache?.stats.usedBytes || 0,
      limitBytes: B2_FREE_PLAN_LIMIT_BYTES,
      remainingBytes: memoryCache?.stats.remainingBytes || B2_FREE_PLAN_LIMIT_BYTES,
      percentage: memoryCache?.stats.percentage || 0,
      objectCount: memoryCache?.stats.objectCount || 0,
      bucketName: config.b2.bucketName,
      cached: false,
      lastUpdated: new Date().toISOString(),
      error: err?.message || 'Failed to list Backblaze B2 bucket objects',
    };
  }
}

/**
 * Check connectivity and latency to Backblaze B2
 */
export async function checkB2Health(): Promise<{ status: 'CONNECTED' | 'ERROR'; latencyMs: number; error?: string }> {
  try {
    const storageService = getStorageService();
    const res = await storageService.checkConnectivity();
    return {
      status: res.connected ? 'CONNECTED' : 'ERROR',
      latencyMs: res.latencyMs,
      error: res.error,
    };
  } catch (err: any) {
    return {
      status: 'ERROR',
      latencyMs: 0,
      error: err?.message || 'B2 connection failed',
    };
  }
}
