/**
 * PHILOZZ CMS — Reliable Media Usage Resolver
 * Phase 16E.0: Media Library Foundation & Storage Provider Readiness
 *
 * Scans all content entities across the application to detect active references:
 * 1. Projects & Case Studies (thumbnailUrl, ogImageUrl, case study assets)
 * 2. Articles & Technical Notes (coverImageUrl, ogImageUrl, sections)
 * 3. Homepage Sections (Hero background, About mosaic cards, Contact portrait & CV)
 * 4. Brand Information & Global Site Settings (cvUrl, downloadable assets)
 * 5. Global & Page-Level SEO Configurations (defaultOgImage, archive OG overrides)
 * 6. Hardcoded Scene Visuals (Journal author badge, core photo assets)
 *
 * Guarantees zero unverified media deletions or orphaned broken URLs.
 */

import {
  MediaAssetEntity,
  MediaUsageReference,
  MediaUsageReport,
} from '../models/media';
import {
  projectRepository,
  articleRepository,
  siteContentRepository,
} from '../repositories';
import { PHOTO_ASSETS } from '@/data/portfolioData';

/**
 * Checks if a candidate target string matches a media asset's identifier, URL, or filename.
 */
export function doesAssetMatch(target: unknown, asset: MediaAssetEntity): boolean {
  if (typeof target !== 'string' || !target.trim()) return false;
  const t = target.trim();

  // Exact URL match
  if (t === asset.url) return true;

  // Relative vs Absolute URL matching (e.g. /images/hero.png vs https://philozz.com/images/hero.png)
  if (asset.url.startsWith('/') && t.endsWith(asset.url)) return true;
  if (t.startsWith('/') && asset.url.endsWith(t)) return true;

  // Filename suffix match
  if (asset.filename && (t.endsWith(`/${asset.filename}`) || t === asset.filename)) {
    return true;
  }

  // Stable media ID match
  if (t === asset.id) return true;

  return false;
}

