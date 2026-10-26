'use server';

/**
 * PHILOZZ CMS — Global Site Settings & Brand Configuration Server Actions
 * Phase 16D.4B: Complete Safe Site Configuration Without Exposing Security Controls
 *
 * Implements owner-only Draft -> Preview -> Publish and Rollback operations.
 * Strictly gated by assertAdminSession(), allowlist verification, and audit logging.
 */

import { revalidatePath } from 'next/cache';
import { assertAdminSession } from '@/lib/auth/requireAdminSession';
import { siteContentRepository, auditLogRepository } from '@/cms/repositories';
import { BrandInfoEntity, SiteSettingsEntity } from '@/cms/models/site';
import {
  validateBrandInfo,
  sanitizeRichText,
} from '@/cms/validation/validators';

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
};

/**
 * Helper to recursively sanitize strings inside settings payloads
 */
function sanitizeSettingsPayload<T>(input: T): T {
  if (typeof input === 'string') {
    return sanitizeRichText(input) as unknown as T;
  }
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeSettingsPayload(item)) as unknown as T;
  }
  if (input !== null && typeof input === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(input)) {
      output[key] = sanitizeSettingsPayload(val);
    }
    return output as T;
  }
  return input;
}

/**
 * Saves global site settings as a private DRAFT.
 * Does NOT alter the public website.
 */
export async function saveSiteSettingsDraftAction(
  payload: Partial<BrandInfoEntity>,
  expectedVersion?: number
): Promise<ActionResponse<SiteSettingsEntity>> {
  const admin = await assertAdminSession();

  // Validate fields against schema and security allowlist
  const validation = validateBrandInfo(payload);
  if (!validation.valid) {
    return {
      success: false,
      error: 'Validation failed. Please correct the highlighted errors.',
      fieldErrors: validation.errors,
    };
  }

  // Check optimistic concurrency if expectedVersion provided
  const currentPublished = await siteContentRepository.getBrandInfo();
  const currentDraft = await siteContentRepository.getBrandInfoDraft();
  const activeBase = currentDraft || currentPublished;

  if (
    expectedVersion !== undefined &&
    activeBase.version !== undefined &&
    expectedVersion !== activeBase.version
  ) {
    return {
      success: false,
      error:
        'CONCURRENCY_CONFLICT: The site settings were modified in another session. Please reload to review the latest changes.',
    };
  }

  const sanitized = sanitizeSettingsPayload(payload);
  const updatedDraft = await siteContentRepository.saveBrandInfoDraft(sanitized);

  await auditLogRepository.record({
    actorId: admin.uid,
    actorEmail: admin.email || 'owner@philozz.internal',
    action: 'update',
    entityType: 'site_content',
    entityId: 'brand_info_draft',
    summary: 'Saved global site settings draft revision',
  });

  return {
    success: true,
    data: updatedDraft,
  };
}

/**
 * Publishes global site settings to the LIVE website.
 * Atomically promotes draft (or provided payload) to live status and clears draft.
 */
export async function publishSiteSettingsAction(
  payload?: Partial<BrandInfoEntity>,
  expectedVersion?: number
): Promise<ActionResponse<SiteSettingsEntity>> {
  const admin = await assertAdminSession();

  if (payload) {
    const validation = validateBrandInfo(payload);
    if (!validation.valid) {
      return {
        success: false,
        error: 'Validation failed. Cannot publish invalid settings.',
        fieldErrors: validation.errors,
      };
    }
  }

  const currentPublished = await siteContentRepository.getBrandInfo();
  if (
    expectedVersion !== undefined &&
    currentPublished.version !== undefined &&
    expectedVersion !== currentPublished.version
  ) {
    return {
      success: false,
      error:
        'CONCURRENCY_CONFLICT: The live site settings have been updated by another action. Please reload.',
    };
  }

  const sanitized = payload ? sanitizeSettingsPayload(payload) : undefined;
  const published = await siteContentRepository.publishBrandInfo(sanitized);

  await auditLogRepository.record({
    actorId: admin.uid,
    actorEmail: admin.email || 'owner@philozz.internal',
    action: 'publish',
    entityType: 'site_content',
    entityId: 'brand_info',
    summary: `Published global site settings revision (version ${published.version || 'latest'})`,
  });

  // Revalidate public consumers and admin views
  revalidatePath('/');
  revalidatePath('/admin/settings');
  revalidatePath('/admin/sections');
  revalidatePath('/admin/sections/preview');
  revalidatePath('/projects');
  revalidatePath('/blog');

  return {
    success: true,
    data: published,
  };
}

/**
 * Rolls back global site settings to the previous published state.
 */
export async function rollbackSiteSettingsAction(
  expectedVersion?: number
): Promise<ActionResponse<SiteSettingsEntity>> {
  const admin = await assertAdminSession();

  const currentPublished = await siteContentRepository.getBrandInfo();
  if (
    expectedVersion !== undefined &&
    currentPublished.version !== undefined &&
    expectedVersion !== currentPublished.version
  ) {
    return {
      success: false,
      error:
        'CONCURRENCY_CONFLICT: The live site settings have changed since your session started.',
    };
  }

  try {
    const rolledBack = await siteContentRepository.rollbackBrandInfo();

    await auditLogRepository.record({
      actorId: admin.uid,
      actorEmail: admin.email || 'owner@philozz.internal',
      action: 'update',
      entityType: 'site_content',
      entityId: 'brand_info',
      summary: `Rolled back global site settings to previous revision (now version ${rolledBack.version})`,
    });

    revalidatePath('/');
    revalidatePath('/admin/settings');
    revalidatePath('/admin/sections');
    revalidatePath('/admin/sections/preview');
    revalidatePath('/projects');
    revalidatePath('/blog');

    return {
      success: true,
      data: rolledBack,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to rollback site settings.',
    };
  }
}
