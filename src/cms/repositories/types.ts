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
  SiteSettingsEntity,
  HomepageConfigEntity,
  SiteSeoConfigEntity,
} from '../models/site';
import {
  TechnologyEntity,
  CreateTechnologyInput,
  UpdateTechnologyInput,
  ExpertiseAreaEntity,
  CreateExpertiseAreaInput,
  UpdateExpertiseAreaInput,
  OrbitSlotsTuple,
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
  // Brand & Global Site Settings
  getBrandInfo(options?: { preview?: boolean }): Promise<BrandInfoEntity>;
  getBrandInfoDraft(): Promise<BrandInfoEntity | null>;
  saveBrandInfoDraft(data: Partial<BrandInfoEntity>): Promise<BrandInfoEntity>;
  publishBrandInfo(data?: Partial<BrandInfoEntity>): Promise<BrandInfoEntity>;
  rollbackBrandInfo(): Promise<BrandInfoEntity>;
  updateBrandInfo(data: Partial<BrandInfoEntity>): Promise<BrandInfoEntity>;

  // Site Settings Aliases
  getSiteSettings(options?: { preview?: boolean }): Promise<SiteSettingsEntity>;
  getSiteSettingsDraft(): Promise<SiteSettingsEntity | null>;
  saveSiteSettingsDraft(data: Partial<SiteSettingsEntity>): Promise<SiteSettingsEntity>;
  publishSiteSettings(data?: Partial<SiteSettingsEntity>): Promise<SiteSettingsEntity>;
  rollbackSiteSettings(): Promise<SiteSettingsEntity>;

  getHomepageConfig(options?: { preview?: boolean }): Promise<HomepageConfigEntity>;
  getHomepageConfigDraft(): Promise<HomepageConfigEntity | null>;
  saveHomepageConfigDraft(data: Partial<HomepageConfigEntity>): Promise<HomepageConfigEntity>;
  publishHomepageConfig(data?: Partial<HomepageConfigEntity>): Promise<HomepageConfigEntity>;
  rollbackHomepageConfig(): Promise<HomepageConfigEntity>;
  updateHomepageConfig(data: Partial<HomepageConfigEntity>): Promise<HomepageConfigEntity>;

  // Technologies (Inventory & Focus Mode Content)
  getTechnologies(options?: { preview?: boolean }): Promise<TechnologyEntity[]>;
  getAllTechnologies(options?: { includeArchived?: boolean; preview?: boolean }): Promise<TechnologyEntity[]>;
  getTechnologyById(id: string): Promise<TechnologyEntity | null>;
  createTechnology(data: CreateTechnologyInput): Promise<TechnologyEntity>;
  updateTechnology(id: string, data: UpdateTechnologyInput): Promise<TechnologyEntity>;
  archiveTechnology(id: string): Promise<boolean>;
  restoreTechnology(id: string): Promise<boolean>;
  deleteTechnology(id: string): Promise<boolean>;
  reorderTechnologies(orderedIds: string[]): Promise<boolean>;

  // 9-Slot 3D Orbit Mapping
  getOrbitSlots(options?: { preview?: boolean }): Promise<OrbitSlotsTuple>;
  getOrbitSlotsDraft(): Promise<OrbitSlotsTuple | null>;
  saveOrbitSlotsDraft(slotTechnologyIds: OrbitSlotsTuple): Promise<OrbitSlotsTuple>;
  publishOrbitSlots(slotTechnologyIds?: OrbitSlotsTuple): Promise<OrbitSlotsTuple>;
  rollbackOrbitSlots(): Promise<OrbitSlotsTuple>;

  // Expertise Areas (Homepage Disciplines & Skills)
  getExpertiseAreas(options?: { preview?: boolean }): Promise<ExpertiseAreaEntity[]>;
  getAllExpertiseAreas(options?: { includeArchived?: boolean; preview?: boolean }): Promise<ExpertiseAreaEntity[]>;
  getExpertiseAreaById(id: string): Promise<ExpertiseAreaEntity | null>;
  createExpertiseArea(data: CreateExpertiseAreaInput): Promise<ExpertiseAreaEntity>;
  updateExpertiseArea(id: string, data: UpdateExpertiseAreaInput): Promise<ExpertiseAreaEntity>;
  archiveExpertiseArea(id: string): Promise<boolean>;
  restoreExpertiseArea(id: string): Promise<boolean>;
  deleteExpertiseArea(id: string): Promise<boolean>;
  reorderExpertiseAreas(orderedIds: string[]): Promise<boolean>;

  // SEO Management
  getSeoConfig(options?: { preview?: boolean }): Promise<SiteSeoConfigEntity>;
  getSeoConfigDraft(): Promise<SiteSeoConfigEntity | null>;
  saveSeoConfigDraft(data: Partial<SiteSeoConfigEntity>): Promise<SiteSeoConfigEntity>;
  publishSeoConfig(data?: Partial<SiteSeoConfigEntity>): Promise<SiteSeoConfigEntity>;
  rollbackSeoConfig(): Promise<SiteSeoConfigEntity>;

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
