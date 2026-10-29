import 'server-only';

/**
 * PHILOZZ CMS — Secure Upload Intent & Rate Limiting Engine
 * Phase 16E.2.1: Vercel-Safe Distributed Upload State
 *
 * Provides distributed cryptographic authorization hardening for cloud media uploads:
 * 1. Durable server-side Upload Intents persisted to Firestore with 15-minute TTL.
 * 2. Distributed sliding-window rate limiting per owner UID in Firestore (Vercel cross-instance safe).
 * 3. Strict filename & path sanitization (anti path-traversal, anti control-char).
 * 4. Atomic single-use consumption at registration time in Firestore transactions.
 * 5. Fail-closed posture if the shared state store is unavailable.
 */

import { getFirebaseFirestore } from '@/lib/auth/firebaseAdmin';
import { FIRESTORE_COLLECTIONS } from '../repositories/firestore/firestoreContracts';
import { MediaFolder, MediaProviderType } from '../models/media';

export interface UploadIntent {
  token: string;
  ownerUid: string;
  provider?: MediaProviderType;
  filename: string;
  folder: MediaFolder;
  mimeType: string;
  sizeBytes: number;
  createdAt: number;
  expiresAt: number;
  consumed: boolean;
  consumedAt?: number;
  providerAssetId?: string;
  registeredAssetId?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 60 seconds
const MAX_REQUESTS_PER_WINDOW = 30; // 30 requests per minute
export const INTENT_TTL_MS = 15 * 60 * 1000; // 15 minutes (matches ImageKit token TTL)

// In-memory fallback buckets strictly for offline unit tests without Firestore/Emulator
interface RateLimitBucket {
  count: number;
  resetAt: number;
}
const memRateLimitStore = new Map<string, RateLimitBucket>();
const memIntentStore = new Map<string, UploadIntent>();

function getDb(): FirebaseFirestore.Firestore | null {
  try {
    return getFirebaseFirestore();
  } catch {
    return null;
  }
}

function sanitizeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Validates filename against path-traversal, hidden files, and dangerous control characters.
 */
export function validateSafeFilename(filename: string): {
  valid: boolean;
  sanitized: string;
  error?: string;
} {
  if (!filename || typeof filename !== 'string') {
    return { valid: false, sanitized: '', error: 'Filename is required.' };
  }

  const trimmed = filename.trim();

  // Reject empty or overly long filenames
  if (trimmed.length === 0 || trimmed.length > 120) {
    return {
      valid: false,
      sanitized: '',
      error: 'Filename length must be between 1 and 120 characters.',
    };
  }

  // Reject path traversal and control characters
  if (
    trimmed.includes('..') ||
    trimmed.includes('/') ||
    trimmed.includes('\\') ||
    trimmed.includes('\0') ||
    /[\x00-\x1f\x7f]/.test(trimmed)
  ) {
    return {
      valid: false,
      sanitized: '',
      error: 'Filename contains forbidden path characters or control sequences.',
    };
  }

  // Reject hidden files starting with dot
  if (trimmed.startsWith('.')) {
    return {
      valid: false,
      sanitized: '',
      error: 'Hidden files starting with "." are not allowed.',
    };
  }

  // Enforce safe characters: alphanumeric, hyphen, underscore, and dots for extension
  const safeCharRegex = /^[a-zA-Z0-9_\-.]+$/;
  if (!safeCharRegex.test(trimmed)) {
    return {
      valid: false,
      sanitized: '',
      error: 'Filename may only contain alphanumeric characters, hyphens, underscores, and dots.',
    };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Checks sliding-window rate limit for a given actor identifier (UID).
 * Uses Firestore transaction for distributed correctness across Vercel serverless functions.
 */
export async function checkUploadRateLimit(actorId: string): Promise<RateLimitResult> {
  const db = getDb();
  const now = Date.now();

  if (db) {
    const docRef = db.collection(FIRESTORE_COLLECTIONS.RATE_LIMITS).doc(`rate_${sanitizeKey(actorId)}`);
    return await db.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(docRef);

      if (!docSnap.exists) {
        transaction.set(docRef, {
          actorId,
          count: 1,
          resetAt: now + RATE_LIMIT_WINDOW_MS,
          updatedAt: now,
        });
        return {
          allowed: true,
          remaining: MAX_REQUESTS_PER_WINDOW - 1,
          resetSeconds: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
        };
      }

      const data = docSnap.data()!;
      const resetAt = (data.resetAt as number) || 0;
      const count = (data.count as number) || 0;

      if (now >= resetAt) {
        transaction.set(docRef, {
          actorId,
          count: 1,
          resetAt: now + RATE_LIMIT_WINDOW_MS,
          updatedAt: now,
        });
        return {
          allowed: true,
          remaining: MAX_REQUESTS_PER_WINDOW - 1,
          resetSeconds: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
        };
      }

      if (count >= MAX_REQUESTS_PER_WINDOW) {
        const resetSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));
        return {
          allowed: false,
          remaining: 0,
          resetSeconds,
        };
      }

      const nextCount = count + 1;
      transaction.update(docRef, {
        count: nextCount,
        updatedAt: now,
      });
      const resetSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));
      return {
        allowed: true,
        remaining: MAX_REQUESTS_PER_WINDOW - nextCount,
        resetSeconds,
      };
    });
  }

  // Fail-closed in production if shared store is unavailable
  if (process.env.NODE_ENV === 'production' || process.env.CMS_DATA_SOURCE === 'firestore') {
    throw new Error('Shared upload rate limit store is unavailable. Signing rejected fail-closed.');
  }

  // In-memory fallback for local offline unit tests
  const bucket = memRateLimitStore.get(actorId);
  if (!bucket || now >= bucket.resetAt) {
    memRateLimitStore.set(actorId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return {
      allowed: true,
      remaining: MAX_REQUESTS_PER_WINDOW - 1,
      resetSeconds: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
    };
  }

  if (bucket.count >= MAX_REQUESTS_PER_WINDOW) {
    const resetSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetSeconds,
    };
  }

  bucket.count += 1;
  const resetSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_WINDOW - bucket.count,
    resetSeconds,
  };
}

