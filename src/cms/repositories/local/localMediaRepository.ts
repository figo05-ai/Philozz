/**
 * PHILOZZ CMS — Local Media Repository Implementation
 * Phase 16A: Dynamic CMS Architecture & Data Foundation
 *
 * In-memory repository tracking media assets, seeded with existing public assets.
 */

import {
  MediaAssetEntity,
  MediaFilterOptions,
} from '../../models/media';
import { IMediaRepository, CreateMediaResult, CreateMediaOptions } from '../types';

export class LocalMediaRepository implements IMediaRepository {
  private assets: MediaAssetEntity[];

  constructor() {
    this.assets = [
      {
        id: 'portrait-thinking',
        filename: 'felopater-portrait-thinking.jpg',
        originalName: 'felopater-portrait-thinking.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 154000,
        dimensions: { width: 800, height: 1000 },
        url: '/images/felopater-portrait-thinking.jpg',
        provider: 'local',
        altText: 'Felopater Nabil — The Mind Behind the Code',
        caption: 'Portrait representing analytical reasoning and architecture decisions.',
        folder: 'photos',
        tags: ['portrait', 'about', 'editorial'],
        uploadedBy: 'system',
        status: 'ready',
        isDeleted: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-04-15T00:00:00.000Z',
      },
      {
        id: 'portrait-sitting',
        filename: 'felopater-portrait-sitting.jpg',
        originalName: 'felopater-portrait-sitting.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 168000,
        dimensions: { width: 800, height: 1000 },
        url: '/images/felopater-portrait-sitting.jpg',
        provider: 'local',
        altText: 'Felopater Nabil seated in studio workspace',
        folder: 'photos',
        tags: ['portrait', 'studio'],
        uploadedBy: 'system',
        status: 'ready',
        isDeleted: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-04-15T00:00:00.000Z',
      },
      {
        id: 'workspace-backdrop',
        filename: 'studio-workspace-backdrop.jpg',
        originalName: 'studio-workspace-backdrop.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 245000,
        dimensions: { width: 1920, height: 1080 },
        url: '/images/studio-workspace-backdrop.jpg',
        provider: 'local',
        altText: 'Studio Workspace Backdrop',
        folder: 'brand',
        tags: ['backdrop', 'studio'],
        uploadedBy: 'system',
        status: 'ready',
        isDeleted: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-04-15T00:00:00.000Z',
      },
      {
        id: 'cinematic-hero',
        filename: 'philozz-cinematic-hero.png',
        originalName: 'philozz-cinematic-hero.png',
        mimeType: 'image/png',
        sizeBytes: 890000,
        dimensions: { width: 1920, height: 1080 },
        url: '/images/philozz-cinematic-hero.png',
        provider: 'local',
        altText: 'Felopater Nabil — Full-Stack Software Engineer seated at executive desk',
        folder: 'brand',
        tags: ['hero', 'cinematic'],
        uploadedBy: 'system',
        status: 'ready',
        isDeleted: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-04-15T00:00:00.000Z',
      },
      {
        id: 'cv-pdf',
        filename: 'felopater-cv.pdf',
        originalName: 'felopater-cv.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 320000,
        url: '/images/felopater-cv.pdf',
        provider: 'local',
        altText: 'Curriculum Vitae of Felopater Nabil',
        folder: 'brand',
        tags: ['resume', 'cv', 'pdf'],
        uploadedBy: 'system',
        status: 'ready',
        isDeleted: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-04-15T00:00:00.000Z',
      },
    ];
  }

  async getAll(options?: MediaFilterOptions): Promise<MediaAssetEntity[]> {
    let result = [...this.assets];

    // Filter soft-deleted assets unless explicitly requested
    if (!options?.includeDeleted) {
      result = result.filter((a) => !a.isDeleted);
    }

    if (options?.folder) {
      result = result.filter((a) => a.folder === options.folder);
    }
    if (options?.mimeTypePrefix) {
      result = result.filter((a) => a.mimeType.startsWith(options.mimeTypePrefix!));
    }
    if (options?.tag) {
      result = result.filter((a) => a.tags.includes(options.tag!));
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      result = result.filter(
        (a) => a.filename.toLowerCase().includes(q) || a.altText.toLowerCase().includes(q)
      );
    }
    const offset = options?.offset || 0;
    const limit = options?.limit || result.length;
    return result.slice(offset, offset + limit);
  }

  async getById(id: string): Promise<MediaAssetEntity | null> {
    const found = this.assets.find((a) => a.id === id);
    return found ? { ...found } : null;
  }

  async getByProviderAssetId(providerAssetId: string): Promise<MediaAssetEntity | null> {
    if (!providerAssetId) return null;
    const found = this.assets.find((a) => a.providerAssetId === providerAssetId);
    return found ? { ...found } : null;
  }

  async createIdempotent(
    asset: Omit<MediaAssetEntity, 'id' | 'createdAt' | 'updatedAt'>,
    _options?: CreateMediaOptions
  ): Promise<CreateMediaResult> {
    if (asset.providerAssetId) {
      const existing = this.assets.find((a) => a.providerAssetId === asset.providerAssetId);
      if (existing) {
        return { asset: { ...existing }, isNew: false };
      }
    }
    const created = await this.create(asset);
    return { asset: created, isNew: true };
  }

  async create(asset: Omit<MediaAssetEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<MediaAssetEntity> {
    const now = new Date().toISOString();
    const isCloud = Boolean(asset.provider && asset.provider !== 'local' && asset.providerAssetId);
    const sanitizedId = isCloud ? asset.providerAssetId!.replace(/[^a-zA-Z0-9_-]/g, '_') : null;
    const id = isCloud
      ? `media_${asset.provider}_${sanitizedId}`
      : `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newAsset: MediaAssetEntity = {
      ...asset,
      id,
      status: asset.status || 'ready',
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };
    this.assets.unshift(newAsset);
    return { ...newAsset };
  }

  async update(id: string, data: Partial<MediaAssetEntity>): Promise<MediaAssetEntity> {
    const idx = this.assets.findIndex((a) => a.id === id);
    if (idx === -1) {
      throw new Error(`Media asset with id "${id}" not found.`);
    }
    const updated: MediaAssetEntity = {
      ...this.assets[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.assets[idx] = updated;
    return { ...updated };
  }

  async softDelete(id: string): Promise<boolean> {
    const idx = this.assets.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    const now = new Date().toISOString();
    this.assets[idx] = {
      ...this.assets[idx],
      status: 'archived',
      isDeleted: true,
      deletedAt: now,
      updatedAt: now,
    };
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const idx = this.assets.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    const now = new Date().toISOString();
    this.assets[idx] = {
      ...this.assets[idx],
      status: 'ready',
      isDeleted: false,
      deletedAt: undefined,
      updatedAt: now,
    };
    return true;
  }

  async delete(id: string): Promise<boolean> {
    const idx = this.assets.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    this.assets.splice(idx, 1);
    return true;
  }
}
