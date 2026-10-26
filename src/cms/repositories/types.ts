/**
 * PHILOZZ CMS — Repository Contracts & Interfaces
 * Phase 16A: Dynamic CMS Architecture & Data Foundation
 */

import {
  ProjectEntity,
  CreateProjectInput,
  UpdateProjectInput,
  ContentStatus,
} from '../models/project';
import {
  ArticleEntity,
  CreateArticleInput,
  UpdateArticleInput,
  BlogCategoryEntity,
} from '../models/article';
import {
  BrandInfoEntity,
  HomepageConfigEntity,
} from '../models/site';
import {
  TechnologyEntity,
  ExpertiseAreaEntity,
  StackDetailsEntity,
} from '../models/technology';
import {
  MediaAssetEntity,
  MediaFilterOptions,
} from '../models/media';
import {
  AuditLogEntity,
  CreateAuditLogInput,
} from '../models/audit';

export interface IProjectRepository {
  getAll(options?: {
    status?: ContentStatus;
    featuredOnly?: boolean;
    includeDeleted?: boolean;
  }): Promise<ProjectEntity[]>;
  getBySlug(slug: string, options?: { includeDeleted?: boolean }): Promise<ProjectEntity | null>;
  getById(id: string, options?: { includeDeleted?: boolean }): Promise<ProjectEntity | null>;
  create(data: CreateProjectInput): Promise<ProjectEntity>;
  update(id: string, data: UpdateProjectInput): Promise<ProjectEntity>;
  delete(id: string, permanent?: boolean): Promise<boolean>;
  softDelete(id: string): Promise<boolean>;
  restore(id: string): Promise<boolean>;
  reorder(orderedIds: string[]): Promise<boolean>;
  setFeaturedSlots(slotProjectIds: [string, string, string]): Promise<boolean>;
}

export interface IArticleRepository {
  getAll(options?: {
    status?: ContentStatus;
    category?: string;
    featuredOnly?: boolean;
    includeDeleted?: boolean;
  }): Promise<ArticleEntity[]>;
  getBySlug(slug: string, options?: { includeDeleted?: boolean }): Promise<ArticleEntity | null>;
  getById(id: string, options?: { includeDeleted?: boolean }): Promise<ArticleEntity | null>;
  create(data: CreateArticleInput): Promise<ArticleEntity>;
  update(id: string, data: UpdateArticleInput): Promise<ArticleEntity>;
  delete(id: string, permanent?: boolean): Promise<boolean>;
  softDelete(id: string): Promise<boolean>;
  restore(id: string): Promise<boolean>;
  reorder(orderedIds: string[]): Promise<boolean>;
  setHomepageJournalSlots(slots: [string, string, string, string]): Promise<boolean>;
  getCategories(): Promise<BlogCategoryEntity[]>;
  getCategoryById(id: string): Promise<BlogCategoryEntity | null>;
  createCategory(category: BlogCategoryEntity): Promise<BlogCategoryEntity>;
  updateCategory(id: string, patch: Partial<BlogCategoryEntity>): Promise<BlogCategoryEntity>;
  deleteCategory(id: string): Promise<boolean>;
}

export interface ISiteContentRepository {
  getBrandInfo(): Promise<BrandInfoEntity>;
  updateBrandInfo(data: Partial<BrandInfoEntity>): Promise<BrandInfoEntity>;
  getHomepageConfig(): Promise<HomepageConfigEntity>;
  updateHomepageConfig(data: Partial<HomepageConfigEntity>): Promise<HomepageConfigEntity>;
  getTechnologies(): Promise<TechnologyEntity[]>;
  getExpertiseAreas(): Promise<ExpertiseAreaEntity[]>;
  getStackDetails(): Promise<StackDetailsEntity>;
}

export interface IMediaRepository {
  getAll(options?: MediaFilterOptions): Promise<MediaAssetEntity[]>;
  getById(id: string): Promise<MediaAssetEntity | null>;
  create(asset: Omit<MediaAssetEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<MediaAssetEntity>;
  update(id: string, data: Partial<MediaAssetEntity>): Promise<MediaAssetEntity>;
  delete(id: string): Promise<boolean>;
}

export interface IAuditLogRepository {
  record(input: CreateAuditLogInput): Promise<AuditLogEntity>;
  getRecent(limit?: number): Promise<AuditLogEntity[]>;
  getByEntity(entityType: string, entityId: string): Promise<AuditLogEntity[]>;
}
