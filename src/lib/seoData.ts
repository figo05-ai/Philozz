import { BRAND_INFO } from '@/data/portfolioData';
import { ProjectItem, NoteItem } from '@/types';
import { ProjectEntity } from '@/cms/models/project';
import { ArticleEntity } from '@/cms/models/article';
import { projectRepository, articleRepository, siteContentRepository } from '@/cms/repositories';
import { BrandInfoEntity, SiteSeoConfigEntity } from '@/cms/models/site';

export const SITE_CONFIG = {
  name: BRAND_INFO.name, // 'PHILOZZ'
  developerName: BRAND_INFO.developerName, // 'Felopater Nabil'
  role: BRAND_INFO.role, // 'Full-Stack Software Engineer'
  tagline: BRAND_INFO.tagline, // 'Full-Stack Engineer. Backend at Heart.'
  url: 'https://philozz.com',
  description:
    'Portfolio and Engineering Journal of Felopater Nabil (PHILOZZ), a Backend-focused Full-Stack Software Engineer specializing in Laravel, system architecture, database optimization, and high-concurrency queue topologies.',
  ogImage: 'https://philozz.com/images/philozz-cinematic-hero.png',
  locale: 'en_US',
  github: BRAND_INFO.github,
  linkedin: BRAND_INFO.linkedin,
  email: BRAND_INFO.email,
  location: BRAND_INFO.location,
} as const;

/**
 * Technical SEO: Fetch active published (or draft preview) SEO configuration.
 */
export async function getDynamicSeoConfig(options?: { preview?: boolean }): Promise<SiteSeoConfigEntity> {
  return siteContentRepository.getSeoConfig(options);
}

/**
 * Data abstraction layer for SEO metadata, dynamic routes, and sitemap generation.
 * Wired directly through the CMS repository layer.
 */
export async function getPublishedProjects(): Promise<ProjectEntity[]> {
  return projectRepository.getAll({ status: 'published' });
}

export async function getProjectBySlug(slug: string): Promise<ProjectEntity | undefined> {
  const project = await projectRepository.getBySlug(slug);
  if (!project || project.status !== 'published' || project.isDeleted) {
    return undefined;
  }
  return project;
}

/**
 * Data abstraction layer for published notes/articles.
 * Wired directly through the CMS repository layer.
 */
export async function getPublishedNotes(): Promise<ArticleEntity[]> {
  return articleRepository.getAll({ status: 'published' });
}

export async function getNoteBySlug(slug: string): Promise<ArticleEntity | undefined> {
  const note = await articleRepository.getBySlug(slug);
  if (!note || note.status !== 'published' || note.isDeleted) {
    return undefined;
  }
  return note;
}

/**
 * Safely parse date strings from note metadata into ISO 8601 strings.
 * Falls back to undefined if date is not parseable to avoid fabricating invalid timestamps.
 */
export function parseIsoDate(dateStr?: string): string | undefined {
  if (!dateStr) return undefined;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

/**
 * Generates Schema.org JSON-LD for the primary person / website.
 */
export function getPersonAndWebSiteJsonLd(
  brandInfo?: BrandInfoEntity,
  seoConfig?: SiteSeoConfigEntity
) {
  const devName = brandInfo?.developerName || SITE_CONFIG.developerName;
  const brandName = brandInfo?.name || SITE_CONFIG.name;
  const role = brandInfo?.role || SITE_CONFIG.role;
  const desc = seoConfig?.defaultDescription || brandInfo?.statement || SITE_CONFIG.description;
  const github = brandInfo?.github || SITE_CONFIG.github;
  const linkedin = brandInfo?.linkedin || SITE_CONFIG.linkedin;
  const locality = brandInfo?.location ? brandInfo.location.split(',')[0].trim() : 'Alexandria';

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${SITE_CONFIG.url}/#person`,
        name: devName,
        alternateName: brandName,
        jobTitle: role,
        description: desc,
        url: SITE_CONFIG.url,
        image: `${SITE_CONFIG.url}/images/felopater-portrait-thinking.jpg`,
        sameAs: [github, linkedin],
        knowsAbout: [
          'Backend Engineering',
          'Laravel',
          'PHP',
          'MySQL Database Optimization',
          'Redis Queues & Horizon',
          'System Design',
          'Docker & Containerization',
          'RESTful API Architecture',
          'React & TypeScript',
          'Linux Systems',
        ],
        address: {
          '@type': 'PostalAddress',
          addressLocality: locality,
          addressCountry: 'EG',
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_CONFIG.url}/#website`,
        url: SITE_CONFIG.url,
        name: brandName,
        description: desc,
        publisher: {
          '@id': `${SITE_CONFIG.url}/#person`,
        },
        inLanguage: 'en-US',
      },
    ],
  };
}

/**
 * Generates Schema.org JSON-LD for an engineering Case Study.
 */
export function getCaseStudyJsonLd(project: ProjectEntity | ProjectItem, brandInfo?: BrandInfoEntity) {
  const devName = brandInfo?.developerName || SITE_CONFIG.developerName;
  const brandName = brandInfo?.name || SITE_CONFIG.name;

  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    '@id': `${SITE_CONFIG.url}/work/${project.slug}#case-study`,
    headline: `${project.title}: ${project.tagline}`,
    description: project.summary,
    url: `${SITE_CONFIG.url}/work/${project.slug}`,
    inLanguage: 'en-US',
    author: {
      '@type': 'Person',
      name: devName,
      alternateName: brandName,
      url: SITE_CONFIG.url,
    },
    about: {
      '@type': 'SoftwareSourceCode',
      name: project.title,
      description: project.summary,
      programmingLanguage: project.technologies,
    },
    keywords: project.technologies.join(', '),
  };
}

/**
 * Generates Schema.org JSON-LD for an Engineering Journal / Blog Note.
 */
export function getNoteJsonLd(note: ArticleEntity | NoteItem, brandInfo?: BrandInfoEntity) {
  const devName = brandInfo?.developerName || SITE_CONFIG.developerName;
  const brandName = brandInfo?.name || SITE_CONFIG.name;
  const publishedDate = parseIsoDate(note.date);

  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    '@id': `${SITE_CONFIG.url}/notes/${note.slug}#article`,
    headline: note.title,
    description: note.abstract,
    url: `${SITE_CONFIG.url}/notes/${note.slug}`,
    inLanguage: 'en-US',
    author: {
      '@type': 'Person',
      name: devName,
      alternateName: brandName,
      url: SITE_CONFIG.url,
    },
    publisher: {
      '@type': 'Person',
      name: devName,
      url: SITE_CONFIG.url,
    },
    ...(publishedDate ? { datePublished: publishedDate } : {}),
    keywords: note.tags ? note.tags.join(', ') : note.category,
    articleSection: note.category,
  };
}

/**
 * Generates Schema.org BreadcrumbList JSON-LD.
 */
export function getBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_CONFIG.url}${item.url}`,
    })),
  };
}
