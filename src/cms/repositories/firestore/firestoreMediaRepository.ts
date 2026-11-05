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
import { IMediaRepository, CreateMediaResult, CreateMediaOptions } from '../types';
import { FIRESTORE_COLLECTIONS } from './firestoreContracts';

function stripUndefined<T extends Record<string, unknown>>(data: T): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) {
      clean[k] = v;
    }
  }
  return clean;
}

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
        status: (data.status as MediaAssetEntity['status']) || 'ready',
        isDeleted: Boolean(data.isDeleted),
        deletedAt: (data.deletedAt as string) || undefined,
        createdAt: (data.createdAt as string) || new Date().toISOString(),
        updatedAt: (data.updatedAt as string) || new Date().toISOString(),
      };
    });

    if (!options?.includeDeleted) {
      assets = assets.filter((a) => !a.isDeleted);
    }

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
      status: (data.status as MediaAssetEntity['status']) || 'ready',
      isDeleted: Boolean(data.isDeleted),
      deletedAt: (data.deletedAt as string) || undefined,
      createdAt: (data.createdAt as string) || new Date().toISOString(),
      updatedAt: (data.updatedAt as string) || new Date().toISOString(),
    };
  }

  async getByProviderAssetId(providerAssetId: string): Promise<MediaAssetEntity | null> {
    if (!providerAssetId || typeof providerAssetId !== 'string') return null;
    const sanitizedId = providerAssetId.replace(/[^a-zA-Z0-9_-]/g, '_');

    // 1. Direct deterministic document lookup
    const directDoc = await this.collection.doc(`media_imagekit_${sanitizedId}`).get();
    if (directDoc.exists) {
      const data = directDoc.data()!;
      return {
        id: (data.id as string) || directDoc.id,
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
        status: (data.status as MediaAssetEntity['status']) || 'ready',
        isDeleted: Boolean(data.isDeleted),
        deletedAt: (data.deletedAt as string) || undefined,
        createdAt: (data.createdAt as string) || new Date().toISOString(),
        updatedAt: (data.updatedAt as string) || new Date().toISOString(),
      };
    }

    // 2. Query fallback across any provider
    const snapshot = await this.collection.where('providerAssetId', '==', providerAssetId).limit(1).get();
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
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
        status: (data.status as MediaAssetEntity['status']) || 'ready',
        isDeleted: Boolean(data.isDeleted),
        deletedAt: (data.deletedAt as string) || undefined,
        createdAt: (data.createdAt as string) || new Date().toISOString(),
        updatedAt: (data.updatedAt as string) || new Date().toISOString(),
      };
    }

    return null;
  }

  async createIdempotent(
    asset: Omit<MediaAssetEntity, 'id' | 'createdAt' | 'updatedAt'>,
    options?: CreateMediaOptions
  ): Promise<CreateMediaResult> {
    const hasProviderId = Boolean(asset.providerAssetId && asset.providerAssetId.trim());
    const sanitizedId = hasProviderId
      ? asset.providerAssetId!.trim().replace(/[^a-zA-Z0-9_-]/g, '_')
      : null;
    const providerKey = asset.provider || 'asset';
    const id = sanitizedId
      ? `media_${providerKey}_${sanitizedId}`
      : `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const docRef = this.collection.doc(id);
    const firestore = getFirebaseFirestore();

    return await firestore.runTransaction(async (transaction) => {
      let intentRef: FirebaseFirestore.DocumentReference | null = null;
      let intentData: Record<string, unknown> | null = null;

      if (options?.intentToken) {
        const sanitizedToken = options.intentToken.replace(/[^a-zA-Z0-9_-]/g, '_');
        intentRef = firestore.collection(FIRESTORE_COLLECTIONS.UPLOAD_INTENTS).doc(`intent_${sanitizedToken}`);
        const intentSnap = await transaction.get(intentRef);

        if (!intentSnap.exists) {
          throw new Error('Upload intent not found or expired.');
        }

        intentData = intentSnap.data() as Record<string, unknown>;
        const nowMs = Date.now();

        if (nowMs > (intentData.expiresAt as number)) {
          throw new Error('Upload intent has expired (15-minute window exceeded).');
        }

        if (options.ownerUid && intentData.ownerUid !== options.ownerUid) {
          throw new Error('Upload intent owner mismatch.');
        }

        if (intentData.folder !== asset.folder) {
          throw new Error(
            `Target folder "${asset.folder}" does not match authorized upload intent folder "${intentData.folder}".`
          );
        }

        // Check consumption state
        if (intentData.consumed) {
          if (asset.providerAssetId && intentData.providerAssetId === asset.providerAssetId) {
            // Permitted idempotent retry for the exact same asset
          } else {
            throw new Error('Upload intent has already been consumed (replay rejected).');
          }
        }
      }

      const existingDoc = await transaction.get(docRef);
      if (existingDoc.exists) {
        const data = existingDoc.data()!;
        const existingAsset: MediaAssetEntity = {
          id: (data.id as string) || existingDoc.id,
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
          status: (data.status as MediaAssetEntity['status']) || 'ready',
          isDeleted: Boolean(data.isDeleted),
          deletedAt: (data.deletedAt as string) || undefined,
          createdAt: (data.createdAt as string) || new Date().toISOString(),
          updatedAt: (data.updatedAt as string) || new Date().toISOString(),
        };

        // If intent exists and wasn't marked consumed with this asset, mark it consumed
        if (intentRef && intentData && (!intentData.consumed || intentData.providerAssetId !== asset.providerAssetId)) {
          transaction.update(intentRef, {
            consumed: true,
            consumedAt: Date.now(),
            providerAssetId: asset.providerAssetId || null,
            registeredAssetId: id,
          });
        }

        return { asset: existingAsset, isNew: false };
      }

      const now = new Date().toISOString();
      const newAsset: MediaAssetEntity = {
        ...asset,
        id,
        status: asset.status || 'ready',
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      };

      // Atomic commit of both media record and intent consumption
      transaction.set(docRef, stripUndefined(newAsset as unknown as Record<string, unknown>));
      if (intentRef) {
        transaction.update(intentRef, {
          consumed: true,
          consumedAt: Date.now(),
          providerAssetId: asset.providerAssetId || null,
          registeredAssetId: id,
        });
      }

      return { asset: newAsset, isNew: true };
    });
  }

  async create(
    asset: Omit<MediaAssetEntity, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<MediaAssetEntity> {
    const res = await this.createIdempotent(asset);
    return res.asset;
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

    await docRef.set(stripUndefined(updated as unknown as Record<string, unknown>), { merge: true });
    return updated;
  }

  async softDelete(id: string): Promise<boolean> {
    const docRef = this.collection.doc(id);
    const existing = await docRef.get();
    if (!existing.exists) {
      return false;
    }
    const now = new Date().toISOString();
    await docRef.update({
      status: 'archived',
      isDeleted: true,
      deletedAt: now,
      updatedAt: now,
    });
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const docRef = this.collection.doc(id);
    const existing = await docRef.get();
    if (!existing.exists) {
      return false;
    }
    const now = new Date().toISOString();
    await docRef.update({
      status: 'ready',
      isDeleted: false,
      deletedAt: null,
      updatedAt: now,
    });
    return true;
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
