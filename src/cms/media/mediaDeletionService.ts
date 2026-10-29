import 'server-only';
import crypto from 'crypto';

/**
 * PHILOZZ CMS — Safe Remote Deletion Engine
 * Phase 17: Atomic Concurrency, Transactional Reservation & Recoverable Tombstones
 *
 * Implements an owner-only, recoverable, idempotent deletion workflow:
 * 1. Pre-deletion Verification: Checks provider ownership and scans all active references
 *    across projects, articles, sections, brand, and SEO (including all draft versions).
 * 2. Fail-Closed Posture: Any scan error or uncertainty immediately blocks deletion.
 * 3. Atomic Deletion Reservation: Runs a Firestore transaction to transition the asset into
 *    'deleting' with a unique reservation ID and lease expiration, serializing against any
 *    concurrent content reference attachment. ImageKit is NEVER called inside a Firestore transaction.
 * 4. Safe Provider Deletion: Calls provider outside transaction. If network or provider fails,
 *    asset records 'delete_failed' for retry. If provider returns 404, it is treated as already
 *    deleted, enabling idempotent progress.
 * 5. Recoverable Tombstone Finalization: Commits a retry-safe tombstone in Firestore.
 * 6. Full Audit Log Integration: Records every permanent deletion with actor details.
 */

import { mediaRepository, auditLogRepository } from '@/cms/repositories';
import { getFirebaseFirestore } from '@/lib/auth/firebaseAdmin';
import { MediaUsageResolver } from './mediaUsageResolver';
import { getActiveStorageProvider, ImageKitMediaProvider } from './mediaStorageProvider';
import { MediaAssetEntity } from '../models/media';

export interface RemoteDeletionResult {
  success: boolean;
  assetId: string;
  stage: 'verified' | 'deleting' | 'remote_deleted' | 'completed' | 'failed';
  error?: string;
  code?:
    | 'ASSET_NOT_FOUND'
    | 'REFERENCED_ASSET'
    | 'SCAN_FAILED'
    | 'UNSUPPORTED_PROVIDER'
    | 'PROVIDER_NOT_CONFIGURED'
    | 'PROVIDER_OWNERSHIP_MISMATCH'
    | 'STATE_TRANSITION_FAILED'
    | 'REMOTE_DELETE_FAILED'
    | 'DATABASE_DELETE_FAILED'
    | 'REMOTE_DELETION_DISABLED'
    | 'ALREADY_DELETED'
    | 'ALREADY_IN_PROGRESS';
  asset?: MediaAssetEntity;
}

export interface DeletionActor {
  uid: string;
  email?: string;
}

/**
 * Safely executes permanent remote deletion of a media asset.
 */
