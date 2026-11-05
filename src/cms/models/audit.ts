/**
 * PHILOZZ CMS — Audit Log Domain Models
 * Phase 16A: Dynamic CMS Architecture & Data Foundation
 */

export type AuditActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'publish'
  | 'unpublish'
  | 'reorder'
  | 'upload';

export type AuditEntityType =
  | 'project'
  | 'article'
  | 'technology'
  | 'site_content'
  | 'media'
  | 'category';

export interface AuditFieldDiff {
  before: unknown;
  after: unknown;
}

export interface AuditLogEntity {
  id: string;
  actorId: string;
  actorEmail: string;
  action: AuditActionType;
  entityType: AuditEntityType;
  entityId: string;
  summary: string;
  diff?: Record<string, AuditFieldDiff>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string; // ISO 8601
}

export type CreateAuditLogInput = Omit<AuditLogEntity, 'id' | 'timestamp'>;
