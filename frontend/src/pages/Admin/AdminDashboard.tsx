import React, { useState, useEffect, useCallback } from 'react';
import {
  RotateCw,
  LogOut,
  HardDrive,
  Database,
  Cpu,
  Activity,
  Users,
  Eye,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  FileBox,
  Layers,
} from 'lucide-react';

import {
  getAdminOverview,
  getAdminStorage,
  getAdminHealth,
  adminLogout,
} from '../../services/api';
import {
  AdminOverviewResponse,
  AdminStorageResponse,
  AdminHealthResponse,
} from '../../types';
import dropLogo from '../../assets/logo.png';

interface AdminDashboardProps {
  onLogout: () => void;
  onNotify?: (text: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, onNotify }) => {
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [storage, setStorage] = useState<AdminStorageResponse | null>(null);
  const [health, setHealth] = useState<AdminHealthResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Fetch all metrics in parallel
  const fetchAllData = useCallback(async (forceRefreshStorage: boolean = false) => {
    setIsRefreshing(true);
    try {
      const [overviewData, storageData, healthData] = await Promise.all([
        getAdminOverview(),
        getAdminStorage(forceRefreshStorage),
        getAdminHealth(),
      ]);

      setOverview(overviewData);
      setStorage(storageData);
      setHealth(healthData);
      setLastRefreshedAt(new Date());
    } catch (err: any) {
      console.error('Failed to load admin metrics:', err);
      onNotify?.(err.message || 'Failed to load some dashboard metrics', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [onNotify]);

  // Initial load
  useEffect(() => {
    fetchAllData(false);
  }, [fetchAllData]);

  // Optional 5-minute auto-refresh (free-tier safe)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchAllData(false);
    }, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [autoRefresh, fetchAllData]);

  const handleLogout = async () => {
    try {
      await adminLogout();
      onNotify?.('Logged out successfully', 'info');
      onLogout();
    } catch {
      onLogout();
    }
  };

  // Byte Formatter
  const formatBytes = (bytes: number | null | undefined): string => {
    if (bytes === null || bytes === undefined || isNaN(bytes)) return 'Unavailable';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  // Date Formatter
  const formatDate = (dateInput: string | Date | undefined): string => {
    if (!dateInput) return '—';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Progress Bar Color based on usage percentage
  const getProgressColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-rose-500';
    if (percentage >= 75) return 'bg-amber-500';
    return 'bg-brand-green';
  };

  // Service Status Chip
  const renderStatusBadge = (status: string, latencyMs?: number, message?: string) => {
    if (status === 'CONNECTED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
          <CheckCircle2 size={13} className="text-emerald-600" />
          CONNECTED
          {latencyMs !== undefined && <span className="opacity-70 font-mono text-[11px]">{latencyMs}ms</span>}
        </span>
      );
    }
    if (status === 'UNAVAILABLE') {
      return (
        <span
          title={message || 'Metric or service is not configured'}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80"
        >
          <HelpCircle size={13} className="text-amber-600" />
          UNAVAILABLE
        </span>
      );
    }
    return (
      <span
        title={message || 'Service encountered an error'}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80"
      >
        <XCircle size={13} className="text-rose-600" />
        ERROR
      </span>
    );
  };

  return (
    <div className="site-container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      {/* 1. Header & Controls */}
      <header className="glass-card rounded-2xl p-6 border border-brand-neutral-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-white border border-brand-neutral-200 flex items-center justify-center p-2 shadow-xs">
            <img src={dropLogo} alt="DROP" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-brand-black">Admin Dashboard</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-neutral-100 text-brand-neutral-700 border border-brand-neutral-200">
                Production
              </span>
            </div>
            <p className="text-xs text-brand-neutral-500 mt-0.5">
              DROP by LocalReach • Live Infrastructure & Free Plan Quota Tracker
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Last updated indicator */}
          <div className="text-right mr-2 hidden sm:block">
            <p className="text-[11px] text-brand-neutral-400">Last updated</p>
            <p className="text-xs font-medium text-brand-neutral-700">
              {lastRefreshedAt ? lastRefreshedAt.toLocaleTimeString() : 'Loading...'}
            </p>
          </div>

          {/* Auto-refresh toggle */}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              autoRefresh
                ? 'bg-brand-green/10 text-brand-green border-brand-green/30'
                : 'bg-brand-white text-brand-neutral-600 border-brand-neutral-200 hover:bg-brand-neutral-50'
            }`}
            title="Automatically refresh every 5 minutes (free-tier safe)"
          >
            <Clock size={14} />
            {autoRefresh ? 'Auto 5m ON' : 'Auto 5m OFF'}
          </button>

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={() => fetchAllData(true)}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-black text-brand-white hover:bg-brand-neutral-800 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-xs"
          >
            <RotateCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-2 rounded-xl text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors flex items-center gap-1.5"
            title="Log out from admin session"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* 2. Service Health Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-neutral-500 flex items-center gap-2">
            <Activity size={16} className="text-brand-green" />
            System Health & Service Latency
          </h2>
          <span className="text-xs text-brand-neutral-400">Real-time connectivity checks</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Backend */}
          <div className="glass-card rounded-xl p-3.5 border border-brand-neutral-200/80 bg-brand-white/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-brand-black">Express API</span>
              <Cpu size={15} className="text-brand-neutral-400" />
            </div>
            <div>{renderStatusBadge(health?.backend.status || 'CONNECTED', health?.backend.latencyMs)}</div>
          </div>

          {/* MongoDB Atlas */}
          <div className="glass-card rounded-xl p-3.5 border border-brand-neutral-200/80 bg-brand-white/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-brand-black">MongoDB Atlas</span>
              <Database size={15} className="text-brand-neutral-400" />
            </div>
            <div>
              {renderStatusBadge(health?.mongodb.status || (isLoading ? '...' : 'ERROR'), health?.mongodb.latencyMs, health?.mongodb.error)}
            </div>
          </div>

          {/* Backblaze B2 */}
          <div className="glass-card rounded-xl p-3.5 border border-brand-neutral-200/80 bg-brand-white/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-brand-black">Backblaze B2</span>
              <HardDrive size={15} className="text-brand-neutral-400" />
            </div>
            <div>
              {renderStatusBadge(health?.b2.status || (isLoading ? '...' : 'ERROR'), health?.b2.latencyMs, health?.b2.error)}
            </div>
          </div>

          {/* Upstash Redis */}
          <div className="glass-card rounded-xl p-3.5 border border-brand-neutral-200/80 bg-brand-white/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-brand-black">Upstash Redis</span>
              <Layers size={15} className="text-brand-neutral-400" />
            </div>
            <div>
              {renderStatusBadge(health?.redis.status || (isLoading ? '...' : 'ERROR'), health?.redis.latencyMs, health?.redis.error)}
            </div>
          </div>

          {/* Vercel Analytics */}
          <div className="glass-card rounded-xl p-3.5 border border-brand-neutral-200/80 bg-brand-white/80 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-brand-black">Vercel Analytics</span>
              <Users size={15} className="text-brand-neutral-400" />
            </div>
            <div>
              {renderStatusBadge(
                health?.vercelAnalytics.status || (isLoading ? '...' : 'UNAVAILABLE'),
                health?.vercelAnalytics.latencyMs,
                health?.vercelAnalytics.message
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Resource Cards (Free Plan Quota Limits) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-neutral-500 flex items-center gap-2">
            <HardDrive size={16} className="text-brand-green" />
            Free Plan Storage & Quota Monitoring
          </h2>
          <span className="text-xs text-brand-neutral-400">Calculated from actual provider data</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Backblaze B2 */}
          <div className="glass-card rounded-2xl p-6 border border-brand-neutral-200/80 bg-brand-white/90 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-neutral-400">Storage Bucket</span>
                  <h3 className="text-lg font-bold text-brand-black">BACKBLAZE B2</h3>
                  <span className="text-xs text-brand-neutral-500 font-mono">10 GB Free Plan</span>
                </div>
                <div className="p-2.5 rounded-xl bg-brand-neutral-100 text-brand-neutral-700">
                  <HardDrive size={20} />
                </div>
              </div>

              {/* Metric Breakdown */}
              <div className="mt-6 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold tracking-tight text-brand-black">
                    {formatBytes(storage?.b2.usedBytes)}
                  </span>
                  <span className="text-xs font-semibold text-brand-neutral-500">
                    of 10.00 GB ({storage?.b2.percentage.toFixed(2) || '0.00'}%)
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-brand-neutral-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
                      storage?.b2.percentage || 0
                    )}`}
                    style={{ width: `${Math.min(100, Math.max(1, storage?.b2.percentage || 0))}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-brand-neutral-500 pt-1">
                  <span>Remaining: <strong>{formatBytes(storage?.b2.remainingBytes)}</strong></span>
                  <span>{storage?.b2.objectCount ?? 0} total objects</span>
                </div>
              </div>
            </div>

            {/* Footer Details */}
            <div className="mt-6 pt-4 border-t border-brand-neutral-200/60 text-[11px] text-brand-neutral-400 flex items-center justify-between">
              <span className="truncate max-w-[170px]" title={storage?.b2.bucketName}>
                Bucket: {storage?.b2.bucketName || 'drop-localreach-storage'}
              </span>
              <span>{storage?.b2.cached ? 'Cached (3m)' : 'Live'}</span>
            </div>
          </div>

          {/* Card 2: MongoDB Atlas */}
          <div className="glass-card rounded-2xl p-6 border border-brand-neutral-200/80 bg-brand-white/90 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-neutral-400">Database Cluster</span>
                  <h3 className="text-lg font-bold text-brand-black">MONGODB ATLAS</h3>
                  <span className="text-xs text-brand-neutral-500 font-mono">512 MB Free Tier</span>
                </div>
                <div className="p-2.5 rounded-xl bg-brand-neutral-100 text-brand-neutral-700">
                  <Database size={20} />
                </div>
              </div>

              {/* Metric Breakdown */}
              <div className="mt-6 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold tracking-tight text-brand-black">
                    {formatBytes(storage?.mongo.usedBytes)}
                  </span>
                  <span className="text-xs font-semibold text-brand-neutral-500">
                    of 512.00 MB ({storage?.mongo.percentage.toFixed(2) || '0.00'}%)
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-brand-neutral-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
                      storage?.mongo.percentage || 0
                    )}`}
                    style={{ width: `${Math.min(100, Math.max(1, storage?.mongo.percentage || 0))}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-brand-neutral-500 pt-1">
                  <span>Remaining: <strong>{formatBytes(storage?.mongo.remainingBytes)}</strong></span>
                  <span>{storage?.mongo.documentsCount ?? 0} documents</span>
                </div>
              </div>
            </div>

            {/* Footer Details */}
            <div className="mt-6 pt-4 border-t border-brand-neutral-200/60 text-[11px] text-brand-neutral-400 flex items-center justify-between">
              <span>BSON data + index size (Free Tier standard)</span>
              <span>DB: {storage?.mongo.databaseName || 'test'}</span>
            </div>
          </div>

          {/* Card 3: Upstash Redis */}
          <div className="glass-card rounded-2xl p-6 border border-brand-neutral-200/80 bg-brand-white/90 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-neutral-400">Cache & Rate Limiting</span>
                  <h3 className="text-lg font-bold text-brand-black">UPSTASH REDIS</h3>
                  <span className="text-xs text-brand-neutral-500 font-mono">256 MB Free Data</span>
                </div>
                <div className="p-2.5 rounded-xl bg-brand-neutral-100 text-brand-neutral-700">
                  <Layers size={20} />
                </div>
              </div>

              {/* Metric Breakdown */}
              <div className="mt-6 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold tracking-tight text-brand-black">
                    {formatBytes(storage?.redis.usedBytes)}
                  </span>
                  <span className="text-xs font-semibold text-brand-neutral-500">
                    of 256.00 MB ({storage?.redis.percentage.toFixed(2) || '0.00'}%)
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-brand-neutral-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
                      storage?.redis.percentage || 0
                    )}`}
                    style={{ width: `${Math.min(100, Math.max(1, storage?.redis.percentage || 0))}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-brand-neutral-500 pt-1">
                  <span>Remaining: <strong>{formatBytes(storage?.redis.remainingBytes)}</strong></span>
                  <span>{storage?.redis.totalKeys ?? 0} active keys</span>
                </div>
              </div>
            </div>

            {/* Footer Details */}
            <div className="mt-6 pt-4 border-t border-brand-neutral-200/60 text-[11px] text-brand-neutral-400 flex items-center justify-between">
              <span>Monthly Cmds: <strong className="text-brand-neutral-600 font-normal">{storage?.redis.monthlyCommands || 'Usage unavailable'}</strong></span>
              <span>Bandwidth: <strong className="text-brand-neutral-600 font-normal">{storage?.redis.monthlyBandwidth || 'Usage unavailable'}</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Overview Statistics Grid (10 Required Real Metrics) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-neutral-500 flex items-center gap-2">
            <Activity size={16} className="text-brand-green" />
            Platform & Visitor Overview
          </h2>
          <span className="text-xs text-brand-neutral-400">
            {overview?.analytics.status === 'CONNECTED'
              ? 'Vercel Web Analytics & Database metrics'
              : 'Vercel credentials required for visitor metrics'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* 1. Visitors Today */}
          <div className="glass-card rounded-xl p-4 border border-brand-neutral-200/80 bg-brand-white/80">
            <div className="flex items-center justify-between text-brand-neutral-400 mb-1">
              <span className="text-xs font-medium">Visitors Today</span>
              <Users size={15} />
            </div>
            <div className="text-xl font-bold text-brand-black">
              {overview?.analytics.visitors.today !== null && overview?.analytics.visitors.today !== undefined
                ? overview.analytics.visitors.today.toLocaleString()
                : 'Unavailable'}
            </div>
            <span className="text-[11px] text-brand-neutral-400">UTC Day</span>
          </div>

          {/* 2. Visitors 7 Days */}
          <div className="glass-card rounded-xl p-4 border border-brand-neutral-200/80 bg-brand-white/80">
            <div className="flex items-center justify-between text-brand-neutral-400 mb-1">
              <span className="text-xs font-medium">Visitors 7 Days</span>
              <Users size={15} />
            </div>
            <div className="text-xl font-bold text-brand-black">
              {overview?.analytics.visitors.last7Days !== null && overview?.analytics.visitors.last7Days !== undefined
                ? overview.analytics.visitors.last7Days.toLocaleString()
                : 'Unavailable'}
            </div>
            <span className="text-[11px] text-brand-neutral-400">Last 7 Days</span>
          </div>

          {/* 3. Visitors 30 Days */}
          <div className="glass-card rounded-xl p-4 border border-brand-neutral-200/80 bg-brand-white/80">
            <div className="flex items-center justify-between text-brand-neutral-400 mb-1">
              <span className="text-xs font-medium">Visitors 30 Days</span>
              <Users size={15} />
            </div>
            <div className="text-xl font-bold text-brand-black">
              {overview?.analytics.visitors.last30Days !== null && overview?.analytics.visitors.last30Days !== undefined
                ? overview.analytics.visitors.last30Days.toLocaleString()
                : 'Unavailable'}
            </div>
            <span className="text-[11px] text-brand-neutral-400">Last 30 Days</span>
          </div>

          {/* 4. Page Views Today */}
          <div className="glass-card rounded-xl p-4 border border-brand-neutral-200/80 bg-brand-white/80">
            <div className="flex items-center justify-between text-brand-neutral-400 mb-1">
              <span className="text-xs font-medium">Page Views Today</span>
              <Eye size={15} />
            </div>
            <div className="text-xl font-bold text-brand-black">
              {overview?.analytics.pageviews.today !== null && overview?.analytics.pageviews.today !== undefined
                ? overview.analytics.pageviews.today.toLocaleString()
                : 'Unavailable'}
            </div>
            <span className="text-[11px] text-brand-neutral-400">UTC Day</span>
          </div>

          {/* 5. Page Views 7 Days */}
          <div className="glass-card rounded-xl p-4 border border-brand-neutral-200/80 bg-brand-white/80">
            <div className="flex items-center justify-between text-brand-neutral-400 mb-1">
              <span className="text-xs font-medium">Page Views 7 Days</span>
              <Eye size={15} />
            </div>
            <div className="text-xl font-bold text-brand-black">
              {overview?.analytics.pageviews.last7Days !== null && overview?.analytics.pageviews.last7Days !== undefined
                ? overview.analytics.pageviews.last7Days.toLocaleString()
                : 'Unavailable'}
            </div>
            <span className="text-[11px] text-brand-neutral-400">Last 7 Days</span>
          </div>

          {/* 6. Page Views 30 Days */}
          <div className="glass-card rounded-xl p-4 border border-brand-neutral-200/80 bg-brand-white/80">
            <div className="flex items-center justify-between text-brand-neutral-400 mb-1">
              <span className="text-xs font-medium">Page Views 30 Days</span>
              <Eye size={15} />
            </div>
            <div className="text-xl font-bold text-brand-black">
              {overview?.analytics.pageviews.last30Days !== null && overview?.analytics.pageviews.last30Days !== undefined
                ? overview.analytics.pageviews.last30Days.toLocaleString()
                : 'Unavailable'}
            </div>
            <span className="text-[11px] text-brand-neutral-400">Quota: 50,000/mo</span>
          </div>

          {/* 7. Total Drops */}
          <div className="glass-card rounded-xl p-4 border border-brand-neutral-200/80 bg-brand-white/80">
            <div className="flex items-center justify-between text-brand-neutral-400 mb-1">
              <span className="text-xs font-medium">Total Drops</span>
              <FileBox size={15} />
            </div>
            <div className="text-xl font-bold text-brand-black">
              {overview?.drops.totalDrops ?? (isLoading ? '...' : 0)}
            </div>
            <span className="text-[11px] text-brand-neutral-400">All created drops</span>
          </div>

          {/* 8. Active Drops */}
          <div className="glass-card rounded-xl p-4 border border-brand-neutral-200/80 bg-brand-white/80">
            <div className="flex items-center justify-between text-brand-neutral-400 mb-1">
              <span className="text-xs font-medium">Active Drops</span>
              <CheckCircle2 size={15} className="text-brand-green" />
            </div>
            <div className="text-xl font-bold text-brand-green">
              {overview?.drops.activeDrops ?? (isLoading ? '...' : 0)}
            </div>
            <span className="text-[11px] text-brand-neutral-400">Available to unlock</span>
          </div>

          {/* 9. Expired Drops */}
          <div className="glass-card rounded-xl p-4 border border-brand-neutral-200/80 bg-brand-white/80">
            <div className="flex items-center justify-between text-brand-neutral-400 mb-1">
              <span className="text-xs font-medium">Expired Drops</span>
              <AlertTriangle size={15} className="text-amber-500" />
            </div>
            <div className="text-xl font-bold text-brand-neutral-700">
              {overview?.drops.expiredDrops ?? (isLoading ? '...' : 0)}
            </div>
            <span className="text-[11px] text-brand-neutral-400">Past expiration</span>
          </div>

          {/* 10. Total Files */}
          <div className="glass-card rounded-xl p-4 border border-brand-neutral-200/80 bg-brand-white/80">
            <div className="flex items-center justify-between text-brand-neutral-400 mb-1">
              <span className="text-xs font-medium">Total Files</span>
              <FileText size={15} />
            </div>
            <div className="text-xl font-bold text-brand-black">
              {overview?.drops.totalFiles ?? (isLoading ? '...' : 0)}
            </div>
            <span className="text-[11px] text-brand-neutral-400">
              {formatBytes(overview?.drops.totalSizeBytes)} represented
            </span>
          </div>
        </div>
      </section>

      {/* 5. Recent Drops Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-neutral-500 flex items-center gap-2">
            <FileBox size={16} className="text-brand-green" />
            Recent Drops (Database Records)
          </h2>
          <span className="text-xs text-brand-neutral-400">
            Showing latest {overview?.drops.recentDrops.length || 0} records
          </span>
        </div>

        <div className="glass-card rounded-2xl border border-brand-neutral-200/80 bg-brand-white/90 shadow-sm overflow-hidden">
          {overview?.drops.recentDrops && overview.drops.recentDrops.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-brand-neutral-200/60 bg-brand-neutral-50/70 text-xs font-semibold uppercase tracking-wider text-brand-neutral-500">
                    <th className="py-3.5 px-4 sm:px-6">Original File</th>
                    <th className="py-3.5 px-4">Size</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">Created</th>
                    <th className="py-3.5 px-4 hidden lg:table-cell">Expires</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right sm:pr-6">Downloads</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-neutral-200/50">
                  {overview.drops.recentDrops.map((drop) => {
                    const isExpired = new Date(drop.expiresAt).getTime() <= Date.now() || drop.status === 'expired';
                    return (
                      <tr key={drop.fileId} className="hover:bg-brand-neutral-50/50 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6 font-medium text-brand-black">
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[200px] sm:max-w-xs">{drop.originalName}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-neutral-100 text-brand-neutral-600">
                              {drop.mimeType.split('/')[1] || 'bin'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-brand-neutral-600">
                          {formatBytes(drop.size)}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-brand-neutral-500 hidden md:table-cell">
                          {formatDate(drop.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-brand-neutral-500 hidden lg:table-cell">
                          {formatDate(drop.expiresAt)}
                        </td>
                        <td className="py-3.5 px-4">
                          {isExpired ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-neutral-100 text-brand-neutral-600">
                              Expired
                            </span>
                          ) : drop.status === 'active' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 capitalize">
                              {drop.status}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right sm:pr-6 font-mono text-xs text-brand-neutral-600">
                          {drop.downloadCount ?? 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-brand-neutral-400">
              <FileBox size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No DROP records found in database</p>
            </div>
          )}
        </div>
      </section>

      {/* 6. Footer Note */}
      <footer className="text-center py-4 border-t border-brand-neutral-200/50 text-xs text-brand-neutral-400">
        <p>
          DROP by LocalReach Administration • Real metrics only • Zero assumed data
        </p>
      </footer>
    </div>
  );
};
