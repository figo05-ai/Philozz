/**
 * PHILOZZ CMS — Provider-Independent Media Storage Adapter
 * Phase 16A: Dynamic CMS Architecture & Data Foundation
 *
 * Decouples the application from any specific image host or database (e.g. "Image DB",
 * Firebase Storage, Cloudinary, ImgBB, S3). When the exact external service configuration
 * is finalized, only this adapter driver needs to be plugged in.
 */

import {
  MediaFolder,
  MediaUploadPayload,
  MediaUploadResult,
  MediaAssetEntity,
} from '../models/media';
import { validateMediaUpload } from '../validation/validators';
import { IMediaRepository } from '../repositories/types';

export * from './mediaStorageProvider';
export * from './mediaUsageResolver';

export interface StorageUploadResult {
  url: string;
  providerAssetId?: string;
  sizeBytes: number;
  dimensions?: { width: number; height: number };
}

export interface IMediaStorageProvider {
  readonly providerName: string;

  upload(
    fileBuffer: Buffer | Uint8Array,
    metadata: {
      filename: string;
      mimeType: string;
      folder: MediaFolder;
    }
  ): Promise<StorageUploadResult>;

  delete(providerAssetIdOrUrl: string): Promise<boolean>;

  resolveUrl(assetPathOrUrl: string): string;
}

/**
 * Local Static Media Provider
 * Operates on Next.js public directory assets (e.g. /images/...)
 */
export class LocalStaticMediaProvider implements IMediaStorageProvider {
  readonly providerName = 'local';

  async upload(
    fileBuffer: Buffer | Uint8Array,
    metadata: {
      filename: string;
      mimeType: string;
      folder: MediaFolder;
    }
  ): Promise<StorageUploadResult> {
    // In local development/mock, return the public URL path
    const url = `/images/${metadata.folder}/${metadata.filename}`;
    return {
      url,
      providerAssetId: metadata.filename,
      sizeBytes: fileBuffer.byteLength,
    };
  }

  async delete(_providerAssetIdOrUrl: string): Promise<boolean> {
    void _providerAssetIdOrUrl;
    return true;
  }

  resolveUrl(assetPathOrUrl: string): string {
    if (assetPathOrUrl.startsWith('http://') || assetPathOrUrl.startsWith('https://')) {
      return assetPathOrUrl;
    }
    return assetPathOrUrl.startsWith('/') ? assetPathOrUrl : `/${assetPathOrUrl}`;
  }
}

/**
 * Image DB Media Provider Stub
 * Prepared for the owner-specified "Image DB" once provider credentials & API contracts are provided.
 */
export class ImageDbMediaProviderStub implements IMediaStorageProvider {
  readonly providerName = 'imagedb';
  private apiKey?: string;
  private endpoint?: string;

  constructor(apiKey?: string, endpoint?: string) {
    this.apiKey = apiKey;
    this.endpoint = endpoint;
  }

  async upload(
    _fileBuffer: Buffer | Uint8Array,
    metadata: {
      filename: string;
      mimeType: string;
      folder: MediaFolder;
    }
  ): Promise<StorageUploadResult> {
    void _fileBuffer;
    if (!this.apiKey || !this.endpoint) {
      throw new Error(
        'ImageDB credentials not configured. Please supply IMAGEDB_API_KEY and IMAGEDB_ENDPOINT in environment variables.'
      );
    }
    // Stub implementation prepared for HTTP multipart upload to Image DB
    return {
      url: `https://images.philozz.com/${metadata.folder}/${metadata.filename}`,
      providerAssetId: `imgdb_${Date.now()}`,
      sizeBytes: 0,
    };
  }

  async delete(_providerAssetIdOrUrl: string): Promise<boolean> {
    void _providerAssetIdOrUrl;
    if (!this.apiKey || !this.endpoint) {
      throw new Error('ImageDB credentials not configured.');
    }
    return true;
  }

  resolveUrl(assetPathOrUrl: string): string {
    if (assetPathOrUrl.startsWith('http://') || assetPathOrUrl.startsWith('https://')) {
      return assetPathOrUrl;
    }
    return `https://images.philozz.com/${assetPathOrUrl.replace(/^\//, '')}`;
  }
}

/**
 * High-Level Media Service
 * Coordinates validation, physical storage upload, and metadata record keeping.
 */
export class MediaService {
  constructor(
    private storageProvider: IMediaStorageProvider,
    private mediaRepo: IMediaRepository
  ) {}

  async uploadAsset(payload: MediaUploadPayload): Promise<MediaUploadResult> {
    // 1. Validate payload metadata
    const validation = validateMediaUpload(payload);
    if (!validation.valid) {
      return {
        success: false,
        error: Object.values(validation.errors).join('; '),
      };
    }

    if (!payload.buffer) {
      return {
        success: false,
        error: 'File content buffer is required for upload.',
      };
    }

    try {
      // 2. Delegate file storage to the active provider
      const uploadResult = await this.storageProvider.upload(payload.buffer, {
        filename: payload.filename,
        mimeType: payload.mimeType,
        folder: payload.folder,
      });

      // 3. Persist media asset entity to repository
      const asset = await this.mediaRepo.create({
        filename: payload.filename,
        originalName: payload.filename,
        mimeType: payload.mimeType,
        sizeBytes: uploadResult.sizeBytes,
        dimensions: uploadResult.dimensions,
        url: uploadResult.url,
        provider: this.storageProvider.providerName as MediaAssetEntity['provider'],
        providerAssetId: uploadResult.providerAssetId,
        altText: payload.altText || payload.filename,
        caption: payload.caption,
        folder: payload.folder,
        tags: payload.tags || [],
        uploadedBy: payload.uploadedBy || 'admin',
      });

      return {
        success: true,
        asset,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown upload error';
      return {
        success: false,
        error: message,
      };
    }
  }

  resolveUrl(urlOrPath: string): string {
    return this.storageProvider.resolveUrl(urlOrPath);
  }
}
