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
  TechnologyEntity,
  CreateTechnologyInput,
  UpdateTechnologyInput,
  OrbitSlotsTuple,
  ExpertiseAreaEntity,
  CreateExpertiseAreaInput,
  UpdateExpertiseAreaInput,
} from '@/cms/models/technology';
import {
  validateHomepageConfig,
  validateBrandInfo,
  sanitizeRichText,
  validateTechnology,
  validateOrbitSlots,
  validateExpertiseArea,
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

// ============================================================================
// PHASE 16D.3B: TECHNOLOGIES & ORBIT FULL CRUD ACTIONS
// ============================================================================

/**
 * Creates or updates a Technology item.
 */
export async function saveTechnologyAction(
  payload: CreateTechnologyInput | UpdateTechnologyInput
): Promise<ActionResponse<TechnologyEntity>> {
  const admin = await assertAdminSession();

  const validation = validateTechnology(payload);
  if (!validation.valid) {
    return {
      success: false,
      error: 'Validation failed. Please correct the highlighted errors.',
      fieldErrors: validation.errors,
    };
  }

  const isUpdate = 'id' in payload && Boolean(payload.id);

  try {
    let result: TechnologyEntity;
    if (isUpdate) {
      result = await siteContentRepository.updateTechnology(
        payload.id!,
        payload as UpdateTechnologyInput
      );
      await auditLogRepository.record({
        actorId: admin.uid,
        actorEmail: admin.email || 'owner@philozz.internal',
        action: 'update',
        entityType: 'technology',
        entityId: result.id,
        summary: `Updated technology: ${result.name}`,
      });
    } else {
      result = await siteContentRepository.createTechnology(
        payload as CreateTechnologyInput
      );
      await auditLogRepository.record({
        actorId: admin.uid,
        actorEmail: admin.email || 'owner@philozz.internal',
        action: 'create',
        entityType: 'technology',
        entityId: result.id,
        summary: `Created technology: ${result.name}`,
      });
    }

    revalidatePath('/');
    revalidatePath('/admin/sections');
    revalidatePath('/admin/sections/preview');

    return {
      success: true,
      data: result,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to save technology.',
    };
  }
}

/**
 * Archives a Technology item.
 * Guarded against archiving if currently occupying an active Orbit slot.
 */
export async function archiveTechnologyAction(
  id: string
): Promise<ActionResponse<boolean>> {
  const admin = await assertAdminSession();

  try {
    const success = await siteContentRepository.archiveTechnology(id);

    await auditLogRepository.record({
      actorId: admin.uid,
      actorEmail: admin.email || 'owner@philozz.internal',
      action: 'update',
      entityType: 'technology',
      entityId: id,
      summary: `Archived technology: ${id}`,
    });

    revalidatePath('/');
    revalidatePath('/admin/sections');
    revalidatePath('/admin/sections/preview');

    return {
      success: true,
      data: success,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to archive technology.',
    };
  }
}

/**
 * Restores an archived Technology item to draft status.
 */
export async function restoreTechnologyAction(
  id: string
): Promise<ActionResponse<boolean>> {
  const admin = await assertAdminSession();

  try {
    const success = await siteContentRepository.restoreTechnology(id);

    await auditLogRepository.record({
      actorId: admin.uid,
      actorEmail: admin.email || 'owner@philozz.internal',
      action: 'update',
      entityType: 'technology',
      entityId: id,
      summary: `Restored technology: ${id}`,
    });

    revalidatePath('/');
    revalidatePath('/admin/sections');
    revalidatePath('/admin/sections/preview');

    return {
      success: true,
      data: success,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to restore technology.',
    };
  }
}

/**
 * Deletes a Technology item.
 * Guarded against deletion if currently occupying an active Orbit slot.
 */
export async function deleteTechnologyAction(
  id: string
): Promise<ActionResponse<void>> {
  const admin = await assertAdminSession();

  try {
    await siteContentRepository.deleteTechnology(id);

    await auditLogRepository.record({
      actorId: admin.uid,
      actorEmail: admin.email || 'owner@philozz.internal',
      action: 'delete',
      entityType: 'technology',
      entityId: id,
      summary: `Deleted technology: ${id}`,
    });

    revalidatePath('/');
    revalidatePath('/admin/sections');
    revalidatePath('/admin/sections/preview');

    return {
      success: true,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete technology.',
    };
  }
}

/**
 * Reorders technology catalog items.
 */
export async function reorderTechnologiesAction(
  orderedIds: string[]
): Promise<ActionResponse<void>> {
  await assertAdminSession();

  try {
    await siteContentRepository.reorderTechnologies(orderedIds);
    revalidatePath('/');
    revalidatePath('/admin/sections');
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to reorder technologies.',
    };
  }
}

