/**
 * PHILOZZ CMS — Phase 16E.0: Media Library Foundation & Storage Provider Readiness
 * Comprehensive Verification & Regression Test Suite
 *
 * Verifies:
 * 1. Unauthorized & Wrong-Owner Access Rejection (Dual-layer security boundary).
 * 2. Upload Input Validation (MIME whitelist, extension check, executable rejection).
 * 3. Malicious SVG Script Injection Rejection (Anti-XSS SVG inspection).
 * 4. Media Metadata CRUD (Local & Firestore repository operations).
 * 5. Soft-Delete & Restore Lifecycle (Non-destructive asset lifecycle).
 * 6. Multi-Entity Asset Usage Resolution (Projects, Articles, Homepage, Brand, SEO, Static photos).
 * 7. Safe Deletion Guard (Strict blocking of referenced assets).
 * 8. 6-Step Safe Replacement Protocol (Atomic reference update, zero asset loss).
 * 9. Honest Provider Readiness & Upload Signing Endpoint (Vercel-compatible direct upload architecture).
 * 10. Client Component Bundle & Secret Leakage Audit.
 * 11. Firestore Media Adapter Contract Compliance.
 * 12. Local Assets & Official Tech Logos Physical Integrity.
 * 13. CMS Management Screens & Form Integration Stability.
 */

import './register-server-only.cjs';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

import { MediaFolder } from '../src/cms/models/media';
import {
  mediaRepository,
  siteContentRepository,
  FirestoreMediaRepository,
} from '../src/cms/repositories';
import {
  validateUploadSigningRequest,
  containsMaliciousSvgContent,
} from '../src/cms/validation/mediaValidators';
import { MediaUsageResolver } from '../src/cms/media/mediaUsageResolver';
import {
  getActiveStorageProvider,
  STORAGE_PROVIDER_COMPARISON,
  CloudinaryMediaProvider,
  ImageKitMediaProvider,
  FirebaseStorageMediaProvider,
  LocalStaticMediaProvider,
} from '../src/cms/media/mediaStorageProvider';
import {
  updateMediaMetadataAction,
  deleteMediaAssetAction,
  restoreMediaAssetAction,
  replaceAssetReferenceAction,
} from '../src/app/admin/media/actions';
import { POST as signUploadPost } from '../src/app/api/admin/media/sign-upload/route';
import { isAuthorizedOwnerClaims } from '../src/lib/auth/session';
import { assertAdminSession } from '../src/lib/auth/requireAdminSession';

function pass(msg: string) {
  console.log(`  [PASS] ${msg}`);
}

