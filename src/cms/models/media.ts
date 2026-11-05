/**
 * PHILOZZ CMS — Provider-Independent Media Domain Models
 * Phase 16A: Dynamic CMS Architecture & Data Foundation
 */

export type MediaFolder = 'projects' | 'articles' | 'photos' | 'brand' | 'general';
export type MediaProviderType =
  | 'local'
  | 'imagedb'
  | 'firebase-storage'
  | 'cloudinary'
  | 'imagekit'
  | 'custom';

export type MediaLifecycleStatus =
  | 'ready'
  | 'pending'
  | 'processing'
  | 'archived'
  | 'failed'
  | 'deleting'
  | 'delete_failed'
  | 'deleted';

export interface MediaDimensions {
  width: number;
  height: number;
}

export interface MediaUsageReference {
  entityType:
    | 'project'
    | 'article'
    | 'homepage_hero'
    | 'homepage_about'
    | 'homepage_contact'
    | 'brand_info'
    | 'seo_config';
  entityId: string;
  entityTitle: string;
  field: string;
  fieldLabel: string;
  isPublished: boolean;
  isDraft: boolean;
}

export interface MediaUsageReport {
  assetId: string;
  references: MediaUsageReference[];
  isInUse: boolean;
  isDeletable: boolean;
  summary: string;
  scanError?: string;
}

export interface MediaAssetEntity {
  id: string; // Stable media ID
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  dimensions?: MediaDimensions;
  url: string; // Canonical delivery URL
  thumbnailUrl?: string;
  provider: MediaProviderType;
  providerAssetId?: string; // ID assigned by external provider if applicable
  altText: string;
  caption?: string;
  folder: MediaFolder;
  tags: string[];
  uploadedBy: string;
  status?: MediaLifecycleStatus; // Lifecycle status: 'ready', 'pending', 'deleting', etc.
  deletionStartedAt?: string;
  deletionError?: string;
  isDeleted?: boolean; // Soft-deletion flag
  deletedAt?: string | null; // ISO 8601 timestamp
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
  includeDeleted?: boolean; // When true, includes soft-deleted assets
}
