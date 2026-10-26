'use server';

/**
 * PHILOZZ CMS — Site Sections & Homepage Content Server Actions
 * Phase 16D.3A: Homepage Sections Full Content Management
 *
 * Implements owner-only Draft -> Preview -> Publish and Rollback operations.
 * Gated by assertAdminSession(), input validation, and audit logging.
 */

import { revalidatePath } from 'next/cache';
import { assertAdminSession } from '@/lib/auth/requireAdminSession';
import { siteContentRepository, auditLogRepository } from '@/cms/repositories';
import { HomepageConfigEntity, BrandInfoEntity } from '@/cms/models/site';
import {
  validateHomepageConfig,
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
 * Helper to recursively sanitize strings inside config payloads
 */
function sanitizeConfigPayload<T>(input: T): T {
  if (typeof input === 'string') {
    return sanitizeRichText(input) as unknown as T;
  }
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeConfigPayload(item)) as unknown as T;
  }
  if (input !== null && typeof input === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(input)) {
      output[key] = sanitizeConfigPayload(val);
    }
    return output as T;
  }
  return input;
}

/**
 * Saves homepage section configuration as a private DRAFT.
 * Does NOT alter the public homepage.
 */
export async function saveSectionsDraftAction(
  payload: Partial<HomepageConfigEntity>,
  expectedVersion?: number
): Promise<ActionResponse<HomepageConfigEntity>> {
  const admin = await assertAdminSession();

  // Validate fields
  const validation = validateHomepageConfig(payload);
  if (!validation.valid) {
    return {
      success: false,
      error: 'Validation failed. Please correct the highlighted errors.',
      fieldErrors: validation.errors,
    };
  }

  // Check optimistic concurrency if expectedVersion provided
  const currentPublished = await siteContentRepository.getHomepageConfig();
  const currentDraft = await siteContentRepository.getHomepageConfigDraft();
  const activeBase = currentDraft || currentPublished;

  if (expectedVersion !== undefined && activeBase.version !== undefined && expectedVersion !== activeBase.version) {
    return {
      success: false,
      error: 'CONCURRENCY_CONFLICT: The section configuration was modified in another session. Please reload to review the latest changes.',
    };
  }

  const sanitized = sanitizeConfigPayload(payload);
  const updatedDraft = await siteContentRepository.saveHomepageConfigDraft(sanitized);

  await auditLogRepository.record({
    actorId: admin.uid,
    actorEmail: admin.email || 'owner@philozz.internal',
    action: 'update',
    entityType: 'site_content',
    entityId: 'homepage_config_draft',
    summary: `Saved homepage sections draft (v${updatedDraft.version || 1})`,
  });

  revalidatePath('/admin/sections');
  revalidatePath('/admin/sections/preview');

  return {
    success: true,
    data: updatedDraft,
  };
}

/**
 * Promotes current draft (or direct payload) to LIVE PUBLISHED status.
 * Backs up previous published configuration for instant rollback.
 */
export async function publishSectionsAction(
  payload?: Partial<HomepageConfigEntity>,
  expectedVersion?: number
): Promise<ActionResponse<HomepageConfigEntity>> {
  const admin = await assertAdminSession();

  if (payload) {
    const validation = validateHomepageConfig(payload);
    if (!validation.valid) {
      return {
        success: false,
        error: 'Validation failed. Please correct the highlighted errors.',
        fieldErrors: validation.errors,
      };
    }
  }

  const currentPublished = await siteContentRepository.getHomepageConfig();
  if (expectedVersion !== undefined && currentPublished.version !== undefined && expectedVersion !== currentPublished.version) {
    return {
      success: false,
      error: 'CONCURRENCY_CONFLICT: The published configuration has changed. Please refresh and review before publishing.',
    };
  }

  const sanitizedPayload = payload ? sanitizeConfigPayload(payload) : undefined;
  const published = await siteContentRepository.publishHomepageConfig(sanitizedPayload);

  await auditLogRepository.record({
    actorId: admin.uid,
    actorEmail: admin.email || 'owner@philozz.internal',
    action: 'publish',
    entityType: 'site_content',
    entityId: 'homepage_config',
    summary: `Published homepage section revisions to live website (v${published.version || 1})`,
  });

  revalidatePath('/');
  revalidatePath('/admin/sections');
  revalidatePath('/admin/sections/preview');

  return {
    success: true,
    data: published,
  };
}

/**
 * Rolls back the published configuration to the previous published revision.
 */
export async function rollbackSectionsAction(): Promise<ActionResponse<HomepageConfigEntity>> {
  const admin = await assertAdminSession();

  try {
    const restored = await siteContentRepository.rollbackHomepageConfig();

    await auditLogRepository.record({
      actorId: admin.uid,
      actorEmail: admin.email || 'owner@philozz.internal',
      action: 'update',
      entityType: 'site_content',
      entityId: 'homepage_config',
      summary: `Rolled back homepage sections to previous published configuration (v${restored.version || 1})`,
    });

    revalidatePath('/');
    revalidatePath('/admin/sections');
    revalidatePath('/admin/sections/preview');

    return {
      success: true,
      data: restored,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to rollback homepage sections.',
    };
  }
}

/**
 * Updates central brand information (name, email, domain, phone, location, CV).
 */
export async function updateBrandInfoAction(
  payload: Partial<BrandInfoEntity>
): Promise<ActionResponse<BrandInfoEntity>> {
  const admin = await assertAdminSession();

  const validation = validateBrandInfo(payload);
  if (!validation.valid) {
    return {
      success: false,
      error: 'Validation failed for brand information.',
      fieldErrors: validation.errors,
    };
  }

  const sanitized = sanitizeConfigPayload(payload);
  const updatedBrand = await siteContentRepository.updateBrandInfo(sanitized);

  await auditLogRepository.record({
    actorId: admin.uid,
    actorEmail: admin.email || 'owner@philozz.internal',
    action: 'update',
    entityType: 'site_content',
    entityId: 'brand_info',
    summary: 'Updated brand identity and contact destinations',
  });

  revalidatePath('/');
  revalidatePath('/admin/sections');

  return {
    success: true,
    data: updatedBrand,
  };
}
