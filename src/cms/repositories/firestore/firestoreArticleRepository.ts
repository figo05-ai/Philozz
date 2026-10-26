import 'server-only';

/**
 * PHILOZZ CMS — Firestore Article / Note Repository Implementation
 * Phase 16D.0: Firestore Foundation & Safe Content Migration
 *
 * Real server-only Firestore adapter implementing IArticleRepository.
 */

import { getFirebaseFirestore } from '@/lib/auth/firebaseAdmin';
import {
  ArticleEntity,
  CreateArticleInput,
  UpdateArticleInput,
  BlogCategoryEntity,
} from '../../models/article';
import { ContentStatus } from '../../models/project';
import { IArticleRepository } from '../types';
import {
  FIRESTORE_COLLECTIONS,
  articleFirestoreConverter,
} from './firestoreContracts';

export class FirestoreArticleRepository implements IArticleRepository {
  private get collection() {
    return getFirebaseFirestore().collection(FIRESTORE_COLLECTIONS.ARTICLES);
  }

  private get categoriesCollection() {
    return getFirebaseFirestore().collection(FIRESTORE_COLLECTIONS.CATEGORIES);
  }

  async getAll(options?: {
    status?: ContentStatus;
    category?: string;
    featuredOnly?: boolean;
    includeDeleted?: boolean;
  }): Promise<ArticleEntity[]> {
    let query: FirebaseFirestore.Query = this.collection;

    if (options?.status) {
      query = query.where('status', '==', options.status);
    }

    if (options?.featuredOnly) {
      query = query.where('featured', '==', true);
    }

    const snapshot = await query.get();
    let articles: ArticleEntity[] = snapshot.docs.map((doc) =>
      articleFirestoreConverter.fromFirestore(doc.data(), doc.id)
    );

    // Filter deleted records unless includeDeleted is explicitly true
    if (!options?.includeDeleted) {
      articles = articles.filter((a) => !a.isDeleted);
    }

    if (options?.category && options.category !== 'all') {
      const cat = options.category.toLowerCase();
      articles = articles.filter(
        (a) =>
          a.archiveCategory === options.category ||
          a.category.toLowerCase().includes(cat)
      );
    }

    return articles.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getBySlug(slug: string, options?: { includeDeleted?: boolean }): Promise<ArticleEntity | null> {
    // 1. Direct document ID lookup
    const directDoc = await this.collection.doc(slug).get();
    if (directDoc.exists) {
      const article = articleFirestoreConverter.fromFirestore(directDoc.data()!, directDoc.id);
      if (!options?.includeDeleted && article.isDeleted) return null;
      return article;
    }

    // 2. Query by slug
    const querySnapshot = await this.collection
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const article = articleFirestoreConverter.fromFirestore(doc.data(), doc.id);
      if (!options?.includeDeleted && article.isDeleted) return null;
      return article;
    }

    return null;
  }

