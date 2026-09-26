import { Document } from 'mongoose';
import { Readable } from 'stream';

export type FileDropStatus = 'pending' | 'active' | 'expired' | 'deleted';

export interface IFileDrop {
  fileId: string;
  tokenHash: string;
  originalName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  passcodeHash: string;
  createdAt: Date;
  expiresAt: Date;
  status: FileDropStatus;
  downloadCount: number;
}

export interface IFileDropDocument extends IFileDrop, Document {}

export interface StorageService {
  upload(key: string, buffer: Buffer, mimeType: string): Promise<string>;
  download(key: string): Promise<Readable>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getDownloadUrl?(key: string, filename: string, inline?: boolean): Promise<string | null>;
  getUploadPresignedUrl?(key: string, mimeType: string, expiresIn?: number): Promise<string>;
  getDownloadPresignedUrl?(key: string, filename: string, inline?: boolean, expiresIn?: number): Promise<string>;
  headObject?(key: string): Promise<{ exists: boolean; size: number; mimeType?: string }>;
  deleteAllVersions?(key: string): Promise<void>;
}

export interface FileMetadataResponse {
  fileId: string;
  originalName: string;
  mimeType: string;
  size: number;
  expiresAt: string;
  createdAt: string;
  isExpired: boolean;
  status: FileDropStatus;
}

export interface IAdminCredential {
  role: string;
  passwordHash: string;
  updatedAt: Date;
}

export interface IAdminCredentialDocument extends IAdminCredential, Document {}

export interface IAdminPasswordReset {
  tokenHash: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

export interface IAdminPasswordResetDocument extends IAdminPasswordReset, Document {}
