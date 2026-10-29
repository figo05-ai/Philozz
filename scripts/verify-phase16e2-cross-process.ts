/**
 * PHILOZZ CMS — Phase 16E.2.1: Cross-Process Integration & Distributed State Verification Suite
 *
 * Proves distributed correctness using TWO independent Node.js processes against the Firestore Emulator:
 * 1. Process A creates an upload intent.
 * 2. Process B retrieves and validates it.
 * 3. Process B completes registration.
 * 4. Process A observes the consumed state.
 * 5. Concurrent registrations produce exactly one asset.
 * 6. A duplicate retry is safe.
 * 7. A failed transaction leaves registration recoverable.
 * 8. An expired intent is rejected.
 * 9. Wrong-owner access is rejected.
 * 10. Invalid asset association is rejected.
 * 11. Rate limits apply across separate processes.
 * 12. Restarting the application does not lose active intents.
 */

import './register-server-only.cjs';
import assert from 'assert';
import path from 'path';
import { fork, ChildProcess } from 'child_process';
import {
  registerUploadIntent,
  getUploadIntent,
  checkUploadRateLimit,
  _resetIntentStoreForTesting,
  UploadIntent,
} from '../src/cms/media/mediaUploadIntent';
import { FirestoreMediaRepository } from '../src/cms/repositories';
import { MediaAssetEntity, MediaFolder } from '../src/cms/models/media';
import { getFirebaseFirestore } from '../src/lib/auth/firebaseAdmin';
import { FIRESTORE_COLLECTIONS } from '../src/cms/repositories/firestore/firestoreContracts';

function pass(msg: string) {
  console.log(`  [PASS] ${msg}`);
}

interface WorkerResponse {
  id: number;
  success: boolean;
  pid?: number;
  intent?: UploadIntent | null;
  result?: { isNew: boolean; asset: MediaAssetEntity; allowed?: boolean; remaining?: number; resetSeconds?: number };
  error?: string;
  [key: string]: unknown;
}

class RemoteWorkerClient {
  private child: ChildProcess;
  private messageId = 0;
  private callbacks = new Map<number, (res: WorkerResponse) => void>();

  constructor(child: ChildProcess) {
    this.child = child;
    this.child.on('message', (msg: WorkerResponse) => {
      const cb = this.callbacks.get(msg.id);
      if (cb) {
        this.callbacks.delete(msg.id);
        cb(msg);
      }
    });
  }

  get pid(): number | undefined {
    return this.child.pid;
  }

  async send(action: string, payload: Record<string, unknown> = {}): Promise<WorkerResponse> {
    const id = ++this.messageId;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, (res) => resolve(res));
      this.child.send({ id, action, payload }, (err) => {
        if (err) reject(err);
      });
    });
  }

  kill(): void {
    this.child.kill();
  }
}

function spawnWorker(): RemoteWorkerClient {
  const workerPath = path.resolve(__dirname, 'cross-process-worker.ts');
  const child = fork(workerPath, [], {
    env: {
      ...process.env,
      TS_NODE_PROJECT: path.resolve(__dirname, '../tsconfig.json'),
    },
    execArgv: process.execArgv.filter((arg) => !arg.startsWith('--eval') && arg !== '-e'),
  });
  return new RemoteWorkerClient(child);
}

