/**
 * PHILOZZ CMS — Content Validation & Sanitization Engine
 * Phase 16A: Dynamic CMS Architecture & Data Foundation
 */

import { CreateProjectInput } from '../models/project';
import { CreateArticleInput } from '../models/article';
import { MediaUploadPayload } from '../models/media';
import { HomepageConfigEntity, BrandInfoEntity } from '../models/site';
import {
  TechnologyEntity,
  ExpertiseAreaEntity,
  isSupportedLogoKey,
} from '../models/technology';

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'work',
  'notes',
  'blog',
  'projects',
  'login',
  'dashboard',
  'settings',
  'auth',
  '_next',
  'static',
  'images',
  'favicon',
  'robots',
  'sitemap',
  '404',
  '500',
]);

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Validates a URL slug for projects or articles.
 */
export function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug || typeof slug !== 'string') {
    return { valid: false, error: 'Slug is required and must be a string.' };
  }
  const trimmed = slug.trim();
  if (trimmed.length < 2) {
    return { valid: false, error: 'Slug must be at least 2 characters long.' };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: 'Slug cannot exceed 100 characters.' };
  }
  if (!SLUG_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: 'Slug must consist only of lowercase alphanumeric characters and hyphens (kebab-case).',
    };
  }
  if (RESERVED_SLUGS.has(trimmed.toLowerCase())) {
    return { valid: false, error: `Slug "${trimmed}" is a reserved system path.` };
  }
  return { valid: true };
}

/**
 * Generates a clean kebab-case slug from a title string.
 */
export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || `project-${Date.now()}`;
}

/**
 * Validates project creation and update inputs.
 */
export function validateProject(input: Partial<CreateProjectInput>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.title || input.title.trim().length < 2) {
    errors.title = 'Title must be at least 2 characters.';
  } else if (input.title.length > 120) {
    errors.title = 'Title cannot exceed 120 characters.';
  }

  if (input.slug !== undefined) {
    const slugCheck = validateSlug(input.slug);
    if (!slugCheck.valid && slugCheck.error) {
      errors.slug = slugCheck.error;
    }
  } else {
    errors.slug = 'Slug is required.';
  }

  if (!input.tagline || input.tagline.trim().length < 2) {
    errors.tagline = 'Tagline is required.';
  } else if (input.tagline.length > 200) {
    errors.tagline = 'Tagline cannot exceed 200 characters.';
  }

  if (!input.summary || input.summary.trim().length < 20) {
    errors.summary = 'Summary must be at least 20 characters.';
  }

  if (!input.challenge || input.challenge.trim().length < 20) {
    errors.challenge = 'Challenge description must be at least 20 characters.';
  }

  if (!input.architectureSummary || input.architectureSummary.trim().length < 20) {
    errors.architectureSummary = 'Architecture summary must be at least 20 characters.';
  }

  if (!Array.isArray(input.technologies) || input.technologies.length === 0) {
    errors.technologies = 'At least one technology must be specified.';
  }

  if (!Array.isArray(input.responsibilities) || input.responsibilities.length === 0) {
    errors.responsibilities = 'At least one responsibility item is required.';
  }

  if (input.status && !['draft', 'published', 'archived'].includes(input.status)) {
    errors.status = 'Status must be one of: draft, published, archived.';
  }

  if (input.demoUrl && !isValidUrl(input.demoUrl)) {
    errors.demoUrl = 'Demo URL must be a valid HTTP or HTTPS URL.';
  }

  if (input.githubUrl && !isValidUrl(input.githubUrl)) {
    errors.githubUrl = 'GitHub URL must be a valid HTTP or HTTPS URL.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates article creation and update inputs.
 */
export function validateArticle(input: Partial<CreateArticleInput>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.title || input.title.trim().length < 3) {
    errors.title = 'Title must be at least 3 characters.';
  } else if (input.title.length > 150) {
    errors.title = 'Title cannot exceed 150 characters.';
  }

  if (input.slug !== undefined) {
    const slugCheck = validateSlug(input.slug);
    if (!slugCheck.valid && slugCheck.error) {
      errors.slug = slugCheck.error;
    }
  } else {
    errors.slug = 'Slug is required.';
  }

  if (!input.category || input.category.trim().length < 2) {
    errors.category = 'Category is required.';
  }

  if (!input.abstract || input.abstract.trim().length < 10) {
    errors.abstract = 'Abstract must be at least 10 characters.';
  } else if (input.abstract.length > 500) {
    errors.abstract = 'Abstract cannot exceed 500 characters.';
  }

  if (!Array.isArray(input.sections) || input.sections.length === 0) {
    errors.sections = 'At least one article section is required.';
  } else {
    input.sections.forEach((sec, idx) => {
      if (!sec.heading || sec.heading.trim().length === 0) {
        errors[`sections[${idx}].heading`] = 'Section heading cannot be empty.';
      }
      if (!sec.content || sec.content.trim().length === 0) {
        errors[`sections[${idx}].content`] = 'Section content cannot be empty.';
      }
    });
  }

  if (input.status && !['draft', 'published', 'archived'].includes(input.status)) {
    errors.status = 'Status must be one of: draft, published, archived.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
  'application/pdf',
]);