/**
 * Saves private draft assignments for the 9 Orbit slots.
 */
export async function saveOrbitSlotsDraftAction(
  slots: OrbitSlotsTuple
): Promise<ActionResponse<OrbitSlotsTuple>> {
  const admin = await assertAdminSession();

  const allTech = await siteContentRepository.getAllTechnologies();
  const validation = validateOrbitSlots(slots, allTech);
  if (!validation.valid) {
    return {
      success: false,
      error: 'Validation failed for Orbit slot configuration.',
      fieldErrors: validation.errors,
    };
  }

  try {
    const draft = await siteContentRepository.saveOrbitSlotsDraft(slots);

    await auditLogRepository.record({
      actorId: admin.uid,
      actorEmail: admin.email || 'owner@philozz.internal',
      action: 'update',
      entityType: 'site_content',
      entityId: 'orbit_slots_draft',
      summary: 'Saved Orbit slots draft configuration',
    });

    revalidatePath('/admin/sections');
    revalidatePath('/admin/sections/preview');

    return {
      success: true,
      data: draft,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to save orbit slots draft.',
    };
  }
}

/**
 * Publishes Orbit slots to the live website.
 */
export async function publishOrbitSlotsAction(
  slots?: OrbitSlotsTuple
): Promise<ActionResponse<OrbitSlotsTuple>> {
  const admin = await assertAdminSession();

  const allTech = await siteContentRepository.getAllTechnologies();
  if (slots) {
    const validation = validateOrbitSlots(slots, allTech);
    if (!validation.valid) {
      return {
        success: false,
        error: 'Validation failed for Orbit slot configuration.',
        fieldErrors: validation.errors,
      };
    }
  }

  try {
    const published = await siteContentRepository.publishOrbitSlots(slots);

    await auditLogRepository.record({
      actorId: admin.uid,
      actorEmail: admin.email || 'owner@philozz.internal',
      action: 'publish',
      entityType: 'site_content',
      entityId: 'orbit_slots',
      summary: 'Published Orbit slot assignments to live website',
    });

    revalidatePath('/');
    revalidatePath('/admin/sections');
    revalidatePath('/admin/sections/preview');

    return {
      success: true,
      data: published,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to publish orbit slots.',
    };
  }
}

/**
 * Rolls back Orbit slots to previous configuration.
 */
export async function rollbackOrbitSlotsAction(): Promise<ActionResponse<OrbitSlotsTuple>> {
  const admin = await assertAdminSession();

  try {
    const rolledBack = await siteContentRepository.rollbackOrbitSlots();

    await auditLogRepository.record({
      actorId: admin.uid,
      actorEmail: admin.email || 'owner@philozz.internal',
      action: 'update',
      entityType: 'site_content',
      entityId: 'orbit_slots',
      summary: 'Rolled back Orbit slots to previous configuration',
    });

    revalidatePath('/');
    revalidatePath('/admin/sections');
    revalidatePath('/admin/sections/preview');

    return {
      success: true,
      data: rolledBack,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to rollback orbit slots.',
    };
  }
}

// ============================================================================
// PHASE 16D.3B: EXPERTISE AREAS FULL CRUD ACTIONS
// ============================================================================

/**
 * Creates or updates an Expertise Area item.
 */
