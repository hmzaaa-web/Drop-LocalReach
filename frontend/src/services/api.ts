import { FileDropMetadata, UploadResponse, VerifyResponse } from '../types';

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

export async function getFileMetadata(token: string): Promise<FileDropMetadata> {
  const response = await fetch(`${API_BASE}/api/files/${encodeURIComponent(token)}`);
  const data = await response.json();

  if (!response.ok) {
    const error: any = new Error(data.message || data.error || 'Failed to retrieve file metadata');
    error.status = response.status;
    error.isExpired = data.isExpired;
    throw error;
  }

  return data;
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
