import 'server-only';

/**
 * PHILOZZ CMS — Orphan Media Reconciliation API
 * Phase 16E.2: ImageKit Activation, Upload Reliability & Security Verification
 *
 * Implements recovery and reconciliation for partial upload failures:
 * 1. GET: Discovers unmanaged remote files on ImageKit that have no Firestore record.
 * 2. POST: Reconciles and registers an orphaned provider asset safely into Firestore.
 * 3. Never deletes remote files destructively.
 * 4. Strictly guarded by dual-layer owner session verification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { assertAdminSession } from '@/lib/auth/requireAdminSession';
import {
  mediaRepository,
  auditLogRepository,
  getRepositoryDataSource,
  FirestoreMediaRepository,
} from '@/cms/repositories';
import { MediaFolder } from '@/cms/models/media';
import { getActiveStorageProvider } from '@/cms/media/mediaStorageProvider';
import {
  ALLOWED_RASTER_IMAGE_MIME_TYPES,
  MAX_MEDIA_FILE_SIZE,
  MAX_PDF_FILE_SIZE,
  verifyRemotePdfSignature,
  ALLOWED_MEDIA_FOLDERS,
} from '@/cms/validation/mediaValidators';

export interface OrphanedAssetSummary {
  fileId: string;
  name: string;
  filePath: string;
  url: string;
  thumbnailUrl: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  mimeType?: string;
  folder: MediaFolder;
  createdAt: string;
}

export async function GET() {
  try {
    await assertAdminSession();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized access';
    return NextResponse.json({ success: false, error: message }, { status: 401 });
  }

  const provider = getActiveStorageProvider();
  if (provider.providerName !== 'imagekit' || !provider.isUploadConfigured) {
    return NextResponse.json({
      success: true,
      count: 0,
      orphanedAssets: [],
      message: 'Active storage provider is not ImageKit or is not configured for cloud listing.',
    });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ImageKit = require('imagekit');
    const ik = new ImageKit({
      publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || process.env.IMAGEKIT_URL_ENDPOINT,
    });

    // 1. Fetch recent uploads from ImageKit
    const listRes = await ik.listFiles({
      limit: 50,
      sort: 'DESC_CREATED',
      fileType: 'all',
    });

    const files = Array.isArray(listRes) ? listRes : listRes?.data || [];

    // 2. Query all existing media assets in CMS
    const registeredAssets = await mediaRepository.getAll({ includeDeleted: true });
    const registeredIds = new Set<string>();
    for (const a of registeredAssets) {
      if (a.providerAssetId) {
        registeredIds.add(a.providerAssetId);
      }
    }

    // 3. Filter orphaned files that belong to CMS folders
    const orphaned: OrphanedAssetSummary[] = [];
    for (const file of files) {
      if (!file || !file.fileId || registeredIds.has(file.fileId)) {
        continue;
      }

      // Check folder prefix
      const filePath = String(file.filePath || '');
      const matchedFolder = ALLOWED_MEDIA_FOLDERS.find((f) =>
        filePath.startsWith(`/${f}/`) || filePath.startsWith(`${f}/`)
      );

      orphaned.push({
        fileId: file.fileId,
        name: file.name,
        filePath: file.filePath,
        url: file.url,
        thumbnailUrl: file.thumbnail || file.url,
        sizeBytes: Number(file.size) || 0,
        width: file.width || undefined,
        height: file.height || undefined,
        mimeType: file.mime || undefined,
        folder: matchedFolder || 'general',
        createdAt: file.createdAt || new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      count: orphaned.length,
      orphanedAssets: orphaned,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed querying ImageKit file list';
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
  const providerAssetId = payload.providerAssetId ? String(payload.providerAssetId).trim() : '';

  if (!providerAssetId) {
    return NextResponse.json(
      { success: false, error: 'providerAssetId is required for reconciliation.' },
      { status: 422 }
    );
  }

  const provider = getActiveStorageProvider();
  if (provider.providerName !== 'imagekit' || !provider.isUploadConfigured) {
    return NextResponse.json(
      { success: false, error: 'ImageKit provider is not active or configured.' },
      { status: 503 }
    );
  }

  // 1. Verify remote asset with ImageKit trusted API
  if (typeof provider.verifyUploadedAsset !== 'function') {
    return NextResponse.json(
      { success: false, error: 'Provider does not support remote asset verification.' },
      { status: 500 }
    );
  }

  const verified = await provider.verifyUploadedAsset(providerAssetId);
  if (!verified) {
    return NextResponse.json(
      {
        success: false,
        code: 'PROVIDER_VERIFICATION_FAILED',
        error: `Remote asset verification failed for ID "${providerAssetId}". Asset does not exist on ImageKit.`,
      },
      { status: 422 }
    );
  }

  // 2. Account Endpoint Ownership Check
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

  // 3. Validate media type (Raster image or PDF), size, dimensions
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
          error: `PDF file size exceeds ${(MAX_PDF_FILE_SIZE / (1024 * 1024)).toFixed(0)} MB limit.`,
        },
        { status: 422 }
      );
    }

    // Verify PDF signature (%PDF-) (fail-closed, bounded stream)
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
    if (verified.fileType !== 'image') {
      return NextResponse.json(
        {
          success: false,
          code: 'NON_IMAGE_REJECTED',
          error: `Asset is not an image (detected: "${verified.fileType}").`,
        },
        { status: 422 }
      );
    }

    if (verified.mimeType && !ALLOWED_RASTER_IMAGE_MIME_TYPES.has(verified.mimeType.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          code: 'DISALLOWED_MIME_TYPE',
          error: `MIME type "${verified.mimeType}" is not an allowed raster format.`,
        },
        { status: 422 }
      );
    }

    if (verified.sizeBytes > MAX_MEDIA_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          code: 'FILE_SIZE_EXCEEDED',
          error: `File size exceeds 15 MB limit.`,
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

  // 4. Enforce Firestore persistence requirement
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
        error: 'Cloud asset reconciliation requires durable Firestore persistence.',
      },
      { status: 503 }
    );
  }

  // 5. Infer or validate folder
  let targetFolder: MediaFolder = 'general';
  if (payload.folder && ALLOWED_MEDIA_FOLDERS.includes(payload.folder as MediaFolder)) {
    targetFolder = payload.folder as MediaFolder;
  } else {
    const matched = ALLOWED_MEDIA_FOLDERS.find((f) =>
      verified.filePath.startsWith(`/${f}/`) || verified.filePath.startsWith(`${f}/`)
    );
    if (matched) targetFolder = matched;
  }

  // 6. Idempotent Registration
  try {
    const defaultMime = isPdf ? 'application/pdf' : 'image/jpeg';
    const finalDimensions = isPdf
      ? undefined
      : verified.width && verified.height
      ? { width: verified.width, height: verified.height }
      : undefined;

    const creationResult = mediaRepository.createIdempotent
      ? await mediaRepository.createIdempotent({
          filename: verified.name,
          originalName: verified.name,
          mimeType: verified.mimeType || defaultMime,
          sizeBytes: verified.sizeBytes,
          dimensions: finalDimensions,
          url: verified.url,
          thumbnailUrl: isPdf ? verified.url : verified.thumbnailUrl || verified.url,
          provider: 'imagekit',
          providerAssetId,
          altText: String(payload.altText || verified.name),
          caption: payload.caption ? String(payload.caption) : undefined,
          folder: targetFolder,
          tags: Array.isArray(payload.tags) ? (payload.tags as string[]) : [],
          uploadedBy: admin.email || admin.uid,
          status: 'ready',
        })
      : {
          asset: await mediaRepository.create({
            filename: verified.name,
            originalName: verified.name,
            mimeType: verified.mimeType || defaultMime,
            sizeBytes: verified.sizeBytes,
            dimensions: finalDimensions,
            url: verified.url,
            thumbnailUrl: isPdf ? verified.url : verified.thumbnailUrl || verified.url,
            provider: 'imagekit',
            providerAssetId,
            altText: String(payload.altText || verified.name),
            caption: payload.caption ? String(payload.caption) : undefined,
            folder: targetFolder,
            tags: Array.isArray(payload.tags) ? (payload.tags as string[]) : [],
            uploadedBy: admin.email || admin.uid,
            status: 'ready',
          }),
          isNew: true,
        };

    if (creationResult.isNew) {
      await auditLogRepository.record({
        actorId: admin.uid,
        actorEmail: admin.email || 'owner@philozz.com',
        action: 'upload',
        entityType: 'media',
        entityId: creationResult.asset.id,
        summary: `Reconciled orphaned remote asset "${creationResult.asset.filename}" in folder "${creationResult.asset.folder}"`,
      });
    }

    return NextResponse.json({
      success: true,
      data: creationResult.asset,
      alreadyRegistered: !creationResult.isNew,
      message: creationResult.isNew
        ? 'Orphaned asset successfully reconciled and saved to media library.'
        : 'Asset was already registered in media library.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Reconciliation failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
