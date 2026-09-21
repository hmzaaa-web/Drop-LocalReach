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
