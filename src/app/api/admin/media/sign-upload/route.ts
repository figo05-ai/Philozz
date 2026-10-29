import { NextRequest, NextResponse } from 'next/server';
import { assertAdminSession } from '@/lib/auth/requireAdminSession';
import { validateUploadSigningRequest } from '@/cms/validation/mediaValidators';
import { getActiveStorageProvider } from '@/cms/media/mediaStorageProvider';
import {
  checkUploadRateLimit,
  validateSafeFilename,
  registerUploadIntent,
} from '@/cms/media/mediaUploadIntent';

/**
 * Validates request origin / referer for CSRF mitigation.
 */
function isOriginAuthorized(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  // Allow server-to-server or test runners without origin header if running in local test mode
  if (!origin && !referer && process.env.NODE_ENV === 'test') {
    return true;
  }

  const expectedSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  let allowedHost = '';
  try {
    allowedHost = new URL(expectedSiteUrl).host;
  } catch {
    allowedHost = host || '';
  }

  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === allowedHost || originHost === host || originHost.startsWith('localhost:')) {
        return true;
      }
    } catch {
      return false;
    }
  }

  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      if (refererHost === allowedHost || refererHost === host || refererHost.startsWith('localhost:')) {
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
}

export async function POST(request: NextRequest) {
  // 1. Dual-Layer Owner Session Verification
  let admin;
  try {
    admin = await assertAdminSession();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unauthorized access';
    return NextResponse.json(
      { success: false, error: message },
      { status: 401 }
    );
  }

  // 2. Server-Side Rate Limiting (30 signing requests / 60s per owner)
  let rateLimit;
  try {
    rateLimit = await checkUploadRateLimit(admin.uid);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Rate limit store unavailable';
    return NextResponse.json(
      {
        success: false,
        error: `Upload signing failed: ${message}`,
        code: 'SHARED_STORE_UNAVAILABLE',
      },
      { status: 503 }
    );
  }

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: `Upload signing rate limit exceeded. Please wait ${rateLimit.resetSeconds} seconds before requesting new credentials.`,
        code: 'RATE_LIMIT_EXCEEDED',
      },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.resetSeconds) },
      }
    );
  }

  // 3. CSRF & Origin Verification
  if (!isOriginAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: 'Cross-origin request rejected (CSRF protection).' },
      { status: 403 }
    );
  }

  // 4. Payload Parsing & Schema Validation
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Malformed JSON payload.' },
      { status: 400 }
    );
  }

  const validation = validateUploadSigningRequest(body as Record<string, unknown>);
  if (!validation.valid) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed for upload request.',
        fieldErrors: validation.errors,
      },
      { status: 422 }
    );
  }

  const validatedInput = body as {
    filename: string;
    mimeType: string;
    folder: 'projects' | 'articles' | 'photos' | 'brand' | 'general';
    sizeBytes: number;
  };

  // 5. Strict Filename & Path Sanitization (anti path-traversal & control characters)
  const safeNameCheck = validateSafeFilename(validatedInput.filename);
  if (!safeNameCheck.valid) {
    return NextResponse.json(
      {
        success: false,
        error: safeNameCheck.error || 'Invalid filename format.',
        code: 'UNSAFE_FILENAME',
      },
      { status: 422 }
    );
  }

  // 6. Provider Readiness & Authorization Delegation
  const provider = getActiveStorageProvider();

  if (!provider.isUploadConfigured) {
    return NextResponse.json(
      {
        success: false,
        code: 'PROVIDER_SETUP_REQUIRED',
        activeProvider: provider.providerName,
        message:
          'Live uploads are blocked: No cloud storage provider is configured in environment variables. Vercel serverless functions do not persist local files. Please configure ImageKit, Cloudinary, or Firebase Storage credentials to enable direct uploads.',
        recommendedProvider: 'imagekit',
      },
      { status: 503 }
    );
  }

  try {
    const authResult = await provider.getUploadAuthorization({
      ...validatedInput,
      filename: safeNameCheck.sanitized,
    });

    if (!authResult.configured) {
      return NextResponse.json(
        {
          success: false,
          code: 'PROVIDER_CONFIG_INCOMPLETE',
          message: authResult.reason || 'Storage provider configuration is incomplete.',
        },
        { status: 503 }
      );
    }

    // 7. Register Server-Side Upload Intent (Single-Use, 15-Minute Expiry)
    if (authResult.fields?.token) {
      try {
        await registerUploadIntent({
          token: authResult.fields.token,
          ownerUid: admin.uid,
          provider: 'imagekit',
          filename: safeNameCheck.sanitized,
          folder: validatedInput.folder,
          mimeType: validatedInput.mimeType,
          sizeBytes: validatedInput.sizeBytes,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Upload intent registration failed';
        return NextResponse.json(
          {
            success: false,
            error: `Failed to persist upload intent to shared store: ${message}`,
            code: 'SHARED_STORE_UNAVAILABLE',
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      auth: authResult,
      intentToken: authResult.fields?.token,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload signing failed';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
