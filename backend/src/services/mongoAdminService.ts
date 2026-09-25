import mongoose from 'mongoose';
import { ensureDatabaseConnected } from '../db/connect.js';
import { FileDrop } from '../models/FileDrop.js';

export const MONGO_FREE_PLAN_LIMIT_BYTES = 512 * 1024 * 1024; // 512 MB

export interface MongoStorageStats {
  status: 'CONNECTED' | 'ERROR';
  databaseName: string;
  collectionsCount: number;
  documentsCount: number;
  dataSize: number;       // Uncompressed BSON data size in bytes
  indexSize: number;      // Total index size in bytes
  storageSize: number;    // Allocated on-disk storage size in bytes
  usedBytes: number;      // dataSize + indexSize (Atlas Free Tier measurement)
  limitBytes: number;
  remainingBytes: number;
  percentage: number;
  lastUpdated: string;
  error?: string;
}

export interface DropStats {
  totalDrops: number;
  activeDrops: number;
  expiredDrops: number;
  totalFiles: number;
  totalSizeBytes: number;
  recentDrops: Array<{
    fileId: string;
    originalName: string;
    size: number;
    mimeType: string;
    createdAt: Date;
    expiresAt: Date;
    status: string;
    downloadCount: number;
  }>;
}

/**
 * Get real MongoDB database storage stats according to Atlas Free Tier definition (uncompressed data + indexes)
 */
export async function getMongoStorageStats(): Promise<MongoStorageStats> {
  const isConnected = await ensureDatabaseConnected();

  if (!isConnected || !mongoose.connection.db) {
    return {
      status: 'ERROR',
      databaseName: 'unavailable',
      collectionsCount: 0,
      documentsCount: 0,
      dataSize: 0,
      indexSize: 0,
      storageSize: 0,
      usedBytes: 0,
      limitBytes: MONGO_FREE_PLAN_LIMIT_BYTES,
      remainingBytes: MONGO_FREE_PLAN_LIMIT_BYTES,
      percentage: 0,
      lastUpdated: new Date().toISOString(),
      error: 'MongoDB is disconnected or not reachable',
    };
  }

  try {
    const stats = await mongoose.connection.db.command({ dbStats: 1 });

    const dataSize = Number(stats.dataSize || 0);
    const indexSize = Number(stats.indexSize || 0);
    const storageSize = Number(stats.storageSize || 0);
    const usedBytes = dataSize + indexSize;

    const remainingBytes = Math.max(0, MONGO_FREE_PLAN_LIMIT_BYTES - usedBytes);
    const percentage = Number(((usedBytes / MONGO_FREE_PLAN_LIMIT_BYTES) * 100).toFixed(2));

    return {
      status: 'CONNECTED',
      databaseName: stats.db || 'drop',
      collectionsCount: Number(stats.collections || 0),
      documentsCount: Number(stats.objects || 0),
      dataSize,
      indexSize,
      storageSize,
      usedBytes,
      limitBytes: MONGO_FREE_PLAN_LIMIT_BYTES,
      remainingBytes,
      percentage,
      lastUpdated: new Date().toISOString(),
    };
  } catch (err: any) {
    console.error('[MongoAdminService] Failed to retrieve dbStats:', err);
    return {
      status: 'ERROR',
      databaseName: 'unavailable',
      collectionsCount: 0,
      documentsCount: 0,
      dataSize: 0,
      indexSize: 0,
      storageSize: 0,
      usedBytes: 0,
      limitBytes: MONGO_FREE_PLAN_LIMIT_BYTES,
      remainingBytes: MONGO_FREE_PLAN_LIMIT_BYTES,
      percentage: 0,
      lastUpdated: new Date().toISOString(),
      error: err?.message || 'Failed to query MongoDB dbStats',
    };
  }
}

/**
 * Get real DROP statistics and recent drops from the FileDrop collection
 */
export async function getDropStats(): Promise<DropStats> {
  const isConnected = await ensureDatabaseConnected();

  if (!isConnected) {
    return {
      totalDrops: 0,
      activeDrops: 0,
      expiredDrops: 0,
      totalFiles: 0,
      totalSizeBytes: 0,
      recentDrops: [],
    };
  }

  try {
    const now = new Date();

    const [totalDrops, activeDrops, expiredDrops, totalFiles, sizeAgg, recentDrops] = await Promise.all([
      FileDrop.countDocuments(),
      FileDrop.countDocuments({ status: 'active', expiresAt: { $gt: now } }),
      FileDrop.countDocuments({ $or: [{ status: 'expired' }, { expiresAt: { $lte: now } }] }),
      FileDrop.countDocuments({ status: { $ne: 'deleted' } }),
      FileDrop.aggregate([
        { $match: { status: { $ne: 'deleted' } } },
        { $group: { _id: null, totalSize: { $sum: '$size' } } },
      ]),
      FileDrop.find()
        .sort({ createdAt: -1 })
        .limit(15)
        .select('fileId originalName size mimeType createdAt expiresAt status downloadCount')
        .lean(),
    ]);

    const totalSizeBytes = sizeAgg.length > 0 ? Number(sizeAgg[0].totalSize || 0) : 0;

    return {
      totalDrops,
      activeDrops,
      expiredDrops,
      totalFiles,
      totalSizeBytes,
      recentDrops: recentDrops as any,
    };
  } catch (err) {
    console.error('[MongoAdminService] Failed to query FileDrop statistics:', err);
    return {
      totalDrops: 0,
      activeDrops: 0,
      expiredDrops: 0,
      totalFiles: 0,
      totalSizeBytes: 0,
      recentDrops: [],
    };
  }
}

/**
 * Real lightweight connectivity check for MongoDB
 */
export async function checkMongoHealth(): Promise<{ status: 'CONNECTED' | 'ERROR'; latencyMs: number; error?: string }> {
  const isConnected = await ensureDatabaseConnected();
  if (!isConnected || !mongoose.connection.db) {
    return {
      status: 'ERROR',
      latencyMs: 0,
      error: 'MongoDB is not connected',
    };
  }

  const start = Date.now();
  try {
    await mongoose.connection.db.admin().ping();
    return {
      status: 'CONNECTED',
      latencyMs: Date.now() - start,
    };
  } catch (err: any) {
    return {
      status: 'ERROR',
      latencyMs: Date.now() - start,
      error: err?.message || 'MongoDB ping failed',
    };
  }
}
