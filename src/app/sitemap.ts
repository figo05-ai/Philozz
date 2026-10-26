import type { MetadataRoute } from 'next';
import { getPublishedProjects, getPublishedNotes, SITE_CONFIG, parseIsoDate } from '@/lib/seoData';

/**
 * Technical SEO: Dynamic Sitemap Generation
 * Automatically enumerates published public canonical routes.
 * Future CMS integration: Replaces internal arrays via getPublished* functions with Firestore published documents.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, notes] = await Promise.all([
    getPublishedProjects(),
    getPublishedNotes(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_CONFIG.url}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_CONFIG.url}/projects`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_CONFIG.url}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];

  const projectRoutes: MetadataRoute.Sitemap = projects.map((p) => ({
    url: `${SITE_CONFIG.url}/work/${p.slug}`,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const noteRoutes: MetadataRoute.Sitemap = notes.map((n) => {
    const isoDate = parseIsoDate(n.date);
    return {
      url: `${SITE_CONFIG.url}/notes/${n.slug}`,
      ...(isoDate ? { lastModified: new Date(isoDate) } : {}),
      changeFrequency: 'monthly',
      priority: 0.8,
    };
  });

  return [...staticRoutes, ...projectRoutes, ...noteRoutes];
}