  async getById(id: string, options?: { includeDeleted?: boolean }): Promise<ArticleEntity | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      return null;
    }
    const article = articleFirestoreConverter.fromFirestore(doc.data()!, doc.id);
    if (!options?.includeDeleted && article.isDeleted) return null;
    return article;
  }

  async create(data: CreateArticleInput): Promise<ArticleEntity> {
    const now = new Date().toISOString();
    const id = data.slug || `note_${Date.now()}`;
    const entity: ArticleEntity = {
      ...data,
      id,
      version: 1,
      createdAt: now,
      updatedAt: now,
      publishedAt: data.status === 'published' ? data.publishedAt || now : undefined,
      isDeleted: false,
      deletedAt: undefined,
    };

    const firestoreData = articleFirestoreConverter.toFirestore(entity);
    await this.collection.doc(id).set(firestoreData);
    return entity;
  }

  async update(id: string, data: UpdateArticleInput): Promise<ArticleEntity> {
    const docRef = this.collection.doc(id);
    const existing = await docRef.get();

    if (!existing.exists) {
      throw new Error(`Article with ID "${id}" not found in Firestore.`);
    }

    const current = articleFirestoreConverter.fromFirestore(existing.data()!, existing.id);
    const updated: ArticleEntity = {
      ...current,
      ...data,
      version: (current.version || 1) + 1,
      updatedAt: new Date().toISOString(),
    };

    const firestoreData = articleFirestoreConverter.toFirestore(updated);
    await docRef.set(firestoreData, { merge: true });
    return updated;
  }

  async delete(id: string, permanent?: boolean): Promise<boolean> {
    if (!permanent) {
      return this.softDelete(id);
    }
    const docRef = this.collection.doc(id);
    const existing = await docRef.get();
    if (!existing.exists) {
      return false;
    }
    await docRef.delete();
    return true;
  }

  async softDelete(id: string): Promise<boolean> {
    const docRef = this.collection.doc(id);
    const existing = await docRef.get();
    if (!existing.exists) {
      throw new Error(`Article with ID "${id}" not found in Firestore.`);
    }

    const current = articleFirestoreConverter.fromFirestore(existing.data()!, existing.id);
    if (current.featured) {
      throw new Error(
        `Cannot delete "${current.title}" because it is currently assigned to a Homepage Engineering Journal slot. Reassign the slot first in Homepage Journal Manager.`
      );
    }

    const now = new Date().toISOString();
    await docRef.set(
      {
        isDeleted: true,
        deletedAt: now,
        updatedAt: now,
      },
      { merge: true }
    );
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const docRef = this.collection.doc(id);
    const existing = await docRef.get();
    if (!existing.exists) {
      throw new Error(`Article with ID "${id}" not found in Firestore.`);
    }

    const now = new Date().toISOString();
    await docRef.set(
      {
        isDeleted: false,
        deletedAt: null,
        updatedAt: now,
      },
      { merge: true }
    );
    return true;
  }

  async reorder(orderedIds: string[]): Promise<boolean> {
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      throw new Error('Invalid ordered IDs array.');
    }

    const db = getFirebaseFirestore();
    const batch = db.batch();

    orderedIds.forEach((id, index) => {
      const docRef = this.collection.doc(id);
      batch.update(docRef, {
        displayOrder: index + 1,
        updatedAt: new Date().toISOString(),
      });
    });

    await batch.commit();
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

    // Verify all 4 articles exist, are published, and not deleted
    for (let i = 0; i < slots.length; i++) {
      const id = slots[i];
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) {
        throw new Error(`Article with id "${id}" selected for slot #${i + 1} not found in Firestore.`);
      }
      const data = articleFirestoreConverter.fromFirestore(doc.data()!, doc.id);
      if (data.isDeleted) {
        throw new Error(`Cannot assign deleted article "${data.title}" to a homepage slot.`);
      }
      if (data.status !== 'published') {
        throw new Error(`Cannot assign draft article "${data.title}" to a homepage slot. It must be published first.`);
      }
    }

    const db = getFirebaseFirestore();
    const batch = db.batch();

    // Reset all currently featured articles
    const currentFeatured = await this.collection.where('featured', '==', true).get();
    currentFeatured.docs.forEach((doc) => {
      batch.update(doc.ref, {
        featured: false,
        featuredOrder: null,
        updatedAt: new Date().toISOString(),
      });
    });

    // Assign exactly the 4 chosen slots
    slots.forEach((id, index) => {
      const docRef = this.collection.doc(id);
      batch.update(docRef, {
        featured: true,
        featuredOrder: index + 1,
        updatedAt: new Date().toISOString(),
      });
    });

    await batch.commit();
    return true;
  }

  // --- Category Management ---

  async getCategories(): Promise<BlogCategoryEntity[]> {
    const snapshot = await this.categoriesCollection.get();
    const categories: BlogCategoryEntity[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: (data.id as string) || doc.id,
        label: (data.label as string) || '',
        displayOrder: (data.displayOrder as number) || 1,
        description: (data.description as string) || undefined,
      };
    });

    return categories.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getCategoryById(id: string): Promise<BlogCategoryEntity | null> {
    const doc = await this.categoriesCollection.doc(id).get();
    if (!doc.exists) {
      return null;
    }
    const data = doc.data()!;
    return {
      id: (data.id as string) || doc.id,
      label: (data.label as string) || '',
      displayOrder: (data.displayOrder as number) || 1,
      description: (data.description as string) || undefined,
    };
  }

  async createCategory(data: BlogCategoryEntity): Promise<BlogCategoryEntity> {
    const docRef = this.categoriesCollection.doc(data.id);
    const existing = await docRef.get();
    if (existing.exists) {
      throw new Error(`Category with ID "${data.id}" already exists in Firestore.`);
    }

    await docRef.set({
      id: data.id,
      label: data.label,
      displayOrder: data.displayOrder,
      description: data.description ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return data;
  }

  async updateCategory(id: string, data: Partial<BlogCategoryEntity>): Promise<BlogCategoryEntity> {
    const docRef = this.categoriesCollection.doc(id);
    const existing = await docRef.get();
    if (!existing.exists) {
      throw new Error(`Category with ID "${id}" not found in Firestore.`);
    }

    const current = existing.data()!;
    const updated: BlogCategoryEntity = {
      id,
      label: data.label !== undefined ? data.label : (current.label as string),
      displayOrder: data.displayOrder !== undefined ? data.displayOrder : (current.displayOrder as number),
      description: data.description !== undefined ? data.description : (current.description as string),
    };

    await docRef.set(
      {
        ...updated,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const docRef = this.categoriesCollection.doc(id);
    const existing = await docRef.get();
    if (!existing.exists) return false;

    const catData = existing.data()!;
    const catLabel = (catData.label as string) || id;

    // Referential integrity check: check if any published, non-deleted article uses this category
    const allArticles = await this.getAll({ status: 'published', includeDeleted: false });
    const referencing = allArticles.filter(
      (a) =>
        a.category.toLowerCase() === id.toLowerCase() ||
        a.category.toLowerCase() === catLabel.toLowerCase() ||
        a.archiveCategory === id
    );

    if (referencing.length > 0) {
      throw new Error(
        `Cannot delete category "${catLabel}" because it is still referenced by ${referencing.length} published article(s) (${referencing.map((a) => `"${a.title}"`).join(', ')}). Reassign or unpublish those articles first.`
      );
    }

    await docRef.delete();
    return true;
  }
}