/**
 * Creates and registers a durable Upload Intent in Firestore (or offline test fallback).
 */
export async function registerUploadIntent(params: {
  token: string;
  ownerUid: string;
  provider?: MediaProviderType;
  filename: string;
  folder: MediaFolder;
  mimeType: string;
  sizeBytes: number;
}): Promise<UploadIntent> {
  const db = getDb();
  const now = Date.now();
  const intent: UploadIntent = {
    token: params.token,
    ownerUid: params.ownerUid,
    provider: params.provider || 'imagekit',
    filename: params.filename,
    folder: params.folder,
    mimeType: params.mimeType,
    sizeBytes: params.sizeBytes,
    createdAt: now,
    expiresAt: now + INTENT_TTL_MS,
    consumed: false,
  };

  if (db) {
    const docRef = db.collection(FIRESTORE_COLLECTIONS.UPLOAD_INTENTS).doc(`intent_${sanitizeKey(params.token)}`);
    await docRef.set(intent);
    return intent;
  }

  // Fail-closed in production if shared store is unavailable
  if (process.env.NODE_ENV === 'production' || process.env.CMS_DATA_SOURCE === 'firestore') {
    throw new Error('Shared upload intent store is unavailable. Signing rejected fail-closed.');
  }

  memIntentStore.set(params.token, intent);
  return intent;
}

/**
 * Retrieves an active Upload Intent from Firestore or test store.
 * Explicitly validates expiration in application logic.
 */
