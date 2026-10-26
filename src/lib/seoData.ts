import { BRAND_INFO } from '@/data/portfolioData';
import { ProjectItem, NoteItem } from '@/types';
import { projectRepository, articleRepository } from '@/cms/repositories';

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
 * Data abstraction layer for SEO metadata, dynamic routes, and sitemap generation.
 * Wired directly through the CMS repository layer.
 */
export async function getPublishedProjects(): Promise<ProjectItem[]> {
  return projectRepository.getAll({ status: 'published' });
}

export async function getProjectBySlug(slug: string): Promise<ProjectItem | undefined> {
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
export async function getPublishedNotes(): Promise<NoteItem[]> {
  return articleRepository.getAll({ status: 'published' });
}

export async function getNoteBySlug(slug: string): Promise<NoteItem | undefined> {
  const note = await articleRepository.getBySlug(slug);
  return note ?? undefined;
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
export function getPersonAndWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${SITE_CONFIG.url}/#person`,
        name: SITE_CONFIG.developerName,
        alternateName: SITE_CONFIG.name,
        jobTitle: SITE_CONFIG.role,
        description: SITE_CONFIG.description,
        url: SITE_CONFIG.url,
        image: `${SITE_CONFIG.url}/images/felopater-portrait-thinking.jpg`,
        sameAs: [SITE_CONFIG.github, SITE_CONFIG.linkedin],
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
          addressLocality: 'Alexandria',
          addressCountry: 'EG',
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_CONFIG.url}/#website`,
        url: SITE_CONFIG.url,
        name: SITE_CONFIG.name,
        description: SITE_CONFIG.description,
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
export function getCaseStudyJsonLd(project: ProjectItem) {
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
      name: SITE_CONFIG.developerName,
      alternateName: SITE_CONFIG.name,
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
export function getNoteJsonLd(note: NoteItem) {
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
      name: SITE_CONFIG.developerName,
      alternateName: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
    publisher: {
      '@type': 'Person',
      name: SITE_CONFIG.developerName,
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
