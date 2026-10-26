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

  async getBySlug(slug: string): Promise<ArticleEntity | null> {
    // 1. Direct document ID lookup
    const directDoc = await this.collection.doc(slug).get();
    if (directDoc.exists) {
      return articleFirestoreConverter.fromFirestore(directDoc.data()!, directDoc.id);
    }

    // 2. Query by slug
    const querySnapshot = await this.collection
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return articleFirestoreConverter.fromFirestore(doc.data(), doc.id);
    }

    return null;
  }

  async getById(id: string): Promise<ArticleEntity | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return articleFirestoreConverter.fromFirestore(doc.data()!, doc.id);
  }

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

  async create(data: CreateArticleInput): Promise<ArticleEntity> {
    const now = new Date().toISOString();
    const id = data.slug || `note_${Date.now()}`;
    const entity: ArticleEntity = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
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
      updatedAt: new Date().toISOString(),
    };

    const firestoreData = articleFirestoreConverter.toFirestore(updated);
    await docRef.set(firestoreData, { merge: true });
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const docRef = this.collection.doc(id);
    const existing = await docRef.get();
    if (!existing.exists) {
      return false;
    }
    await docRef.delete();
    return true;
  }
}
