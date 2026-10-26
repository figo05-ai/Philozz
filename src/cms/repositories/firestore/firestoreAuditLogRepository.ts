import 'server-only';

/**
 * PHILOZZ CMS — Firestore Audit Log Repository Implementation
 * Phase 16D.0: Firestore Foundation & Safe Content Migration
 *
 * Real server-only Firestore adapter implementing IAuditLogRepository.
 * Manages tamper-evident, append-only operational audit records.
 */

import { getFirebaseFirestore } from '@/lib/auth/firebaseAdmin';
import {
  AuditLogEntity,
  CreateAuditLogInput,
} from '../../models/audit';
import { IAuditLogRepository } from '../types';
import { FIRESTORE_COLLECTIONS } from './firestoreContracts';

export class FirestoreAuditLogRepository implements IAuditLogRepository {
  private get collection() {
    return getFirebaseFirestore().collection(FIRESTORE_COLLECTIONS.AUDIT_LOGS);
  }

  async record(input: CreateAuditLogInput): Promise<AuditLogEntity> {
    const timestamp = new Date().toISOString();
    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const entry: AuditLogEntity = {
      ...input,
      id,
      timestamp,
    };

    await this.collection.doc(id).set(entry);
    return entry;
  }

  async getRecent(limit: number = 50): Promise<AuditLogEntity[]> {
    const snapshot = await this.collection
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: (data.id as string) || doc.id,
        actorId: (data.actorId as string) || '',
        actorEmail: (data.actorEmail as string) || '',
        action: data.action as AuditLogEntity['action'],
        entityType: data.entityType as AuditLogEntity['entityType'],
        entityId: (data.entityId as string) || '',
        summary: (data.summary as string) || '',
        diff: data.diff as AuditLogEntity['diff'],
        ipAddress: (data.ipAddress as string) || undefined,
        userAgent: (data.userAgent as string) || undefined,
        timestamp: (data.timestamp as string) || new Date().toISOString(),
      };
    });
  }

  async getByEntity(
    entityType: string,
    entityId: string
  ): Promise<AuditLogEntity[]> {
    const snapshot = await this.collection
      .where('entityType', '==', entityType)
      .where('entityId', '==', entityId)
      .get();

    const logs = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: (data.id as string) || doc.id,
        actorId: (data.actorId as string) || '',
        actorEmail: (data.actorEmail as string) || '',
        action: data.action as AuditLogEntity['action'],
        entityType: data.entityType as AuditLogEntity['entityType'],
        entityId: (data.entityId as string) || '',
        summary: (data.summary as string) || '',
        diff: data.diff as AuditLogEntity['diff'],
        ipAddress: (data.ipAddress as string) || undefined,
        userAgent: (data.userAgent as string) || undefined,
        timestamp: (data.timestamp as string) || new Date().toISOString(),
      };
    });

    return logs.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
}
