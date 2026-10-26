/**
 * PHILOZZ CMS — Firestore Architecture Contracts & Schemas
 * Phase 16A: Dynamic CMS Architecture & Data Foundation
 *
 * Defines collection schemas, document converters, composite query indexes,
 * and security rules blueprint for future Firebase Firestore integration.
 */

import { ProjectEntity } from '../../models/project';
import { ArticleEntity } from '../../models/article';

/**
 * Firestore Collection Names
 */
export const FIRESTORE_COLLECTIONS = {
  PROJECTS: 'projects',
  ARTICLES: 'articles',
  CATEGORIES: 'categories',
  TECHNOLOGIES: 'technologies',
  EXPERTISE_AREAS: 'expertise_areas',
  SITE_CONFIG: 'site_config',
  MEDIA: 'media',
  AUDIT_LOGS: 'audit_logs',
} as const;

export type FirestoreCollectionName =
  (typeof FIRESTORE_COLLECTIONS)[keyof typeof FIRESTORE_COLLECTIONS];

/**
 * Firestore Document IDs for singletons
 */
export const FIRESTORE_SINGLETON_DOCS = {
  BRAND_INFO: 'brand_info',
  HOMEPAGE_CONFIG: 'homepage_config',
  HOMEPAGE_CONFIG_DRAFT: 'homepage_config_draft',
  HOMEPAGE_CONFIG_PREV: 'homepage_config_prev',
  STACK_DETAILS: 'stack_details',
} as const;

/**
 * Composite Query Indexes Required by PHILOZZ CMS
 * To be declared in firestore.indexes.json
 */
export interface FirestoreIndexDefinition {
  collectionGroup: string;
  queryScope: 'COLLECTION';
  fields: Array<{
    fieldPath: string;
    order: 'ASCENDING' | 'DESCENDING';
  }>;
}

export const REQUIRED_FIRESTORE_INDEXES: FirestoreIndexDefinition[] = [
  // 1. Projects: Public ordered query (status == 'published' ORDER BY displayOrder ASC)
  {
    collectionGroup: 'projects',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'status', order: 'ASCENDING' },
      { fieldPath: 'displayOrder', order: 'ASCENDING' },
    ],
  },
  // 2. Projects: Featured query (status == 'published' AND featured == true ORDER BY featuredOrder ASC)
  {
    collectionGroup: 'projects',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'status', order: 'ASCENDING' },
      { fieldPath: 'featured', order: 'ASCENDING' },
      { fieldPath: 'featuredOrder', order: 'ASCENDING' },
    ],
  },
  // 3. Articles: Public chronologically ordered query (status == 'published' ORDER BY publishedAt DESC)
  {
    collectionGroup: 'articles',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'status', order: 'ASCENDING' },
      { fieldPath: 'publishedAt', order: 'DESCENDING' },
    ],
  },
  // 4. Articles: Category filter query (status == 'published' AND archiveCategory == X ORDER BY publishedAt DESC)
  {
    collectionGroup: 'articles',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'status', order: 'ASCENDING' },
      { fieldPath: 'archiveCategory', order: 'ASCENDING' },
      { fieldPath: 'publishedAt', order: 'DESCENDING' },
    ],
  },
  // 5. Media: Folder filter query (folder == X ORDER BY createdAt DESC)
  {
    collectionGroup: 'media',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'folder', order: 'ASCENDING' },
      { fieldPath: 'createdAt', order: 'DESCENDING' },
    ],
  },
  // 6. Audit Logs: Entity timeline (entityType == X AND entityId == Y ORDER BY timestamp DESC)
  {
    collectionGroup: 'audit_logs',
    queryScope: 'COLLECTION',
    fields: [
      { fieldPath: 'entityType', order: 'ASCENDING' },
      { fieldPath: 'entityId', order: 'ASCENDING' },
      { fieldPath: 'timestamp', order: 'DESCENDING' },
    ],
  },
];

/**
 * Generic Firestore Data Converter Interface
 */
