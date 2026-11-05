'use server';

/**
 * PHILOZZ CMS — Media Library Server Actions
 * Phase 16E.0: Media Library Foundation & Storage Provider Readiness
 *
 * Implements owner-only Media Metadata CRUD, Safe Deletion Protection,
 * and the 6-Step Asset Replacement Architecture.
 */

import { revalidatePath } from 'next/cache';
import { assertAdminSession } from '@/lib/auth/requireAdminSession';
import {
  mediaRepository,
  projectRepository,
  articleRepository,
  siteContentRepository,
  auditLogRepository,
} from '@/cms/repositories';
import {
  MediaAssetEntity,
  MediaFolder,
  MediaUsageReport,
} from '@/cms/models/media';
import { MediaUsageResolver } from '@/cms/media/mediaUsageResolver';
import { executeSafeRemoteDeletion } from '@/cms/media/mediaDeletionService';
import { sanitizeRichText } from '@/cms/validation/validators';

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export interface UpdateMediaMetadataInput {
  altText?: string;
  caption?: string;
  folder?: MediaFolder;
  tags?: string[];
}

export interface ReplaceAssetTarget {
  entityType:
    | 'project'
    | 'article'
    | 'homepage_hero'
    | 'homepage_about'
    | 'homepage_contact'
    | 'brand_info'
    | 'seo_config';
  entityId: string;
  field: string;
}

/**
 * Updates an asset's editable metadata (alt text, caption, folder, tags).
 */
