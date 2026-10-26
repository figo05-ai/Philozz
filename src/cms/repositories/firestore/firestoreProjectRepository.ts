import 'server-only';

/**
 * PHILOZZ CMS — Firestore Project Repository Implementation
 * Phase 16D.1: Projects & Case Studies Full CRUD
 *
 * Real server-only Firestore adapter implementing IProjectRepository.
 * Interacts with Firestore via Firebase Admin SDK with transactional consistency,
 * soft deletion, and atomic 3-card homepage featured slots enforcement.
 */

import { getFirebaseFirestore } from '@/lib/auth/firebaseAdmin';
import {
  ProjectEntity,
  CreateProjectInput,
  UpdateProjectInput,
  ContentStatus,
} from '../../models/project';
import { IProjectRepository } from '../types';
import {
  FIRESTORE_COLLECTIONS,
  projectFirestoreConverter,
} from './firestoreContracts';

export class FirestoreProjectRepository implements IProjectRepository {
  private get collection() {
    return getFirebaseFirestore().collection(FIRESTORE_COLLECTIONS.PROJECTS);
  }

  async getAll(options?: {
    status?: ContentStatus;
    featuredOnly?: boolean;
    includeDeleted?: boolean;
  }): Promise<ProjectEntity[]> {
    let query: FirebaseFirestore.Query = this.collection;

    if (options?.status) {
      query = query.where('status', '==', options.status);
    }

    if (options?.featuredOnly) {
      query = query.where('featured', '==', true);
    }

    const snapshot = await query.get();
    let projects: ProjectEntity[] = snapshot.docs.map((doc) =>
      projectFirestoreConverter.fromFirestore(doc.data(), doc.id)
    );

    // Filter out soft-deleted projects unless specifically requested
    if (!options?.includeDeleted) {
      projects = projects.filter((p) => !p.isDeleted);
    }

    // In-memory sort ensures deterministic ordering
    if (options?.featuredOnly) {
      return projects.sort(
        (a, b) =>
          (a.featuredOrder ?? a.displayOrder) -
          (b.featuredOrder ?? b.displayOrder)
      );
    }

    return projects.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getBySlug(
    slug: string,
    options?: { includeDeleted?: boolean }
  ): Promise<ProjectEntity | null> {
    // 1. Direct document ID lookup
    const directDoc = await this.collection.doc(slug).get();
    if (directDoc.exists) {
      const entity = projectFirestoreConverter.fromFirestore(
        directDoc.data()!,
        directDoc.id
      );
      if (entity.isDeleted && !options?.includeDeleted) {
        return null;
      }
      return entity;
    }

    // 2. Query by slug field in case doc ID differs from slug
    const querySnapshot = await this.collection
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const entity = projectFirestoreConverter.fromFirestore(doc.data(), doc.id);
      if (entity.isDeleted && !options?.includeDeleted) {
        return null;
      }
      return entity;
    }

    return null;
  }