export async function executeSafeRemoteDeletion(
  assetId: string,
  actor: DeletionActor
): Promise<RemoteDeletionResult> {
  // Production Safety Guard: Keep permanent remote deletion disabled in production
  // until explicitly authorized via ENABLE_PERMANENT_REMOTE_DELETION="true"
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_PERMANENT_REMOTE_DELETION !== 'true') {
    return {
      success: false,
      assetId: String(assetId || ''),
      stage: 'failed',
      code: 'REMOTE_DELETION_DISABLED',
      error:
        'Permanent remote deletion is currently disabled in production until explicitly authorized via ENABLE_PERMANENT_REMOTE_DELETION="true". Soft-delete instead.',
    };
  }

  if (!assetId || typeof assetId !== 'string') {
    return {
      success: false,
      assetId: String(assetId || ''),
      stage: 'failed',
      code: 'ASSET_NOT_FOUND',
      error: 'Valid media asset ID is required.',
    };
  }

  // Step 1: Asset Lookup (including soft-deleted records)
  const asset = await mediaRepository.getById(assetId);
  if (!asset) {
    return {
      success: false,
      assetId,
      stage: 'failed',
      code: 'ASSET_NOT_FOUND',
      error: `Media asset "${assetId}" does not exist in media repository.`,
    };
  }

  // Idempotency: If already tombstoned/deleted, return success
  if (asset.status === 'deleted' || (asset as { tombstone?: boolean }).tombstone) {
    return {
      success: true,
      assetId,
      stage: 'completed',
      code: 'ALREADY_DELETED',
      asset,
    };
  }

  // Step 2: Content Reference Scan across all published and draft entities (Fail-Closed)
  let safetyCheck;
  try {
    safetyCheck = await MediaUsageResolver.canSafelyDelete(asset);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown scan error';
    return {
      success: false,
      assetId,
      stage: 'failed',
      code: 'SCAN_FAILED',
      error: `Content reference verification failed (${message}). Deletion blocked fail-closed to prevent broken links.`,
      asset,
    };
  }

  if (!safetyCheck.allowed) {
    return {
      success: false,
      assetId,
      stage: 'failed',
      code: 'REFERENCED_ASSET',
      error:
        safetyCheck.reason ||
        `Deletion blocked: Asset "${asset.filename}" is actively referenced by content entities.`,
      asset,
    };
  }

  // Step 3: Provider Ownership & Capability Verification
  if (asset.provider === 'local') {
    return {
      success: false,
      assetId,
      stage: 'failed',
      code: 'UNSUPPORTED_PROVIDER',
      error:
        'Local repository assets are part of static code versioning and cannot be permanently removed via remote cloud API. Use safe soft-delete instead.',
      asset,
    };
  }

  const provider = getActiveStorageProvider();

  if (asset.provider === 'imagekit') {
    if (provider.providerName !== 'imagekit' || !provider.isUploadConfigured) {
      return {
        success: false,
        assetId,
        stage: 'failed',
        code: 'PROVIDER_NOT_CONFIGURED',
        error: 'Active storage provider is not configured for ImageKit remote operations.',
        asset,
      };
    }

    // Verify asset URL belongs to configured ImageKit endpoint
    if (provider instanceof ImageKitMediaProvider) {
      const isOwner = provider.verifyProviderOwnership(asset.url);
      if (!isOwner) {
        return {
          success: false,
          assetId,
          stage: 'failed',
          code: 'PROVIDER_OWNERSHIP_MISMATCH',
          error: `Provider mismatch: Asset URL does not match configured ImageKit account endpoint. Remote deletion blocked.`,
          asset,
        };
      }
    }
  }

  // Step 4: Atomic Deletion Reservation via Firestore Transaction (Zero Provider Calls Inside Transaction)
  const now = Date.now();
  const reservationId = crypto.randomUUID();
  const expiresAt = new Date(now + 120_000).toISOString();
  const nowIso = new Date().toISOString();

  if (process.env.CMS_DATA_SOURCE === 'firestore') {
    try {
      const db = getFirebaseFirestore();
      const docRef = db.collection('media').doc(assetId);

      const reservationResult = await db.runTransaction(async (t) => {
        const snap = await t.get(docRef);
        if (!snap.exists) {
          return { success: false, code: 'ASSET_NOT_FOUND' as const };
        }
        const data = snap.data()!;
        if (data.status === 'deleted' || (data.isDeleted && data.tombstone)) {
          return { success: true, code: 'ALREADY_DELETED' as const };
        }

        const leaseExpires = data.reservationExpiresAt
          ? new Date(data.reservationExpiresAt).getTime()
          : 0;

        // If already deleting with an active lease held by another reservation
        if (data.status === 'deleting' && leaseExpires > now && data.reservationId !== reservationId) {
          return { success: true, code: 'ALREADY_IN_PROGRESS' as const, reservationId: data.reservationId };
        }

        t.update(docRef, {
          status: 'deleting',
          reservationId,
          reservationExpiresAt: expiresAt,
          deletionStartedAt: nowIso,
          deletionActor: { uid: actor.uid, email: actor.email || 'owner@philozz.internal' },
          deletionError: null,
          refVersion: ((data.refVersion as number) || 0) + 1,
        });

        return { success: true, code: 'RESERVED' as const };
      });

      if (!reservationResult.success) {
        return {
          success: false,
          assetId,
          stage: 'failed',
          code: reservationResult.code === 'ASSET_NOT_FOUND' ? 'ASSET_NOT_FOUND' : 'STATE_TRANSITION_FAILED',
          error: `Failed reserving asset for deletion: ${reservationResult.code}`,
          asset,
        };
      }

      if (reservationResult.code === 'ALREADY_DELETED') {
        return {
          success: true,
          assetId,
          stage: 'completed',
          code: 'ALREADY_DELETED',
          asset,
        };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        assetId,
        stage: 'failed',
        code: 'STATE_TRANSITION_FAILED',
        error: `Transactional reservation failed (${msg}). Deletion aborted fail-closed.`,
        asset,
      };
    }
  } else {
    // Local memory repository fallback
    try {
      await mediaRepository.update(assetId, {
        status: 'deleting',
        deletionStartedAt: nowIso,
        deletionError: undefined,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        assetId,
        stage: 'failed',
        code: 'STATE_TRANSITION_FAILED',
        error: `Local reservation failed (${msg}). Deletion aborted.`,
        asset,
      };
    }
  }

  // Step 5: Remote Deletion on Provider (Executed Completely Outside Transaction)
  if (asset.providerAssetId) {
    try {
      const remoteDeleted = await provider.delete(asset.providerAssetId);
      if (!remoteDeleted) {
        const deleteErrMsg = `Remote file deletion failed on provider "${asset.provider}".`;
        try {
          await mediaRepository.update(assetId, {
            status: 'delete_failed',
            deletionError: deleteErrMsg,
          });
        } catch {}

        await auditLogRepository.record({
          actorId: actor.uid,
          actorEmail: actor.email || 'owner@philozz.internal',
          action: 'delete',
          entityType: 'media',
          entityId: assetId,
          summary: `Remote deletion failed for asset "${asset.filename}" on ${asset.provider}`,
        });

        return {
          success: false,
          assetId,
          stage: 'failed',
          code: 'REMOTE_DELETE_FAILED',
          error: `${deleteErrMsg} Database record preserved for recovery and retry.`,
          asset,
        };
      }
    } catch (remoteErr: unknown) {
      const msg = remoteErr instanceof Error ? remoteErr.message : String(remoteErr);
      try {
        await mediaRepository.update(assetId, {
          status: 'delete_failed',
          deletionError: `Provider exception: ${msg}`,
        });
      } catch {}

      return {
        success: false,
        assetId,
        stage: 'failed',
        code: 'REMOTE_DELETE_FAILED',
        error: `Provider call threw exception (${msg}). Asset preserved in delete_failed state for retry.`,
        asset,
      };
    }
  }

  // Step 6: Atomic Tombstone Finalization
  try {
    if (process.env.CMS_DATA_SOURCE === 'firestore') {
      const db = getFirebaseFirestore();
      const docRef = db.collection('media').doc(assetId);
      await docRef.set(
        {
          status: 'deleted',
          isDeleted: true,
          tombstone: true,
          deletedAt: new Date().toISOString(),
          deletedBy: actor.uid,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } else {
      await mediaRepository.delete(assetId);
    }
  } catch (dbErr: unknown) {
    const msg = dbErr instanceof Error ? dbErr.message : String(dbErr);
    try {
      await mediaRepository.update(assetId, {
        status: 'delete_failed',
        deletionError: `Tombstone write failed: ${msg}`,
      });
    } catch {}

    return {
      success: false,
      assetId,
      stage: 'failed',
      code: 'DATABASE_DELETE_FAILED',
      error: `Remote file was deleted, but tombstone finalization failed (${msg}). Retry to finalize.`,
      asset,
    };
  }

  // Step 7: Record Operational Audit Log
  await auditLogRepository.record({
    actorId: actor.uid,
    actorEmail: actor.email || 'owner@philozz.internal',
    action: 'delete',
    entityType: 'media',
    entityId: assetId,
    summary: `Permanently deleted media asset "${asset.filename}" (ID: ${assetId}, Provider: ${asset.provider})`,
  });

  return {
    success: true,
    assetId,
    stage: 'completed',
  };
}
