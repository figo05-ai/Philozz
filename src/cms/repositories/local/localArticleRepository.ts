/**
 * PHILOZZ CMS — Local Article / Note Repository Implementation
 * Phase 16A: Dynamic CMS Architecture & Data Foundation
 *
 * Provides a concrete, in-memory repository wrapping the existing portfolio notes.
 * Adheres strictly to IArticleRepository.
 */

import { NOTES, BLOG_CATEGORIES } from '@/data/portfolioData';
import {
  ArticleEntity,
  CreateArticleInput,
  UpdateArticleInput,
  BlogCategoryEntity,
} from '../../models/article';
import { ContentStatus } from '../../models/project';
import { IArticleRepository } from '../types';

function parseDateToIso(dateStr?: string): string {
  if (!dateStr) return '2026-01-01T00:00:00.000Z';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '2026-01-01T00:00:00.000Z' : d.toISOString();
}

function mapToArticleEntity(slug: string, index: number): ArticleEntity {
  const note = NOTES.find((item) => item.slug === slug);
  if (!note) {
    throw new Error(`Article with slug "${slug}" not found in local data source.`);
  }

  return {
    id: note.slug,
    slug: note.slug,
    title: note.title,
    category: note.category,
    archiveCategory: note.archiveCategory || 'backend',
    readTime: note.readTime,
    date: note.date,
    publishedAt: parseDateToIso(note.date),
    featured: Boolean(note.featured),
    featuredOrder: note.featured ? 1 : undefined,
    tags: note.tags ? [...note.tags] : [],
    abstract: note.abstract,
    sections: note.sections.map((s) => ({ ...s })),
    status: 'published' as ContentStatus,
    displayOrder: index + 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-04-15T00:00:00.000Z',
  };
}

export class LocalArticleRepository implements IArticleRepository {
  private articles: ArticleEntity[];
  private categories: BlogCategoryEntity[];

  constructor() {
    this.articles = NOTES.map((n, idx) => mapToArticleEntity(n.slug, idx));
    this.categories = BLOG_CATEGORIES.map((cat, idx) => ({
      id: cat.id,
      label: cat.label,
      displayOrder: idx + 1,
    }));
  }

  async getAll(options?: {
    status?: ContentStatus;
    category?: string;
    featuredOnly?: boolean;
  }): Promise<ArticleEntity[]> {
    let result = [...this.articles];
    if (options?.status) {
      result = result.filter((a) => a.status === options.status);
    }
    if (options?.category && options.category !== 'all') {
      const cat = options.category.toLowerCase();
      result = result.filter(
        (a) => a.archiveCategory === options.category || a.category.toLowerCase().includes(cat)
      );
    }
    if (options?.featuredOnly) {
      result = result.filter((a) => a.featured);
    }
    return result.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getBySlug(slug: string): Promise<ArticleEntity | null> {
    const found = this.articles.find((a) => a.slug === slug);
    return found ? { ...found } : null;
  }

  async getById(id: string): Promise<ArticleEntity | null> {
    const found = this.articles.find((a) => a.id === id);
    return found ? { ...found } : null;
  }

  async getCategories(): Promise<BlogCategoryEntity[]> {
    return [...this.categories].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async create(data: CreateArticleInput): Promise<ArticleEntity> {
    const now = new Date().toISOString();
    const newEntity: ArticleEntity = {
      ...data,
      id: data.slug,
      createdAt: now,
      updatedAt: now,
      publishedAt: data.publishedAt || now,
    };
    this.articles.push(newEntity);
    return { ...newEntity };
  }

  async update(id: string, data: UpdateArticleInput): Promise<ArticleEntity> {
    const idx = this.articles.findIndex((a) => a.id === id);
    if (idx === -1) {
      throw new Error(`Article with id "${id}" not found.`);
    }
    const updated: ArticleEntity = {
      ...this.articles[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.articles[idx] = updated;
    return { ...updated };
  }

  async delete(id: string): Promise<boolean> {
    const idx = this.articles.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    this.articles.splice(idx, 1);
    return true;
  }
}