export async function getUploadIntent(token: string): Promise<UploadIntent | null> {
  const db = getDb();
  const now = Date.now();

  if (db) {
    const docRef = db.collection(FIRESTORE_COLLECTIONS.UPLOAD_INTENTS).doc(`intent_${sanitizeKey(token)}`);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return null;

    const intent = docSnap.data() as UploadIntent;
    if (now > intent.expiresAt) {
      return null;
    }
    return intent;
  }

  const intent = memIntentStore.get(token);
  if (!intent) return null;
  if (now > intent.expiresAt) {
    memIntentStore.delete(token);
    return null;
  }
  return intent;
}

/**
 * Atomically consumes an Upload Intent in Firestore.
 * Supports idempotent retries for the same providerAssetId.
 */
export async function consumeUploadIntent(
  token: string,
  ownerUid: string,
  providerAssetId?: string
): Promise<{ success: boolean; intent?: UploadIntent; error?: string; code?: string }> {
  const db = getDb();
  const now = Date.now();

  if (db) {
    const docRef = db.collection(FIRESTORE_COLLECTIONS.UPLOAD_INTENTS).doc(`intent_${sanitizeKey(token)}`);
    return await db.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(docRef);

      if (!docSnap.exists) {
        return { success: false, code: 'NOT_FOUND', error: 'Upload intent not found or expired.' };
      }

      const intent = docSnap.data() as UploadIntent;

      if (now > intent.expiresAt) {
        return {
          success: false,
          code: 'EXPIRED',
          error: 'Upload intent has expired (15-minute window exceeded).',
        };
      }

      if (intent.ownerUid !== ownerUid) {
        return { success: false, code: 'OWNER_MISMATCH', error: 'Upload intent owner mismatch.' };
      }

      if (intent.consumed) {
        // Safe retry if it matches the exact same providerAssetId
        if (providerAssetId && intent.providerAssetId === providerAssetId) {
          return { success: true, intent };
        }
        return {
          success: false,
          code: 'ALREADY_CONSUMED',
          error: 'Upload intent has already been consumed (replay rejected).',
        };
      }

      const updatedIntent: UploadIntent = {
        ...intent,
        consumed: true,
        consumedAt: now,
        providerAssetId: providerAssetId || intent.providerAssetId,
      };

      transaction.update(docRef, {
        consumed: true,
        consumedAt: now,
        providerAssetId: providerAssetId || null,
      });

      return { success: true, intent: updatedIntent };
    });
  }

  // In-memory fallback for local offline unit tests
  const intent = memIntentStore.get(token);
  if (!intent) {
    return { success: false, code: 'NOT_FOUND', error: 'Upload intent not found or expired.' };
  }
  if (now > intent.expiresAt) {
    memIntentStore.delete(token);
    return { success: false, code: 'EXPIRED', error: 'Upload intent has expired (15-minute window exceeded).' };
  }
  if (intent.ownerUid !== ownerUid) {
    return { success: false, code: 'OWNER_MISMATCH', error: 'Upload intent owner mismatch.' };
  }
  if (intent.consumed) {
    if (providerAssetId && intent.providerAssetId === providerAssetId) {
      return { success: true, intent };
    }
    return {
      success: false,
      code: 'ALREADY_CONSUMED',
      error: 'Upload intent has already been consumed (replay rejected).',
    };
  }

  intent.consumed = true;
  intent.consumedAt = now;
  if (providerAssetId) {
    intent.providerAssetId = providerAssetId;
  }
  return { success: true, intent };
}

/**
 * Resets stores for test suites.
 */
export async function _resetIntentStoreForTesting(): Promise<void> {
  memIntentStore.clear();
  memRateLimitStore.clear();

  const db = getDb();
  if (db && process.env.FIRESTORE_EMULATOR_HOST) {
    const intents = await db.collection(FIRESTORE_COLLECTIONS.UPLOAD_INTENTS).get();
    const batch = db.batch();
    intents.docs.forEach((doc) => batch.delete(doc.ref));
    const limits = await db.collection(FIRESTORE_COLLECTIONS.RATE_LIMITS).get();
    limits.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
}
