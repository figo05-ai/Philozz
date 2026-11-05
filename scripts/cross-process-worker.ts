/**
 * PHILOZZ CMS — Phase 16E.2.1: Cross-Process Integration Worker (Process B)
 *
 * Runs as an independent Node.js process with its own isolated memory space.
 * Communicates with Process A via Node.js IPC messages.
 */

import './register-server-only.cjs';
import {
  registerUploadIntent,
  getUploadIntent,
  consumeUploadIntent,
  checkUploadRateLimit,
} from '../src/cms/media/mediaUploadIntent';
import { FirestoreMediaRepository } from '../src/cms/repositories';

interface WorkerMessage {
  id: number;
  action: string;
  payload?: Record<string, unknown>;
}

const mediaRepo = new FirestoreMediaRepository();

process.on('message', async (msg: WorkerMessage) => {
  const { id, action, payload = {} } = msg;

  try {
    switch (action) {
      case 'ping': {
        process.send?.({ id, success: true, pid: process.pid });
        break;
      }

      case 'get_intent': {
        const intent = await getUploadIntent(payload.token as string);
        process.send?.({ id, success: true, intent, pid: process.pid });
        break;
      }

      case 'register_intent': {
        const intent = await registerUploadIntent(payload as Parameters<typeof registerUploadIntent>[0]);
        process.send?.({ id, success: true, intent, pid: process.pid });
        break;
      }

      case 'consume_intent': {
        const result = await consumeUploadIntent(
          payload.token as string,
          payload.ownerUid as string,
          payload.providerAssetId as string | undefined
        );
        process.send?.({ id, success: result.success, result, pid: process.pid });
        break;
      }

      case 'create_idempotent': {
        const result = await mediaRepo.createIdempotent!(
          payload.asset as Parameters<NonNullable<typeof mediaRepo.createIdempotent>>[0],
          payload.options as Parameters<NonNullable<typeof mediaRepo.createIdempotent>>[1]
        );
        process.send?.({ id, success: true, result, pid: process.pid });
        break;
      }

      case 'check_rate_limit': {
        const result = await checkUploadRateLimit(payload.actorId as string);
        process.send?.({ id, success: true, result, pid: process.pid });
        break;
      }

      default: {
        process.send?.({ id, success: false, error: `Unknown action: ${action}` });
      }
    }
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    process.send?.({ id, success: false, error, pid: process.pid });
  }
});
