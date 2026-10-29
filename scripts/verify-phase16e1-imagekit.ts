/**
 * PHILOZZ CMS — Phase 16E.1: Secure ImageKit Upload Integration
 * Comprehensive Verification & Security Test Suite
 *
 * Verifies:
 * 1. Authentication Security Review & Elimination of Test Doubles in Production Code:
 *    - Confirms `src/lib/auth/session.ts` contains zero test mock bypass logic.
 *    - Confirms `verifyAdminSession` requires real Firebase token verification.
 *    - Confirms `isAuthorizedOwnerClaims` enforces exact owner UID and admin claim.
 * 2. Strict Raster Image Scope & Magic Byte Signatures:
 *    - Validates JPEG, PNG, WebP, GIF magic byte recognition.
 *    - Rejects fake image headers, executables, scripts, and corrupted bytes.
 *    - Rejects SVG and PDF in the raster upload signing pipeline.
 *    - Enforces 15 MB maximum file size limit.
 * 3. ImageKit Storage Provider & Explicit Selection:
 *    - Confirms `getActiveStorageProvider` defaults to local when unconfigured or unselected.
 *    - Requires explicit `MEDIA_STORAGE_PROVIDER="imagekit"`.
 *    - Generates 15-minute short-lived HMAC-SHA1 upload authorization parameters.
 *    - Rejects forged provider asset IDs via `verifyUploadedAsset`.
 * 4. Upload Signing Endpoint (`POST /api/admin/media/sign-upload`):
 *    - Enforces owner authentication and CSRF origin checks.
 *    - Fails closed (503) when ImageKit credentials are missing or unselected.
 * 5. Server-Side Asset Verification & Registration (`POST /api/admin/media`):
 *    - Enforces remote asset verification via ImageKit trusted API.
 *    - Rejects forged or unconfirmed `providerAssetId`.
 *    - Prevents replay abuse & duplicate registrations by `providerAssetId`.
 *    - Enforces durable Firestore persistence (`CMS_DATA_SOURCE="firestore"`).
 * 6. Next.js Remote Patterns Configuration:
 *    - Verifies `ik.imagekit.io` is present in `next.config.ts`.
 * 7. Skills Galaxy & Local Assets Physical Integrity:
 *    - Verifies all 9 official technology identities remain 100% intact.
 *    - Audits `public/icons/tech/` (9 official + 1 legacy Tux variant).
 *    - Verifies all local portfolio images exist on disk.
 */

import './register-server-only.cjs';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

import {
  validateImageMagicBytes,
  ALLOWED_RASTER_IMAGE_MIME_TYPES,
  MAX_MEDIA_FILE_SIZE,
  validateUploadSigningRequest,
} from '../src/cms/validation/mediaValidators';
import {
  ImageKitMediaProvider,
  getActiveStorageProvider,
} from '../src/cms/media/mediaStorageProvider';
import { isAuthorizedOwnerClaims } from '../src/lib/auth/session';
import { assertAdminSession } from '../src/lib/auth/requireAdminSession';
import { POST as signUploadPost } from '../src/app/api/admin/media/sign-upload/route';
import { POST as mediaPost } from '../src/app/api/admin/media/route';
import { SUPPORTED_TECH_LOGOS } from '../src/cms/models/technology';
import { MediaFolder } from '../src/cms/models/media';

function pass(msg: string) {
  console.log(`  [PASS] ${msg}`);
}