export interface TypedFirestoreConverter<T> {
  toFirestore(modelObject: T): Record<string, unknown>;
  fromFirestore(snapshotData: Record<string, unknown>, id: string): T;
}

/**
 * Project Entity Firestore Converter
 */
export const projectFirestoreConverter: TypedFirestoreConverter<ProjectEntity> = {
  toFirestore(project: ProjectEntity): Record<string, unknown> {
    return {
      slug: project.slug,
      title: project.title,
      tagline: project.tagline,
      role: project.role,
      period: project.period,
      clientOrContext: project.clientOrContext,
      category: project.category,
      archiveCategory: project.archiveCategory,
      categoryLabel: project.categoryLabel,
      technologies: project.technologies,
      primaryTechs: project.primaryTechs,
      summary: project.summary,
      shortSummary: project.shortSummary,
      challenge: project.challenge,
      responsibilities: project.responsibilities,
      architectureSummary: project.architectureSummary,
      architectureNodes: project.architectureNodes,
      technicalDecisions: project.technicalDecisions,
      demoVisualType: project.demoVisualType,
      lessonsLearned: project.lessonsLearned,
      hasLiveDemo: project.hasLiveDemo,
      demoUrl: project.demoUrl ?? null,
      githubUrl: project.githubUrl ?? null,
      status: project.status,
      featured: project.featured,
      featuredOrder: project.featuredOrder ?? null,
      displayOrder: project.displayOrder,
      thumbnailUrl: project.thumbnailUrl ?? null,
      ogImageUrl: project.ogImageUrl ?? null,
      seoTitle: project.seoTitle ?? null,
      seoDescription: project.seoDescription ?? null,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      publishedAt: project.publishedAt ?? null,
      isDeleted: Boolean(project.isDeleted),
      deletedAt: project.deletedAt ?? null,
    };
  },
  fromFirestore(data: Record<string, unknown>, id: string): ProjectEntity {
    return {
      id,
      slug: (data.slug as string) || id,
      title: (data.title as string) || '',
      tagline: (data.tagline as string) || '',
      role: (data.role as string) || '',
      period: (data.period as string) || '',
      clientOrContext: (data.clientOrContext as string) || '',
      category: (data.category as string) || '',
      archiveCategory: (data.archiveCategory as string) || 'backend',
      categoryLabel: (data.categoryLabel as string) || '',
      technologies: Array.isArray(data.technologies) ? (data.technologies as string[]) : [],
      primaryTechs: Array.isArray(data.primaryTechs) ? (data.primaryTechs as string[]) : [],
      summary: (data.summary as string) || '',
      shortSummary: (data.shortSummary as string) || '',
      challenge: (data.challenge as string) || '',
      responsibilities: Array.isArray(data.responsibilities) ? (data.responsibilities as string[]) : [],
      architectureSummary: (data.architectureSummary as string) || '',
      architectureNodes: Array.isArray(data.architectureNodes) ? (data.architectureNodes as ProjectEntity['architectureNodes']) : [],
      technicalDecisions: Array.isArray(data.technicalDecisions) ? (data.technicalDecisions as ProjectEntity['technicalDecisions']) : [],
      demoVisualType: (data.demoVisualType as ProjectEntity['demoVisualType']) || 'skillup-horizon',
      lessonsLearned: Array.isArray(data.lessonsLearned) ? (data.lessonsLearned as string[]) : [],
      hasLiveDemo: Boolean(data.hasLiveDemo),
      demoUrl: (data.demoUrl as string) || undefined,
      githubUrl: (data.githubUrl as string) || undefined,
      status: (data.status as ProjectEntity['status']) || 'draft',
      featured: Boolean(data.featured),
      featuredOrder: (data.featuredOrder as number) || undefined,
      displayOrder: (data.displayOrder as number) || 1,
      thumbnailUrl: (data.thumbnailUrl as string) || undefined,
      ogImageUrl: (data.ogImageUrl as string) || undefined,
      seoTitle: (data.seoTitle as string) || undefined,
      seoDescription: (data.seoDescription as string) || undefined,
      createdAt: (data.createdAt as string) || new Date().toISOString(),
      updatedAt: (data.updatedAt as string) || new Date().toISOString(),
      publishedAt: (data.publishedAt as string) || undefined,
      isDeleted: Boolean(data.isDeleted),
      deletedAt: (data.deletedAt as string) || undefined,
    };
  },
};

