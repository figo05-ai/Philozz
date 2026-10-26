import type { MetadataRoute } from 'next';
import { getPublishedProjects, getPublishedNotes, SITE_CONFIG, parseIsoDate } from '@/lib/seoData';
import { siteContentRepository } from '@/cms/repositories';

/**
 * Technical SEO: Dynamic Sitemap Generation
 * Automatically enumerates published public canonical routes.
 * Strictly excludes drafts and trashed content.
 * Prevents URL duplicates and uses meaningful content timestamps.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, notes, seoConfig] = await Promise.all([
    getPublishedProjects(),
    getPublishedNotes(),
    siteContentRepository.getSeoConfig(),
  ]);

  const siteLastModified = seoConfig.updatedAt ? new Date(seoConfig.updatedAt) : new Date();

  // Deduplication map: URL -> SitemapItem
  const urlMap = new Map<string, MetadataRoute.Sitemap[number]>();

  // 1. Authoritative static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_CONFIG.url}`,
      lastModified: siteLastModified,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_CONFIG.url}/projects`,
      lastModified: siteLastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_CONFIG.url}/blog`,
      lastModified: siteLastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];

  for (const route of staticRoutes) {
    urlMap.set(route.url, route);
  }

  // 2. Published Case Studies (strictly exclude drafts / trashed items)
  const publishedProjects = projects.filter((p) => p.status === 'published' && !p.isDeleted);
  for (const p of publishedProjects) {
    const projectUrl = `${SITE_CONFIG.url}/work/${p.slug}`;
    const timestampStr = p.updatedAt || p.createdAt;
    const lastModified = timestampStr ? new Date(timestampStr) : siteLastModified;

    urlMap.set(projectUrl, {
      url: projectUrl,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    });
  }

  // 3. Published Engineering Notes (strictly exclude drafts / trashed items)
  const publishedNotes = notes.filter((n) => n.status === 'published' && !n.isDeleted);
  for (const n of publishedNotes) {
    const noteUrl = `${SITE_CONFIG.url}/notes/${n.slug}`;
    const isoDate = n.updatedAt || n.publishedAt || parseIsoDate(n.date);
    const lastModified = isoDate ? new Date(isoDate) : siteLastModified;

    urlMap.set(noteUrl, {
      url: noteUrl,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    });
  }

  return Array.from(urlMap.values());
}