export const MAX_MEDIA_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

/**
 * Validates media upload payload metadata.
 */
export function validateMediaUpload(payload: Partial<MediaUploadPayload>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!payload.filename || payload.filename.trim().length === 0) {
    errors.filename = 'Filename is required.';
  } else if (!/^[a-zA-Z0-9_\-.]+\.[a-zA-Z0-9]+$/.test(payload.filename)) {
    errors.filename = 'Filename contains invalid characters.';
  }

  if (!payload.mimeType || !ALLOWED_MIME_TYPES.has(payload.mimeType)) {
    errors.mimeType = `MIME type "${payload.mimeType}" is not supported. Allowed: JPEG, PNG, WEBP, SVG, GIF, PDF.`;
  }

  if (!payload.folder || !['projects', 'articles', 'photos', 'brand', 'general'].includes(payload.folder)) {
    errors.folder = 'Invalid target folder.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Helper to check URL validity.
 */
function isValidUrl(val: string): boolean {
  try {
    const url = new URL(val);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Basic HTML/Script tag sanitization to prevent XSS in editorial text.
 */
export function sanitizeRichText(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');
}

/**
 * Calculates human-readable reading time from article sections.
 */
export function calculateReadTime(sections: { content?: string; codeSnippet?: string }[]): string {
  if (!Array.isArray(sections) || sections.length === 0) {
    return '1 min read';
  }
  const words = sections.reduce((total, s) => {
    const textWords = (s.content || '').trim().split(/\s+/).filter(Boolean).length;
    const codeLines = (s.codeSnippet || '').split('\n').filter(Boolean).length;
    return total + textWords + codeLines * 5;
  }, 0);
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

/**
 * Checks if a URL or anchor href is safe to render in href attributes.
 * Allows relative paths ('/'), anchors ('#'), mailto:, tel:, and http:/https:.
 * Strictly rejects javascript:, data:, vbscript:, etc.
 */
export function isValidSafeUrl(val: string): boolean {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (trimmed.startsWith('#') || trimmed.startsWith('/') || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) {
    return !/^(javascript|data|vbscript):/i.test(trimmed);
  }
  try {
    const url = new URL(trimmed);
    return (
      (url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'mailto:' || url.protocol === 'tel:') &&
      !/^(javascript|data|vbscript):/i.test(trimmed)
    );
  } catch {
    return false;
  }
}

/**
 * Validates Homepage Section Configuration inputs.
 */
export function validateHomepageConfig(config: Partial<HomepageConfigEntity>): ValidationResult {
  const errors: Record<string, string> = {};

  if (config.hero) {
    const h = config.hero;
    if (!h.eyebrow || h.eyebrow.trim().length === 0) {
      errors['hero.eyebrow'] = 'Hero eyebrow badge is required.';
    } else if (h.eyebrow.length > 80) {
      errors['hero.eyebrow'] = 'Hero eyebrow cannot exceed 80 characters.';
    }

    if (!h.titleLine1 || h.titleLine1.trim().length === 0) {
      errors['hero.titleLine1'] = 'Headline Line 1 is required.';
    } else if (h.titleLine1.length > 50) {
      errors['hero.titleLine1'] = 'Headline Line 1 cannot exceed 50 characters.';
    }

    if (!h.titleLine2 || h.titleLine2.trim().length === 0) {
      errors['hero.titleLine2'] = 'Headline Line 2 is required.';
    } else if (h.titleLine2.length > 50) {
      errors['hero.titleLine2'] = 'Headline Line 2 cannot exceed 50 characters.';
    }

    if (!h.titleLine3 || h.titleLine3.trim().length === 0) {
      errors['hero.titleLine3'] = 'Headline Line 3 is required.';
    } else if (h.titleLine3.length > 50) {
      errors['hero.titleLine3'] = 'Headline Line 3 cannot exceed 50 characters.';
    }

    if (!h.description || h.description.trim().length < 20) {
      errors['hero.description'] = 'Hero description must be at least 20 characters.';
    } else if (h.description.length > 400) {
      errors['hero.description'] = 'Hero description cannot exceed 400 characters.';
    }

    if (!h.primaryCtaLabel || h.primaryCtaLabel.trim().length === 0) {
      errors['hero.primaryCtaLabel'] = 'Primary CTA label is required.';
    }

    if (h.primaryCtaHref && !isValidSafeUrl(h.primaryCtaHref)) {
      errors['hero.primaryCtaHref'] = 'Primary CTA href must be a valid safe URL or anchor.';
    }

    if (h.secondaryCtaHref && !isValidSafeUrl(h.secondaryCtaHref)) {
      errors['hero.secondaryCtaHref'] = 'Secondary CTA href must be a valid safe URL or anchor.';
    }
  }

  if (config.about) {
    const a = config.about;
    if (!a.sectionTag || a.sectionTag.trim().length === 0) {
      errors['about.sectionTag'] = 'About section tag is required.';
    }
    if (!a.titlePrefix || a.titlePrefix.trim().length === 0) {
      errors['about.titlePrefix'] = 'About title prefix is required.';
    }
    if (!a.narrativeParagraph1 || a.narrativeParagraph1.trim().length < 20) {
      errors['about.narrativeParagraph1'] = 'Biography paragraph 1 must be at least 20 characters.';
    }
    if (!a.narrativeParagraph2 || a.narrativeParagraph2.trim().length < 20) {
      errors['about.narrativeParagraph2'] = 'Biography paragraph 2 must be at least 20 characters.';
    }
    if (a.ctaHref && !isValidSafeUrl(a.ctaHref)) {
      errors['about.ctaHref'] = 'About CTA href must be a valid safe URL or anchor.';
    }
  }

  if (config.contact) {
    const c = config.contact;
    if (!c.headline || c.headline.trim().length === 0) {
      errors['contact.headline'] = 'Contact headline is required.';
    }
    if (!c.subheadline || c.subheadline.trim().length < 20) {
      errors['contact.subheadline'] = 'Contact subheadline/intro must be at least 20 characters.';
    }
    if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) {
      errors['contact.email'] = 'Contact email must be a valid email address.';
    }
    if (c.secondaryCtaHref && !isValidSafeUrl(c.secondaryCtaHref)) {
      errors['contact.secondaryCtaHref'] = 'Resume URL must be a valid safe URL.';
    }
    if (Array.isArray(c.socialLinks)) {
      for (let i = 0; i < c.socialLinks.length; i++) {
        const link = c.socialLinks[i];
        if (link.url && !isValidSafeUrl(link.url)) {
          errors[`contact.socialLinks.${i}.url`] = `Social link for ${link.platform || 'item'} must be a valid safe URL.`;
        }
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates Brand Information inputs.
 */
export function validateBrandInfo(brand: Partial<BrandInfoEntity>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!brand.name || brand.name.trim().length === 0) {
    errors.name = 'Brand name is required.';
  }
  if (!brand.developerName || brand.developerName.trim().length === 0) {
    errors.developerName = 'Developer name is required.';
  }
  if (brand.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(brand.email)) {
    errors.email = 'Valid email is required.';
  }
  if (brand.github && !isValidSafeUrl(brand.github)) {
    errors.github = 'GitHub URL must be a valid safe URL.';
  }
  if (brand.linkedin && !isValidSafeUrl(brand.linkedin)) {
    errors.linkedin = 'LinkedIn URL must be a valid safe URL.';
  }
  if (brand.cvUrl && !isValidSafeUrl(brand.cvUrl)) {
    errors.cvUrl = 'CV/Resume URL must be a valid safe URL.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates Technology entity inputs.
 */
export function validateTechnology(input: Partial<TechnologyEntity>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.name || input.name.trim().length === 0) {
    errors.name = 'Technology name is required.';
  } else if (input.name.trim().length < 2 || input.name.trim().length > 60) {
    errors.name = 'Technology name must be between 2 and 60 characters.';
  }

  if (!input.label || input.label.trim().length === 0) {
    errors.label = 'Display label is required.';
  } else if (input.label.trim().length > 30) {
    errors.label = 'Display label cannot exceed 30 characters.';
  }

  if (!input.category || input.category.trim().length === 0) {
    errors.category = 'Category is required.';
  } else if (input.category.trim().length > 50) {
    errors.category = 'Category cannot exceed 50 characters.';
  }

  if (!input.role || input.role.trim().length === 0) {
    errors.role = 'Engineering role summary is required.';
  } else if (input.role.trim().length < 5 || input.role.trim().length > 120) {
    errors.role = 'Engineering role must be between 5 and 120 characters.';
  }

  if (!input.description || input.description.trim().length === 0) {
    errors.description = 'Description is required.';
  } else if (input.description.trim().length < 10 || input.description.trim().length > 400) {
    errors.description = 'Description must be between 10 and 400 characters.';
  }

  if (!input.capability || input.capability.trim().length === 0) {
    errors.capability = 'Core capability details are required.';
  } else if (input.capability.trim().length < 5 || input.capability.trim().length > 120) {
    errors.capability = 'Core capability must be between 5 and 120 characters.';
  }

  if (!input.logoKey || input.logoKey.trim().length === 0) {
    errors.logoKey = 'Logo reference key is required.';
  }

  if (input.status && !['draft', 'published', 'archived'].includes(input.status)) {
    errors.status = 'Status must be one of: draft, published, archived.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates 9-slot Homepage Orbit assignments.
 * Enforces:
 * 1. Exactly 9 slots.
 * 2. Distinct IDs (no duplicates).
 * 3. All referenced technologies exist and are published.
 * 4. All referenced technologies have a supported logo in our logo registry.
 * 5. All referenced technologies have valid focus mode content.
 */
export function validateOrbitSlots(
  slotTechnologyIds: string[],
  availableTechnologies: TechnologyEntity[]
): ValidationResult {
  const errors: Record<string, string> = {};

  if (!Array.isArray(slotTechnologyIds) || slotTechnologyIds.length !== 9) {
    errors.slots = `Orbit composition requires exactly 9 technology slots (received ${slotTechnologyIds?.length || 0}).`;
    return { valid: false, errors };
  }

  const unique = new Set(slotTechnologyIds);
  if (unique.size !== 9) {
    errors.slots = 'Duplicate technologies detected. All 9 orbit slots must reference unique technologies.';
  }

  const techMap = new Map(availableTechnologies.map((t) => [t.id, t]));

  slotTechnologyIds.forEach((techId, idx) => {
    const tech = techMap.get(techId);
    if (!tech) {
      errors[`slot.${idx}`] = `Technology with ID "${techId}" does not exist in inventory.`;
      return;
    }

    if (tech.status !== 'published') {
      errors[`slot.${idx}`] = `Cannot assign "${tech.name}" (Slot ${idx + 1}): Only published technologies can occupy an Orbit slot (current status: ${tech.status}).`;
    }

    if (!isSupportedLogoKey(tech.logoKey)) {
      errors[`slot.${idx}`] = `Cannot assign "${tech.name}" (Slot ${idx + 1}): Unsupported logo key "${tech.logoKey}". A supported logo is required before assigning to an Orbit slot.`;
    }

    if (!tech.name || !tech.label || !tech.category || !tech.description || !tech.capability) {
      errors[`slot.${idx}`] = `Cannot assign "${tech.name || techId}" (Slot ${idx + 1}): Technology has incomplete Focus Mode content.`;
    }
  });

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates Expertise Area entity inputs.
 */
export function validateExpertiseArea(input: Partial<ExpertiseAreaEntity>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.name || input.name.trim().length === 0) {
    errors.name = 'Discipline name is required.';
  } else if (input.name.trim().length < 2 || input.name.trim().length > 60) {
    errors.name = 'Discipline name must be between 2 and 60 characters.';
  }

  if (!input.level || input.level.trim().length === 0) {
    errors.level = 'Skill level or classification is required.';
  }

  if (!input.description || input.description.trim().length === 0) {
    errors.description = 'Description is required.';
  } else if (input.description.trim().length < 10 || input.description.trim().length > 400) {
    errors.description = 'Description must be between 10 and 400 characters.';
  }

  if (!Array.isArray(input.coreConcepts) || input.coreConcepts.length === 0) {
    errors.coreConcepts = 'At least one core concept is required.';
  } else {
    input.coreConcepts.forEach((c, idx) => {
      if (!c || c.trim().length === 0) {
        errors[`coreConcepts.${idx}`] = 'Core concept cannot be empty.';
      }
    });
  }

  if (input.status && !['draft', 'published', 'archived'].includes(input.status)) {
    errors.status = 'Status must be one of: draft, published, archived.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}


