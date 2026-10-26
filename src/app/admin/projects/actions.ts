'use server';

/**
 * PHILOZZ CMS — Projects & Case Studies Server Mutations
 * Phase 16D.1: Projects & Case Studies Full CRUD
 *
 * Secure, server-only actions for all Project mutations.
 * Enforces verified owner session, input validation, audit logging,
 * and Next.js 16 cache invalidation.
 */

import { assertAdminSession } from '@/lib/auth/requireAdminSession';
import { projectRepository, auditLogRepository } from '@/cms/repositories';
import {
  ProjectEntity,
  CreateProjectInput,
  UpdateProjectInput,
} from '@/cms/models/project';
import {
  validateProject,
  generateSlug,
  validateSlug,
} from '@/cms/validation/validators';
import { revalidateProjectCache } from '@/cms/cache/revalidate';

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Creates a new Project and Case Study.
 */
export async function createProjectAction(
  input: CreateProjectInput
): Promise<ActionResult<ProjectEntity>> {
  try {
    const user = await assertAdminSession();

    // 1. Validate input fields
    const validation = validateProject(input);
    if (!validation.valid) {
      return {
        success: false,
        error: 'Validation failed. Please correct highlighted fields.',
        fieldErrors: validation.errors,
      };
    }

    // 2. Slug generation & uniqueness check
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
    const existing = await projectRepository.getBySlug(slug, { includeDeleted: true });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    // 3. Compute display order
    const allProjects = await projectRepository.getAll({ includeDeleted: true });
    const maxOrder = allProjects.reduce((max, p) => Math.max(max, p.displayOrder || 0), 0);
    const displayOrder = maxOrder + 1;

    // 4. Create in repository
    const payload: CreateProjectInput = {
      ...input,
      slug,
      displayOrder,
      featured: false, // New projects start unfeatured to protect 3-card invariant
      featuredOrder: undefined,
      status: input.status || 'draft',
      publishedAt: input.status === 'published' ? new Date().toISOString() : undefined,
    };

    const created = await projectRepository.create(payload);

    // 5. Audit Logging
    await auditLogRepository.record({
      actorId: user.uid,
      actorEmail: user.email || 'owner@philozz.internal',
      action: 'create',
      entityType: 'project',
      entityId: created.id,
      summary: `Created project "${created.title}" (slug: /${created.slug}, status: ${created.status})`,
    });

    // 6. Invalidate Cache
    await revalidateProjectCache(created.slug);

    return { success: true, data: created };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create project.';
    return { success: false, error: msg };
  }
}

/**
 * Updates an existing Project & Case Study.
 */
export async function updateProjectAction(
  id: string,
  input: UpdateProjectInput
): Promise<ActionResult<ProjectEntity>> {
  try {
    const user = await assertAdminSession();

    const current = await projectRepository.getById(id, { includeDeleted: true });
    if (!current) {
      return { success: false, error: `Project with ID "${id}" not found.` };
    }

    // 1. Validate changes
    const validation = validateProject({ ...current, ...input });
    if (!validation.valid) {
      return {
        success: false,
        error: 'Validation failed. Please correct highlighted fields.',
        fieldErrors: validation.errors,
      };
    }

    // 2. Prevent changing slug directly in this phase
    const sanitizedInput: UpdateProjectInput = {
      ...input,
      slug: current.slug,
    };

    // If status is transitioning to published for the first time, record timestamp
    if (input.status === 'published' && current.status !== 'published' && !current.publishedAt) {
      sanitizedInput.publishedAt = new Date().toISOString();
    }

    // 3. Execute update via repository
    const updated = await projectRepository.update(id, sanitizedInput);

    // 4. Record Audit Log
    await auditLogRepository.record({
      actorId: user.uid,
      actorEmail: user.email || 'owner@philozz.internal',
      action: 'update',
      entityType: 'project',
      entityId: id,
      summary: `Updated case study content for "${updated.title}"`,
    });

    // 5. Invalidate Cache
    await revalidateProjectCache(updated.slug);

    return { success: true, data: updated };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update project.';
    return { success: false, error: msg };
  }
}

/**
 * Publishes a draft project.
 */
export async function publishProjectAction(
  id: string
): Promise<ActionResult<ProjectEntity>> {
  try {
    const user = await assertAdminSession();

    const current = await projectRepository.getById(id, { includeDeleted: true });
    if (!current) {
      return { success: false, error: `Project with ID "${id}" not found.` };
    }

    if (current.isDeleted) {
      return { success: false, error: `Cannot publish deleted project "${current.title}". Restore it first.` };
    }

    const now = new Date().toISOString();
    const updated = await projectRepository.update(id, {
      status: 'published',
      publishedAt: current.publishedAt || now,
    });

    await auditLogRepository.record({
      actorId: user.uid,
      actorEmail: user.email || 'owner@philozz.internal',
      action: 'publish',
      entityType: 'project',
      entityId: id,
      summary: `Published project "${updated.title}"`,
    });

    await revalidateProjectCache(updated.slug);
    return { success: true, data: updated };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to publish project.';
    return { success: false, error: msg };
  }
}

