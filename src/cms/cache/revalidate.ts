import 'server-only';

/**
 * PHILOZZ CMS — Next.js 16 Cache Invalidation Utility
 * Phase 16D.0: Firestore Foundation & Safe Content Migration
 *
 * Provides targeted, fine-grained cache revalidation for Server Components
 * without invalidating unrelated public content. Adheres strictly to
 * Next.js 16 APIs (cacheTag, revalidateTag with CacheLifeConfig, and updateTag).
 */

import { revalidatePath, revalidateTag, updateTag } from 'next/cache';

export const CMS_CACHE_TAGS = {
  PROJECTS: 'cms-projects',
  ARTICLES: 'cms-articles',
  SITE_CONTENT: 'cms-site-content',
  MEDIA: 'cms-media',
} as const;

export type CMSCacheTag = (typeof CMS_CACHE_TAGS)[keyof typeof CMS_CACHE_TAGS];

/**
 * Revalidates cache after project creation, update, or deletion.
 */
export async function revalidateProjectCache(slug?: string): Promise<void> {
  try {
    revalidateTag(CMS_CACHE_TAGS.PROJECTS, { expire: 0 });
    revalidatePath('/projects');
    revalidatePath('/');
    revalidatePath('/sitemap.xml');
    if (slug) {
      revalidatePath(`/work/${slug}`);
    }
  } catch (err) {
    // Gracefully handle situations when executed outside request lifecycle (e.g. CLI scripts)
    console.warn('[revalidateProjectCache] Invoked outside active request context:', err);
  }
}

/**
 * Revalidates cache after article / note creation, update, or deletion.
 */
export async function revalidateArticleCache(slug?: string): Promise<void> {
  try {
    revalidateTag(CMS_CACHE_TAGS.ARTICLES, { expire: 0 });
    revalidatePath('/blog');
    revalidatePath('/');
    revalidatePath('/sitemap.xml');
    if (slug) {
      revalidatePath(`/notes/${slug}`);
    }
  } catch (err) {
    console.warn('[revalidateArticleCache] Invoked outside active request context:', err);
  }
}

/**
 * Revalidates cache after site settings, brand info, or homepage section updates.
 */
export async function revalidateSiteContentCache(): Promise<void> {
  try {
    revalidateTag(CMS_CACHE_TAGS.SITE_CONTENT, { expire: 0 });
    revalidatePath('/');
  } catch (err) {
    console.warn('[revalidateSiteContentCache] Invoked outside active request context:', err);
  }
}

/**
 * Revalidates media cache after asset upload or deletion.
 */
export async function revalidateMediaCache(): Promise<void> {
  try {
    revalidateTag(CMS_CACHE_TAGS.MEDIA, { expire: 0 });
    revalidatePath('/admin/media');
  } catch (err) {
    console.warn('[revalidateMediaCache] Invoked outside active request context:', err);
  }
}

/**
 * Immediate read-your-own-writes cache update for Server Actions.
 */
export function updateActionCache(tag: CMSCacheTag): void {
  try {
    updateTag(tag);
  } catch (err) {
    console.warn('[updateActionCache] Invoked outside Server Action context:', err);
  }
}
