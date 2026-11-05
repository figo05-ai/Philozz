/**
 * PHILOZZ CMS — Local Audit Log Repository Implementation
 * Phase 16A: Dynamic CMS Architecture & Data Foundation
 */

import {
  AuditLogEntity,
  CreateAuditLogInput,
} from '../../models/audit';
import { IAuditLogRepository } from '../types';

export class LocalAuditLogRepository implements IAuditLogRepository {
  private logs: AuditLogEntity[] = [];

  async record(input: CreateAuditLogInput): Promise<AuditLogEntity> {
    const entry: AuditLogEntity = {
      ...input,
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.logs.unshift(entry);
    return { ...entry };
  }

  async getRecent(limit: number = 50): Promise<AuditLogEntity[]> {
    return this.logs.slice(0, limit).map((l) => ({ ...l }));
  }

  async getByEntity(entityType: string, entityId: string): Promise<AuditLogEntity[]> {
    return this.logs
      .filter((l) => l.entityType === entityType && l.entityId === entityId)
      .map((l) => ({ ...l }));
  }
}
