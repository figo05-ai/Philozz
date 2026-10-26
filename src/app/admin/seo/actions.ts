'use server';

/**
 * PHILOZZ CMS — Technical SEO Management Server Actions
 * Phase 16D.4A: Complete SEO Management Studio
 *
 * Implements owner-only Draft -> Preview -> Publish and Rollback operations for SEO.
 * Strictly gated by assertAdminSession(), input validation, optimistic concurrency,
 * and audit logging.
 */

import { revalidatePath } from 'next/cache';
import { assertAdminSession } from '@/lib/auth/requireAdminSession';
import { siteContentRepository, auditLogRepository } from '@/cms/repositories';
import { SiteSeoConfigEntity } from '@/cms/models/site';
import { validateSeoConfig, sanitizeRichText } from '@/cms/validation/validators';

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
};

/**
 * Recursively sanitizes string properties inside SEO configuration payload.
 */
function sanitizeSeoPayload<T>(input: T): T {
  if (typeof input === 'string') {
    return sanitizeRichText(input.trim()) as unknown as T;
  }
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeSeoPayload(item)) as unknown as T;
  }
  if (input !== null && typeof input === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(input)) {
      output[key] = sanitizeSeoPayload(val);
    }
    return output as T;
  }
  return input;
}

/**
 * Saves SEO settings as an unpublished private DRAFT.
 * Public website metadata remains unaffected.
 */
export async function saveSeoConfigDraftAction(
  payload: Partial<SiteSeoConfigEntity>,
  expectedVersion?: number
): Promise<ActionResponse<SiteSeoConfigEntity>> {
  const admin = await assertAdminSession();

  // Validate payload
  const validation = validateSeoConfig(payload);
  if (!validation.valid) {
    return {
      success: false,
      error: 'Validation failed. Please correct the highlighted errors.',
      fieldErrors: validation.errors,
    };
  }

  // Optimistic concurrency check
  const currentPublished = await siteContentRepository.getSeoConfig();
  const currentDraft = await siteContentRepository.getSeoConfigDraft();
  const activeBase = currentDraft || currentPublished;

  if (
    expectedVersion !== undefined &&
    activeBase.version !== undefined &&
    expectedVersion !== activeBase.version
  ) {
    return {
      success: false,
      error:
        'CONCURRENCY_CONFLICT: The SEO configuration was modified in another session. Please reload to review the latest changes.',
    };
  }

  const sanitized = sanitizeSeoPayload(payload);
  const updatedDraft = await siteContentRepository.saveSeoConfigDraft(sanitized);

  await auditLogRepository.record({
    actorId: admin.uid,
    actorEmail: admin.email || 'owner@philozz.internal',
    action: 'update',
    entityType: 'site_content',
    entityId: 'seo_config_draft',
    summary: `Saved SEO configuration draft (v${updatedDraft.version || 1})`,
  });

  revalidatePath('/admin/seo');

  return {
    success: true,
    data: updatedDraft,
  };
}

/**
 * Publishes draft (or provided payload) directly to live public metadata.
 * Automatically invalidates layout metadata, archive pages, sitemap, and robots caches.
 */
export async function publishSeoConfigAction(
  payload?: Partial<SiteSeoConfigEntity>,
  expectedVersion?: number
): Promise<ActionResponse<SiteSeoConfigEntity>> {
  const admin = await assertAdminSession();

  if (payload) {
    const validation = validateSeoConfig(payload);
    if (!validation.valid) {
      return {
        success: false,
        error: 'Validation failed. Please correct the highlighted errors.',
        fieldErrors: validation.errors,
      };
    }
  }

  // Concurrency check
  const currentPublished = await siteContentRepository.getSeoConfig();
  const currentDraft = await siteContentRepository.getSeoConfigDraft();
  const activeBase = currentDraft || currentPublished;

  if (
    expectedVersion !== undefined &&
    activeBase.version !== undefined &&
    expectedVersion !== activeBase.version
  ) {
    return {
      success: false,
      error:
        'CONCURRENCY_CONFLICT: The SEO configuration was modified in another session. Please reload to review the latest changes.',
    };
  }

  const sanitized = payload ? sanitizeSeoPayload(payload) : undefined;
  const published = await siteContentRepository.publishSeoConfig(sanitized);

  await auditLogRepository.record({
    actorId: admin.uid,
    actorEmail: admin.email || 'owner@philozz.internal',
    action: 'publish',
    entityType: 'site_content',
    entityId: 'seo_config',
    summary: `Published SEO configuration (v${published.version || 1})`,
  });

  // Revalidate public metadata consumers and sitemap / robots routes
  revalidatePath('/', 'layout');
  revalidatePath('/');
  revalidatePath('/projects');
  revalidatePath('/blog');
  revalidatePath('/sitemap.xml');
  revalidatePath('/robots.txt');
  revalidatePath('/admin/seo');

  return {
    success: true,
    data: published,
  };
}

/**
 * Restores the previous published SEO configuration.
 */
export async function rollbackSeoConfigAction(): Promise<ActionResponse<SiteSeoConfigEntity>> {
  const admin = await assertAdminSession();

  try {
    const restored = await siteContentRepository.rollbackSeoConfig();

    await auditLogRepository.record({
      actorId: admin.uid,
      actorEmail: admin.email || 'owner@philozz.internal',
      action: 'update',
      entityType: 'site_content',
      entityId: 'seo_config',
      summary: `Rolled back SEO configuration to v${restored.version || 1}`,
    });

    // Invalidate public caches to reflect restored metadata
    revalidatePath('/', 'layout');
    revalidatePath('/');
    revalidatePath('/projects');
    revalidatePath('/blog');
    revalidatePath('/sitemap.xml');
    revalidatePath('/robots.txt');
    revalidatePath('/admin/seo');

    return {
      success: true,
      data: restored,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to rollback SEO configuration.';
    return {
      success: false,
      error: message,
    };
  }
}