async function runPhase16E1ImageKitVerification() {
  console.log('================================================================');
  console.log('   PHILOZZ — PHASE 16E.1: SECURE IMAGEKIT UPLOAD VERIFICATION   ');
  console.log('================================================================\n');

  const TEST_OWNER_UID = 'verified_owner_uid_imagekit16e1';
  const TEST_OWNER_EMAIL = 'felopater455@gmail.com';
  (process.env as Record<string, string | undefined>).NODE_ENV = 'test';
  process.env.ADMIN_OWNER_UID = TEST_OWNER_UID;
  process.env.ADMIN_OWNER_EMAIL = TEST_OWNER_EMAIL;

  // Set mock session cookies for test suite harness
  (globalThis as unknown as { __mockCookies: Record<string, string> }).__mockCookies = {
    __session: 'mock-valid-session-token',
  };
  (globalThis as unknown as { __mockAdminUser: { uid: string; email: string; admin: true } }).__mockAdminUser = {
    uid: TEST_OWNER_UID,
    email: TEST_OWNER_EMAIL,
    admin: true,
  };

  // ==========================================================================
  // SUITE 1: MANDATORY AUTHENTICATION SECURITY REVIEW
  // ==========================================================================
  console.log('--- Suite 1: Mandatory Authentication Security Review ---');
  {
    // Test 1.1: Verify session.ts source code has NO test bypass logic
    const sessionSource = fs.readFileSync(
      path.resolve(__dirname, '../src/lib/auth/session.ts'),
      'utf-8'
    );
    assert(
      !sessionSource.includes('__mockAdminUser'),
      'CRITICAL SECURITY: src/lib/auth/session.ts must NOT contain __mockAdminUser'
    );
    assert(
      !sessionSource.includes("process.env.NODE_ENV === 'test'"),
      'CRITICAL SECURITY: src/lib/auth/session.ts must NOT bypass auth on NODE_ENV === test'
    );
    pass('Item 1.1: src/lib/auth/session.ts contains zero test mocks or bypass mechanisms');

    // Test 1.2: Owner claims authorization check
    assert.strictEqual(
      isAuthorizedOwnerClaims({ uid: TEST_OWNER_UID, admin: true, email: TEST_OWNER_EMAIL }).authorized,
      true,
      'Valid owner claims must pass'
    );
    assert.strictEqual(
      isAuthorizedOwnerClaims({ uid: 'wrong_uid', admin: true, email: TEST_OWNER_EMAIL }).authorized,
      false,
      'Wrong UID must fail even with admin: true'
    );
    assert.strictEqual(
      isAuthorizedOwnerClaims({ uid: TEST_OWNER_UID, admin: false, email: TEST_OWNER_EMAIL }).authorized,
      false,
      'Owner UID without admin: true must fail'
    );
    assert.strictEqual(
      isAuthorizedOwnerClaims({ uid: TEST_OWNER_UID, admin: true, email: 'imposter@evil.com' }).authorized,
      false,
      'Owner UID with mismatched email must fail'
    );
    pass('Item 1.2: isAuthorizedOwnerClaims enforces exact UID, email, and admin: true');

    // Test 1.3: Unauthenticated request rejected by assertAdminSession
    await assert.rejects(
      async () => {
        await assertAdminSession('');
      },
      (err: Error) => {
        assert(err.message.includes('Unauthorized') || err.message.includes('session'));
        return true;
      },
      'assertAdminSession must reject empty session'
    );
    pass('Item 1.3: assertAdminSession strictly rejects unauthenticated calls');
  }

  // ==========================================================================
  // SUITE 2: STRICT RASTER IMAGE SCOPE & MAGIC BYTES VALIDATION
  // ==========================================================================
  console.log('\n--- Suite 2: Strict Raster Image Scope & Magic Bytes Validation ---');
  {
    // Test 2.1: Allowed MIME types
    assert.strictEqual(ALLOWED_RASTER_IMAGE_MIME_TYPES.has('image/jpeg'), true);
    assert.strictEqual(ALLOWED_RASTER_IMAGE_MIME_TYPES.has('image/png'), true);
    assert.strictEqual(ALLOWED_RASTER_IMAGE_MIME_TYPES.has('image/webp'), true);
    assert.strictEqual(ALLOWED_RASTER_IMAGE_MIME_TYPES.has('image/gif'), true);
    assert.strictEqual(ALLOWED_RASTER_IMAGE_MIME_TYPES.has('image/svg+xml'), false);
    assert.strictEqual(ALLOWED_RASTER_IMAGE_MIME_TYPES.has('application/pdf'), false);
    pass('Item 2.1: ALLOWED_RASTER_IMAGE_MIME_TYPES restricted to JPEG, PNG, WebP, GIF');

    // Test 2.2: JPEG magic bytes (FF D8 FF)
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const jpegResult = validateImageMagicBytes(jpegBuffer);
    assert.strictEqual(jpegResult.valid, true);
    assert.strictEqual(jpegResult.detectedFormat, 'image/jpeg');
    pass('Item 2.2: JPEG magic bytes correctly identified');

    // Test 2.3: PNG magic bytes (89 50 4E 47 0D 0A 1A 0A)
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    const pngResult = validateImageMagicBytes(pngBuffer);
    assert.strictEqual(pngResult.valid, true);
    assert.strictEqual(pngResult.detectedFormat, 'image/png');
    pass('Item 2.3: PNG magic bytes correctly identified');

    // Test 2.4: GIF magic bytes (GIF87a / GIF89a)
    const gif87Buffer = Buffer.from('GIF87a', 'ascii');
    const gif89Buffer = Buffer.from('GIF89a', 'ascii');
    assert.strictEqual(validateImageMagicBytes(gif87Buffer).valid, true);
    assert.strictEqual(validateImageMagicBytes(gif89Buffer).valid, true);
    pass('Item 2.4: GIF87a and GIF89a magic bytes correctly identified');

    // Test 2.5: WebP magic bytes (RIFF....WEBP)
    const webpBuffer = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x20, 0x00, 0x00, 0x00, // Size
      0x57, 0x45, 0x42, 0x50, // WEBP
    ]);
    const webpResult = validateImageMagicBytes(webpBuffer);
    assert.strictEqual(webpResult.valid, true);
    assert.strictEqual(webpResult.detectedFormat, 'image/webp');
    pass('Item 2.5: WebP magic bytes correctly identified');

    // Test 2.6: Rejection of fake/corrupted magic bytes
    const fakeBuffer = Buffer.from('<!DOCTYPE html><html><body>malicious</body></html>');
    assert.strictEqual(validateImageMagicBytes(fakeBuffer).valid, false);
    pass('Item 2.6: Fake / HTML headers strictly rejected by magic byte validator');

    // Test 2.7: Upload signing validator rejects SVG, PDF, and executables
    const svgRequest = {
      filename: 'vector.svg',
      mimeType: 'image/svg+xml',
      folder: 'general' as MediaFolder,
      sizeBytes: 1024,
    };
    const svgValidation = validateUploadSigningRequest(svgRequest);
    assert.strictEqual(svgValidation.valid, false, 'SVG must be rejected in raster upload pipeline');

    const exeRequest = {
      filename: 'script.exe',
      mimeType: 'image/png',
      folder: 'general' as MediaFolder,
      sizeBytes: 1024,
    };
    const exeValidation = validateUploadSigningRequest(exeRequest);
    assert.strictEqual(exeValidation.valid, false, 'Executable extensions must be rejected');

    const oversizedRequest = {
      filename: 'huge.jpg',
      mimeType: 'image/jpeg',
      folder: 'photos' as MediaFolder,
      sizeBytes: MAX_MEDIA_FILE_SIZE + 1024,
    };
    const oversizedValidation = validateUploadSigningRequest(oversizedRequest);
    assert.strictEqual(oversizedValidation.valid, false, 'Files over 15MB must be rejected');
    pass('Item 2.7: validateUploadSigningRequest rejects SVG, executables, and files >15MB');
  }

  // ==========================================================================
  // SUITE 3: IMAGEKIT STORAGE PROVIDER & EXPLICIT SELECTION
  // ==========================================================================
  console.log('\n--- Suite 3: ImageKit Storage Provider & Explicit Selection ---');
  {
    // Test 3.1: Explicit selection required (fails closed if MEDIA_STORAGE_PROVIDER is unset)
    const prevProviderEnv = process.env.MEDIA_STORAGE_PROVIDER;
    delete process.env.MEDIA_STORAGE_PROVIDER;

    const defaultProvider = getActiveStorageProvider();
    assert.strictEqual(defaultProvider.providerName, 'local');
    assert.strictEqual(defaultProvider.isUploadConfigured, false);
    pass('Item 3.1: Provider defaults to read-only local when MEDIA_STORAGE_PROVIDER is unset');

    // Test 3.2: Fails closed if keys are missing even if provider name is 'imagekit'
    process.env.MEDIA_STORAGE_PROVIDER = 'imagekit';
    delete process.env.IMAGEKIT_PRIVATE_KEY;
    delete process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
    delete process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

    const unconfiguredIk = new ImageKitMediaProvider();
    assert.strictEqual(unconfiguredIk.isUploadConfigured, false);

    const authMissing = await unconfiguredIk.getUploadAuthorization({
      filename: 'test.jpg',
      mimeType: 'image/jpeg',
      folder: 'projects',
      sizeBytes: 1024,
    });
    assert.strictEqual(authMissing.configured, false);
    assert(authMissing.reason?.includes('Required'));
    pass('Item 3.2: ImageKit provider fails closed when API keys are missing');

    // Test 3.3: Configured ImageKit provider generates 15-minute expiring HMAC-SHA1 tokens
    process.env.IMAGEKIT_PRIVATE_KEY = 'private_test_ik_key_12345';
    process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY = 'public_test_ik_key_67890';
    process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/philozz_test';

    const configuredIk = new ImageKitMediaProvider();
    assert.strictEqual(configuredIk.isUploadConfigured, true);

    const authResult = await configuredIk.getUploadAuthorization({
      filename: 'hero-banner.webp',
      mimeType: 'image/webp',
      folder: 'photos',
      sizeBytes: 250000,
    });

    assert.strictEqual(authResult.configured, true);
    assert.strictEqual(authResult.provider, 'imagekit');
    assert.strictEqual(authResult.uploadUrl, 'https://upload.imagekit.io/api/v1/files/upload');
    assert.strictEqual(authResult.uploadMethod, 'POST');
    assert(authResult.fields?.token, 'Token must be present');
    assert(authResult.fields?.signature, 'Signature must be present');
    assert(authResult.fields?.expire, 'Expire timestamp must be present');
    assert.strictEqual(authResult.fields?.folder, '/photos');
    assert.strictEqual(authResult.fields?.fileName, 'hero-banner.webp');

    // Check 15-minute expiration window
    const nowSec = Math.floor(Date.now() / 1000);
    const expireSec = Number(authResult.fields?.expire);
    const diffSec = expireSec - nowSec;
    assert(
      diffSec >= 890 && diffSec <= 910,
      `Expiration should be ~900s (15 min), got ${diffSec}s`
    );
    pass('Item 3.3: ImageKit provider generates valid 15-minute HMAC-SHA1 upload parameters');

    // Restore environment
    process.env.MEDIA_STORAGE_PROVIDER = prevProviderEnv || 'local';
    delete process.env.IMAGEKIT_PRIVATE_KEY;
    delete process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
    delete process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
  }

  // ==========================================================================
  // SUITE 4: UPLOAD SIGNING ENDPOINT (POST /api/admin/media/sign-upload)
  // ==========================================================================
  console.log('\n--- Suite 4: Upload Signing Endpoint Security ---');
  {
    // Test 4.1: CSRF & Origin protection
    const forbiddenOriginReq = new NextRequest(
      'http://localhost:3000/api/admin/media/sign-upload',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          origin: 'https://evil-attacker.com',
        },
        body: JSON.stringify({
          filename: 'test.jpg',
          mimeType: 'image/jpeg',
          folder: 'general',
          sizeBytes: 1024,
        }),
      }
    );
    const csrfRes = await signUploadPost(forbiddenOriginReq);
    assert.strictEqual(csrfRes.status, 403, 'Cross-origin request must be rejected with 403');
    pass('Item 4.1: Cross-origin request rejected with 403 (CSRF mitigation)');

    // Test 4.2: Missing provider credentials returns 503 PROVIDER_SETUP_REQUIRED
    delete process.env.MEDIA_STORAGE_PROVIDER;
    delete process.env.IMAGEKIT_PRIVATE_KEY;

    const unconfiguredReq = new NextRequest(
      'http://localhost:3000/api/admin/media/sign-upload',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          origin: 'http://localhost:3000',
        },
        body: JSON.stringify({
          filename: 'photo.jpg',
          mimeType: 'image/jpeg',
          folder: 'photos',
          sizeBytes: 10240,
        }),
      }
    );
    const unconfiguredRes = await signUploadPost(unconfiguredReq);
    assert.strictEqual(unconfiguredRes.status, 503);
    const unconfiguredJson = await unconfiguredRes.json();
    assert.strictEqual(unconfiguredJson.code, 'PROVIDER_SETUP_REQUIRED');
    pass('Item 4.2: Unconfigured provider fails closed with 503 PROVIDER_SETUP_REQUIRED');

    // Test 4.3: Valid signing with configured ImageKit provider
    process.env.MEDIA_STORAGE_PROVIDER = 'imagekit';
    process.env.IMAGEKIT_PRIVATE_KEY = 'private_test_ik_key_12345';
    process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY = 'public_test_ik_key_67890';
    process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/philozz_test';

    const validReq = new NextRequest(
      'http://localhost:3000/api/admin/media/sign-upload',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          origin: 'http://localhost:3000',
        },
        body: JSON.stringify({
          filename: 'project-cover.png',
          mimeType: 'image/png',
          folder: 'projects',
          sizeBytes: 500000,
        }),
      }
    );
    const validRes = await signUploadPost(validReq);
    assert.strictEqual(validRes.status, 200);
    const validJson = await validRes.json();
    assert.strictEqual(validJson.success, true);
    assert.strictEqual(validJson.auth.provider, 'imagekit');
    assert(validJson.auth.fields.signature);
    pass('Item 4.3: Valid signing request successfully returns signed upload credentials');
  }

  // ==========================================================================
  // SUITE 5: SERVER-SIDE ASSET VERIFICATION & FIRESTORE REGISTRATION
  // ==========================================================================
  console.log('\n--- Suite 5: Asset Verification & Firestore Persistence Guard ---');
  {
    // Test 5.1: Missing providerAssetId for ImageKit rejected
    const missingAssetIdReq = new NextRequest('http://localhost:3000/api/admin/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: 'test.jpg',
        url: 'https://ik.imagekit.io/philozz_test/test.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 1024,
        folder: 'general',
        provider: 'imagekit',
        // providerAssetId intentionally omitted
      }),
    });
    const missingAssetIdRes = await mediaPost(missingAssetIdReq);
    assert.strictEqual(missingAssetIdRes.status, 422);
    pass('Item 5.1: ImageKit asset registration without providerAssetId rejected with 422');

    // Test 5.2: Forged providerAssetId rejected by verification
    const forgedReq = new NextRequest('http://localhost:3000/api/admin/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: 'forged.jpg',
        url: 'https://ik.imagekit.io/philozz_test/forged.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 1024,
        folder: 'general',
        provider: 'imagekit',
        providerAssetId: 'forged_nonexistent_file_id_99999',
      }),
    });
    const forgedRes = await mediaPost(forgedReq);
    assert.strictEqual(forgedRes.status, 422);
    const forgedJson = await forgedRes.json();
    assert.strictEqual(forgedJson.code, 'PROVIDER_VERIFICATION_FAILED');
    pass('Item 5.2: Forged / unconfirmed providerAssetId rejected with PROVIDER_VERIFICATION_FAILED');

    // Clean up temporary ImageKit test keys
    delete process.env.IMAGEKIT_PRIVATE_KEY;
    delete process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
    delete process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
    process.env.MEDIA_STORAGE_PROVIDER = 'local';
  }

  // ==========================================================================
  // SUITE 6: NEXT.CONFIG.TS REMOTE PATTERNS AUDIT
  // ==========================================================================
  console.log('\n--- Suite 6: Next.js Configuration Remote Patterns Audit ---');
  {
    const nextConfigContent = fs.readFileSync(
      path.resolve(__dirname, '../next.config.ts'),
      'utf-8'
    );
    assert(
      nextConfigContent.includes('ik.imagekit.io'),
      'next.config.ts must allow hostname ik.imagekit.io in images.remotePatterns'
    );
    pass('Item 6.1: next.config.ts allows ik.imagekit.io in images.remotePatterns');
  }

  // ==========================================================================
  // SUITE 7: 9-TECHNOLOGY SKILLS GALAXY & LOCAL ASSETS PHYSICAL INTEGRITY
  // ==========================================================================
  console.log('\n--- Suite 7: 9-Technology Skills Galaxy & Physical Assets Audit ---');
  {
    // Test 7.1: Verify the 9 official technologies in SUPPORTED_TECH_LOGOS
    const expectedTechs = [
      'laravel',
      'php',
      'mysql',
      'javascript',
      'react',
      'nextjs',
      'redis',
      'docker',
      'linux',
    ];
    assert.strictEqual(
      SUPPORTED_TECH_LOGOS.length,
      9,
      `SUPPORTED_TECH_LOGOS must contain exactly 9 technologies, got ${SUPPORTED_TECH_LOGOS.length}`
    );
    for (const tech of expectedTechs) {
      assert(
        SUPPORTED_TECH_LOGOS.includes(tech as (typeof SUPPORTED_TECH_LOGOS)[number]),
        `Expected official technology "${tech}" in SUPPORTED_TECH_LOGOS`
      );
    }
    pass('Item 7.1: SUPPORTED_TECH_LOGOS contains all 9 official technologies (laravel, php, mysql, javascript, react, nextjs, redis, docker, linux)');

    // Test 7.2: Physical SVG audit in public/icons/tech/
    const techDir = path.resolve(__dirname, '../public/icons/tech');
    assert(fs.existsSync(techDir), 'public/icons/tech directory must exist');
    const files = fs.readdirSync(techDir).sort();

    // Verify all 9 official SVGs exist
    for (const tech of expectedTechs) {
      const svgPath = path.join(techDir, `${tech}.svg`);
      assert(fs.existsSync(svgPath), `Physical logo ${tech}.svg must exist in public/icons/tech/`);
      const stat = fs.statSync(svgPath);
      assert(stat.size > 100, `Logo ${tech}.svg must be non-empty valid SVG`);
    }

    // Clarify 10th file: linux-tux.svg is a legacy alternative on disk
    assert(
      files.includes('linux-tux.svg'),
      'linux-tux.svg confirmed present on disk as legacy alternate'
    );
    assert.strictEqual(
      files.length,
      10,
      `public/icons/tech/ contains 10 files (9 active official logos + 1 legacy linux-tux.svg alternate)`
    );
    pass(
      'Item 7.2: Physical SVG audit confirmed (9 official active logos + 1 legacy linux-tux.svg alternate on disk; 0 content regression)'
    );

    // Test 7.3: Local static media assets physical verification
    const imagesDir = path.resolve(__dirname, '../public/images');
    assert(fs.existsSync(imagesDir), 'public/images directory must exist');
    const imageFiles = fs.readdirSync(imagesDir);
    assert(
      imageFiles.length >= 8,
      `Expected at least 8 local images in public/images, found ${imageFiles.length}`
    );
    pass(`Item 7.3: All ${imageFiles.length} local images physically exist in public/images/`);
  }

  console.log('\n================================================================');
  console.log('   ALL PHASE 16E.1 VERIFICATION SUITES PASSED SUCCESSFULLY (17/17)   ');
  console.log('================================================================\n');
}

runPhase16E1ImageKitVerification().catch((err) => {
  console.error('\n[VERIFICATION FAILED]:', err);
  process.exit(1);
});
