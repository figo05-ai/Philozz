import 'server-only';

/**
 * PHILOZZ CMS — Firestore Media Repository Implementation
 * Phase 16D.0: Firestore Foundation & Safe Content Migration
 *
 * Real server-only Firestore adapter implementing IMediaRepository.
 * Manages metadata records for uploaded portfolio assets.
 */

import { getFirebaseFirestore } from '@/lib/auth/firebaseAdmin';
import {
  MediaAssetEntity,
  MediaFilterOptions,
} from '../../models/media';
import { IMediaRepository } from '../types';
import { FIRESTORE_COLLECTIONS } from './firestoreContracts';

export class FirestoreMediaRepository implements IMediaRepository {
  private get collection() {
    return getFirebaseFirestore().collection(FIRESTORE_COLLECTIONS.MEDIA);
  }

  async getAll(options?: MediaFilterOptions): Promise<MediaAssetEntity[]> {
    let query: FirebaseFirestore.Query = this.collection;

    if (options?.folder) {
      query = query.where('folder', '==', options.folder);
    }

    const snapshot = await query.get();
    let assets: MediaAssetEntity[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: (data.id as string) || doc.id,
        filename: (data.filename as string) || '',
        originalName: (data.originalName as string) || '',
        mimeType: (data.mimeType as string) || '',
        sizeBytes: (data.sizeBytes as number) || 0,
        dimensions: data.dimensions as MediaAssetEntity['dimensions'],
        url: (data.url as string) || '',
        thumbnailUrl: (data.thumbnailUrl as string) || undefined,
        provider: (data.provider as MediaAssetEntity['provider']) || 'local',
        providerAssetId: (data.providerAssetId as string) || undefined,
        altText: (data.altText as string) || '',
        caption: (data.caption as string) || undefined,
        folder: (data.folder as MediaAssetEntity['folder']) || 'general',
        tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
        uploadedBy: (data.uploadedBy as string) || 'system',
        createdAt: (data.createdAt as string) || new Date().toISOString(),
        updatedAt: (data.updatedAt as string) || new Date().toISOString(),
      };
    });

    if (options?.mimeTypePrefix) {
      assets = assets.filter((a) => a.mimeType.startsWith(options.mimeTypePrefix!));
    }

    if (options?.tag) {
      assets = assets.filter((a) => a.tags.includes(options.tag!));
    }

    if (options?.search) {
      const q = options.search.toLowerCase();
      assets = assets.filter(
        (a) =>
          a.filename.toLowerCase().includes(q) ||
          a.altText.toLowerCase().includes(q)
      );
    }

    // Sort by createdAt descending
    assets.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const offset = options?.offset || 0;
    const limit = options?.limit || assets.length;
    return assets.slice(offset, offset + limit);
  }

  async getById(id: string): Promise<MediaAssetEntity | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      return null;
    }
    const data = doc.data()!;
    return {
      id: (data.id as string) || doc.id,
      filename: (data.filename as string) || '',
      originalName: (data.originalName as string) || '',
      mimeType: (data.mimeType as string) || '',
      sizeBytes: (data.sizeBytes as number) || 0,
      dimensions: data.dimensions as MediaAssetEntity['dimensions'],
      url: (data.url as string) || '',
      thumbnailUrl: (data.thumbnailUrl as string) || undefined,
      provider: (data.provider as MediaAssetEntity['provider']) || 'local',
      providerAssetId: (data.providerAssetId as string) || undefined,
      altText: (data.altText as string) || '',
      caption: (data.caption as string) || undefined,
      folder: (data.folder as MediaAssetEntity['folder']) || 'general',
      tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
      uploadedBy: (data.uploadedBy as string) || 'system',
      createdAt: (data.createdAt as string) || new Date().toISOString(),
      updatedAt: (data.updatedAt as string) || new Date().toISOString(),
    };
  }

  async create(
    asset: Omit<MediaAssetEntity, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<MediaAssetEntity> {
    const now = new Date().toISOString();
    const id = `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newAsset: MediaAssetEntity = {
      ...asset,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await this.collection.doc(id).set(newAsset);
    return newAsset;
  }

  async update(
    id: string,
    data: Partial<MediaAssetEntity>
  ): Promise<MediaAssetEntity> {
    const docRef = this.collection.doc(id);
    const existing = await docRef.get();

    if (!existing.exists) {
      throw new Error(`Media asset with ID "${id}" not found in Firestore.`);
    }

    const current = existing.data()! as MediaAssetEntity;
    const updated: MediaAssetEntity = {
      ...current,
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };

    await docRef.set(updated, { merge: true });
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const docRef = this.collection.doc(id);
    const existing = await docRef.get();
    if (!existing.exists) {
      return false;
    }
    await docRef.delete();
    return true;
  }
}
