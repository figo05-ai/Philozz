import 'server-only';

/**
 * PHILOZZ CMS — Media Reference Coordinator
 * Phase 17: Security & Cloud Integration Hardening
 *
 * Implements atomic coordination between reserving media assets for deletion
 * and linking/referencing them in content (Projects, Articles, Sections, Brand, SEO).
 *
 * Guarantees:
 * 1. An asset in 'deleting' state cannot be linked by any concurrent content save.
 * 2. An asset with active references cannot be reserved or deleted.
 * 3. Firestore transactions enforce strict mutual exclusion between deletion reservation
 *    and reference creation/updating across all process boundaries.
 */

import { mediaRepository } from '@/cms/repositories';
import { getFirebaseFirestore } from '@/lib/auth/firebaseAdmin';

export interface ReferenceAvailabilityCheck {
  allowed: boolean;
  blockedAssetId?: string;
  blockedFilename?: string;
  error?: string;
}

export class MediaReferenceCoordinator {
  /**
   * Validates that all candidate media URLs or IDs are available and NOT currently
   * reserved for deletion or soft-deleted. Enforces atomic transactional conflict
   * checking in Cloud Firestore mode.
   */
  static async validateReferencesAvailable(
    candidateUrlsOrIds: (string | undefined | null)[]
  ): Promise<ReferenceAvailabilityCheck> {
    const cleanCandidates = candidateUrlsOrIds
      .filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
      .map((c) => c.trim());

    if (cleanCandidates.length === 0) {
      return { allowed: true };
    }

    try {
      const allAssets = await mediaRepository.getAll({ includeDeleted: true });

      const matchedAssets: typeof allAssets = [];

      for (const candidate of cleanCandidates) {
        const matched = allAssets.find(
          (a) =>
            a.id === candidate ||
            a.url === candidate ||
            (candidate.startsWith('/') && a.url.endsWith(candidate)) ||
            (a.url.startsWith('/') && candidate.endsWith(a.url)) ||
            (a.filename && (candidate === a.filename || candidate.endsWith(`/${a.filename}`)))
        );

        if (matched) {
          if (matched.status === 'deleting') {
            return {
              allowed: false,
              blockedAssetId: matched.id,
              blockedFilename: matched.filename,
              error: `Cannot reference media asset "${matched.filename}": Asset is currently being deleted or reserved for deletion.`,
            };
          }

          if (matched.isDeleted) {
            return {
              allowed: false,
              blockedAssetId: matched.id,
              blockedFilename: matched.filename,
              error: `Cannot reference media asset "${matched.filename}": Asset has been deleted. Restore it before referencing.`,
            };
          }

          matchedAssets.push(matched);
        }
      }

      // In Firestore mode, perform atomic conflict verification and reference touch
      if (process.env.CMS_DATA_SOURCE === 'firestore' && matchedAssets.length > 0) {
        const db = getFirebaseFirestore();
        await db.runTransaction(async (t) => {
          for (const asset of matchedAssets) {
            const docRef = db.collection('media').doc(asset.id);
            const snap = await t.get(docRef);
            if (snap.exists) {
              const data = snap.data()!;
              const now = Date.now();
              const leaseExpires = data.reservationExpiresAt
                ? new Date(data.reservationExpiresAt).getTime()
                : 0;

              if (data.status === 'deleting' && leaseExpires > now) {
                throw new Error(
                  `ASSET_RESERVED_FOR_DELETION: Cannot reference media asset "${data.filename || asset.id}": Asset is currently reserved for deletion.`
                );
              }

              if (data.status === 'deleted' || data.isDeleted) {
                throw new Error(
                  `ASSET_ALREADY_DELETED: Cannot reference media asset "${data.filename || asset.id}": Asset has been deleted.`
                );
              }

              // Touch refVersion atomically to create strict serializability with any concurrent deletion reservation
              t.update(docRef, {
                refVersion: ((data.refVersion as number) || 0) + 1,
                lastReferencedAt: new Date().toISOString(),
              });
            }
          }
        });
      }

      return { allowed: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        allowed: false,
        error: `Media reference coordination verification failed (${msg}). Save operation blocked fail-closed.`,
      };
    }
  }

  /**
   * Asserts availability, throwing an Error if any referenced asset is deleting or deleted.
   */
  static async assertReferencesAvailable(
    candidateUrlsOrIds: (string | undefined | null)[]
  ): Promise<void> {
    const check = await this.validateReferencesAvailable(candidateUrlsOrIds);
    if (!check.allowed) {
      throw new Error(check.error || 'Media reference coordination check failed.');
    }
  }
}
