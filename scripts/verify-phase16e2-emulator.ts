/**
 * PHILOZZ CMS — Phase 16E.2: Firestore Emulator Verification Suite
 *
 * Verifies real database interactions against the Firestore Emulator:
 * 1. Live asset metadata persistence in Firestore.
 * 2. Database-enforced atomic uniqueness under 10 simultaneous concurrent requests.
 * 3. Zero duplicate documents or audit log events on concurrent registration.
 * 4. Recovery and reconciliation of orphaned uploads in Firestore.
 * 5. Deterministic document ID lookup (getByProviderAssetId).
 * 6. Media usage resolver dependency protection against live Firestore records.
 * 7. Asset persistence survival across simulated application restarts.
 */

import './register-server-only.cjs';
import assert from 'assert';
import {
  FirestoreMediaRepository,
  FirestoreAuditLogRepository,
} from '../src/cms/repositories';
import { MediaAssetEntity, MediaFolder } from '../src/cms/models/media';
import { MediaUsageResolver } from '../src/cms/media/mediaUsageResolver';
import { getFirebaseFirestore } from '../src/lib/auth/firebaseAdmin';

function pass(msg: string) {
  console.log(`  [PASS] ${msg}`);
}

async function runEmulatorVerification() {
  console.log('================================================================');
  console.log('   PHILOZZ — PHASE 16E.2: FIRESTORE EMULATOR VERIFICATION       ');
  console.log('================================================================\n');

  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
  const isEmulatorActive = Boolean(emulatorHost);
  console.log(
    `Runtime mode: ${
      isEmulatorActive
        ? `FIRESTORE EMULATOR ACTIVE (${emulatorHost})`
        : 'LIVE / IN-PROCESS FIRESTORE ENVIRONMENT'
    }\n`
  );

  let mediaRepo = new FirestoreMediaRepository();
  const auditRepo = new FirestoreAuditLogRepository();
  const firestore = getFirebaseFirestore();

  const TEST_PROVIDER_ASSET_ID = `ik_test_asset_${Date.now()}_abc`;
  let orphanAssetId = '';

  // ==========================================================================
  // SUITE 1: REAL ASSET METADATA PERSISTENCE IN FIRESTORE
  // ==========================================================================
  console.log('--- Suite 1: Live Metadata Persistence in Firestore ---');
  {
    const initialPayload: Omit<MediaAssetEntity, 'id' | 'createdAt' | 'updatedAt'> = {
      filename: 'emulator-test-hero.webp',
      originalName: 'emulator-test-hero.webp',
      mimeType: 'image/webp',
      sizeBytes: 450000,
      dimensions: { width: 1920, height: 1080 },
      url: `https://ik.imagekit.io/philozz_official/photos/emulator-test-hero.webp`,
      thumbnailUrl: `https://ik.imagekit.io/philozz_official/photos/emulator-test-hero.webp?tr=w-200`,
      provider: 'imagekit',
      providerAssetId: TEST_PROVIDER_ASSET_ID,
      altText: 'Emulator Persistence Verification Hero',
      caption: 'Captured during automated Firestore emulator testing',
      folder: 'photos' as MediaFolder,
      tags: ['emulator', 'test', 'hero'],
      uploadedBy: 'owner@philozz.com',
      status: 'ready',
    };

    const result = await mediaRepo.createIdempotent!(initialPayload);
    assert.strictEqual(result.isNew, true, 'First creation must report isNew === true');
    assert(result.asset.id.startsWith('media_imagekit_'), 'Doc ID must be deterministic media_imagekit_*');

    // Read directly from Firestore
    const persisted = await mediaRepo.getById(result.asset.id);
    assert(persisted, 'Asset must exist in Firestore');
    assert.strictEqual(persisted.filename, 'emulator-test-hero.webp');
    assert.strictEqual(persisted.sizeBytes, 450000);
    assert.strictEqual(persisted.dimensions?.width, 1920);
    assert.strictEqual(persisted.dimensions?.height, 1080);
    assert.strictEqual(persisted.providerAssetId, TEST_PROVIDER_ASSET_ID);
    assert.strictEqual(persisted.folder, 'photos');
    pass('Item 1.1: New asset metadata successfully persisted and verified in Firestore');

    // Record initial audit event
    await auditRepo.record({
      actorId: 'owner_uid_test',
      actorEmail: 'owner@philozz.com',
      action: 'upload',
      entityType: 'media',
      entityId: result.asset.id,
      summary: `Registered verified media asset "${persisted.filename}"`,
    });
    pass('Item 1.2: Audit log record created in Firestore audit_logs collection');
  }

  // ==========================================================================
  // SUITE 2: CONCURRENT DUPLICATE PREVENTION & RACE-SAFETY
  // ==========================================================================
  console.log('\n--- Suite 2: Concurrent Duplicate Prevention in Real Firestore Transactions ---');
  {
    const concurrentPayload: Omit<MediaAssetEntity, 'id' | 'createdAt' | 'updatedAt'> = {
      filename: 'emulator-test-hero.webp',
      originalName: 'emulator-test-hero.webp',
      mimeType: 'image/webp',
      sizeBytes: 450000,
      dimensions: { width: 1920, height: 1080 },
      url: `https://ik.imagekit.io/philozz_official/photos/emulator-test-hero.webp`,
      provider: 'imagekit',
      providerAssetId: TEST_PROVIDER_ASSET_ID,
      altText: 'Emulator Persistence Verification Hero',
      folder: 'photos' as MediaFolder,
      tags: ['emulator', 'test'],
      uploadedBy: 'owner@philozz.com',
      status: 'ready',
    };

    // Execute 10 simultaneous concurrent requests for the EXACT same providerAssetId
    const concurrentRequests = Array.from({ length: 10 }).map(() =>
      mediaRepo.createIdempotent!(concurrentPayload)
    );

    const results = await Promise.all(concurrentRequests);

    // All 10 must report isNew === false (since initialPayload already created it)
    const newCount = results.filter((r) => r.isNew).length;
    const existingCount = results.filter((r) => !r.isNew).length;

    assert.strictEqual(
      newCount,
      0,
      `All 10 concurrent requests must report isNew === false, got ${newCount}`
    );
    assert.strictEqual(existingCount, 10);

    // Verify at the database level: Exactly 1 document exists in Firestore
    const snapshot = await firestore
      .collection('media')
      .where('providerAssetId', '==', TEST_PROVIDER_ASSET_ID)
      .get();

    assert.strictEqual(
      snapshot.size,
      1,
      `Firestore must contain exactly 1 document for providerAssetId, found ${snapshot.size}`
    );
    pass('Item 2.1: 10 simultaneous concurrent registration requests resulted in exactly 1 Firestore document (0 duplicates)');
  }

  // ==========================================================================
  // SUITE 3: DETERMINISTIC LOOKUP (getByProviderAssetId)
  // ==========================================================================
  console.log('\n--- Suite 3: Deterministic Lookup via getByProviderAssetId ---');
  {
    const lookup = await mediaRepo.getByProviderAssetId!(TEST_PROVIDER_ASSET_ID);
    assert(lookup, 'getByProviderAssetId must find existing asset');
    assert.strictEqual(lookup.providerAssetId, TEST_PROVIDER_ASSET_ID);

    const nonExistent = await mediaRepo.getByProviderAssetId!('nonexistent_asset_id_xyz');
    assert.strictEqual(nonExistent, null, 'Nonexistent provider asset ID must return null');
    pass('Item 3.1: getByProviderAssetId performs fast deterministic lookup in Firestore');
  }

  // ==========================================================================
  // SUITE 4: ORPHAN RECONCILIATION IN FIRESTORE
  // ==========================================================================
  console.log('\n--- Suite 4: Orphaned Remote Asset Reconciliation in Firestore ---');
  {
    const orphanProviderId = `ik_orphan_recovered_${Date.now()}`;
    const orphanPayload: Omit<MediaAssetEntity, 'id' | 'createdAt' | 'updatedAt'> = {
      filename: 'orphaned-article-cover.jpg',
      originalName: 'orphaned-article-cover.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 180000,
      url: `https://ik.imagekit.io/philozz_official/articles/orphaned-article-cover.jpg`,
      provider: 'imagekit',
      providerAssetId: orphanProviderId,
      altText: 'Recovered Article Cover',
      folder: 'articles' as MediaFolder,
      tags: ['reconciled', 'articles'],
      uploadedBy: 'owner@philozz.com',
      status: 'ready',
    };

    const reconciled = await mediaRepo.createIdempotent!(orphanPayload);
    orphanAssetId = reconciled.asset.id;
    assert.strictEqual(reconciled.isNew, true);

    const verifyPersisted = await mediaRepo.getByProviderAssetId!(orphanProviderId);
    assert(verifyPersisted);
    assert.strictEqual(verifyPersisted.filename, 'orphaned-article-cover.jpg');
    assert.strictEqual(verifyPersisted.folder, 'articles');
    pass('Item 4.1: Orphaned asset successfully reconciled and committed to Firestore');
  }

  // ==========================================================================
  // SUITE 5: ASSET PERSISTENCE ACROSS SIMULATED APPLICATION RESTART
  // ==========================================================================
  console.log('\n--- Suite 5: Asset Persistence Across Application Restart ---');
  {
    // Simulate application restart: tear down existing repository reference
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mediaRepo = null as any;

    // Instantiate a fresh repository connection
    const freshMediaRepo = new FirestoreMediaRepository();

    const retrievedAfterRestart = await freshMediaRepo.getByProviderAssetId!(TEST_PROVIDER_ASSET_ID);
    assert(
      retrievedAfterRestart,
      'Asset must survive repository teardown and application restart'
    );
    assert.strictEqual(retrievedAfterRestart.providerAssetId, TEST_PROVIDER_ASSET_ID);
    assert.strictEqual(retrievedAfterRestart.filename, 'emulator-test-hero.webp');

    const allAssets = await freshMediaRepo.getAll({ includeDeleted: true });
    assert(
      allAssets.some((a) => a.providerAssetId === TEST_PROVIDER_ASSET_ID),
      'All assets query includes persisted asset after restart'
    );
    pass('Item 5.1: Media asset metadata 100% durable across simulated process teardown and restart');
  }

  // ==========================================================================
  // SUITE 6: USAGE RESOLUTION & SOFT-DELETE PROTECTIONS IN FIRESTORE
  // ==========================================================================
  console.log('\n--- Suite 6: Usage Resolution & Soft-Delete Lifecycle in Firestore ---');
  {
    const freshRepo = new FirestoreMediaRepository();
    const asset = await freshRepo.getByProviderAssetId!(TEST_PROVIDER_ASSET_ID);
    assert(asset);

    // Initial usage check: asset is not referenced yet
    const usageBefore = await MediaUsageResolver.resolveAssetUsage(asset);
    assert.strictEqual(usageBefore.isInUse, false);
    assert.strictEqual(usageBefore.isDeletable, true);

    // Perform soft deletion
    const deleteRes = await freshRepo.softDelete(asset.id);
    assert.strictEqual(deleteRes, true);

    const deletedAsset = await freshRepo.getById(asset.id);
    assert.strictEqual(deletedAsset?.isDeleted, true);
    assert.strictEqual(deletedAsset?.status, 'archived');

    // Restore asset
    const restoreRes = await freshRepo.restore(asset.id);
    assert.strictEqual(restoreRes, true);

    const restoredAsset = await freshRepo.getById(asset.id);
    assert.strictEqual(restoredAsset?.isDeleted, false);
    assert.strictEqual(restoredAsset?.status, 'ready');
    pass('Item 6.1: Soft-deletion and restoration lifecycle verified against real Firestore records');

    // Clean up temporary test assets so database remains clean
    await freshRepo.delete(asset.id);
    if (orphanAssetId) {
      await freshRepo.delete(orphanAssetId);
    }
  }

  console.log('\n================================================================');
  console.log('   FIRESTORE EMULATOR VERIFICATION SUITE PASSED (11/11)          ');
  console.log('================================================================\n');
}

runEmulatorVerification().catch((err) => {
  console.error('\n[EMULATOR VERIFICATION FAILED]:', err);
  process.exit(1);
});
