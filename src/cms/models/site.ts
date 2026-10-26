/**
 * PHILOZZ CMS — Site Content & Section Configuration Models
 * Phase 16A: Dynamic CMS Architecture & Data Foundation
 */

export interface BrandInfoEntity {
  id: 'brand_info';
  name: string; // 'PHILOZZ'
  developerName: string; // 'Felopater Nabil'
  role: string; // 'Full-Stack Software Engineer'
  specialization: string;
  tagline: string;
  statement: string;
  philosophy: string;
  transformationHeadline: string;
  finaleHeadline: string;
  email: string;
  brandEmail: string;
  domain: string;
  phone: string;
  location: string;
  github: string;
  linkedin: string;
  cvAvailable: boolean;
  cvUrl: string;
  experienceYears: string;
  projectsCount: string;
  curiosity: string;
  status: string;
  isDemoEnvironment: boolean;
  updatedAt: string;
}

export interface HeroSectionConfig {
  eyebrow: string; // 'FULL-STACK DEVELOPER'
  titleLine1: string; // 'Full-Stack'
  titleLine2: string; // 'Engineer.'
  titleLine3: string; // 'Backend at Heart.'
  description: string;
  primaryCtaLabel: string; // 'View My Work'
  primaryCtaHref: string; // '#projects'
  secondaryCtaLabel: string; // "Let's Talk"
  secondaryCtaHref: string; // '#contact'
  signatureWords: string[]; // ['Code', 'Build', 'Improve', 'Repeat']
  signatureCredentials: string[]; // ['CLEAN CODE', 'SCALABLE SYSTEMS', 'REAL IMPACT']
  heroImageUrl: string;
  experienceYears?: string;
  projectsCount?: string;
  curiosity?: string;
}

export interface MosaicCardEntity {
  id: 'thinking' | 'building' | 'journey';
  badge: string;
  title: string;
  subtitle: string;
  imageUrl?: string;
  imageAlt?: string;
  // Code snippet card specific fields
  ideFilename?: string;
  ideLang?: string;
  ideSnippet?: string;
  telemetryRoute?: string;
  telemetryStatus?: string;
  // Timeline card specific fields
  timelineItems?: Array<{
    heading: string;
    info: string;
    isActive?: boolean;
  }>;
}

export interface AboutSectionConfig {
  sectionTag: string; // 'ABOUT ME'
  titlePrefix: string; // 'The Engineer'
  narrativeParagraph1: string;
  narrativeParagraph2: string;
  badges: Array<{
    icon: 'MapPin' | 'Layers' | 'Code2';
    label: string;
  }>;
  ctaLabel: string; // 'More About Me'
  ctaHref: string; // '#skills'
  mosaicCards: MosaicCardEntity[];
}

export interface ContactSectionConfig {
  sectionTag?: string; // "LET'S BUILD SOMETHING GREAT"
  headline: string; // 'Get In Touch'
  subheadline: string;
  email: string;
  phone: string;
  location: string;
  socialLinks: Array<{
    platform: string;
    url: string;
    label: string;
  }>;
  footerTagline: string;
  primaryCtaLabel?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  portraitImageUrl?: string;
  scriptBadgeText?: string;
  copyrightNotice?: string;
}

export interface HomepageConfigEntity {
  id: 'homepage_config';
  status?: 'draft' | 'published';
  version?: number;
  hero: HeroSectionConfig;
  about: AboutSectionConfig;
  contact: ContactSectionConfig;
  updatedAt: string;
  publishedAt?: string;
}

export type UpdateHomepageConfigInput = Partial<HomepageConfigEntity>;

export interface PageSeoOverride {
  title?: string;
  description?: string;
  ogImageUrl?: string;
}

export interface SiteSeoConfigEntity {
  id: 'seo_config';
  status: 'draft' | 'published';
  version: number;
  siteTitle: string;
  titleTemplate: string;
  defaultDescription: string;
  defaultKeywords: string[];
  defaultOgImage: string;
  twitterCard: 'summary_large_image' | 'summary';
  twitterCreator: string;
  locale: string;
  homepage?: PageSeoOverride;
  projectsArchive?: PageSeoOverride;
  blogArchive?: PageSeoOverride;
  allowIndexing: boolean;
  disallowAdminRoutes: boolean;
  disallowApiRoutes: boolean;
  updatedAt: string;
  publishedAt?: string;
}

export type UpdateSiteSeoConfigInput = Partial<
  Omit<SiteSeoConfigEntity, 'id' | 'version' | 'updatedAt' | 'publishedAt'>
>;

export const DEFAULT_SEO_CONFIG: SiteSeoConfigEntity = {
  id: 'seo_config',
  status: 'published',
  version: 1,
  siteTitle: 'PHILOZZ // Full-Stack Software Engineer',
  titleTemplate: '%s // PHILOZZ',
  defaultDescription:
    'Portfolio and Engineering Journal of Felopater Nabil (PHILOZZ), a Backend-focused Full-Stack Software Engineer specializing in Laravel, system architecture, database optimization, and high-concurrency queue topologies.',
  defaultKeywords: [
    'Backend Engineer',
    'System Design',
    'Software Architecture',
    'Laravel',
    'PostgreSQL',
    'MySQL',
    'Redis Queues',
    'React',
    'TypeScript',
    'Docker',
    'PHP 8.3',
  ],
  defaultOgImage: '/images/philozz-cinematic-hero.png',
  twitterCard: 'summary_large_image',
  twitterCreator: '@philozz',
  locale: 'en_US',
  homepage: {
    title: 'PHILOZZ // Full-Stack Software Engineer',
    description:
      'Portfolio and Engineering Journal of Felopater Nabil (PHILOZZ), a Backend-focused Full-Stack Software Engineer specializing in Laravel, system architecture, database optimization, and high-concurrency queue topologies.',
    ogImageUrl: '/images/philozz-cinematic-hero.png',
  },
  projectsArchive: {
    title: 'Selected Engineering Projects',
    description:
      'A collection of verified production software systems, backend architectures, high-concurrency queue platforms, and database designs engineered by Felopater Nabil (PHILOZZ).',
    ogImageUrl: '/images/philozz-cinematic-hero.png',
  },
  blogArchive: {
    title: 'Engineering Journal & Technical Notes',
    description:
      'Engineering notes, architectural postmortems, database query optimizations, and backend best practices written by Felopater Nabil (PHILOZZ).',
    ogImageUrl: '/images/philozz-cinematic-hero.png',
  },
  allowIndexing: true,
  disallowAdminRoutes: true,
  disallowApiRoutes: true,
  updatedAt: '2026-04-15T00:00:00.000Z',
  publishedAt: '2026-04-15T00:00:00.000Z',
};
