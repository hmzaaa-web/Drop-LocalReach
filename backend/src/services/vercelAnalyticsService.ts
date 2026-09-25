import { config } from '../config/index.js';

export interface VercelAnalyticsStats {
  status: 'CONNECTED' | 'UNAVAILABLE' | 'ERROR';
  message?: string;
  visitors: {
    today: number | null;
    last7Days: number | null;
    last30Days: number | null;
  };
  pageviews: {
    today: number | null;
    last7Days: number | null;
    last30Days: number | null;
  };
  timeSeries?: Array<{
    date: string;
    visitors: number;
    pageviews: number;
  }>;
  monthlyQuota: number; // 50,000 for Vercel Hobby
  lastUpdated: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let memoryCache: {
  stats: VercelAnalyticsStats;
  timestamp: number;
} | null = null;

/**
 * Helper to query Vercel Web Analytics visits/count for a given date range
 */
async function queryVercelVisitsCount(
  since: Date,
  until: Date
): Promise<{ visitors: number; pageviews: number }> {
  const url = new URL('https://api.vercel.com/v1/query/web-analytics/visits/count');
  url.searchParams.set('projectId', config.vercel.projectId);
  if (config.vercel.teamId) {
    url.searchParams.set('teamId', config.vercel.teamId);
  }
  url.searchParams.set('since', since.toISOString());
  url.searchParams.set('until', until.toISOString());

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${config.vercel.token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Vercel Web Analytics HTTP ${res.status}: ${errorText}`);
  }

  const data: any = await res.json();
  return {
    visitors: Number(data?.data?.visitors ?? 0),
    pageviews: Number(data?.data?.pageviews ?? 0),
  };
}

/**
 * Fetch real Vercel Web Analytics data server-side
 */
export async function getVercelAnalyticsStats(forceRefresh: boolean = false): Promise<VercelAnalyticsStats> {
  // 1. Check if Vercel credentials are configured
  if (!config.vercel.token || !config.vercel.projectId) {
    return {
      status: 'UNAVAILABLE',
      message: 'Vercel Analytics credentials (VERCEL_TOKEN, VERCEL_PROJECT_ID) not configured',
      visitors: {
        today: null,
        last7Days: null,
        last30Days: null,
      },
      pageviews: {
        today: null,
        last7Days: null,
        last30Days: null,
      },
      monthlyQuota: 50000,
      lastUpdated: new Date().toISOString(),
    };
  }

  const now = Date.now();
  if (!forceRefresh && memoryCache && now - memoryCache.timestamp < CACHE_TTL_MS) {
    return memoryCache.stats;
  }

  try {
    const nowDate = new Date();

    // Start of today (UTC 00:00:00)
    const todayStart = new Date(Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), nowDate.getUTCDate()));

    // 7 days ago (UTC)
    const sevenDaysAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 30 days ago (UTC)
    const thirtyDaysAgo = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Query counts in parallel
    const [todayCount, sevenDaysCount, thirtyDaysCount] = await Promise.all([
      queryVercelVisitsCount(todayStart, nowDate),
      queryVercelVisitsCount(sevenDaysAgo, nowDate),
      queryVercelVisitsCount(thirtyDaysAgo, nowDate),
    ]);

    // Build simple daily time series for the last 7 days
    const timeSeries: Array<{ date: string; visitors: number; pageviews: number }> = [];
    try {
      const daysToFetch = 7;
      const dayPromises = [];

      for (let i = daysToFetch - 1; i >= 0; i--) {
        const dayStart = new Date(todayStart.getTime() - i * 24 * 60 * 60 * 1000);
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        const effectiveEnd = dayEnd.getTime() > nowDate.getTime() ? nowDate : dayEnd;
        const dateLabel = dayStart.toISOString().split('T')[0];

        dayPromises.push(
          queryVercelVisitsCount(dayStart, effectiveEnd).then((c) => ({
            date: dateLabel,
            visitors: c.visitors,
            pageviews: c.pageviews,
          }))
        );
      }

      const results = await Promise.all(dayPromises);
      timeSeries.push(...results);
    } catch {
      // Time series is optional if individual day queries are rate-limited
    }

    const stats: VercelAnalyticsStats = {
      status: 'CONNECTED',
      visitors: {
        today: todayCount.visitors,
        last7Days: sevenDaysCount.visitors,
        last30Days: thirtyDaysCount.visitors,
      },
      pageviews: {
        today: todayCount.pageviews,
        last7Days: sevenDaysCount.pageviews,
        last30Days: thirtyDaysCount.pageviews,
      },
      timeSeries: timeSeries.length > 0 ? timeSeries : undefined,
      monthlyQuota: 50000,
      lastUpdated: new Date().toISOString(),
    };

    memoryCache = {
      stats,
      timestamp: now,
    };

    return stats;
  } catch (err: any) {
    console.error('[VercelAnalyticsService] Error fetching Vercel analytics:', err);
    return {
      status: 'ERROR',
      message: err?.message || 'Failed to query Vercel Web Analytics API',
      visitors: {
        today: null,
        last7Days: null,
        last30Days: null,
      },
      pageviews: {
        today: null,
        last7Days: null,
        last30Days: null,
      },
      monthlyQuota: 50000,
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Real lightweight connectivity check for Vercel Web Analytics
 */
export async function checkVercelAnalyticsHealth(): Promise<{
  status: 'CONNECTED' | 'UNAVAILABLE' | 'ERROR';
  latencyMs: number;
  message?: string;
}> {
  if (!config.vercel.token || !config.vercel.projectId) {
    return {
      status: 'UNAVAILABLE',
      latencyMs: 0,
      message: 'Credentials not configured',
    };
  }

  const start = Date.now();
  try {
    const now = new Date();
    await queryVercelVisitsCount(now, now);
    return {
      status: 'CONNECTED',
      latencyMs: Date.now() - start,
    };
  } catch (err: any) {
    return {
      status: 'ERROR',
      latencyMs: Date.now() - start,
      message: err?.message || 'Vercel Analytics check failed',
    };
  }
}