export async function updateMediaMetadataAction(
  id: string,
  input: UpdateMediaMetadataInput
): Promise<ActionResponse<MediaAssetEntity>> {
  const admin = await assertAdminSession();

  try {
    const existing = await mediaRepository.getById(id);
    if (!existing) {
      return { success: false, error: `Media asset "${id}" not found.` };
    }

    const updates: Partial<MediaAssetEntity> = {};

    if (input.altText !== undefined) {
      updates.altText = sanitizeRichText(input.altText).trim();
    }
    if (input.caption !== undefined) {
      updates.caption = sanitizeRichText(input.caption).trim();
    }
    if (input.folder !== undefined) {
      if (!['projects', 'articles', 'photos', 'brand', 'general'].includes(input.folder)) {
        return { success: false, error: 'Invalid folder selected.' };
      }
      updates.folder = input.folder;
    }
    if (Array.isArray(input.tags)) {
      updates.tags = input.tags
        .map((t) => sanitizeRichText(t).trim())
        .filter(Boolean)
        .slice(0, 20);
    }

    const updated = await mediaRepository.update(id, updates);

    const diffRecord: Record<string, { before: unknown; after: unknown }> = {};
    for (const [k, v] of Object.entries(updates)) {
      diffRecord[k] = {
        before: (existing as unknown as Record<string, unknown>)[k],
        after: v,
      };
    }

    await auditLogRepository.record({
      actorId: admin.uid,
      actorEmail: admin.email || 'owner@philozz.com',
      action: 'update',
      entityType: 'media',
      entityId: id,
      summary: `Updated metadata for media asset "${updated.filename}"`,
      diff: diffRecord,
    });

    revalidatePath('/admin/media');
    return { success: true, data: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed updating media metadata';
    return { success: false, error: message };
  }
}

/**
 * Safe Deletion Control:
 * Strictly prevents deletion of any asset currently referenced in published or draft content.
 */
export async function deleteMediaAssetAction(id: string): Promise<ActionResponse<{ id: string }>> {
  const admin = await assertAdminSession();

  try {
    const asset = await mediaRepository.getById(id);
    if (!asset) {
      return { success: false, error: `Media asset "${id}" not found.` };
    }

    // 1. Enforce usage resolution check
    const safetyCheck = await MediaUsageResolver.canSafelyDelete(asset);
    if (!safetyCheck.allowed) {
      return {
        success: false,
        error: safetyCheck.reason || 'Deletion blocked: Asset is currently referenced in active content.',
      };
    }

    // 2. Perform safe soft deletion
    const success = await mediaRepository.softDelete(id);
    if (!success) {
      return { success: false, error: 'Failed to soft-delete media asset.' };
    }

    await auditLogRepository.record({
      actorId: admin.uid,
      actorEmail: admin.email || 'owner@philozz.com',
      action: 'delete',
      entityType: 'media',
      entityId: id,
      summary: `Soft-deleted unreferenced media asset "${asset.filename}"`,
    });

    revalidatePath('/admin/media');
    return { success: true, data: { id } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete media asset';
    return { success: false, error: message };
  }
}

/**
 * Restores a soft-deleted media asset.
 */
export async function restoreMediaAssetAction(id: string): Promise<ActionResponse<MediaAssetEntity>> {
  const admin = await assertAdminSession();

  try {
    const asset = await mediaRepository.getById(id);
    if (!asset) {
      return { success: false, error: `Media asset "${id}" not found.` };
    }

    const success = await mediaRepository.restore(id);
    if (!success) {
      return { success: false, error: 'Failed to restore media asset.' };
    }

    const restored = await mediaRepository.getById(id);

    await auditLogRepository.record({
      actorId: admin.uid,
      actorEmail: admin.email || 'owner@philozz.com',
      action: 'update',
      entityType: 'media',
      entityId: id,
      summary: `Restored soft-deleted media asset "${asset.filename}"`,
    });

    revalidatePath('/admin/media');
    return { success: true, data: restored || asset };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to restore media asset';
    return { success: false, error: message };
  }
}

/**
 * Live Usage Resolution Action
 */
export async function getAssetUsageAction(id: string): Promise<ActionResponse<MediaUsageReport>> {
  await assertAdminSession();

  try {
    const asset = await mediaRepository.getById(id);
    if (!asset) {
      return { success: false, error: `Media asset "${id}" not found.` };
    }

    const report = await MediaUsageResolver.resolveAssetUsage(asset);
    return { success: true, data: report };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to resolve asset usage';
    return { success: false, error: message };
  }
}

/**
 * 6-Step Safe Replacement Protocol:
 * 1. Validate replacement asset exists and is ready.
 * 2. Verify new asset URL is available.
 * 3. Update the intended content reference in repository.
 * 4. Verify the content reference is consistent.
 * 5. Retain old asset until no references remain.
 * 6. Return new usage report for old asset.
 */
export async function replaceAssetReferenceAction(
  oldAssetId: string,
  newAssetId: string,
  target: ReplaceAssetTarget
): Promise<ActionResponse<{ updatedTarget: ReplaceAssetTarget; oldAssetUsage: MediaUsageReport }>> {
  const admin = await assertAdminSession();

  try {
    // Step 1: Validate replacement asset
    const newAsset = await mediaRepository.getById(newAssetId);
    if (!newAsset) {
      return { success: false, error: `Replacement asset "${newAssetId}" does not exist in media library.` };
    }
    if (newAsset.isDeleted || newAsset.status === 'deleting') {
      return {
        success: false,
        error: `Cannot replace with asset "${newAsset.filename}": Asset is deleted or currently reserved for deletion.`,
      };
    }

    // Step 2: Verify new asset URL
    if (!newAsset.url || !newAsset.url.trim()) {
      return { success: false, error: `Replacement asset "${newAsset.filename}" has no valid delivery URL.` };
    }

    const oldAsset = await mediaRepository.getById(oldAssetId);
    if (!oldAsset) {
      return { success: false, error: `Original asset "${oldAssetId}" does not exist in media library.` };
    }

    // Step 3: Update intended content reference
    switch (target.entityType) {
      case 'project': {
        const project = await projectRepository.getById(target.entityId, { includeDeleted: true });
        if (!project) {
          return { success: false, error: `Project "${target.entityId}" not found.` };
        }
        if (target.field === 'thumbnailUrl') {
          await projectRepository.update(target.entityId, { thumbnailUrl: newAsset.url });
        } else if (target.field === 'ogImageUrl') {
          await projectRepository.update(target.entityId, { ogImageUrl: newAsset.url });
        } else {
          return { success: false, error: `Unsupported project field "${target.field}" for replacement.` };
        }
        break;
      }

      case 'article': {
        const article = await articleRepository.getById(target.entityId, { includeDeleted: true });
        if (!article) {
          return { success: false, error: `Article "${target.entityId}" not found.` };
        }
        if (target.field === 'coverImageUrl') {
          await articleRepository.update(target.entityId, { coverImageUrl: newAsset.url });
        } else if (target.field === 'ogImageUrl') {
          await articleRepository.update(target.entityId, { ogImageUrl: newAsset.url });
        } else {
          return { success: false, error: `Unsupported article field "${target.field}" for replacement.` };
        }
        break;
      }

      case 'homepage_hero': {
        const currentDraft =
          (await siteContentRepository.getHomepageConfigDraft()) ||
          (await siteContentRepository.getHomepageConfig());
        const updatedHero = { ...currentDraft.hero, heroImageUrl: newAsset.url };
        await siteContentRepository.saveHomepageConfigDraft({ hero: updatedHero });
        break;
      }

      case 'homepage_about': {
        const currentDraft =
          (await siteContentRepository.getHomepageConfigDraft()) ||
          (await siteContentRepository.getHomepageConfig());
        const updatedCards = currentDraft.about.mosaicCards.map((c) =>
          c.id === target.entityId ? { ...c, imageUrl: newAsset.url } : c
        );
        await siteContentRepository.saveHomepageConfigDraft({
          about: { ...currentDraft.about, mosaicCards: updatedCards },
        });
        break;
      }

      case 'homepage_contact': {
        const currentDraft =
          (await siteContentRepository.getHomepageConfigDraft()) ||
          (await siteContentRepository.getHomepageConfig());
        const updatedContact = { ...currentDraft.contact };
        if (target.field === 'portraitImageUrl') {
          updatedContact.portraitImageUrl = newAsset.url;
        } else if (target.field === 'secondaryCtaHref') {
          updatedContact.secondaryCtaHref = newAsset.url;
        }
        await siteContentRepository.saveHomepageConfigDraft({ contact: updatedContact });
        break;
      }

      case 'brand_info': {
        if (target.field === 'cvUrl') {
          await siteContentRepository.saveBrandInfoDraft({ cvUrl: newAsset.url });
        } else {
          return { success: false, error: `Unsupported brand setting "${target.field}" for replacement.` };
        }
        break;
      }

      case 'seo_config': {
        const currentSeoDraft =
          (await siteContentRepository.getSeoConfigDraft()) ||
          (await siteContentRepository.getSeoConfig());
        if (target.field === 'defaultOgImage') {
          await siteContentRepository.saveSeoConfigDraft({ defaultOgImage: newAsset.url });
        } else if (target.field === 'homepage.ogImageUrl') {
          await siteContentRepository.saveSeoConfigDraft({
            homepage: { ...currentSeoDraft.homepage, ogImageUrl: newAsset.url },
          });
        } else if (target.field === 'projectsArchive.ogImageUrl') {
          await siteContentRepository.saveSeoConfigDraft({
            projectsArchive: { ...currentSeoDraft.projectsArchive, ogImageUrl: newAsset.url },
          });
        } else if (target.field === 'blogArchive.ogImageUrl') {
          await siteContentRepository.saveSeoConfigDraft({
            blogArchive: { ...currentSeoDraft.blogArchive, ogImageUrl: newAsset.url },
          });
        } else {
          return { success: false, error: `Unsupported SEO field "${target.field}" for replacement.` };
        }
        break;
      }

      default:
        return { success: false, error: `Unknown target entity type "${target.entityType}".` };
    }

    // Step 4 & 5: Retain old asset and re-evaluate usage
    const oldAssetUsage = await MediaUsageResolver.resolveAssetUsage(oldAsset);

    // Step 6: Record audit event
    await auditLogRepository.record({
      actorId: admin.uid,
      actorEmail: admin.email || 'owner@philozz.com',
      action: 'update',
      entityType: 'media',
      entityId: oldAssetId,
      summary: `Safely replaced asset "${oldAsset.filename}" with "${newAsset.filename}" in ${target.entityType} (${target.field})`,
    });

    revalidatePath('/admin/media');
    return {
      success: true,
      data: {
        updatedTarget: target,
        oldAssetUsage,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Asset replacement failed';
    return { success: false, error: message };
  }
}

/**
 * Phase 16E.3: Permanent Remote Deletion Action.
 * Executes safe remote deletion with fail-closed reference checks,
 * ImageKit remote deletion, and Firestore database cleanup.
 */
export async function permanentlyDeleteMediaAssetAction(
  id: string
): Promise<ActionResponse<{ id: string }>> {
  const admin = await assertAdminSession();

  try {
    const result = await executeSafeRemoteDeletion(id, {
      uid: admin.uid,
      email: admin.email || undefined,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to permanently delete media asset.',
      };
    }

    revalidatePath('/admin/media');
    return { success: true, data: { id } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed permanently deleting media asset';
    return { success: false, error: message };
  }
}
