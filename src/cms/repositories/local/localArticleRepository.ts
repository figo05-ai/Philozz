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
    includeDeleted?: boolean;
  }): Promise<ArticleEntity[]> {
    let result = [...this.articles];

    // Filter deleted records unless includeDeleted is explicitly true
    if (!options?.includeDeleted) {
      result = result.filter((a) => !a.isDeleted);
    }

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

  async getBySlug(slug: string, options?: { includeDeleted?: boolean }): Promise<ArticleEntity | null> {
    const found = this.articles.find((a) => a.slug === slug);
    if (!found) return null;
    if (!options?.includeDeleted && found.isDeleted) return null;
    return { ...found };
  }

  async getById(id: string, options?: { includeDeleted?: boolean }): Promise<ArticleEntity | null> {
    const found = this.articles.find((a) => a.id === id);
    if (!found) return null;
    if (!options?.includeDeleted && found.isDeleted) return null;
    return { ...found };
  }

  async create(data: CreateArticleInput): Promise<ArticleEntity> {
    const now = new Date().toISOString();
    const newEntity: ArticleEntity = {
      ...data,
      id: data.slug || `note_${Date.now()}`,
      version: 1,
      createdAt: now,
      updatedAt: now,
      publishedAt: data.status === 'published' ? data.publishedAt || now : undefined,
      isDeleted: false,
      deletedAt: undefined,
    };
    this.articles.push(newEntity);
    return { ...newEntity };
  }

  async update(id: string, data: UpdateArticleInput): Promise<ArticleEntity> {
    const idx = this.articles.findIndex((a) => a.id === id);
    if (idx === -1) {
      throw new Error(`Article with id "${id}" not found.`);
    }
    const current = this.articles[idx];
    const updated: ArticleEntity = {
      ...current,
      ...data,
      version: (current.version || 1) + 1,
      updatedAt: new Date().toISOString(),
    };
    this.articles[idx] = updated;
    return { ...updated };
  }

  async delete(id: string, permanent?: boolean): Promise<boolean> {
    if (!permanent) {
      return this.softDelete(id);
    }
    const idx = this.articles.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    this.articles.splice(idx, 1);
    return true;
  }

  async softDelete(id: string): Promise<boolean> {
    const idx = this.articles.findIndex((a) => a.id === id);
    if (idx === -1) {
      throw new Error(`Article with id "${id}" not found.`);
    }
    const current = this.articles[idx];
    if (current.featured) {
      throw new Error(
        `Cannot delete "${current.title}" because it is currently assigned to a Homepage Engineering Journal slot. Reassign the slot first in Homepage Journal Manager.`
      );
    }
    this.articles[idx] = {
      ...current,
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const idx = this.articles.findIndex((a) => a.id === id);
    if (idx === -1) {
      throw new Error(`Article with id "${id}" not found.`);
    }
    const current = this.articles[idx];
    this.articles[idx] = {
      ...current,
      isDeleted: false,
      deletedAt: undefined,
      updatedAt: new Date().toISOString(),
    };
    return true;
  }

  async reorder(orderedIds: string[]): Promise<boolean> {
    const orderMap = new Map<string, number>();
    orderedIds.forEach((id, index) => {
      orderMap.set(id, index + 1);
    });

    this.articles = this.articles.map((a) => {
      const newOrder = orderMap.get(a.id);
      return newOrder !== undefined ? { ...a, displayOrder: newOrder } : a;
    });

    return true;
  }

  async setHomepageJournalSlots(slots: [string, string, string, string]): Promise<boolean> {
    if (!Array.isArray(slots) || slots.length !== 4) {
      throw new Error('Homepage Engineering Journal requires exactly 4 article selections.');
    }

    const uniqueIds = Array.from(new Set(slots));
    if (uniqueIds.length !== 4) {
      throw new Error('All 4 Homepage Engineering Journal slots must contain distinct, unique articles.');
    }

    // Verify all 4 exist, are published, and not deleted
    for (let i = 0; i < slots.length; i++) {
      const id = slots[i];
      const article = this.articles.find((a) => a.id === id);
      if (!article) {
        throw new Error(`Article with id "${id}" selected for slot #${i + 1} not found.`);
      }
      if (article.isDeleted) {
        throw new Error(`Cannot assign deleted article "${article.title}" to a homepage slot.`);
      }
      if (article.status !== 'published') {
        throw new Error(`Cannot assign draft article "${article.title}" to a homepage slot. It must be published first.`);
      }
    }

    const slotMap = new Map<string, number>();
    slots.forEach((id, index) => {
      slotMap.set(id, index + 1);
    });

    this.articles = this.articles.map((a) => {
      if (slotMap.has(a.id)) {
        return {
          ...a,
          featured: true,
          featuredOrder: slotMap.get(a.id),
        };
      }
      return {
        ...a,
        featured: false,
        featuredOrder: undefined,
      };
    });

    return true;
  }

  // --- Category Management ---

  async getCategories(): Promise<BlogCategoryEntity[]> {
    return [...this.categories].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getCategoryById(id: string): Promise<BlogCategoryEntity | null> {
    const found = this.categories.find((c) => c.id === id);
    return found ? { ...found } : null;
  }

  async createCategory(data: BlogCategoryEntity): Promise<BlogCategoryEntity> {
    const existing = this.categories.find((c) => c.id === data.id);
    if (existing) {
      throw new Error(`Category with ID "${data.id}" already exists.`);
    }
    const newCat = { ...data };
    this.categories.push(newCat);
    return { ...newCat };
  }

  async updateCategory(id: string, data: Partial<BlogCategoryEntity>): Promise<BlogCategoryEntity> {
    const idx = this.categories.findIndex((c) => c.id === id);
    if (idx === -1) {
      throw new Error(`Category with ID "${id}" not found.`);
    }
    const updated = { ...this.categories[idx], ...data };
    this.categories[idx] = updated;
    return { ...updated };
  }

  async deleteCategory(id: string): Promise<boolean> {
    const idx = this.categories.findIndex((c) => c.id === id);
    if (idx === -1) return false;

    const cat = this.categories[idx];

    // Referential integrity check: reject if published non-deleted articles use this category
    const referencingArticles = this.articles.filter(
      (a) =>
        !a.isDeleted &&
        a.status === 'published' &&
        (a.category.toLowerCase() === cat.id.toLowerCase() ||
          a.category.toLowerCase() === cat.label.toLowerCase() ||
          a.archiveCategory === cat.id)
    );

    if (referencingArticles.length > 0) {
      throw new Error(
        `Cannot delete category "${cat.label}" because it is still referenced by ${referencingArticles.length} published article(s) (${referencingArticles.map((a) => `"${a.title}"`).join(', ')}). Reassign or unpublish those articles first.`
      );
    }

    this.categories.splice(idx, 1);
    return true;
  }
}