export async function saveExpertiseAreaAction(
  payload: CreateExpertiseAreaInput | UpdateExpertiseAreaInput
): Promise<ActionResponse<ExpertiseAreaEntity>> {
  const admin = await assertAdminSession();

  const validation = validateExpertiseArea(payload);
  if (!validation.valid) {
    return {
      success: false,
      error: 'Validation failed for expertise area.',
      fieldErrors: validation.errors,
    };
  }

  const isUpdate = 'id' in payload && Boolean(payload.id);

  try {
    let result: ExpertiseAreaEntity;
    if (isUpdate) {
      result = await siteContentRepository.updateExpertiseArea(
        payload.id!,
        payload as UpdateExpertiseAreaInput
      );
      await auditLogRepository.record({
        actorId: admin.uid,
        actorEmail: admin.email || 'owner@philozz.internal',
        action: 'update',
        entityType: 'site_content',
        entityId: result.id,
        summary: `Updated expertise area: ${result.name}`,
      });
    } else {
      result = await siteContentRepository.createExpertiseArea(
        payload as CreateExpertiseAreaInput
      );
      await auditLogRepository.record({
        actorId: admin.uid,
        actorEmail: admin.email || 'owner@philozz.internal',
        action: 'create',
        entityType: 'site_content',
        entityId: result.id,
        summary: `Created expertise area: ${result.name}`,
      });
    }

    revalidatePath('/');
    revalidatePath('/admin/sections');
    revalidatePath('/admin/sections/preview');

    return {
      success: true,
      data: result,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to save expertise area.',
    };
  }
}

/**
 * Archives an Expertise Area.
 */
export async function archiveExpertiseAreaAction(
  id: string
): Promise<ActionResponse<boolean>> {
  const admin = await assertAdminSession();

  try {
    const success = await siteContentRepository.archiveExpertiseArea(id);

    await auditLogRepository.record({
      actorId: admin.uid,
      actorEmail: admin.email || 'owner@philozz.internal',
      action: 'update',
      entityType: 'site_content',
      entityId: id,
      summary: `Archived expertise area: ${id}`,
    });

    revalidatePath('/');
    revalidatePath('/admin/sections');
    revalidatePath('/admin/sections/preview');

    return {
      success: true,
      data: success,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to archive expertise area.',
    };
  }
}

/**
 * Restores an archived Expertise Area to draft status.
 */
export async function restoreExpertiseAreaAction(
  id: string
): Promise<ActionResponse<boolean>> {
  const admin = await assertAdminSession();

  try {
    const success = await siteContentRepository.restoreExpertiseArea(id);

    await auditLogRepository.record({
      actorId: admin.uid,
      actorEmail: admin.email || 'owner@philozz.internal',
      action: 'update',
      entityType: 'site_content',
      entityId: id,
      summary: `Restored expertise area: ${id}`,
    });

    revalidatePath('/');
    revalidatePath('/admin/sections');
    revalidatePath('/admin/sections/preview');

    return {
      success: true,
      data: success,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to restore expertise area.',
    };
  }
}

/**
 * Deletes an Expertise Area.
 */
export async function deleteExpertiseAreaAction(
  id: string
): Promise<ActionResponse<void>> {
  const admin = await assertAdminSession();

  try {
    await siteContentRepository.deleteExpertiseArea(id);

    await auditLogRepository.record({
      actorId: admin.uid,
      actorEmail: admin.email || 'owner@philozz.internal',
      action: 'delete',
      entityType: 'site_content',
      entityId: id,
      summary: `Deleted expertise area: ${id}`,
    });

    revalidatePath('/');
    revalidatePath('/admin/sections');
    revalidatePath('/admin/sections/preview');

    return {
      success: true,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete expertise area.',
    };
  }
}

/**
 * Reorders expertise area items.
 */
export async function reorderExpertiseAreasAction(
  orderedIds: string[]
): Promise<ActionResponse<void>> {
  await assertAdminSession();

  try {
    await siteContentRepository.reorderExpertiseAreas(orderedIds);
    revalidatePath('/');
    revalidatePath('/admin/sections');
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to reorder expertise areas.',
    };
  }
}

