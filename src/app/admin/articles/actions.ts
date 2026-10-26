'use server';

/**
 * PHILOZZ CMS — Blog Articles & Technical Writeups Server Mutations
 * Phase 16D.2: Blog & Technical Writeups Full CRUD
 *
 * Secure, server-only actions for all Article mutations.
 * Enforces verified owner session, input validation, optimistic concurrency,
 * homepage journal 4-card invariant, referential category integrity,
 * audit logging, and Next.js 16 cache invalidation.
 */

import { assertAdminSession } from '@/lib/auth/requireAdminSession';
import { articleRepository, auditLogRepository } from '@/cms/repositories';
import {
  ArticleEntity,
  CreateArticleInput,
  UpdateArticleInput,
  BlogCategoryEntity,
} from '@/cms/models/article';
import {
  validateArticle,
  generateSlug,
  validateSlug,
  calculateReadTime,
  sanitizeRichText,
} from '@/cms/validation/validators';
import { revalidateArticleCache } from '@/cms/cache/revalidate';

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
}

function formatDateHuman(d: Date = new Date()): string {
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Creates a new Article / Technical Writeup.
 */
export async function createArticleAction(
  input: CreateArticleInput
): Promise<ActionResult<ArticleEntity>> {
  try {
    const user = await assertAdminSession();

    // 1. Sanitize text fields
    const sanitizedSections = (input.sections || []).map((s) => ({
      heading: sanitizeRichText(s.heading),
      content: sanitizeRichText(s.content),
      codeSnippet: s.codeSnippet,
      codeLang: s.codeLang,
    }));

    const sanitizedPayload: CreateArticleInput = {
      ...input,
      title: sanitizeRichText(input.title),
      abstract: sanitizeRichText(input.abstract),
      sections: sanitizedSections,
      readTime: input.readTime || calculateReadTime(sanitizedSections),
      date: input.date || formatDateHuman(),
    };

    // 2. Validate input fields
    const validation = validateArticle(sanitizedPayload);
    if (!validation.valid) {
      return {
        success: false,
        error: 'Validation failed. Please correct the highlighted fields.',
        fieldErrors: validation.errors,
      };
    }

    // 3. Slug generation & uniqueness check
    let slug = input.slug?.trim() ? generateSlug(input.slug) : generateSlug(input.title);
    const slugCheck = validateSlug(slug);
    if (!slugCheck.valid) {
      return {
        success: false,
        error: slugCheck.error || 'Invalid slug format.',
        fieldErrors: { slug: slugCheck.error || 'Invalid slug.' },
      };
    }

    // Check collision
    const existing = await articleRepository.getBySlug(slug, { includeDeleted: true });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    // 4. Compute display order
    const allArticles = await articleRepository.getAll({ includeDeleted: true });
    const maxOrder = allArticles.reduce((max, a) => Math.max(max, a.displayOrder || 0), 0);
    const displayOrder = maxOrder + 1;

    // 5. Create in repository
    const now = new Date();
    const payload: CreateArticleInput = {
      ...sanitizedPayload,
      slug,
      displayOrder,
      featured: false, // New articles start unfeatured to protect 4-card invariant
      featuredOrder: undefined,
      status: input.status || 'draft',
      publishedAt: input.status === 'published' ? now.toISOString() : undefined,
    };

    const created = await articleRepository.create(payload);

    // 6. Audit Logging
    await auditLogRepository.record({
      actorId: user.uid,
      actorEmail: user.email || 'owner@philozz.internal',
      action: 'create',
      entityType: 'article',
      entityId: created.id,
      summary: `Created article "${created.title}" (slug: /notes/${created.slug}, status: ${created.status})`,
    });

    // 7. Invalidate Cache
    await revalidateArticleCache(created.slug);

    return { success: true, data: created };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create article.';
    return { success: false, error: msg };
  }
}

/**
 * Updates an existing Article & Sections with optimistic concurrency control.
 */
export async function updateArticleAction(
  id: string,
  input: UpdateArticleInput,
  expectedUpdatedAt?: string
): Promise<ActionResult<ArticleEntity>> {
  try {
    const user = await assertAdminSession();

    const current = await articleRepository.getById(id, { includeDeleted: true });
    if (!current) {
      return { success: false, error: `Article with ID "${id}" not found.` };
    }

    // 1. Optimistic Concurrency Check
    if (expectedUpdatedAt && current.updatedAt !== expectedUpdatedAt) {
      return {
        success: false,
        error:
          'Concurrency conflict: This article has been modified by another session. Please reload the editor before submitting changes to prevent silent overwrites.',
      };
    }

    // 2. Sanitize incoming fields
    const sanitizedSections = (input.sections || current.sections || []).map((s) => ({
      heading: sanitizeRichText(s.heading),
      content: sanitizeRichText(s.content),
      codeSnippet: s.codeSnippet,
      codeLang: s.codeLang,
    }));

    const sanitizedInput: UpdateArticleInput = {
      ...input,
      slug: current.slug, // Slugs are immutable on edit to preserve SEO integrity
      title: input.title !== undefined ? sanitizeRichText(input.title) : current.title,
      abstract: input.abstract !== undefined ? sanitizeRichText(input.abstract) : current.abstract,
      sections: sanitizedSections,
      readTime: input.readTime || calculateReadTime(sanitizedSections),
    };

    // 3. Validate changes
    const validation = validateArticle({ ...current, ...sanitizedInput });
    if (!validation.valid) {
      return {
        success: false,
        error: 'Validation failed. Please correct highlighted fields.',
        fieldErrors: validation.errors,
      };
    }

    // If transitioning to published for the first time
    if (input.status === 'published' && current.status !== 'published' && !current.publishedAt) {
      sanitizedInput.publishedAt = new Date().toISOString();
    }

    // 4. Update in repository
    const updated = await articleRepository.update(id, sanitizedInput);

    // 5. Audit Logging
    await auditLogRepository.record({
      actorId: user.uid,
      actorEmail: user.email || 'owner@philozz.internal',
      action: 'update',
      entityType: 'article',
      entityId: id,
      summary: `Updated article content for "${updated.title}"`,
    });

    // 6. Invalidate Cache
    await revalidateArticleCache(updated.slug);

    return { success: true, data: updated };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update article.';
    return { success: false, error: msg };
  }
}

/**
 * Publishes a draft article.
 */
export async function publishArticleAction(
  id: string
): Promise<ActionResult<ArticleEntity>> {
  try {
    const user = await assertAdminSession();

    const current = await articleRepository.getById(id, { includeDeleted: true });
    if (!current) {
      return { success: false, error: `Article with ID "${id}" not found.` };
    }

    if (current.isDeleted) {
      return { success: false, error: `Cannot publish deleted article "${current.title}". Restore it from Trash first.` };
    }

    const now = new Date().toISOString();
    const updated = await articleRepository.update(id, {
      status: 'published',
      publishedAt: current.publishedAt || now,
    });

    await auditLogRepository.record({
      actorId: user.uid,
      actorEmail: user.email || 'owner@philozz.internal',
      action: 'publish',
      entityType: 'article',
      entityId: id,
      summary: `Published article "${updated.title}"`,
    });

    await revalidateArticleCache(updated.slug);
    return { success: true, data: updated };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to publish article.';
    return { success: false, error: msg };
  }
}

/**
 * Unpublishes a published article (moves to draft).
 */
export async function unpublishArticleAction(
  id: string
): Promise<ActionResult<ArticleEntity>> {
  try {
    const user = await assertAdminSession();

    const current = await articleRepository.getById(id, { includeDeleted: true });
    if (!current) {
      return { success: false, error: `Article with ID "${id}" not found.` };
    }

    // Protect 4-article homepage invariant
    if (current.featured) {
      return {
        success: false,
        error: `Cannot unpublish "${current.title}" because it is currently assigned to a Homepage Engineering Journal slot (#${current.featuredOrder || 1}). Reassign the slot first in Homepage Journal Manager.`,
      };
    }

    const updated = await articleRepository.update(id, {
      status: 'draft',
    });

    await auditLogRepository.record({
      actorId: user.uid,
      actorEmail: user.email || 'owner@philozz.internal',
      action: 'unpublish',
      entityType: 'article',
      entityId: id,
      summary: `Unpublished article "${updated.title}" (moved to draft)`,
    });

    await revalidateArticleCache(updated.slug);
    return { success: true, data: updated };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to unpublish article.';
    return { success: false, error: msg };
  }
}

/**
 * Soft-deletes an article (moves to Trash).
 */
export async function softDeleteArticleAction(
  id: string
): Promise<ActionResult<boolean>> {
  try {
    const user = await assertAdminSession();

    const current = await articleRepository.getById(id, { includeDeleted: true });
    if (!current) {
      return { success: false, error: `Article with ID "${id}" not found.` };
    }

    // Protect 4-article homepage invariant
    if (current.featured) {
      return {
        success: false,
        error: `Cannot delete "${current.title}" because it is currently assigned to a Homepage Engineering Journal slot (#${current.featuredOrder || 1}). Reassign the slot first in Homepage Journal Manager.`,
      };
    }

    await articleRepository.softDelete(id);

    await auditLogRepository.record({
      actorId: user.uid,
      actorEmail: user.email || 'owner@philozz.internal',
      action: 'delete',
      entityType: 'article',
      entityId: id,
      summary: `Moved article "${current.title}" to Trash (soft-delete)`,
    });

    await revalidateArticleCache(current.slug);
    return { success: true, data: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete article.';
    return { success: false, error: msg };
  }
}

/**
 * Restores a soft-deleted article from Trash.
 */
export async function restoreArticleAction(
  id: string
): Promise<ActionResult<boolean>> {
  try {
    const user = await assertAdminSession();

    const current = await articleRepository.getById(id, { includeDeleted: true });
    if (!current) {
      return { success: false, error: `Article with ID "${id}" not found.` };
    }

    await articleRepository.restore(id);

    await auditLogRepository.record({
      actorId: user.uid,
      actorEmail: user.email || 'owner@philozz.internal',
      action: 'update',
      entityType: 'article',
      entityId: id,
      summary: `Restored article "${current.title}" from Trash`,
    });

    await revalidateArticleCache(current.slug);
    return { success: true, data: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to restore article.';
    return { success: false, error: msg };
  }
}

/**
 * Reorders archive articles.
 */
export async function reorderArticlesAction(
  orderedIds: string[]
): Promise<ActionResult<boolean>> {
  try {
    const user = await assertAdminSession();

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return { success: false, error: 'Invalid ordered ID list.' };
    }

    await articleRepository.reorder(orderedIds);

    await auditLogRepository.record({
      actorId: user.uid,
      actorEmail: user.email || 'owner@philozz.internal',
      action: 'reorder',
      entityType: 'article',
      entityId: 'articles_archive',
      summary: `Reordered ${orderedIds.length} articles in blog archive`,
    });

    await revalidateArticleCache();
    return { success: true, data: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to reorder articles.';
    return { success: false, error: msg };
  }
}

/**
 * Atomically updates the 4 Homepage Engineering Journal Slots.
 * Enforces the strict invariant:
 * - Exactly 4 unique published non-deleted articles.
 * - Slot 1: Primary Featured Article.
 * - Slots 2, 3, 4: Supporting Articles.
 */
export async function updateHomepageJournalSlotsAction(
  slots: [string, string, string, string]
): Promise<ActionResult<boolean>> {
  try {
    const user = await assertAdminSession();

    if (!Array.isArray(slots) || slots.length !== 4) {
      return {
        success: false,
        error: 'Homepage Engineering Journal selection must specify exactly 4 articles (1 primary + 3 supporting).',
      };
    }

    const uniqueIds = Array.from(new Set(slots));
    if (uniqueIds.length !== 4) {
      return {
        success: false,
        error: 'Each of the 4 journal slots must contain a different published article.',
      };
    }

    await articleRepository.setHomepageJournalSlots(slots);

    await auditLogRepository.record({
      actorId: user.uid,
      actorEmail: user.email || 'owner@philozz.internal',
      action: 'update',
      entityType: 'article',
      entityId: 'homepage_journal_slots',
      summary: `Updated Homepage 4-slot journal articles to: [${slots.join(', ')}]`,
    });

    await revalidateArticleCache();
    return { success: true, data: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update homepage journal slots.';
    return { success: false, error: msg };
  }
}

// ==============================================================================
// Category Management Server Actions
// ==============================================================================

/**
 * Creates a new taxonomy category.
 */
export async function createCategoryAction(
  input: BlogCategoryEntity
): Promise<ActionResult<BlogCategoryEntity>> {
  try {
    const user = await assertAdminSession();

    if (!input.id || input.id.trim().length < 2) {
      return { success: false, error: 'Category ID is required and must be at least 2 characters.' };
    }
    if (!input.label || input.label.trim().length < 2) {
      return { success: false, error: 'Category label is required.' };
    }

    const cleanId = generateSlug(input.id);
    const categoryPayload: BlogCategoryEntity = {
      id: cleanId,
      label: sanitizeRichText(input.label),
      displayOrder: input.displayOrder || 1,
      description: input.description ? sanitizeRichText(input.description) : undefined,
    };

    const created = await articleRepository.createCategory(categoryPayload);

    await auditLogRepository.record({
      actorId: user.uid,
      actorEmail: user.email || 'owner@philozz.internal',
      action: 'create',
      entityType: 'category',
      entityId: created.id,
      summary: `Created blog category "${created.label}" (${created.id})`,
    });

    await revalidateArticleCache();
    return { success: true, data: created };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create category.';
    return { success: false, error: msg };
  }
}

/**
 * Updates an existing category.
 */
export async function updateCategoryAction(
  id: string,
  input: Partial<BlogCategoryEntity>
): Promise<ActionResult<BlogCategoryEntity>> {
  try {
    const user = await assertAdminSession();

    const patch: Partial<BlogCategoryEntity> = {};
    if (input.label !== undefined) patch.label = sanitizeRichText(input.label);
    if (input.displayOrder !== undefined) patch.displayOrder = input.displayOrder;
    if (input.description !== undefined) patch.description = sanitizeRichText(input.description);

    const updated = await articleRepository.updateCategory(id, patch);

    await auditLogRepository.record({
      actorId: user.uid,
      actorEmail: user.email || 'owner@philozz.internal',
      action: 'update',
      entityType: 'category',
      entityId: id,
      summary: `Updated blog category "${updated.label}"`,
    });

    await revalidateArticleCache();
    return { success: true, data: updated };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update category.';
    return { success: false, error: msg };
  }
}

/**
 * Deletes a category with referential integrity protection.
 */
export async function deleteCategoryAction(
  id: string
): Promise<ActionResult<boolean>> {
  try {
    const user = await assertAdminSession();

    await articleRepository.deleteCategory(id);

    await auditLogRepository.record({
      actorId: user.uid,
      actorEmail: user.email || 'owner@philozz.internal',
      action: 'delete',
      entityType: 'category',
      entityId: id,
      summary: `Deleted blog category ID "${id}"`,
    });

    await revalidateArticleCache();
    return { success: true, data: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete category.';
    return { success: false, error: msg };
  }
}
