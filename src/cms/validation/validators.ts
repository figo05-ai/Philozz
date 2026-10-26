/**
 * PHILOZZ CMS — Content Validation & Sanitization Engine
 * Phase 16A: Dynamic CMS Architecture & Data Foundation
 */

import { CreateProjectInput } from '../models/project';
import { CreateArticleInput } from '../models/article';
import { MediaUploadPayload } from '../models/media';

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