/**
 * Article Entity Firestore Converter
 */
export const articleFirestoreConverter: TypedFirestoreConverter<ArticleEntity> = {
  toFirestore(article: ArticleEntity): Record<string, unknown> {
    return {
      slug: article.slug,
      title: article.title,
      category: article.category,
      archiveCategory: article.archiveCategory,
      readTime: article.readTime,
      date: article.date,
      publishedAt: article.publishedAt ?? null,
      featured: article.featured,
      featuredOrder: article.featuredOrder ?? null,
      tags: article.tags,
      abstract: article.abstract,
      sections: article.sections,
      status: article.status,
      ogImageUrl: article.ogImageUrl ?? null,
      coverImageUrl: article.coverImageUrl ?? null,
      seoTitle: article.seoTitle ?? null,
      seoDescription: article.seoDescription ?? null,
      displayOrder: article.displayOrder,
      version: article.version ?? 1,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      isDeleted: Boolean(article.isDeleted),
      deletedAt: article.deletedAt ?? null,
    };
  },
  fromFirestore(data: Record<string, unknown>, id: string): ArticleEntity {
    return {
      id,
      slug: (data.slug as string) || id,
      title: (data.title as string) || '',
      category: (data.category as string) || '',
      archiveCategory: (data.archiveCategory as string) || 'backend',
      readTime: (data.readTime as string) || '5 min read',
      date: (data.date as string) || '',
      publishedAt: (data.publishedAt as string) || undefined,
      featured: Boolean(data.featured),
      featuredOrder: (data.featuredOrder as number) || undefined,
      tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
      abstract: (data.abstract as string) || '',
      sections: Array.isArray(data.sections) ? (data.sections as ArticleEntity['sections']) : [],
      status: (data.status as ArticleEntity['status']) || 'draft',
      ogImageUrl: (data.ogImageUrl as string) || undefined,
      coverImageUrl: (data.coverImageUrl as string) || undefined,
      seoTitle: (data.seoTitle as string) || undefined,
      seoDescription: (data.seoDescription as string) || undefined,
      displayOrder: (data.displayOrder as number) || 1,
      version: typeof data.version === 'number' ? data.version : 1,
      createdAt: (data.createdAt as string) || new Date().toISOString(),
      updatedAt: (data.updatedAt as string) || new Date().toISOString(),
      isDeleted: Boolean(data.isDeleted),
      deletedAt: (data.deletedAt as string) || undefined,
    };
  },
};

/**
 * Blueprint for Firestore Security Rules
 * For implementation when Cloud Firestore is provisioned in subsequent phase.
 */
export const FIRESTORE_SECURITY_RULES_BLUEPRINT = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && request.auth.token.admin == true;
    }

    // Projects collection: Public read only for published projects; admin has full access
    match /projects/{projectId} {
      allow read: if resource.data.status == 'published' || isAdmin();
      allow write: if isAdmin();
    }

    // Articles collection: Public read only for published notes; admin has full access
    match /articles/{articleId} {
      allow read: if resource.data.status == 'published' || isAdmin();
      allow write: if isAdmin();
    }

    // Categories: Public read, admin write
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Technologies: Public read, admin write
    match /technologies/{techId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Expertise Areas: Public read, admin write
    match /expertise_areas/{areaId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Site Configuration (Singletons): Public read, admin write
    match /site_config/{configId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Media library: Public read, admin write
    match /media/{mediaId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Audit logs: Strictly admin only (read & append-only write)
    match /audit_logs/{logId} {
      allow read: if isAdmin();
      allow create: if isAdmin();
      allow update, delete: if false; // Audit logs are immutable
    }
  }
}
`.trim();
