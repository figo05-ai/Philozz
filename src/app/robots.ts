import type { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/lib/seoData';

/**
 * Technical SEO: robots.txt Generation
 * Controls crawler directives and points to production sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
    host: SITE_CONFIG.url,
  };
}