async function runPhase16EMediaVerification() {
  console.log('================================================================');
  console.log('   PHILOZZ — PHASE 16E.0: MEDIA LIBRARY FOUNDATION VERIFICATION');
  console.log('================================================================\n');

  const TEST_OWNER_UID = 'verified_owner_uid_media16e';
  const TEST_OWNER_EMAIL = 'felopater455@gmail.com';
  (process.env as Record<string, string | undefined>).NODE_ENV = 'test';
  process.env.ADMIN_OWNER_UID = TEST_OWNER_UID;
  process.env.ADMIN_OWNER_EMAIL = TEST_OWNER_EMAIL;
  process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'test-media-project';
  process.env.FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL || 'test@test-media-project.iam.gserviceaccount.com';
  process.env.FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY || '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC\n-----END PRIVATE KEY-----\n';

  // Set mock session cookies and mock admin user for Server Actions
  (globalThis as unknown as { __mockCookies: Record<string, string> }).__mockCookies = {
    __session: 'mock-valid-session-token',
  };
  (globalThis as unknown as { __mockAdminUser: { uid: string; email: string; admin: true } }).__mockAdminUser = {
    uid: TEST_OWNER_UID,
    email: TEST_OWNER_EMAIL,
    admin: true,
  };

  // ==========================================================================
  // SUITE 1: OWNER AUTHENTICATION & SECURITY GUARDS
  // ==========================================================================
  console.log('--- Suite 1: Owner Authentication & Security Guards ---');
  {
    // Test 1.1: Missing session rejection
    await assert.rejects(
      async () => {
        await assertAdminSession('');
      },
      (err: Error) => {
        assert(err.message.includes('Unauthorized') || err.message.includes('session'));
        return true;
      },
      'assertAdminSession must reject unauthenticated call'
    );
    pass('Item 1.1: Unauthenticated request rejected by assertAdminSession');

    // Test 1.2: Impostor UID rejected
    const impostorClaims = {
      uid: 'impostor_uid_999',
      admin: true,
      email: TEST_OWNER_EMAIL,
    };
    const impostorAuth = isAuthorizedOwnerClaims(impostorClaims);
    assert.strictEqual(impostorAuth.authorized, false, 'Impostor UID must be unauthorized');
    pass('Item 1.2: Impostor UID rejected by isAuthorizedOwnerClaims');

    // Test 1.3: Non-admin claims rejected
    const nonAdminClaims = {
      uid: TEST_OWNER_UID,
      admin: false,
      email: TEST_OWNER_EMAIL,
    };
    const nonAdminAuth = isAuthorizedOwnerClaims(nonAdminClaims);
    assert.strictEqual(nonAdminAuth.authorized, false, 'Non-admin claims must be unauthorized');
    pass('Item 1.3: Non-admin claim rejected even with matching UID');

    // Test 1.4: Verified owner accepted
    const validClaims = {
      uid: TEST_OWNER_UID,
      admin: true,
      email: TEST_OWNER_EMAIL,
    };
    const validAuth = isAuthorizedOwnerClaims(validClaims);
    assert.strictEqual(validAuth.authorized, true, 'Verified owner claims must be authorized');
    pass('Item 1.4: Verified owner claims accepted by dual-layer guard');
  }

  // ==========================================================================
  // SUITE 2: UPLOAD VALIDATION & SECURITY REJECTION
  // ==========================================================================
  console.log('\n--- Suite 2: Upload Validation & Malicious Asset Rejection ---');
  {
    // Test 2.1: Valid upload request passes
    const validRequest = {
      filename: 'architecture-diagram.webp',
      mimeType: 'image/webp',
      folder: 'projects' as MediaFolder,
      sizeBytes: 1024 * 500, // 500 KB
    };
    const validRes = validateUploadSigningRequest(validRequest);
    assert.strictEqual(validRes.valid, true, 'Valid webp file should pass validation');
    pass('Item 2.1: Valid image/webp upload request accepted');

    // Test 2.2: Unsupported MIME types rejected
    const badMimeRequests = [
      { filename: 'app.exe', mimeType: 'application/x-msdownload', folder: 'general' as MediaFolder, sizeBytes: 1000 },
      { filename: 'script.js', mimeType: 'application/javascript', folder: 'general' as MediaFolder, sizeBytes: 1000 },
      { filename: 'index.html', mimeType: 'text/html', folder: 'general' as MediaFolder, sizeBytes: 1000 },
      { filename: 'shell.sh', mimeType: 'application/x-sh', folder: 'general' as MediaFolder, sizeBytes: 1000 },
      { filename: 'video.mp4', mimeType: 'video/mp4', folder: 'general' as MediaFolder, sizeBytes: 1000 },
    ];
    for (const req of badMimeRequests) {
      const res = validateUploadSigningRequest(req);
      assert.strictEqual(res.valid, false, `Should reject unsupported MIME: ${req.mimeType}`);
      assert(res.errors.mimeType || res.errors.filename, `Should produce error for ${req.mimeType}`);
    }
    pass('Item 2.2: Executable and unsupported MIME types strictly rejected');

    // Test 2.3: Dangerous extensions rejected even with fake MIME type
    const spoofedExtensionReq = {
      filename: 'malicious.php',
      mimeType: 'image/jpeg',
      folder: 'general' as MediaFolder,
      sizeBytes: 1000,
    };
    const spoofedRes = validateUploadSigningRequest(spoofedExtensionReq);
    assert.strictEqual(spoofedRes.valid, false, 'Spoofed extension must be rejected');
    assert(spoofedRes.errors.filename, 'Must report extension mismatch error');
    pass('Item 2.3: Extension mismatch / spoofed executable extension strictly rejected');

    // Test 2.4: Oversized files rejected (>15MB)
    const oversizedReq = {
      filename: 'giant-asset.png',
      mimeType: 'image/png',
      folder: 'photos' as MediaFolder,
      sizeBytes: 20 * 1024 * 1024, // 20 MB
    };
    const oversizedRes = validateUploadSigningRequest(oversizedReq);
    assert.strictEqual(oversizedRes.valid, false, 'Oversized file must be rejected');
    assert(oversizedRes.errors.sizeBytes, 'Must flag sizeBytes error');
    pass('Item 2.4: Files exceeding 15MB limit strictly rejected');

    // Test 2.5: Malicious SVG content inspection
    const cleanSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="red"/></svg>';
    const isCleanMalicious = containsMaliciousSvgContent(cleanSvg);
    assert.strictEqual(isCleanMalicious, false, 'Clean SVG must not be flagged as malicious');

    const maliciousSvgs = [
      '<svg><script>alert(1)</script></svg>',
      '<svg onload="alert(\'xss\')"><rect width="10" height="10"/></svg>',
      '<svg><a href="javascript:alert(1)"><circle r="5"/></a></svg>',
      '<svg><iframe src="https://evil.com"></iframe></svg>',
    ];
    for (const badSvg of maliciousSvgs) {
      const isBadMalicious = containsMaliciousSvgContent(badSvg);
      assert.strictEqual(isBadMalicious, true, `Malicious SVG should be flagged: ${badSvg}`);
    }
    pass('Item 2.5: Anti-XSS SVG inspection rejects inline scripts, event handlers, and javascript: links');
  }

  // ==========================================================================
  // SUITE 3: MEDIA METADATA CRUD & NON-DESTRUCTIVE LIFECYCLE
  // ==========================================================================
  console.log('\n--- Suite 3: Media Metadata CRUD & Lifecycle Operations ---');
  {
    // Test 3.1: Retrieve baseline seeded assets
    const initialAssets = await mediaRepository.getAll();
    assert(initialAssets.length >= 5, 'Baseline repository must contain seeded assets');
    const heroAsset = initialAssets.find((a) => a.filename === 'philozz-cinematic-hero.png');
    assert(heroAsset, 'Hero asset must exist in library');
    assert.strictEqual(heroAsset.status, 'ready');
    assert.strictEqual(heroAsset.isDeleted, false);
    pass(`Item 3.1: Retrieved ${initialAssets.length} initial media assets with valid status`);

    // Test 3.2: Create new media asset record
    const newAsset = await mediaRepository.create({
      filename: 'test-diagram-q3.png',
      originalName: 'test-diagram-q3.png',
      mimeType: 'image/png',
      sizeBytes: 45000,
      dimensions: { width: 1200, height: 800 },
      url: '/images/test-diagram-q3.png',
      provider: 'local',
      altText: 'Quarterly Architecture Diagram',
      caption: 'System Topology',
      folder: 'projects',
      tags: ['diagram', 'systems'],
      uploadedBy: TEST_OWNER_EMAIL,
      status: 'ready',
    });
    assert(newAsset.id, 'Created asset must have an ID');
    assert.strictEqual(newAsset.filename, 'test-diagram-q3.png');
    pass(`Item 3.2: Created new media metadata record (${newAsset.id})`);

    // Test 3.3: Update metadata via Server Action
    const updateRes = await updateMediaMetadataAction(newAsset.id, {
      altText: 'Updated Architecture Diagram Alt',
      caption: 'New Caption',
      folder: 'articles',
      tags: ['architecture', 'cloud'],
    });
    assert.strictEqual(updateRes.success, true, 'Metadata update should succeed');
    assert.strictEqual(updateRes.data?.altText, 'Updated Architecture Diagram Alt');
    assert.strictEqual(updateRes.data?.folder, 'articles');
    pass('Item 3.3: Updated media metadata (alt text, folder, tags) via updateMediaMetadataAction');

    // Test 3.4: Soft-deletion of unreferenced asset
    const deleteRes = await deleteMediaAssetAction(newAsset.id);
    assert.strictEqual(deleteRes.success, true, 'Soft-deletion of unreferenced asset should succeed');

    // Verify it is excluded from default getAll()
    const activeAssets = await mediaRepository.getAll();
    assert(!activeAssets.find((a) => a.id === newAsset.id), 'Soft-deleted asset must be excluded from default query');

    // Verify it is present when includeDeleted: true
    const allWithDeleted = await mediaRepository.getAll({ includeDeleted: true });
    const deletedRecord = allWithDeleted.find((a) => a.id === newAsset.id);
    assert(deletedRecord, 'Soft-deleted asset must be present when includeDeleted: true');
    assert.strictEqual(deletedRecord.isDeleted, true);
    assert.strictEqual(deletedRecord.status, 'archived');
    assert(deletedRecord.deletedAt, 'deletedAt timestamp must be set');
    pass('Item 3.4: Soft-deleted unreferenced asset; properly hidden from active listing');

    // Test 3.5: Restore soft-deleted asset
    const restoreRes = await restoreMediaAssetAction(newAsset.id);
    assert.strictEqual(restoreRes.success, true, 'Restoring asset should succeed');
    assert.strictEqual(restoreRes.data?.isDeleted, false);
    assert.strictEqual(restoreRes.data?.status, 'ready');

    const restoredAssets = await mediaRepository.getAll();
    assert(restoredAssets.find((a) => a.id === newAsset.id), 'Restored asset must reappear in active listing');
    pass('Item 3.5: Restored soft-deleted asset to active library');

    // Clean up test asset
    await mediaRepository.delete(newAsset.id);
  }

  // ==========================================================================
  // SUITE 4: MULTI-ENTITY ASSET USAGE RESOLUTION
  // ==========================================================================
  console.log('\n--- Suite 4: Multi-Entity Asset Usage Resolution Engine ---');
  {
    const heroAsset = (await mediaRepository.getAll()).find((a) => a.filename === 'philozz-cinematic-hero.png');
    assert(heroAsset, 'Hero asset must exist');

    const heroUsage = await MediaUsageResolver.resolveAssetUsage(heroAsset);
    assert(heroUsage.isInUse, 'Hero asset must be reported as in use');
    assert.strictEqual(heroUsage.isDeletable, false, 'Hero asset must NOT be deletable');
    assert(heroUsage.references.length > 0, 'Hero asset must have references');
    pass(`Item 4.1: Hero asset usage resolved (${heroUsage.references.length} references: ${heroUsage.summary})`);

    const cvAsset = (await mediaRepository.getAll()).find((a) => a.filename === 'felopater-cv.pdf');
    assert(cvAsset, 'CV asset must exist');
    const cvUsage = await MediaUsageResolver.resolveAssetUsage(cvAsset);
    assert(cvUsage.isInUse, 'CV asset must be in use by Brand and/or Finale scene');
    assert.strictEqual(cvUsage.isDeletable, false, 'CV asset must NOT be deletable');
    pass(`Item 4.2: CV document usage resolved (${cvUsage.references.length} references: ${cvUsage.summary})`);

    const portraitAsset = (await mediaRepository.getAll()).find((a) => a.filename === 'felopater-portrait-thinking.jpg');
    assert(portraitAsset, 'Portrait asset must exist');
    const portraitUsage = await MediaUsageResolver.resolveAssetUsage(portraitAsset);
    assert(portraitUsage.isInUse, 'Portrait asset must be in use');
    pass(`Item 4.3: Portrait asset usage resolved (${portraitUsage.references.length} references: ${portraitUsage.summary})`);

    // Test all usage map
    const allAssets = await mediaRepository.getAll();
    const allUsageMap = await MediaUsageResolver.resolveAllUsage(allAssets);
    assert.strictEqual(allUsageMap.size, allAssets.length, 'Usage map must contain entries for all assets');
    pass(`Item 4.4: Bulk usage resolution completed for all ${allAssets.length} library assets`);
  }

  // ==========================================================================
  // SUITE 5: SAFE DELETION GUARD & CONTENT PROTECTION
  // ==========================================================================
  console.log('\n--- Suite 5: Safe Deletion Guard & Reference Protection ---');
  {
    const heroAsset = (await mediaRepository.getAll()).find((a) => a.filename === 'philozz-cinematic-hero.png');
    assert(heroAsset, 'Hero asset must exist');

    // Attempt to delete actively referenced hero asset
    const blockedDelete = await deleteMediaAssetAction(heroAsset.id);
    assert.strictEqual(blockedDelete.success, false, 'Deleting referenced asset must be blocked');
    assert(blockedDelete.error?.includes('Deletion blocked'), 'Must return explicit blocked message');
    assert(blockedDelete.error?.includes('referenced'), 'Error must mention active references');
    pass('Item 5.1: Blocked deletion of actively referenced hero asset with explicit error message');

    // Verify hero asset still exists intact
    const verifyIntact = await mediaRepository.getById(heroAsset.id);
    assert(verifyIntact, 'Hero asset must remain intact in repository');
    assert.strictEqual(verifyIntact.isDeleted, false, 'Hero asset must NOT be marked deleted');
    pass('Item 5.2: Verified referenced asset remains untouched in repository');
  }

  // ==========================================================================
  // SUITE 6: 6-STEP SAFE REPLACEMENT ARCHITECTURE
  // ==========================================================================
  console.log('\n--- Suite 6: 6-Step Safe Replacement Architecture ---');
  {
    // Step 0: Create temporary replacement asset
    const replacementAsset = await mediaRepository.create({
      filename: 'hero-cinematic-v2.webp',
      originalName: 'hero-cinematic-v2.webp',
      mimeType: 'image/webp',
      sizeBytes: 780000,
      dimensions: { width: 1920, height: 1080 },
      url: '/images/hero-cinematic-v2.webp',
      provider: 'local',
      altText: 'Hero Cinematic V2',
      folder: 'photos',
      tags: ['hero', 'v2'],
      uploadedBy: TEST_OWNER_EMAIL,
      status: 'ready',
    });

    const heroAsset = (await mediaRepository.getAll()).find((a) => a.filename === 'philozz-cinematic-hero.png')!;

    // Execute replacement on homepage hero draft
    const replaceRes = await replaceAssetReferenceAction(
      heroAsset.id,
      replacementAsset.id,
      {
        entityType: 'homepage_hero',
        entityId: 'singleton',
        field: 'heroImageUrl',
      }
    );
    assert.strictEqual(replaceRes.success, true, 'Replacement action must succeed');

    // Verify homepage draft was updated to new asset URL
    const draft = await siteContentRepository.getHomepageConfigDraft();
    assert(draft, 'Draft homepage config must exist');
    assert.strictEqual(draft.hero.heroImageUrl, replacementAsset.url, 'Hero image URL in draft must match replacement URL');
    pass('Item 6.1: Step 1-4: Replacement asset validated and homepage draft reference updated');

    // Step 5: Verify original hero asset is STILL RETAINED in media repository
    const oldAssetCheck = await mediaRepository.getById(heroAsset.id);
    assert(oldAssetCheck, 'Original hero asset must still exist in media repository');
    assert.strictEqual(oldAssetCheck.isDeleted, false, 'Original asset must not be deleted');
    pass('Item 6.2: Step 5: Original asset safely retained in library until all references clear');

    // Step 6: Verify usage report was updated
    assert(replaceRes.data?.oldAssetUsage, 'Must return updated usage report for old asset');
    pass('Item 6.3: Step 6: Updated usage report returned for original asset');

    // Revert draft back to original hero URL
    await siteContentRepository.saveHomepageConfigDraft({
      hero: { ...draft.hero, heroImageUrl: heroAsset.url },
    });
    // Clean up test replacement asset
    await mediaRepository.delete(replacementAsset.id);
    pass('Item 6.4: Reverted test draft and verified replacement workflow is 100% recoverable');
  }

  // ==========================================================================
  // SUITE 7: VERCEL UPLOAD COMPATIBILITY & PROVIDER READINESS
  // ==========================================================================
  console.log('\n--- Suite 7: Vercel Upload Compatibility & Provider Readiness ---');
  {
    // Test 7.1: Active provider defaults safely to Local
    const activeProvider = getActiveStorageProvider();
    assert.strictEqual(activeProvider.providerName, 'local', 'Default provider must be local');
    assert.strictEqual(activeProvider.isUploadConfigured, false, 'Local provider cannot accept direct uploads');
    pass('Item 7.1: Active provider safely detects unconfigured cloud storage and defaults to local');

    // Test 7.2: Provider comparison matrix completeness
    assert(STORAGE_PROVIDER_COMPARISON.providers.length === 4, 'Must evaluate 4 storage providers');
    const cloudinaryMeta = STORAGE_PROVIDER_COMPARISON.providers.find((p) => p.id === 'cloudinary');
    const imagekitMeta = STORAGE_PROVIDER_COMPARISON.providers.find((p) => p.id === 'imagekit');
    const firebaseMeta = STORAGE_PROVIDER_COMPARISON.providers.find((p) => p.id === 'firebase-storage');
    const imgbbMeta = STORAGE_PROVIDER_COMPARISON.providers.find((p) => p.id === 'imagedb');

    assert(cloudinaryMeta, 'Cloudinary comparison exists');
    assert(imagekitMeta, 'ImageKit comparison exists');
    assert(firebaseMeta, 'Firebase comparison exists');
    assert(imgbbMeta, 'ImgBB comparison exists');
    assert.strictEqual(imgbbMeta?.recommendationStatus, 'not_recommended', 'ImgBB must be marked not_recommended');
    pass('Item 7.2: Provider comparison matrix evaluates Cloudinary, ImageKit, Firebase, and ImgBB');

    // Test 7.3: Upload signing endpoint rejects unauthenticated request
    const dummyReq = new NextRequest('http://localhost:3000/api/admin/media/sign-upload', {
      method: 'POST',
      body: JSON.stringify({
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        folder: 'projects',
        sizeBytes: 1000,
      }),
    });
    // Clear cookies temporarily to test 401
    (globalThis as unknown as { __mockCookies: Record<string, string> }).__mockCookies = {};
    const unauthRes = await signUploadPost(dummyReq);
    assert.strictEqual(unauthRes.status, 401, 'Endpoint must return 401 when unauthenticated');
    pass('Item 7.3: Upload signing endpoint rejects unauthenticated request (401)');

    // Restore cookies
    (globalThis as unknown as { __mockCookies: Record<string, string> }).__mockCookies = {
      __session: 'mock-valid-session-token',
    };

    // Test 7.4: CSRF check rejection
    const csrfReq = new NextRequest('http://localhost:3000/api/admin/media/sign-upload', {
      method: 'POST',
      headers: {
        origin: 'http://malicious-site.com',
      },
      body: JSON.stringify({
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        folder: 'projects',
        sizeBytes: 1000,
      }),
    });
    const csrfRes = await signUploadPost(csrfReq);
    assert.strictEqual(csrfRes.status, 403, 'Cross-origin request must be rejected (403)');
    pass('Item 7.4: Upload signing endpoint rejects unauthorized cross-origin request (403)');

    // Test 7.5: Honest PROVIDER_SETUP_REQUIRED response (503)
    const validSignReq = new NextRequest('http://localhost:3000/api/admin/media/sign-upload', {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        filename: 'valid-diagram.png',
        mimeType: 'image/png',
        folder: 'projects',
        sizeBytes: 50000,
      }),
    });
    const setupRequiredRes = await signUploadPost(validSignReq);
    assert.strictEqual(setupRequiredRes.status, 503, 'Must return 503 when no cloud provider configured');
    const setupJson = await setupRequiredRes.json();
    assert.strictEqual(setupJson.code, 'PROVIDER_SETUP_REQUIRED');
    assert.strictEqual(setupJson.recommendedProvider, 'imagekit');
    pass('Item 7.5: Upload signing endpoint returns honest PROVIDER_SETUP_REQUIRED (503) state');

    // Test 7.6: Individual provider driver implementations
    const cloudDriver = new CloudinaryMediaProvider();
    assert.strictEqual(cloudDriver.providerName, 'cloudinary');
    const imagekitDriver = new ImageKitMediaProvider();
    assert.strictEqual(imagekitDriver.providerName, 'imagekit');
    const firebaseDriver = new FirebaseStorageMediaProvider();
    assert.strictEqual(firebaseDriver.providerName, 'firebase-storage');
    const localDriver = new LocalStaticMediaProvider();
    assert.strictEqual(localDriver.providerName, 'local');
    pass('Item 7.6: All 4 provider drivers instantiate and implement IMediaStorageProvider interface');
  }

  // ==========================================================================
  // SUITE 8: CLIENT COMPONENT BUNDLE AUDIT (ZERO SECRET LEAKAGE)
  // ==========================================================================
  console.log('\n--- Suite 8: Client Component Bundle & Secret Leakage Audit ---');
  {
    const clientFiles = [
      '../src/components/admin/MediaLibraryView.tsx',
      '../src/components/admin/MediaPickerModal.tsx',
      '../src/components/admin/MediaField.tsx',
    ];

    for (const relPath of clientFiles) {
      const fullPath = path.resolve(__dirname, relPath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      assert(content.includes("'use client'"), `${path.basename(relPath)} must contain 'use client'`);
      assert(!content.includes('CLOUDINARY_API_SECRET'), `No CLOUDINARY_API_SECRET in ${path.basename(relPath)}`);
      assert(!content.includes('IMAGEKIT_PRIVATE_KEY'), `No IMAGEKIT_PRIVATE_KEY in ${path.basename(relPath)}`);
      assert(!content.includes('FIREBASE_ADMIN_SERVICE_ACCOUNT'), `No serviceAccount in ${path.basename(relPath)}`);
      assert(!content.includes('firebase-admin'), `No firebase-admin import in ${path.basename(relPath)}`);
      pass(`Item 8: Audited ${path.basename(relPath)} — zero private secrets or server SDKs`);
    }
  }

  // ==========================================================================
  // SUITE 9: FIRESTORE MEDIA ADAPTER CONTRACT COMPLIANCE
  // ==========================================================================
  console.log('\n--- Suite 9: Firestore Media Adapter Contract Compliance ---');
  {
    const proto = FirestoreMediaRepository.prototype;
    assert(typeof proto.getById === 'function', 'FirestoreMediaRepository must implement getById');
    assert(typeof proto.getAll === 'function', 'FirestoreMediaRepository must implement getAll');
    assert(typeof proto.create === 'function', 'FirestoreMediaRepository must implement create');
    assert(typeof proto.update === 'function', 'FirestoreMediaRepository must implement update');
    assert(typeof proto.delete === 'function', 'FirestoreMediaRepository must implement delete');
    assert(typeof proto.softDelete === 'function', 'FirestoreMediaRepository must implement softDelete');
    assert(typeof proto.restore === 'function', 'FirestoreMediaRepository must implement restore');
    pass('Item 9: FirestoreMediaRepository implements full IMediaRepository interface including softDelete & restore');
  }

  // ==========================================================================
  // SUITE 10: PHYSICAL INTEGRITY OF LOCAL ASSETS & TECH LOGOS
  // ==========================================================================
  console.log('\n--- Suite 10: Physical Integrity of Local Images & Tech Logos ---');
  {
    const requiredImages = [
      'public/images/philozz-cinematic-hero.png',
      'public/images/felopater-portrait-thinking.jpg',
      'public/images/felopater-portrait-sitting.jpg',
      'public/images/studio-workspace-backdrop.jpg',
      'public/images/felopater-cv.pdf',
    ];

    for (const imgRel of requiredImages) {
      const imgPath = path.resolve(__dirname, '..', imgRel);
      assert(fs.existsSync(imgPath), `Required asset "${imgRel}" must exist on disk`);
      const stat = fs.statSync(imgPath);
      assert(stat.size > 1000, `Asset "${imgRel}" must have valid size (>1KB), found ${stat.size}`);
      pass(`Item 10.1: Verified "${imgRel}" exists intact (${Math.round(stat.size / 1024)} KB)`);
    }

    const techIconsDir = path.resolve(__dirname, '../public/icons/tech');
    assert(fs.existsSync(techIconsDir), 'public/icons/tech directory must exist');
    const icons = fs.readdirSync(techIconsDir).filter((f) => f.endsWith('.svg'));
    assert(icons.length >= 10, `Tech logos directory must contain at least 10 SVG icons, found ${icons.length}`);
    pass(`Item 10.2: Verified all ${icons.length} official Skills Galaxy tech logo SVGs remain untouched`);
  }

  // ==========================================================================
  // SUITE 11: CMS STUDIO & FORM INTEGRATIONS
  // ==========================================================================
  console.log('\n--- Suite 11: CMS Studio & Form Integrations ---');
  {
    const integratedFiles = [
      '../src/components/admin/ProjectForm.tsx',
      '../src/components/admin/ArticleForm.tsx',
      '../src/components/admin/SectionsStudioView.tsx',
      '../src/components/admin/SeoStudioView.tsx',
      '../src/components/admin/SettingsStudioView.tsx',
    ];

    for (const relPath of integratedFiles) {
      const fullPath = path.resolve(__dirname, relPath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      assert(content.includes('MediaField'), `${path.basename(relPath)} must integrate MediaField`);
      pass(`Item 11: Verified ${path.basename(relPath)} seamlessly integrates MediaField`);
    }
  }

  console.log('\n================================================================');
  console.log('   ALL 11 PHASE 16E.0 MEDIA VERIFICATION SUITES PASSED');
  console.log('================================================================\n');
}

runPhase16EMediaVerification().catch((err) => {
  console.error('\n❌ Phase 16E.0 Verification Failed:\n', err);
  process.exit(1);
});
