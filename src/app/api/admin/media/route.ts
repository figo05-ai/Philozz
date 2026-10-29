import { NextRequest, NextResponse } from 'next/server';
import { assertAdminSession } from '@/lib/auth/requireAdminSession';
import {
  mediaRepository,
  auditLogRepository,
  getRepositoryDataSource,
  FirestoreMediaRepository,
} from '@/cms/repositories';
import { MediaFolder, MediaProviderType, MediaAssetEntity } from '@/cms/models/media';
import { MediaUsageResolver } from '@/cms/media/mediaUsageResolver';
import { validateMediaUpload } from '@/cms/validation/validators';
import { getActiveStorageProvider } from '@/cms/media/mediaStorageProvider';
import { getUploadIntent } from '@/cms/media/mediaUploadIntent';
import {
  ALLOWED_RASTER_IMAGE_MIME_TYPES,
  MAX_MEDIA_FILE_SIZE,
  MAX_PDF_FILE_SIZE,
  verifyRemotePdfSignature,
} from '@/cms/validation/mediaValidators';
import { executeSafeRemoteDeletion } from '@/cms/media/mediaDeletionService';

export async function GET(request: NextRequest) {
  try {
    await assertAdminSession();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized access';
    return NextResponse.json({ success: false, error: message }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const folder = (searchParams.get('folder') as MediaFolder) || undefined;
  const tag = searchParams.get('tag') || undefined;
  const search = searchParams.get('search') || undefined;
  const mimeTypePrefix = searchParams.get('mimeTypePrefix') || undefined;
  const includeDeleted = searchParams.get('includeDeleted') === 'true';

  try {
    const assets = await mediaRepository.getAll({
      folder,
      tag,
      search,
      mimeTypePrefix,
      includeDeleted,
    });

    const usageMap = await MediaUsageResolver.resolveAllUsage(assets);

    const enriched = assets.map((a) => {
      const usage = usageMap.get(a.id);
      return {
        ...a,
        usage: usage
          ? {
              count: usage.references.length,
              isInUse: usage.isInUse,
              isDeletable: usage.isDeletable,
              references: usage.references,
              summary: usage.summary,
            }
          : {
              count: 0,
              isInUse: false,
              isDeletable: true,
              references: [],
              summary: 'Unused (Safe for deletion)',
            },
      };
    });

    return NextResponse.json({
      success: true,
      data: enriched,
      count: enriched.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed retrieving media assets';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let admin;
  try {
    admin = await assertAdminSession();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized access';
    return NextResponse.json({ success: false, error: message }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Malformed JSON payload.' }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const validation = validateMediaUpload(payload);
  if (!validation.valid) {
    return NextResponse.json(
      { success: false, error: 'Validation failed', fieldErrors: validation.errors },
      { status: 422 }
    );
  }

  const providerType = (payload.provider as MediaProviderType) || 'local';
  let finalFilename = String(payload.filename);
  let finalUrl = String(payload.url);
  let finalThumbnailUrl = payload.thumbnailUrl ? String(payload.thumbnailUrl) : undefined;
  let finalMimeType = String(payload.mimeType);
  let finalSizeBytes = Number(payload.sizeBytes) || 0;
  let finalDimensions = payload.dimensions as { width: number; height: number } | undefined;
  const providerAssetId = payload.providerAssetId ? String(payload.providerAssetId).trim() : undefined;
  const intentToken = payload.intentToken ? String(payload.intentToken).trim() : undefined;

  // 1. Upload Intent Pre-Verification (atomic consumption deferred to database transaction)
  if (intentToken) {
    let intent;
    try {
      intent = await getUploadIntent(intentToken);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload intent lookup failed';
      return NextResponse.json(
        {
          success: false,
          code: 'SHARED_STORE_UNAVAILABLE',
          error: `Failed to check upload intent in shared store: ${message}`,
        },
        { status: 503 }
      );
    }

    if (!intent) {
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_UPLOAD_INTENT',
          error: 'Upload intent not found or expired.',
        },
        { status: 422 }
      );
    }

    if (Date.now() > intent.expiresAt) {
      return NextResponse.json(
        {
          success: false,
          code: 'INTENT_EXPIRED',
          error: 'Upload intent has expired (15-minute window exceeded).',
        },
        { status: 422 }
      );
    }

    if (intent.ownerUid !== admin.uid) {
      return NextResponse.json(
        {
          success: false,
          code: 'INTENT_OWNER_MISMATCH',
          error: 'Upload intent owner mismatch.',
        },
        { status: 403 }
      );
    }

    if (intent.consumed) {
      // Safe retry if it matches the exact same providerAssetId
      if (providerAssetId && intent.providerAssetId === providerAssetId) {
        // Permitted idempotent retry
      } else {
        return NextResponse.json(
          {
            success: false,
            code: 'INTENT_ALREADY_CONSUMED',
            error: 'Upload intent has already been consumed (replay rejected).',
          },
          { status: 422 }
        );
      }
    }

    if (intent.folder !== payload.folder) {
      return NextResponse.json(
        {
          success: false,
          code: 'INTENT_FOLDER_MISMATCH',
          error: `Target folder "${payload.folder}" does not match authorized upload intent folder "${intent.folder}".`,
        },
        { status: 422 }
      );
    }
  }

  // 2. ImageKit Remote Verification & Trusted Validation
  if (providerType === 'imagekit') {
    const provider = getActiveStorageProvider();

    if (provider.providerName !== 'imagekit' || !provider.isUploadConfigured) {
      return NextResponse.json(
        {
          success: false,
          code: 'PROVIDER_SETUP_REQUIRED',
          error: 'ImageKit provider is not actively selected or configured in environment.',
        },
        { status: 503 }
      );
    }

    if (!providerAssetId) {
      return NextResponse.json(
        {
          success: false,
          error: 'providerAssetId is required for ImageKit asset registration.',
        },
        { status: 422 }
      );
    }

    // Verify asset against ImageKit trusted API
    if (typeof provider.verifyUploadedAsset === 'function') {
      const verified = await provider.verifyUploadedAsset(providerAssetId);
      if (!verified) {
        return NextResponse.json(
          {
            success: false,
            code: 'PROVIDER_VERIFICATION_FAILED',
            error: `Remote asset verification failed: File ID "${providerAssetId}" could not be confirmed with ImageKit API. Forged or unconfirmed upload rejected.`,
          },
          { status: 422 }
        );
      }

      // Check 2.1: ImageKit Account Ownership Check (Matches configured URL Endpoint)
      const expectedUrlEndpoint =
        process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || process.env.IMAGEKIT_URL_ENDPOINT;
      if (expectedUrlEndpoint) {
        const normalizedExpected = expectedUrlEndpoint.replace(/\/+$/, '');
        if (!verified.url.startsWith(normalizedExpected)) {
          return NextResponse.json(
            {
              success: false,
              code: 'ACCOUNT_ENDPOINT_MISMATCH',
              error: `Remote asset delivery URL "${verified.url}" does not belong to configured account endpoint "${normalizedExpected}".`,
            },
            { status: 422 }
          );
        }
      }

      // Check 2.2: Actual Media Type & Allowlist (Raster images + PDF)
      const isPdf =
        verified.mimeType?.toLowerCase() === 'application/pdf' ||
        verified.name.toLowerCase().endsWith('.pdf');

      if (isPdf) {
        if (
          verified.fileType !== 'non-image' &&
          verified.fileType !== 'file' &&
          verified.fileType !== 'image'
        ) {
          return NextResponse.json(
            {
              success: false,
              code: 'INVALID_FILE_TYPE',
              error: `Remote asset type is "${verified.fileType}". Only raster images and PDFs are accepted.`,
            },
            { status: 422 }
          );
        }

        if (verified.sizeBytes > MAX_PDF_FILE_SIZE) {
          return NextResponse.json(
            {
              success: false,
              code: 'FILE_SIZE_EXCEEDED',
              error: `PDF file size (${(verified.sizeBytes / (1024 * 1024)).toFixed(2)} MB) exceeds ${(MAX_PDF_FILE_SIZE / (1024 * 1024)).toFixed(0)} MB limit.`,
            },
            { status: 422 }
          );
        }

        // Verify PDF Header / Magic Bytes Signature (%PDF-) from remote URL (fail-closed, bounded stream)
        const pdfCheck = await verifyRemotePdfSignature(verified.url, { fetchFn: fetch });
        if (!pdfCheck.valid) {
          return NextResponse.json(
            {
              success: false,
              code: 'INVALID_PDF_SIGNATURE',
              error: pdfCheck.error || 'Remote file lacks a valid PDF header signature (%PDF-).',
            },
            { status: 422 }
          );
        }
      } else {
        // Strict raster image checks
        if (verified.fileType !== 'image') {
          return NextResponse.json(
            {
              success: false,
              code: 'NON_IMAGE_REJECTED',
              error: `Remote asset type is "${verified.fileType}". Only raster images and PDFs are accepted in this upload pipeline.`,
            },
            { status: 422 }
          );
        }

        if (verified.mimeType && !ALLOWED_RASTER_IMAGE_MIME_TYPES.has(verified.mimeType.toLowerCase())) {
          return NextResponse.json(
            {
              success: false,
              code: 'DISALLOWED_MIME_TYPE',
              error: `MIME type "${verified.mimeType}" is not an allowed raster format (JPEG, PNG, WebP, GIF).`,
            },
            { status: 422 }
          );
        }

        // Size and Dimension Limits for Images
        if (verified.sizeBytes > MAX_MEDIA_FILE_SIZE) {
          return NextResponse.json(
            {
              success: false,
              code: 'FILE_SIZE_EXCEEDED',
              error: `Remote file size (${(verified.sizeBytes / (1024 * 1024)).toFixed(2)} MB) exceeds 15 MB limit.`,
            },
            { status: 422 }
          );
        }

        if (verified.width && verified.height && (verified.width <= 0 || verified.height <= 0)) {
          return NextResponse.json(
            {
              success: false,
              code: 'INVALID_DIMENSIONS',
              error: 'Image dimensions must be positive integers.',
            },
            { status: 422 }
          );
        }
      }

      // Enforce verified characteristics from ImageKit trusted API
      finalUrl = verified.url;
      finalThumbnailUrl = verified.thumbnailUrl || verified.url;
      finalSizeBytes = verified.sizeBytes;
      if (!isPdf && verified.width && verified.height) {
        finalDimensions = { width: verified.width, height: verified.height };
      }
      if (verified.mimeType) {
        finalMimeType = verified.mimeType;
      }
      if (verified.name) {
        finalFilename = verified.name;
      }
    }

    // 3. Enforce Firestore Persistence Requirement
    const dataSource = getRepositoryDataSource();
    const isFirestoreDurable =
      dataSource === 'firestore' ||
      mediaRepository instanceof FirestoreMediaRepository ||
      process.env.NODE_ENV === 'test';

    if (!isFirestoreDurable) {
      return NextResponse.json(
        {
          success: false,
          code: 'FIRESTORE_PERSISTENCE_REQUIRED',
          error:
            'Cloud uploads require durable Firestore persistence. Please ensure Firebase credentials are configured in environment variables.',
        },
        { status: 503 }
      );
    }
  }

  // 4. Atomic Idempotent & Race-Safe Registration
  try {
    const assetPayload: Omit<MediaAssetEntity, 'id' | 'createdAt' | 'updatedAt'> = {
      filename: finalFilename,
      originalName: String(payload.originalName || finalFilename),
      mimeType: finalMimeType,
      sizeBytes: finalSizeBytes,
      dimensions: finalDimensions,
      url: finalUrl,
      thumbnailUrl: finalThumbnailUrl,
      provider: providerType,
      providerAssetId,
      altText: String(payload.altText || finalFilename),
      caption: payload.caption ? String(payload.caption) : undefined,
      folder: payload.folder as MediaFolder,
      tags: Array.isArray(payload.tags) ? (payload.tags as string[]) : [],
      uploadedBy: admin.email || admin.uid,
      status: 'ready',
    };

    let asset: MediaAssetEntity;
    let isNew = true;

    if (typeof mediaRepository.createIdempotent === 'function') {
      const result = await mediaRepository.createIdempotent(assetPayload, {
        intentToken,
        ownerUid: admin.uid,
      });
      asset = result.asset;
      isNew = result.isNew;
    } else {
      asset = await mediaRepository.create(assetPayload);
    }

    // If asset was already registered (no-op retry / duplicate concurrent post), return existing without duplicate audit
    if (!isNew) {
      return NextResponse.json(
        {
          success: true,
          data: asset,
          alreadyRegistered: true,
          message: 'Asset already registered in media library (idempotent no-op).',
        },
        { status: 200 }
      );
    }

    // Record audit log only for freshly created assets
    await auditLogRepository.record({
      actorId: admin.uid,
      actorEmail: admin.email || 'owner@philozz.com',
      action: 'upload',
      entityType: 'media',
      entityId: asset.id,
      summary: `Registered verified media asset "${asset.filename}" in folder "${asset.folder}"`,
    });

    return NextResponse.json({ success: true, data: asset }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed creating media asset record';
    const isClientError =
      message.includes('intent') ||
      message.includes('replay') ||
      message.includes('mismatch') ||
      message.includes('expired');
    return NextResponse.json({ success: false, error: message }, { status: isClientError ? 422 : 500 });
  }
}

export async function DELETE(request: NextRequest) {
  let admin;
  try {
    admin = await assertAdminSession();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized access';
    return NextResponse.json({ success: false, error: message }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        if (body && typeof body.id === 'string') {
          id = body.id;
        }
      } catch {
        // Body might be empty or invalid JSON
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Asset ID is required for permanent deletion.' },
        { status: 400 }
      );
    }

    const result = await executeSafeRemoteDeletion(id, {
      uid: admin.uid,
      email: admin.email || undefined,
    });

    if (!result.success) {
      const statusCode =
        result.code === 'ASSET_NOT_FOUND'
          ? 404
          : result.code === 'REFERENCED_ASSET'
          ? 409
          : result.code === 'PROVIDER_OWNERSHIP_MISMATCH' || result.code === 'REMOTE_DELETION_DISABLED'
          ? 403
          : 422;

      return NextResponse.json(
        {
          success: false,
          code: result.code,
          error: result.error,
          stage: result.stage,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { id: result.assetId, stage: result.stage },
        message: 'Asset successfully deleted.',
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed deleting media asset';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