async function runCrossProcessSuite() {
  console.log('================================================================');
  console.log('   PHILOZZ — PHASE 16E.2.1: CROSS-PROCESS DISTRIBUTED AUDIT    ');
  console.log('================================================================\n');

  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
  assert(emulatorHost, 'FIRESTORE_EMULATOR_HOST must be set for cross-process distributed testing.');
  console.log(`Shared Datastore: FIRESTORE EMULATOR (${emulatorHost})`);
  console.log(`Process A (Orchestrator) PID: ${process.pid}`);

  const worker = spawnWorker();
  const pingRes = await worker.send('ping');
  assert.strictEqual(pingRes.success, true);
  console.log(`Process B (Independent Worker) PID: ${worker.pid}`);
  assert.notStrictEqual(process.pid, worker.pid, 'Process A and Process B must have different PIDs');
  console.log('Process memory heaps are 100% physically isolated.\n');

  const mediaRepoA = new FirestoreMediaRepository();
  const firestore = getFirebaseFirestore();
  const TEST_OWNER_UID = 'owner_cross_process_verified';

  await _resetIntentStoreForTesting();

  // ==========================================================================
  // ITEM 1 & 2: INTENT CREATED IN PROCESS A, RETRIEVED IN PROCESS B
  // ==========================================================================
  console.log('--- Test Group 1: Cross-Process Intent Persistence & Visibility ---');
  const token1 = `ik_cross_intent_${Date.now()}_1`;
  const intent1 = await registerUploadIntent({
    token: token1,
    ownerUid: TEST_OWNER_UID,
    provider: 'imagekit',
    filename: 'distributed-hero.png',
    folder: 'projects',
    mimeType: 'image/png',
    sizeBytes: 120000,
  });
  assert.strictEqual(intent1.token, token1);
  pass('Item 1: Process A created upload intent in Firestore');

  // Process B retrieves from Firestore
  const workerGetRes = await worker.send('get_intent', { token: token1 });
  assert.strictEqual(workerGetRes.success, true);
  assert(workerGetRes.intent, 'Process B must retrieve intent from shared Firestore');
  assert.strictEqual(workerGetRes.intent.token, token1);
  assert.strictEqual(workerGetRes.intent.filename, 'distributed-hero.png');
  assert.strictEqual(workerGetRes.intent.folder, 'projects');
  assert.strictEqual(workerGetRes.intent.consumed, false);
  pass('Item 2: Process B retrieved and validated intent from shared store');

  // ==========================================================================
  // ITEM 3 & 4: REGISTRATION IN PROCESS B, OBSERVED IN PROCESS A
  // ==========================================================================
  console.log('\n--- Test Group 2: Cross-Process Atomic Registration & State Observation ---');
  const providerAssetId1 = `ik_file_asset_${Date.now()}_alpha`;
  const assetPayload1: Omit<MediaAssetEntity, 'id' | 'createdAt' | 'updatedAt'> = {
    filename: 'distributed-hero.png',
    originalName: 'distributed-hero.png',
    mimeType: 'image/png',
    sizeBytes: 120000,
    dimensions: { width: 1200, height: 800 },
    url: `https://ik.imagekit.io/philozz/projects/distributed-hero.png`,
    provider: 'imagekit',
    providerAssetId: providerAssetId1,
    altText: 'Distributed Architecture Asset',
    folder: 'projects',
    tags: ['distributed', 'cross-process'],
    uploadedBy: TEST_OWNER_UID,
    status: 'ready',
  };

  // Process B performs atomic registration
  const workerRegRes = await worker.send('create_idempotent', {
    asset: assetPayload1,
    options: { intentToken: token1, ownerUid: TEST_OWNER_UID },
  });
  assert.strictEqual(workerRegRes.success, true);
  assert(workerRegRes.result);
  assert.strictEqual(workerRegRes.result.isNew, true);
  pass('Item 3: Process B completed atomic registration and intent consumption');

  // Process A queries Firestore to observe consumed state
  const intentInA = await getUploadIntent(token1);
  assert(intentInA, 'Intent must exist');
  assert.strictEqual(intentInA.consumed, true, 'Process A must observe consumed === true');
  assert.strictEqual(intentInA.providerAssetId, providerAssetId1);
  pass('Item 4: Process A observed consumed state updated by Process B');

  // ==========================================================================
  // ITEM 5: CONCURRENT REGISTRATIONS ACROSS BOTH PROCESSES
  // ==========================================================================
  console.log('\n--- Test Group 3: Inter-Process Concurrency & Duplicate Prevention ---');
  const sharedAssetId = `ik_concurrent_${Date.now()}_xyz`;
  const concurrentAssetPayload: Omit<MediaAssetEntity, 'id' | 'createdAt' | 'updatedAt'> = {
    filename: 'concurrent-test.webp',
    originalName: 'concurrent-test.webp',
    mimeType: 'image/webp',
    sizeBytes: 50000,
    url: `https://ik.imagekit.io/philozz/photos/concurrent-test.webp`,
    provider: 'imagekit',
    providerAssetId: sharedAssetId,
    altText: 'Concurrent Test Image',
    folder: 'photos',
    tags: ['concurrency'],
    uploadedBy: TEST_OWNER_UID,
    status: 'ready',
  };

  // Firing simultaneously from Process A and Process B
  const [resFromA, resFromB] = await Promise.all([
    mediaRepoA.createIdempotent(concurrentAssetPayload),
    worker.send('create_idempotent', { asset: concurrentAssetPayload }),
  ]);

  assert(resFromB.result);
  const results = [resFromA.isNew, resFromB.result.isNew];
  const newCount = results.filter((isNew) => isNew === true).length;
  const existingCount = results.filter((isNew) => isNew === false).length;

  assert.strictEqual(newCount, 1, 'Exactly one process must create the document (isNew === true)');
  assert.strictEqual(existingCount, 1, 'The competing process must receive isNew === false');

  // Verify only 1 document in Firestore
  const docsSnap = await firestore
    .collection(FIRESTORE_COLLECTIONS.MEDIA)
    .where('providerAssetId', '==', sharedAssetId)
    .get();
  assert.strictEqual(docsSnap.size, 1, 'Exactly 1 document must exist in Firestore');
  pass('Item 5: Concurrent cross-process registrations produce exactly one asset record');

  // ==========================================================================
  // ITEM 6: DUPLICATE RETRY IS SAFE
  // ==========================================================================
  console.log('\n--- Test Group 4: Safe Retries & Transaction Recovery ---');
  const retryRes = await worker.send('create_idempotent', {
    asset: assetPayload1,
    options: { intentToken: token1, ownerUid: TEST_OWNER_UID },
  });
  assert.strictEqual(retryRes.success, true);
  assert(retryRes.result);
  assert.strictEqual(retryRes.result.isNew, false, 'Retry must return existing asset with isNew === false');
  assert.strictEqual(retryRes.result.asset.providerAssetId, providerAssetId1);
  pass('Item 6: Duplicate retry with matching intent and providerAssetId returns existing asset safely');

  // ==========================================================================
  // ITEM 7: FAILED TRANSACTION LEAVES REGISTRATION RECOVERABLE
  // ==========================================================================
  const tokenRecoverable = `ik_recoverable_${Date.now()}`;
  await registerUploadIntent({
    token: tokenRecoverable,
    ownerUid: TEST_OWNER_UID,
    provider: 'imagekit',
    filename: 'recoverable.png',
    folder: 'brand',
    mimeType: 'image/png',
    sizeBytes: 80000,
  });

  // Intentional failure by passing mismatched folder
  try {
    await mediaRepoA.createIdempotent(
      {
        ...assetPayload1,
        folder: 'articles' as MediaFolder, // Mismatch with intent folder 'brand'
      },
      { intentToken: tokenRecoverable, ownerUid: TEST_OWNER_UID }
    );
    assert.fail('Should have failed due to folder mismatch');
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    assert(errorMsg.includes('folder'), 'Error must report folder mismatch');
  }

  // Confirm intent in Firestore was NOT consumed by the aborted transaction
  const intentCheck = await getUploadIntent(tokenRecoverable);
  assert(intentCheck, 'Intent must still exist');
  assert.strictEqual(intentCheck.consumed, false, 'Intent must remain unconsumed after transaction abort');

  // Process B can now successfully register with correct folder
  const successRecovery = await worker.send('create_idempotent', {
    asset: {
      ...assetPayload1,
      filename: 'recoverable.png',
      folder: 'brand',
      providerAssetId: `ik_recovered_${Date.now()}`,
    },
    options: { intentToken: tokenRecoverable, ownerUid: TEST_OWNER_UID },
  });
  assert.strictEqual(successRecovery.success, true);
  assert(successRecovery.result);
  assert.strictEqual(successRecovery.result.isNew, true);
  pass('Item 7: Failed transaction rolls back atomically, leaving intent recoverable for subsequent retry');

  // ==========================================================================
  // ITEM 8, 9, 10: SECURITY BOUNDARIES (EXPIRATION, OWNER, REPLAY)
  // ==========================================================================
  console.log('\n--- Test Group 5: Security Invariants & Replay Defense ---');

  // Item 8: Expired intent
  const expiredToken = `ik_expired_${Date.now()}`;
  const expiredDocRef = firestore
    .collection(FIRESTORE_COLLECTIONS.UPLOAD_INTENTS)
    .doc(`intent_${expiredToken}`);
  await expiredDocRef.set({
    token: expiredToken,
    ownerUid: TEST_OWNER_UID,
    filename: 'old.png',
    folder: 'general',
    mimeType: 'image/png',
    sizeBytes: 1000,
    createdAt: Date.now() - 20 * 60 * 1000,
    expiresAt: Date.now() - 5 * 60 * 1000, // Expired 5 min ago
    consumed: false,
  });

  const expiredCheck = await getUploadIntent(expiredToken);
  assert.strictEqual(expiredCheck, null, 'getUploadIntent must return null for expired token');

  const workerExpiredRes = await worker.send('create_idempotent', {
    asset: { ...assetPayload1, folder: 'general' },
    options: { intentToken: expiredToken, ownerUid: TEST_OWNER_UID },
  });
  assert.strictEqual(workerExpiredRes.success, false);
  assert(workerExpiredRes.error);
  assert(workerExpiredRes.error.includes('expired'));
  pass('Item 8: Expired upload intent rejected explicitly in application logic');

  // Item 9: Wrong owner
  const tokenWrongOwner = `ik_owner_mismatch_${Date.now()}`;
  await registerUploadIntent({
    token: tokenWrongOwner,
    ownerUid: 'legitimate_owner_uid',
    filename: 'secret.png',
    folder: 'general',
    mimeType: 'image/png',
    sizeBytes: 1000,
  });

  const workerWrongOwnerRes = await worker.send('create_idempotent', {
    asset: { ...assetPayload1, folder: 'general' },
    options: { intentToken: tokenWrongOwner, ownerUid: 'imposter_attacker_uid' },
  });
  assert.strictEqual(workerWrongOwnerRes.success, false);
  assert(workerWrongOwnerRes.error);
  assert(workerWrongOwnerRes.error.includes('owner mismatch'));
  pass('Item 9: Registration attempt with wrong owner UID rejected');

  // Item 10: Replay on different asset
  const workerReplayRes = await worker.send('create_idempotent', {
    asset: {
      ...assetPayload1,
      providerAssetId: 'completely_different_forged_asset_id',
    },
    options: { intentToken: token1, ownerUid: TEST_OWNER_UID },
  });
  assert.strictEqual(workerReplayRes.success, false);
  assert(workerReplayRes.error);
  assert(workerReplayRes.error.includes('already been consumed (replay rejected)'));
  pass('Item 10: Replay attack attempting to associate consumed intent with different asset rejected');

  // ==========================================================================
  // ITEM 11: DISTRIBUTED RATE LIMITING ACROSS INDEPENDENT PROCESSES
  // ==========================================================================
  console.log('\n--- Test Group 6: Distributed Cross-Process Rate Limiting ---');
  const rateActorId = `actor_dist_limit_${Date.now()}`;

  // Process A makes 15 calls
  for (let i = 0; i < 15; i++) {
    const resA = await checkUploadRateLimit(rateActorId);
    assert.strictEqual(resA.allowed, true);
  }

  // Process B makes 15 calls on the same actor
  for (let i = 0; i < 15; i++) {
    const resB = await worker.send('check_rate_limit', { actorId: rateActorId });
    assert.strictEqual(resB.success, true);
    assert(resB.result);
    assert.strictEqual(resB.result.allowed, true);
  }

  // 31st call from Process A must be rejected
  const limitHitA = await checkUploadRateLimit(rateActorId);
  assert.strictEqual(limitHitA.allowed, false, 'Process A must see rate limit exceeded');
  assert.strictEqual(limitHitA.remaining, 0);

  // 32nd call from Process B must also be rejected
  const limitHitB = await worker.send('check_rate_limit', { actorId: rateActorId });
  assert.strictEqual(limitHitB.success, true);
  assert(limitHitB.result);
  assert.strictEqual(limitHitB.result.allowed, false, 'Process B must see rate limit exceeded');
  pass('Item 11: Rate limits apply cumulatively across independent serverless worker processes');

  // ==========================================================================
  // ITEM 12: APPLICATION RESTART SURVIVAL
  // ==========================================================================
  console.log('\n--- Test Group 7: Process Termination & State Durability ---');
  const restartToken = `ik_restart_token_${Date.now()}`;
  await registerUploadIntent({
    token: restartToken,
    ownerUid: TEST_OWNER_UID,
    filename: 'durable-after-restart.png',
    folder: 'photos',
    mimeType: 'image/png',
    sizeBytes: 250000,
  });

  // Kill Process B completely
  console.log(`Terminating Process B (PID: ${worker.pid})...`);
  worker.kill();

  // Spawn fresh Process C
  console.log('Spawning fresh Process C to simulate new Vercel Function instance...');
  const workerC = spawnWorker();
  const pingC = await workerC.send('ping');
  assert.strictEqual(pingC.success, true);
  console.log(`Process C PID: ${workerC.pid}`);

  // Process C reads intent and completes registration
  const getC = await workerC.send('get_intent', { token: restartToken });
  assert.strictEqual(getC.success, true);
  assert(getC.intent);
  assert.strictEqual(getC.intent.filename, 'durable-after-restart.png');

  const regC = await workerC.send('create_idempotent', {
    asset: {
      ...assetPayload1,
      filename: 'durable-after-restart.png',
      folder: 'photos',
      providerAssetId: `ik_durable_asset_${Date.now()}`,
    },
    options: { intentToken: restartToken, ownerUid: TEST_OWNER_UID },
  });
  assert.strictEqual(regC.success, true);
  assert(regC.result);
  assert.strictEqual(regC.result.isNew, true);

  workerC.kill();
  pass('Item 12: Upload intents and registration survive process termination and restarts');

  console.log('\n================================================================');
  console.log('   ALL PHASE 16E.2.1 CROSS-PROCESS AUDIT TESTS PASSED (12/12)   ');
  console.log('================================================================');
}

runCrossProcessSuite().catch((err) => {
  console.error('\n[CROSS-PROCESS AUDIT FAILED]:', err);
  process.exit(1);
});
