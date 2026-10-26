/**
 * PHILOZZ CMS — Repositories Barrel & Configuration-Driven Provider
 * Phase 16D.0: Firestore Foundation & Safe Content Migration
 *
 * Exposes repository singletons. Caller code consumes IProjectRepository,
 * IArticleRepository, etc. without knowing whether the backend is local in-memory
 * or remote Firestore.
 *
 * Switching is controlled explicitly by CMS_DATA_SOURCE ('local' | 'firestore').
 * Default is 'local' to preserve all existing content while Firestore activation
 * is verified.
 * Failures in configured Firestore reads NEVER silently fall back to local data.
 */

import { LocalProjectRepository } from './local/localProjectRepository';
import { LocalArticleRepository } from './local/localArticleRepository';
import { LocalSiteContentRepository } from './local/localSiteContentRepository';
import { LocalMediaRepository } from './local/localMediaRepository';
import { LocalAuditLogRepository } from './local/localAuditLogRepository';

import { FirestoreProjectRepository } from './firestore/firestoreProjectRepository';
import { FirestoreArticleRepository } from './firestore/firestoreArticleRepository';
import { FirestoreSiteContentRepository } from './firestore/firestoreSiteContentRepository';
import { FirestoreMediaRepository } from './firestore/firestoreMediaRepository';
import { FirestoreAuditLogRepository } from './firestore/firestoreAuditLogRepository';

import {
  IProjectRepository,
  IArticleRepository,
  ISiteContentRepository,
  IMediaRepository,
  IAuditLogRepository,
} from './types';

export * from './types';
export * from './local/localProjectRepository';
export * from './local/localArticleRepository';
export * from './local/localSiteContentRepository';
export * from './local/localMediaRepository';
export * from './local/localAuditLogRepository';
export * from './firestore';

export type RepositoryDataSource = 'local' | 'firestore';

export function getRepositoryDataSource(): RepositoryDataSource {
  const raw = process.env.CMS_DATA_SOURCE;
  if (!raw || raw.trim() === '') {
    return 'local';
  }
  const envSource = raw.toLowerCase().trim();
  if (envSource === 'firestore') {
    return 'firestore';
  }
  if (envSource === 'local') {
    return 'local';
  }
  throw new Error(
    `Invalid CMS_DATA_SOURCE configuration: "${raw}". Supported values are "local" or "firestore".`
  );
}

export interface CMSRepositories {
  projects: IProjectRepository;
  articles: IArticleRepository;
  siteContent: ISiteContentRepository;
  media: IMediaRepository;
  auditLogs: IAuditLogRepository;
}

/**
 * Repository Factory: Explicitly construct local or Firestore instances
 */
export function createRepositories(source?: RepositoryDataSource): CMSRepositories {
  const targetSource = source ?? getRepositoryDataSource();

  if (targetSource === 'firestore') {
    return {
      projects: new FirestoreProjectRepository(),
      articles: new FirestoreArticleRepository(),
      siteContent: new FirestoreSiteContentRepository(),
      media: new FirestoreMediaRepository(),
      auditLogs: new FirestoreAuditLogRepository(),
    };
  }

  return {
    projects: new LocalProjectRepository(),
    articles: new LocalArticleRepository(),
    siteContent: new LocalSiteContentRepository(),
    media: new LocalMediaRepository(),
    auditLogs: new LocalAuditLogRepository(),
  };
}

// Global Singletons wired according to CMS_DATA_SOURCE
const activeRepositories = createRepositories();

export const projectRepository: IProjectRepository = activeRepositories.projects;
export const articleRepository: IArticleRepository = activeRepositories.articles;
export const siteContentRepository: ISiteContentRepository = activeRepositories.siteContent;
export const mediaRepository: IMediaRepository = activeRepositories.media;
export const auditLogRepository: IAuditLogRepository = activeRepositories.auditLogs;
