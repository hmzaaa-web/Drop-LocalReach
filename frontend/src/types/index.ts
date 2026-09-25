export interface FileDropMetadata {
  fileId: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'deleted';
}

export interface UploadResponse {
  success: boolean;
  token: string;
  publicUrl: string;
  file: {
    fileId: string;
    originalName: string;
    mimeType: string;
    size: number;
    createdAt: string;
    expiresAt: string;
    expirationDays: number;
  };
}

export interface VerifyResponse {
  success: boolean;
  downloadTicket: string;
  ticket?: string;
  downloadUrl?: string;
  previewUrl?: string;
  file: {
    fileId: string;
    originalName: string;
    mimeType: string;
    size: number;
    expiresAt: string;
  };
}

export type QRVisibility = 'standard' | 'discreet' | 'low-visibility';
export type QRPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
export type QRSize = 'small' | 'medium' | 'large';

// Admin Types
export interface AdminSessionResponse {
  authenticated: boolean;
}

export interface AdminLoginResponse {
  success?: boolean;
  message?: string;
  error?: string;
  remaining?: number;
}

export interface VercelAnalyticsData {
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
  monthlyQuota: number;
  lastUpdated: string;
}

export interface DropItem {
  fileId: string;
  originalName: string;
  size: number;
  mimeType: string;
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'active' | 'expired' | 'deleted';
  downloadCount: number;
}

export interface AdminDropsData {
  totalDrops: number;
  activeDrops: number;
  expiredDrops: number;
  totalFiles: number;
  totalSizeBytes: number;
  recentDrops: DropItem[];
}

export interface AdminOverviewResponse {
  analytics: VercelAnalyticsData;
  drops: AdminDropsData;
  timestamp: string;
}

export interface B2StorageCardData {
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

export interface MongoStorageCardData {
  status: 'CONNECTED' | 'ERROR';
  databaseName: string;
  collectionsCount: number;
  documentsCount: number;
  dataSize: number;
  indexSize: number;
  storageSize: number;
  usedBytes: number;
  limitBytes: number;
  remainingBytes: number;
  percentage: number;
  lastUpdated: string;
  error?: string;
}

export interface RedisStorageCardData {
  status: 'CONNECTED' | 'ERROR';
  usedBytes: number;
  limitBytes: number;
  remainingBytes: number;
  percentage: number;
  totalKeys: number;
  monthlyCommands: string;
  monthlyBandwidth: string;
  lastUpdated: string;
  error?: string;
}

export interface AdminStorageResponse {
  b2: B2StorageCardData;
  mongo: MongoStorageCardData;
  redis: RedisStorageCardData;
  timestamp: string;
}

export interface AdminHealthResponse {
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