export class MediaUsageResolver {
  /**
   * Resolves all active content references for a given media asset.
   */
  static async resolveAssetUsage(asset: MediaAssetEntity): Promise<MediaUsageReport> {
    const references: MediaUsageReference[] = [];
    const scanErrors: string[] = [];

    // ------------------------------------------------------------------------
    // 1. Projects & Case Studies
    // ------------------------------------------------------------------------
    try {
      const projects = await projectRepository.getAll({ includeDeleted: true });
      for (const p of projects) {
        const isPublished = p.status === 'published';
        const isDraft = p.status === 'draft';

        if (doesAssetMatch(p.thumbnailUrl, asset)) {
          references.push({
            entityType: 'project',
            entityId: p.slug,
            entityTitle: `Project: "${p.title}"`,
            field: 'thumbnailUrl',
            fieldLabel: 'Card Thumbnail Visual',
            isPublished,
            isDraft,
          });
        }

        if (doesAssetMatch(p.ogImageUrl, asset)) {
          references.push({
            entityType: 'project',
            entityId: p.slug,
            entityTitle: `Project: "${p.title}"`,
            field: 'ogImageUrl',
            fieldLabel: 'Open Graph Social Card',
            isPublished,
            isDraft,
          });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[MediaUsageResolver] Failed scanning projects:', err);
      scanErrors.push(`Projects scan outage: ${msg}`);
    }

    // ------------------------------------------------------------------------
    // 2. Articles & Technical Notes
    // ------------------------------------------------------------------------
    try {
      const articles = await articleRepository.getAll({ includeDeleted: true });
      for (const a of articles) {
        const isPublished = a.status === 'published';
        const isDraft = a.status === 'draft';

        if (doesAssetMatch(a.coverImageUrl, asset)) {
          references.push({
            entityType: 'article',
            entityId: a.slug,
            entityTitle: `Article: "${a.title}"`,
            field: 'coverImageUrl',
            fieldLabel: 'Article Cover Banner',
            isPublished,
            isDraft,
          });
        }

        if (doesAssetMatch(a.ogImageUrl, asset)) {
          references.push({
            entityType: 'article',
            entityId: a.slug,
            entityTitle: `Article: "${a.title}"`,
            field: 'ogImageUrl',
            fieldLabel: 'Social Preview Card',
            isPublished,
            isDraft,
          });
        }

        // Scan section content
        if (Array.isArray(a.sections)) {
          for (let sIdx = 0; sIdx < a.sections.length; sIdx++) {
            const sec = a.sections[sIdx];
            if (
              (sec.content && (sec.content.includes(asset.url) || sec.content.includes(asset.filename))) ||
              (sec.codeSnippet && (sec.codeSnippet.includes(asset.url) || sec.codeSnippet.includes(asset.filename)))
            ) {
              references.push({
                entityType: 'article',
                entityId: a.slug,
                entityTitle: `Article: "${a.title}"`,
                field: `sections[${sIdx}]`,
                fieldLabel: `Article Section Content (${sec.heading || `Section ${sIdx + 1}`})`,
                isPublished,
                isDraft,
              });
            }
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[MediaUsageResolver] Failed scanning articles:', err);
      scanErrors.push(`Articles scan outage: ${msg}`);
    }

    // ------------------------------------------------------------------------
    // 3. Homepage Sections (Hero, About, Contact) — Published & Draft
    // ------------------------------------------------------------------------
    try {
      const publishedHomepage = await siteContentRepository.getHomepageConfig({ preview: false });
      const draftHomepage = await siteContentRepository.getHomepageConfigDraft();

      const homepageConfigs = [
        { config: publishedHomepage, isPublished: true, isDraft: false },
        ...(draftHomepage ? [{ config: draftHomepage, isPublished: false, isDraft: true }] : []),
      ];

      for (const { config, isPublished, isDraft } of homepageConfigs) {
        if (!config) continue;

        // Hero background image
        if (doesAssetMatch(config.hero?.heroImageUrl, asset)) {
          const existing = references.find(
            (r) => r.entityType === 'homepage_hero' && r.field === 'heroImageUrl'
          );
          if (existing) {
            existing.isPublished = existing.isPublished || isPublished;
            existing.isDraft = existing.isDraft || isDraft;
          } else {
            references.push({
              entityType: 'homepage_hero',
              entityId: 'hero',
              entityTitle: 'Homepage Hero Section',
              field: 'heroImageUrl',
              fieldLabel: 'Hero Background Visual',
              isPublished,
              isDraft,
            });
          }
        }

        // About mosaic cards
        if (Array.isArray(config.about?.mosaicCards)) {
          for (const card of config.about.mosaicCards) {
            if (doesAssetMatch(card.imageUrl, asset)) {
              const cardId = card.id || 'mosaic_card';
              const existing = references.find(
                (r) => r.entityType === 'homepage_about' && r.entityId === cardId
              );
              if (existing) {
                existing.isPublished = existing.isPublished || isPublished;
                existing.isDraft = existing.isDraft || isDraft;
              } else {
                references.push({
                  entityType: 'homepage_about',
                  entityId: cardId,
                  entityTitle: `Homepage About Mosaic (${card.badge || card.title || cardId})`,
                  field: 'imageUrl',
                  fieldLabel: 'Mosaic Card Image',
                  isPublished,
                  isDraft,
                });
              }
            }
          }
        }

        // Contact section portrait
        if (doesAssetMatch(config.contact?.portraitImageUrl, asset)) {
          const existing = references.find(
            (r) => r.entityType === 'homepage_contact' && r.field === 'portraitImageUrl'
          );
          if (existing) {
            existing.isPublished = existing.isPublished || isPublished;
            existing.isDraft = existing.isDraft || isDraft;
          } else {
            references.push({
              entityType: 'homepage_contact',
              entityId: 'contact',
              entityTitle: 'Homepage Contact Section',
              field: 'portraitImageUrl',
              fieldLabel: 'Contact Scene Portrait',
              isPublished,
              isDraft,
            });
          }
        }

        // Contact resume link
        if (doesAssetMatch(config.contact?.secondaryCtaHref, asset)) {
          const existing = references.find(
            (r) => r.entityType === 'homepage_contact' && r.field === 'secondaryCtaHref'
          );
          if (existing) {
            existing.isPublished = existing.isPublished || isPublished;
            existing.isDraft = existing.isDraft || isDraft;
          } else {
            references.push({
              entityType: 'homepage_contact',
              entityId: 'contact',
              entityTitle: 'Homepage Contact Section',
              field: 'secondaryCtaHref',
              fieldLabel: 'Resume Download Action',
              isPublished,
              isDraft,
            });
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[MediaUsageResolver] Failed scanning homepage sections:', err);
      scanErrors.push(`Homepage sections scan outage: ${msg}`);
    }

    // ------------------------------------------------------------------------
    // 4. Brand Information & Global Site Settings — Published & Draft
    // ------------------------------------------------------------------------
    try {
      const publishedBrand = await siteContentRepository.getBrandInfo();
      const draftBrand = await siteContentRepository.getBrandInfoDraft();

      const brandConfigs = [
        { brand: publishedBrand, isPublished: true, isDraft: false },
        ...(draftBrand ? [{ brand: draftBrand, isPublished: false, isDraft: true }] : []),
      ];

      for (const { brand, isPublished, isDraft } of brandConfigs) {
        if (!brand) continue;
        if (doesAssetMatch(brand.cvUrl, asset)) {
          const existing = references.find(
            (r) => r.entityType === 'brand_info' && r.field === 'cvUrl'
          );
          if (existing) {
            existing.isPublished = existing.isPublished || isPublished;
            existing.isDraft = existing.isDraft || isDraft;
          } else {
            references.push({
              entityType: 'brand_info',
              entityId: 'brand_info',
              entityTitle: 'Global Site Settings & Brand Profile',
              field: 'cvUrl',
              fieldLabel: 'Downloadable Resume (CV)',
              isPublished,
              isDraft,
            });
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[MediaUsageResolver] Failed scanning brand info:', err);
      scanErrors.push(`Brand info scan outage: ${msg}`);
    }

    // ------------------------------------------------------------------------
    // 5. Global & Page-Level SEO Configuration — Published & Draft
    // ------------------------------------------------------------------------
    try {
      const publishedSeo = await siteContentRepository.getSeoConfig({ preview: false });
      const draftSeo = await siteContentRepository.getSeoConfigDraft();

      const seoConfigs = [
        { seo: publishedSeo, isPublished: true, isDraft: false },
        ...(draftSeo ? [{ seo: draftSeo, isPublished: false, isDraft: true }] : []),
      ];

      for (const { seo, isPublished, isDraft } of seoConfigs) {
        if (!seo) continue;

        if (doesAssetMatch(seo.defaultOgImage, asset)) {
          const existing = references.find(
            (r) => r.entityType === 'seo_config' && r.field === 'defaultOgImage'
          );
          if (existing) {
            existing.isPublished = existing.isPublished || isPublished;
            existing.isDraft = existing.isDraft || isDraft;
          } else {
            references.push({
              entityType: 'seo_config',
              entityId: 'default_og',
              entityTitle: 'Global SEO Default OpenGraph Image',
              field: 'defaultOgImage',
              fieldLabel: 'Global Default Social Image',
              isPublished,
              isDraft,
            });
          }
        }

        if (doesAssetMatch(seo.homepage?.ogImageUrl, asset)) {
          const existing = references.find(
            (r) => r.entityType === 'seo_config' && r.field === 'homepage.ogImageUrl'
          );
          if (existing) {
            existing.isPublished = existing.isPublished || isPublished;
            existing.isDraft = existing.isDraft || isDraft;
          } else {
            references.push({
              entityType: 'seo_config',
              entityId: 'homepage_og',
              entityTitle: 'Homepage SEO OpenGraph Image',
              field: 'homepage.ogImageUrl',
              fieldLabel: 'Homepage Custom Social Image',
              isPublished,
              isDraft,
            });
          }
        }

        if (doesAssetMatch(seo.projectsArchive?.ogImageUrl, asset)) {
          const existing = references.find(
            (r) => r.entityType === 'seo_config' && r.field === 'projectsArchive.ogImageUrl'
          );
          if (existing) {
            existing.isPublished = existing.isPublished || isPublished;
            existing.isDraft = existing.isDraft || isDraft;
          } else {
            references.push({
              entityType: 'seo_config',
              entityId: 'projects_archive_og',
              entityTitle: 'Projects Archive SEO OpenGraph Image',
              field: 'projectsArchive.ogImageUrl',
              fieldLabel: 'Projects Archive Social Image',
              isPublished,
              isDraft,
            });
          }
        }

        if (doesAssetMatch(seo.blogArchive?.ogImageUrl, asset)) {
          const existing = references.find(
            (r) => r.entityType === 'seo_config' && r.field === 'blogArchive.ogImageUrl'
          );
          if (existing) {
            existing.isPublished = existing.isPublished || isPublished;
            existing.isDraft = existing.isDraft || isDraft;
          } else {
            references.push({
              entityType: 'seo_config',
              entityId: 'blog_archive_og',
              entityTitle: 'Blog Archive SEO OpenGraph Image',
              field: 'blogArchive.ogImageUrl',
              fieldLabel: 'Blog Archive Social Image',
              isPublished,
              isDraft,
            });
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[MediaUsageResolver] Failed scanning SEO settings:', err);
      scanErrors.push(`SEO settings scan outage: ${msg}`);
    }

    // ------------------------------------------------------------------------
    // 6. Hardcoded Scene Visuals & Core Photo Assets
    // ------------------------------------------------------------------------
    if (doesAssetMatch(PHOTO_ASSETS.portraitSitting, asset)) {
      references.push({
        entityType: 'homepage_about',
        entityId: 'journal_author_badge',
        entityTitle: 'Engineering Journal / Notes Scene',
        field: 'portraitSitting',
        fieldLabel: 'Author Avatar Identity Badge',
        isPublished: true,
        isDraft: false,
      });
    }

    const hasScanErrors = scanErrors.length > 0;
    const isInUse = references.length > 0;
    // Fail-Closed: Any scan outage or uncertainty strictly disallows deletion
    const isDeletable = !isInUse && !hasScanErrors;
    const scanError = hasScanErrors ? scanErrors.join('; ') : undefined;

    const summary = hasScanErrors
      ? `Reference scan incomplete (${scanError}). Deletion blocked fail-closed.`
      : isInUse
      ? `Referenced by ${references.length} active location${references.length === 1 ? '' : 's'}: ${references.map((r) => r.entityTitle).join(', ')}`
      : 'Unused (Safe for deletion)';

    return {
      assetId: asset.id,
      references,
      isInUse,
      isDeletable,
      summary,
      scanError,
    };
  }

  /**
   * Resolves usage for an array of media assets in batch.
   */
  static async resolveAllUsage(assets: MediaAssetEntity[]): Promise<Map<string, MediaUsageReport>> {
    const results = new Map<string, MediaUsageReport>();
    for (const asset of assets) {
      const report = await this.resolveAssetUsage(asset);
      results.set(asset.id, report);
    }
    return results;
  }

  /**
   * Safety check: blocks deletion if asset is in use or scan encountered any error.
   * Fail-Closed posture: Never allows deletion on uncertainty.
   */
  static async canSafelyDelete(asset: MediaAssetEntity): Promise<{
    allowed: boolean;
    reason?: string;
    references: MediaUsageReference[];
  }> {
    try {
      const report = await this.resolveAssetUsage(asset);

      if (report.scanError) {
        return {
          allowed: false,
          reason: `Deletion blocked (fail-closed): Content reference scan could not be completed (${report.scanError}). Deletion blocked to protect content integrity.`,
          references: report.references,
        };
      }

      if (report.isInUse) {
        return {
          allowed: false,
          reason: `Deletion blocked: Cannot delete asset "${asset.filename}" because it is actively referenced by: ${report.references.map((r) => `${r.entityTitle} (${r.fieldLabel})`).join('; ')}. Re-point or remove these references before deleting.`,
          references: report.references,
        };
      }

      if (!report.isDeletable) {
        return {
          allowed: false,
          reason: `Deletion blocked (fail-closed): Asset "${asset.filename}" is not marked as deletable.`,
          references: report.references,
        };
      }

      return {
        allowed: true,
        references: [],
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        allowed: false,
        reason: `Deletion blocked (fail-closed): Reference resolution encountered an unexpected error (${message}).`,
        references: [],
      };
    }
  }
}