/**
 * Unpublishes a published project (moves to draft).
 */
export async function unpublishProjectAction(
  id: string
): Promise<ActionResult<ProjectEntity>> {
  try {
    const user = await assertAdminSession();

    const current = await projectRepository.getById(id, { includeDeleted: true });
    if (!current) {
      return { success: false, error: `Project with ID "${id}" not found.` };
    }

    // Protect 3-featured invariant
    if (current.featured) {
      return {
        success: false,
        error: `Cannot unpublish "${current.title}" because it is currently assigned to a Homepage Featured Slot. Reassign the featured slot first in the Homepage Featured manager.`,
      };
    }

    const updated = await projectRepository.update(id, {
      status: 'draft',
    });

    await auditLogRepository.record({
      actorId: user.uid,
      actorEmail: user.email || 'owner@philozz.internal',
      action: 'unpublish',
      entityType: 'project',
      entityId: id,
      summary: `Unpublished project "${updated.title}" (moved to draft)`,
    });

    await revalidateProjectCache(updated.slug);
    return { success: true, data: updated };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to unpublish project.';
    return { success: false, error: msg };
  }
}

/**
 * Soft-deletes a project (moves to Trash).
 */
export async function softDeleteProjectAction(
  id: string
): Promise<ActionResult<boolean>> {
  try {
    const user = await assertAdminSession();

    const current = await projectRepository.getById(id, { includeDeleted: true });
    if (!current) {
      return { success: false, error: `Project with ID "${id}" not found.` };
    }

    if (current.featured) {
      return {
        success: false,
        error: `Cannot delete "${current.title}" because it is currently assigned to a Homepage Featured Slot. Reassign the featured slot first in the Homepage Featured manager.`,
      };
    }

    await projectRepository.softDelete(id);

    await auditLogRepository.record({
      actorId: user.uid,
      actorEmail: user.email || 'owner@philozz.internal',
      action: 'delete',
      entityType: 'project',
      entityId: id,
      summary: `Moved project "${current.title}" to Trash (soft-delete)`,
    });

    await revalidateProjectCache(current.slug);
    return { success: true, data: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete project.';
    return { success: false, error: msg };
  }
}

/**
 * Restores a soft-deleted project from Trash.
 */
export async function restoreProjectAction(
  id: string
): Promise<ActionResult<boolean>> {
  try {
    const user = await assertAdminSession();

    const current = await projectRepository.getById(id, { includeDeleted: true });
    if (!current) {
      return { success: false, error: `Project with ID "${id}" not found.` };
    }

    await projectRepository.restore(id);

    await auditLogRepository.record({
      actorId: user.uid,
      actorEmail: user.email || 'owner@philozz.internal',
      action: 'update',
      entityType: 'project',
      entityId: id,
      summary: `Restored project "${current.title}" from Trash`,
    });

    await revalidateProjectCache(current.slug);
    return { success: true, data: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to restore project.';
    return { success: false, error: msg };
  }
}

/**
 * Reorders archive projects.
 */
export async function reorderProjectsAction(
  orderedIds: string[]
): Promise<ActionResult<boolean>> {
  try {
    const user = await assertAdminSession();

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return { success: false, error: 'Invalid ordered ID list.' };
    }

    await projectRepository.reorder(orderedIds);

    await auditLogRepository.record({
      actorId: user.uid,
      actorEmail: user.email || 'owner@philozz.internal',
      action: 'reorder',
      entityType: 'project',
      entityId: 'projects_archive',
      summary: `Reordered ${orderedIds.length} projects in projects archive`,
    });

    await revalidateProjectCache();
    return { success: true, data: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to reorder projects.';
    return { success: false, error: msg };
  }
}

/**
 * Atomically updates the 3 Homepage Featured Slots.
 * Enforces the strict invariant: EXACTLY 3 published, non-deleted projects.
 */
export async function updateFeaturedSlotsAction(
  slotProjectIds: [string, string, string]
): Promise<ActionResult<boolean>> {
  try {
    const user = await assertAdminSession();

    if (!Array.isArray(slotProjectIds) || slotProjectIds.length !== 3) {
      return {
        success: false,
        error: 'Homepage Featured selection must specify exactly 3 projects.',
      };
    }

    const uniqueIds = Array.from(new Set(slotProjectIds));
    if (uniqueIds.length !== 3) {
      return {
        success: false,
        error: 'Each featured slot must contain a unique, distinct project.',
      };
    }

    await projectRepository.setFeaturedSlots(slotProjectIds);

    await auditLogRepository.record({
      actorId: user.uid,
      actorEmail: user.email || 'owner@philozz.internal',
      action: 'update',
      entityType: 'project',
      entityId: 'homepage_featured_slots',
      summary: `Updated Homepage 3-slot featured projects to: [${slotProjectIds.join(', ')}]`,
    });

    await revalidateProjectCache();
    return { success: true, data: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update featured slots.';
    return { success: false, error: msg };
  }
}
