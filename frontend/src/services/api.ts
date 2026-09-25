import {
  FileDropMetadata,
  UploadResponse,
  VerifyResponse,
  AdminSessionResponse,
  AdminLoginResponse,
  AdminOverviewResponse,
  AdminStorageResponse,
  AdminHealthResponse,
} from '../types';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');


/**
 * Step 1: Request presigned B2 upload URL
 * Step 2: PUT file directly to Backblaze B2 (or local dev storage)
 * Step 3: Complete upload and activate DROP
 */
export async function uploadFile(
  file: File,
  passcode: string,
  onProgress?: (percent: number) => void
): Promise<UploadResponse> {
  // 1. Get presigned upload URL from Vercel API
  const reservationRes = await fetch(`${API_BASE}/api/files/upload-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      passcode,
    }),
  });

  const reservation = await reservationRes.json();
  if (!reservationRes.ok) {
    throw new Error(reservation.error || 'Failed to initialize upload');
  }

  const { uploadUrl, fileId, token } = reservation;

  // 2. Upload file binary directly to Backblaze B2 (or local fallback)
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Direct upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during direct file upload'));
    };

    xhr.onabort = () => {
      reject(new Error('Upload was cancelled'));
    };

    xhr.send(file);
  });

  // 3. Finalize upload with backend to activate DROP record
  const completeRes = await fetch(`${API_BASE}/api/files/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileId,
      token,
    }),
  });

  const completeData = await completeRes.json();
  if (!completeRes.ok) {
    throw new Error(completeData.error || 'Failed to finalize upload');
  }

  return completeData;
}

export async function getFileMetadata(token: string, maxAttempts = 3): Promise<FileDropMetadata> {
  const delays = [500, 1000, 1500];

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`${API_BASE}/api/files/${encodeURIComponent(token)}`);

      // 404: Genuinely not found - do not retry
      if (response.status === 404) {
        let data: any = {};
        try { data = await response.json(); } catch {}
        const error: any = new Error(data.message || data.error || 'DROP not found');
        error.status = 404;
        error.isNotFound = true;
        throw error;
      }

      // 410: Expired - do not retry
      if (response.status === 410) {
        let data: any = {};
        try { data = await response.json(); } catch {}
        const error: any = new Error(data.message || data.error || 'This DROP has disappeared');
        error.status = 410;
        error.isExpired = true;
        throw error;
      }

      // Transient server/database error (503, 502, 504, 500)
      if (response.status >= 500) {
        let data: any = {};
        try { data = await response.json(); } catch {}
        const error: any = new Error(data.message || data.error || `Server unavailable (${response.status})`);
        error.status = response.status;
        error.isTransient = true;

        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, delays[attempt] || 1000));
          continue;
        }
        throw error;
      }

      if (!response.ok) {
        let data: any = {};
        try { data = await response.json(); } catch {}
        const error: any = new Error(data.message || data.error || 'Failed to retrieve file metadata');
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      // If genuine 404 or 410, immediately throw
      if (err.isNotFound || err.isExpired || err.status === 404 || err.status === 410) {
        throw err;
      }

      // If network failure / fetch error and we have retries left
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delays[attempt] || 1000));
        continue;
      }

      // Mark final error as transient
      err.isTransient = true;
      throw err;
    }
  }

  const timeoutErr: any = new Error('Unable to connect to service. Please try again.');
  timeoutErr.isTransient = true;
  throw timeoutErr;
}

export async function verifyPasscode(token: string, passcode: string): Promise<VerifyResponse> {
  const response = await fetch(`${API_BASE}/api/files/${encodeURIComponent(token)}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ passcode }),
  });

  const data = await response.json();
  if (!response.ok) {
    const error: any = new Error(data.message || data.error || 'Passcode verification failed');
    error.status = response.status;
    error.isExpired = data.isExpired;
    throw error;
  }

  return data;
}

export function getDownloadUrl(token: string, ticket: string): string {
  return `${API_BASE}/api/files/${encodeURIComponent(token)}/download?ticket=${encodeURIComponent(ticket)}`;
}

export function getPreviewUrl(token: string, ticket: string): string {
  return `${API_BASE}/api/files/${encodeURIComponent(token)}/preview?ticket=${encodeURIComponent(ticket)}`;
}

export async function getHealth(): Promise<{ status: string; contactUrl?: string; expirationDays?: number }> {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return { status: 'unknown' };
}

/* ==============================================================================
 * Admin API Functions (Protected, Secure HttpOnly Credentials)
 * ============================================================================== */

/**
 * Check if the browser currently holds an authenticated admin session
 */
export async function checkAdminSession(): Promise<AdminSessionResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/session`, {
      method: 'GET',
      credentials: 'include',
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return { authenticated: false };
}

/**
 * Submit admin login password and establish HttpOnly session
 */
export async function adminLogin(password: string): Promise<AdminLoginResponse> {
  const res = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Authentication failed');
  }

  return data;
}

/**
 * Log out and clear the admin session cookie
 */
export async function adminLogout(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/api/admin/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  return await res.json();
}

/**
 * Fetch overview metrics (Vercel Analytics + MongoDB DROP stats)
 */
export async function getAdminOverview(): Promise<AdminOverviewResponse> {
  const res = await fetch(`${API_BASE}/api/admin/overview`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to fetch overview metrics (${res.status})`);
  }

  return await res.json();
}

/**
 * Fetch real storage metrics across B2, MongoDB Atlas, and Upstash Redis
 */
export async function getAdminStorage(forceRefresh: boolean = false): Promise<AdminStorageResponse> {
  const url = `${API_BASE}/api/admin/storage${forceRefresh ? '?refresh=true' : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to fetch storage metrics (${res.status})`);
  }

  return await res.json();
}

/**
 * Fetch real service health and latency measurements
 */
export async function getAdminHealth(): Promise<AdminHealthResponse> {
  const res = await fetch(`${API_BASE}/api/admin/health`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to fetch system health (${res.status})`);
  }

  return await res.json();
}

