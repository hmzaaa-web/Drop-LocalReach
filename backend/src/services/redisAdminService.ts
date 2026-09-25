import { config } from '../config/index.js';
import { getRedisClient } from './redisService.js';

export const REDIS_FREE_PLAN_LIMIT_BYTES = 256 * 1024 * 1024; // 256 MB

export interface RedisStorageStats {
  status: 'CONNECTED' | 'ERROR';
  usedBytes: number;
  limitBytes: number;
  remainingBytes: number;
  percentage: number;
  totalKeys: number;
  monthlyCommands: string;    // 'Usage unavailable'
  monthlyBandwidth: string;   // 'Usage unavailable'
  lastUpdated: string;
  error?: string;
}

/**
 * Parse standard Redis INFO text response into key-value pairs
 */
function parseRedisInfo(rawInfo: string): Record<string, string> {
  const map: Record<string, string> = {};
  const lines = rawInfo.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx > 0) {
      const key = trimmed.slice(0, colonIdx).trim();
      const val = trimmed.slice(colonIdx + 1).trim();
      map[key] = val;
    }
  }
  return map;
}

/**
 * Get real Upstash Redis storage usage via Upstash REST INFO command
 */
export async function getRedisStorageStats(): Promise<RedisStorageStats> {
  if (!config.redis.url || !config.redis.token) {
    return {
      status: 'ERROR',
      usedBytes: 0,
      limitBytes: REDIS_FREE_PLAN_LIMIT_BYTES,
      remainingBytes: REDIS_FREE_PLAN_LIMIT_BYTES,
      percentage: 0,
      totalKeys: 0,
      monthlyCommands: 'Usage unavailable',
      monthlyBandwidth: 'Usage unavailable',
      lastUpdated: new Date().toISOString(),
      error: 'Upstash Redis credentials (UPSTASH_REDIS_REST_URL/TOKEN) not configured',
    };
  }

  try {
    const response = await fetch(config.redis.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.redis.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['INFO']),
    });

    if (!response.ok) {
      throw new Error(`Upstash HTTP ${response.status}: ${response.statusText}`);
    }

    const data: any = await response.json();
    const rawInfo = typeof data?.result === 'string' ? data.result : '';
    const infoMap = parseRedisInfo(rawInfo);

    // Prefer total_data_size, fallback to used_memory
    const totalDataSize = parseInt(infoMap['total_data_size'] || infoMap['used_memory'] || '0', 10);
    const totalKeys = parseInt(infoMap['total_keys'] || '0', 10);

    const usedBytes = isNaN(totalDataSize) ? 0 : totalDataSize;
    const remainingBytes = Math.max(0, REDIS_FREE_PLAN_LIMIT_BYTES - usedBytes);
    const percentage = Number(((usedBytes / REDIS_FREE_PLAN_LIMIT_BYTES) * 100).toFixed(2));

    return {
      status: 'CONNECTED',
      usedBytes,
      limitBytes: REDIS_FREE_PLAN_LIMIT_BYTES,
      remainingBytes,
      percentage,
      totalKeys: isNaN(totalKeys) ? 0 : totalKeys,
      monthlyCommands: 'Usage unavailable',
      monthlyBandwidth: 'Usage unavailable',
      lastUpdated: new Date().toISOString(),
    };
  } catch (err: any) {
    console.error('[RedisAdminService] Failed to retrieve Redis stats:', err);
    return {
      status: 'ERROR',
      usedBytes: 0,
      limitBytes: REDIS_FREE_PLAN_LIMIT_BYTES,
      remainingBytes: REDIS_FREE_PLAN_LIMIT_BYTES,
      percentage: 0,
      totalKeys: 0,
      monthlyCommands: 'Usage unavailable',
      monthlyBandwidth: 'Usage unavailable',
      lastUpdated: new Date().toISOString(),
      error: err?.message || 'Failed to query Redis INFO',
    };
  }
}

/**
 * Real lightweight connectivity check for Upstash Redis
 */
export async function checkRedisHealth(): Promise<{ status: 'CONNECTED' | 'ERROR'; latencyMs: number; error?: string }> {
  const redis = getRedisClient();
  if (!redis) {
    return {
      status: 'ERROR',
      latencyMs: 0,
      error: 'Upstash Redis client not configured',
    };
  }

  const start = Date.now();
  try {
    const res = await redis.ping();
    if (res === 'PONG') {
      return {
        status: 'CONNECTED',
        latencyMs: Date.now() - start,
      };
    }
    return {
      status: 'ERROR',
      latencyMs: Date.now() - start,
      error: `Unexpected ping response: ${res}`,
    };
  } catch (err: any) {
    return {
      status: 'ERROR',
      latencyMs: Date.now() - start,
      error: err?.message || 'Redis ping failed',
    };
  }
}
