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
  headline: string;
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
}

export interface HomepageConfigEntity {
  id: 'homepage_config';
  hero: HeroSectionConfig;
  about: AboutSectionConfig;
  contact: ContactSectionConfig;
  updatedAt: string;
}

export type UpdateHomepageConfigInput = Partial<HomepageConfigEntity>;
