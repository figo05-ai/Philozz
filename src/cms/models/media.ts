/**
 * PHILOZZ CMS — Provider-Independent Media Domain Models
 * Phase 16A: Dynamic CMS Architecture & Data Foundation
 */

export type MediaFolder = 'projects' | 'articles' | 'photos' | 'brand' | 'general';
export type MediaProviderType = 'local' | 'imagedb' | 'firebase-storage' | 'custom';

export interface MediaDimensions {
  width: number;
  height: number;
}

export interface MediaAssetEntity {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  dimensions?: MediaDimensions;
  url: string;
  thumbnailUrl?: string;
  provider: MediaProviderType;
  providerAssetId?: string; // ID assigned by external provider if applicable
  altText: string;
  caption?: string;
  folder: MediaFolder;
  tags: string[];
  uploadedBy: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface MediaUploadPayload {
  buffer?: Buffer | Uint8Array;
  filename: string;
  mimeType: string;
  folder: MediaFolder;
  altText?: string;
  caption?: string;
  tags?: string[];
  uploadedBy?: string;
}

export interface MediaUploadResult {
  success: boolean;
  asset?: MediaAssetEntity;
  error?: string;
}

export interface MediaFilterOptions {
  folder?: MediaFolder;
  mimeTypePrefix?: string; // e.g. 'image/'
  tag?: string;
  search?: string;
  limit?: number;
  offset?: number;
}
