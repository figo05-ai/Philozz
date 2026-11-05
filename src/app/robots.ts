import type { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/lib/seoData';
import { siteContentRepository } from '@/cms/repositories';

/**
 * Technical SEO: robots.txt Generation
 * Controls crawler directives, protects private routes, and links to production sitemap.
 * Dynamically driven by repository SEO configuration.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const seoConfig = await siteContentRepository.getSeoConfig();

  const disallowList: string[] = [];
  if (seoConfig.disallowApiRoutes) {
    disallowList.push('/api/');
  }
  if (seoConfig.disallowAdminRoutes) {
    disallowList.push('/admin/');
  }

  // If indexing is disabled globally
  if (!seoConfig.allowIndexing) {
    return {
      rules: [
        {
          userAgent: '*',
          disallow: '/',
        },
      ],
      sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
      host: SITE_CONFIG.url,
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: disallowList,
      },
    ],
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
    host: SITE_CONFIG.url,
  };
}