  async getById(
    id: string,
    options?: { includeDeleted?: boolean }
  ): Promise<ProjectEntity | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      return null;
    }
    const entity = projectFirestoreConverter.fromFirestore(doc.data()!, doc.id);
    if (entity.isDeleted && !options?.includeDeleted) {
      return null;
    }
    return entity;
  }

  async create(data: CreateProjectInput): Promise<ProjectEntity> {
    const now = new Date().toISOString();
    const id = data.slug || `proj_${Date.now()}`;
    const entity: ProjectEntity = {
      ...data,
      id,
      slug: data.slug || id,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    const firestoreData = projectFirestoreConverter.toFirestore(entity);
    await this.collection.doc(id).set(firestoreData);
    return entity;
  }

  async update(id: string, data: UpdateProjectInput): Promise<ProjectEntity> {
    const docRef = this.collection.doc(id);
    const existing = await docRef.get();

    if (!existing.exists) {
      throw new Error(`Project with ID "${id}" not found in Firestore.`);
    }

    const current = projectFirestoreConverter.fromFirestore(
      existing.data()!,
      existing.id
    );

    // Enforce 3-featured invariant: cannot unpublish or delete if currently featured
    if (
      current.featured &&
      (data.status === 'draft' ||
        data.status === 'archived' ||
        data.isDeleted)
    ) {
      throw new Error(
        `Cannot unpublish or delete "${current.title}" because it is currently assigned to a Homepage Featured Slot. Please reassign the featured slot first.`
      );
    }

    const updated: ProjectEntity = {
      ...current,
      ...data,
      id: current.id,
      slug: current.slug, // Slugs are immutable in this phase
      updatedAt: new Date().toISOString(),
    };

    const firestoreData = projectFirestoreConverter.toFirestore(updated);
    await docRef.set(firestoreData, { merge: true });
    return updated;
  }

  async softDelete(id: string): Promise<boolean> {
    const docRef = this.collection.doc(id);
    const existing = await docRef.get();
    if (!existing.exists) {
      return false;
    }

    const current = projectFirestoreConverter.fromFirestore(
      existing.data()!,
      existing.id
    );

    if (current.featured && current.status === 'published') {
      throw new Error(
        `Cannot delete "${current.title}" because it is currently assigned to a Homepage Featured Slot. Please reassign the featured slot first.`
      );
    }

    const now = new Date().toISOString();
    await docRef.update({
      isDeleted: true,
      deletedAt: now,
      updatedAt: now,
    });
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const docRef = this.collection.doc(id);
    const existing = await docRef.get();
    if (!existing.exists) {
      return false;
    }

    const now = new Date().toISOString();
    await docRef.update({
      isDeleted: false,
      deletedAt: null,
      updatedAt: now,
    });
    return true;
  }

  async delete(id: string, permanent: boolean = false): Promise<boolean> {
    if (!permanent) {
      return this.softDelete(id);
    }

    const docRef = this.collection.doc(id);
    const existing = await docRef.get();
    if (!existing.exists) {
      return false;
    }

    const current = projectFirestoreConverter.fromFirestore(
      existing.data()!,
      existing.id
    );

    if (current.featured && current.status === 'published') {
      throw new Error(
        `Cannot permanently delete "${current.title}" while it is assigned to a Homepage Featured Slot.`
      );
    }

    await docRef.delete();
    return true;
  }

  async reorder(orderedIds: string[]): Promise<boolean> {
    const db = getFirebaseFirestore();
    const batch = db.batch();
    const now = new Date().toISOString();

    orderedIds.forEach((id, index) => {
      const docRef = this.collection.doc(id);
      batch.update(docRef, {
        displayOrder: index + 1,
        updatedAt: now,
      });
    });

    await batch.commit();
    return true;
  }

  async setFeaturedSlots(
    slotProjectIds: [string, string, string]
  ): Promise<boolean> {
    const uniqueIds = Array.from(new Set(slotProjectIds));
    if (uniqueIds.length !== 3) {
      throw new Error(
        'Homepage Featured selection must specify exactly 3 distinct project IDs.'
      );
    }

    // Verify all 3 target projects exist, are published, and not deleted
    for (const id of slotProjectIds) {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) {
        throw new Error(`Project with ID "${id}" does not exist in Firestore.`);
      }
      const data = projectFirestoreConverter.fromFirestore(doc.data()!, doc.id);
      if (data.isDeleted) {
        throw new Error(`Cannot feature deleted project "${data.title}".`);
      }
      if (data.status !== 'published') {
        throw new Error(
          `Cannot feature unpublished project "${data.title}" (status: ${data.status}).`
        );
      }
    }

    const db = getFirebaseFirestore();
    const batch = db.batch();
    const now = new Date().toISOString();

    // Query any currently featured projects to unset them
    const currentFeaturedSnapshot = await this.collection
      .where('featured', '==', true)
      .get();

    for (const doc of currentFeaturedSnapshot.docs) {
      batch.update(doc.ref, {
        featured: false,
        featuredOrder: null,
        updatedAt: now,
      });
    }

    // Assign featuredOrder: 1, 2, 3 to chosen projects
    slotProjectIds.forEach((id, index) => {
      const docRef = this.collection.doc(id);
      batch.update(docRef, {
        featured: true,
        featuredOrder: index + 1,
        updatedAt: now,
      });
    });

    await batch.commit();
    return true;
  }
}
