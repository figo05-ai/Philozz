/**
 * PHILOZZ CMS — Article / Note Domain Models
 * Phase 16A: Dynamic CMS Architecture & Data Foundation
 */

import { ContentStatus } from './project';

export interface ArticleSection {
  heading: string;
  content: string;
  codeSnippet?: string;
  codeLang?: string;
}

export interface ArticleEntity {
  id: string;
  slug: string;
  title: string;
  category: string;
  archiveCategory: string;
  readTime: string;
  date: string; // Human readable date string, e.g. "Apr 12, 2026"
  publishedAt?: string; // ISO 8601 timestamp for sorting and machine readability
  featured: boolean;
  featuredOrder?: number;
  tags: string[];
  abstract: string;
  sections: ArticleSection[];
  status: ContentStatus;
  ogImageUrl?: string;
  coverImageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  displayOrder: number;
  version?: number;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface BlogCategoryEntity {
  id: string;
  label: string;
  displayOrder: number;
  description?: string;
}

export type CreateArticleInput = Omit<ArticleEntity, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateArticleInput = Partial<CreateArticleInput>;
