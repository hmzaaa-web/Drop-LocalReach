import { B2StorageProvider } from './B2StorageProvider.js';

let storageInstance: B2StorageProvider | null = null;

/**
 * Returns the singleton Backblaze B2 Storage Provider instance
 */
export function getStorageService(): B2StorageProvider {
  if (!storageInstance) {
    storageInstance = new B2StorageProvider();
  }
  return storageInstance;
}

export { B2StorageProvider };
