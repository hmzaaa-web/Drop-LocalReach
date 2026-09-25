import { checkMongoHealth } from './mongoAdminService.js';
import { checkB2Health } from './b2AdminService.js';
import { checkRedisHealth } from './redisAdminService.js';
import { checkVercelAnalyticsHealth } from './vercelAnalyticsService.js';

export interface ServiceHealthReport {
  backend: {
    status: 'CONNECTED';
    latencyMs: number;
  };
  mongodb: {
    status: 'CONNECTED' | 'ERROR';
    latencyMs: number;
    error?: string;
  };
  b2: {
    status: 'CONNECTED' | 'ERROR';
    latencyMs: number;
    error?: string;
  };
  redis: {
    status: 'CONNECTED' | 'ERROR';
    latencyMs: number;
    error?: string;
  };
  vercelAnalytics: {
    status: 'CONNECTED' | 'UNAVAILABLE' | 'ERROR';
    latencyMs: number;
    message?: string;
  };
  timestamp: string;
}

/**
 * Execute real, lightweight connectivity checks across all platform services
 */
export async function getSystemHealthReport(): Promise<ServiceHealthReport> {
  const backendStart = Date.now();

  const [mongoRes, b2Res, redisRes, vercelRes] = await Promise.all([
    checkMongoHealth(),
    checkB2Health(),
    checkRedisHealth(),
    checkVercelAnalyticsHealth(),
  ]);

  return {
    backend: {
      status: 'CONNECTED',
      latencyMs: Date.now() - backendStart,
    },
    mongodb: mongoRes,
    b2: b2Res,
    redis: redisRes,
    vercelAnalytics: vercelRes,
    timestamp: new Date().toISOString(),
  };
}
