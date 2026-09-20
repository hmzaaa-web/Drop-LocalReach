import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectVersionsCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { config } from '../config/index.js';
import { StorageService } from '../types/index.js';

export class B2StorageProvider implements StorageService {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = config.b2.bucketName;
    const endpoint = config.b2.endpoint || `https://s3.${config.b2.region}.backblazeb2.com`;

    this.client = new S3Client({
      region: config.b2.region,
      endpoint,
      credentials: {
        accessKeyId: config.b2.keyId,
        secretAccessKey: config.b2.applicationKey,
      },
    });
  }

  /**
   * Generate short-lived presigned PUT URL for direct browser-to-B2 uploads (5 min default)
   */
  async getUploadPresignedUrl(key: string, mimeType: string, expiresIn: number = 300): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
    });

    return await getSignedUrl(this.client, command, { expiresIn });
  }

  /**
   * Generate short-lived presigned GET URL for secure download/preview directly from B2 (15 min default)
   */
  async getDownloadPresignedUrl(
    key: string,
    filename: string,
    inline: boolean = false,
    expiresIn: number = 900
  ): Promise<string> {
    const disposition = inline ? 'inline' : 'attachment';
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: `${disposition}; filename="${encodeURIComponent(filename)}"`,
    });

    return await getSignedUrl(this.client, command, { expiresIn });
  }

  /**
   * Check object presence and exact byte size via HeadObject
   */
  async headObject(key: string): Promise<{ exists: boolean; size: number; mimeType?: string }> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      const res = await this.client.send(command);
      return {
        exists: true,
        size: res.ContentLength || 0,
        mimeType: res.ContentType,
      };
    } catch {
      return { exists: false, size: 0 };
    }
  }

  /**
   * Permanently delete all object versions and delete markers in Backblaze B2
   */
  async deleteAllVersions(key: string): Promise<void> {
    try {
      const listCommand = new ListObjectVersionsCommand({
        Bucket: this.bucket,
        Prefix: key,
      });
      const listRes = await this.client.send(listCommand);

      const objectsToDelete: { Key: string; VersionId?: string }[] = [];

      if (listRes.Versions) {
        for (const v of listRes.Versions) {
          if (v.Key === key && v.VersionId) {
            objectsToDelete.push({ Key: key, VersionId: v.VersionId });
          }
        }
      }

      if (listRes.DeleteMarkers) {
        for (const m of listRes.DeleteMarkers) {
          if (m.Key === key && m.VersionId) {
            objectsToDelete.push({ Key: key, VersionId: m.VersionId });
          }
        }
      }

      if (objectsToDelete.length > 0) {
        await this.client.send(
          new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: { Objects: objectsToDelete },
          })
        );
      } else {
        // Fallback single delete
        await this.client.send(
          new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
          })
        );
      }
    } catch (err) {
      console.error(`[B2Storage] Error deleting all versions for key ${key}:`, err);
    }
  }

  // Standard StorageService implementation
  async upload(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    });
    await this.client.send(command);
    return key;
  }

  async download(key: string): Promise<Readable> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    const response = await this.client.send(command);
    if (!response.Body) {
      throw new Error(`Empty response body from B2 for key: ${key}`);
    }
    return response.Body as Readable;
  }

  async delete(key: string): Promise<void> {
    await this.deleteAllVersions(key);
  }

  async exists(key: string): Promise<boolean> {
    const head = await this.headObject(key);
    return head.exists;
  }

  async getDownloadUrl(key: string, filename: string, inline: boolean = false): Promise<string | null> {
    try {
      return await this.getDownloadPresignedUrl(key, filename, inline);
    } catch {
      return null;
    }
  }
}
