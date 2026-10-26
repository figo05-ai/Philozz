import 'server-only';

/**
 * PHILOZZ CMS — Firestore Site Content Repository Implementation
 * Phase 16D.0: Firestore Foundation & Safe Content Migration
 *
 * Real server-only Firestore adapter implementing ISiteContentRepository.
 * Manages singleton configurations and relational ecosystem collections.
 */

import { getFirebaseFirestore } from '@/lib/auth/firebaseAdmin';
import {
  BrandInfoEntity,
  HomepageConfigEntity,
} from '../../models/site';
import {
  TechnologyEntity,
  ExpertiseAreaEntity,
  StackDetailsEntity,
} from '../../models/technology';
import { ISiteContentRepository } from '../types';
import {
  FIRESTORE_COLLECTIONS,
  FIRESTORE_SINGLETON_DOCS,
} from './firestoreContracts';

export class FirestoreSiteContentRepository implements ISiteContentRepository {
  private get siteConfigCollection() {
    return getFirebaseFirestore().collection(FIRESTORE_COLLECTIONS.SITE_CONFIG);
  }

  private get technologiesCollection() {
    return getFirebaseFirestore().collection(FIRESTORE_COLLECTIONS.TECHNOLOGIES);
  }

  private get expertiseCollection() {
    return getFirebaseFirestore().collection(FIRESTORE_COLLECTIONS.EXPERTISE_AREAS);
  }

  async getBrandInfo(): Promise<BrandInfoEntity> {
    const docRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.BRAND_INFO);
    const snap = await docRef.get();

    if (!snap.exists) {
      throw new Error(
        `Brand info singleton "${FIRESTORE_SINGLETON_DOCS.BRAND_INFO}" not found in Firestore site_config collection. Ensure migration has been executed.`
      );
    }

    const data = snap.data()!;
    return {
      ...(data as BrandInfoEntity),
      id: 'brand_info',
    };
  }

  async updateBrandInfo(data: Partial<BrandInfoEntity>): Promise<BrandInfoEntity> {
    const docRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.BRAND_INFO);
    const updatedAt = new Date().toISOString();
    const updatePayload = {
      ...data,
      updatedAt,
    };

    await docRef.set(updatePayload, { merge: true });
    const fresh = await docRef.get();
    return {
      ...(fresh.data()! as BrandInfoEntity),
      id: 'brand_info',
    };
  }

  async getHomepageConfig(): Promise<HomepageConfigEntity> {
    const docRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.HOMEPAGE_CONFIG);
    const snap = await docRef.get();

    if (!snap.exists) {
      throw new Error(
        `Homepage config singleton "${FIRESTORE_SINGLETON_DOCS.HOMEPAGE_CONFIG}" not found in Firestore site_config collection. Ensure migration has been executed.`
      );
    }

    const data = snap.data()!;
    return {
      ...(data as HomepageConfigEntity),
      id: 'homepage_config',
    };
  }

  async updateHomepageConfig(
    data: Partial<HomepageConfigEntity>
  ): Promise<HomepageConfigEntity> {
    const docRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.HOMEPAGE_CONFIG);
    const updatedAt = new Date().toISOString();
    const updatePayload = {
      ...data,
      updatedAt,
    };

    await docRef.set(updatePayload, { merge: true });
    const fresh = await docRef.get();
    return {
      ...(fresh.data()! as HomepageConfigEntity),
      id: 'homepage_config',
    };
  }

  async getTechnologies(): Promise<TechnologyEntity[]> {
    const snap = await this.technologiesCollection.get();
    const techs: TechnologyEntity[] = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: (d.id as string) || doc.id,
        name: (d.name as string) || '',
        label: (d.label as string) || '',
        category: (d.category as string) || '',
        role: (d.role as string) || '',
        description: (d.description as string) || '',
        capability: (d.capability as string) || '',
        logoKey: (d.logoKey as string) || doc.id,
        logoSize: (d.logoSize as number) || 28,
        x: (d.x as number) ?? 50,
        y: (d.y as number) ?? 50,
        svgX: (d.svgX as number) ?? 500,
        svgY: (d.svgY as number) ?? 280,
        isRear: Boolean(d.isRear),
        scale: (d.scale as number) ?? 1,
        floatDelay: (d.floatDelay as string) || '0s',
        displayOrder: (d.displayOrder as number) ?? 1,
        status: (d.status as TechnologyEntity['status']) || 'published',
        updatedAt: (d.updatedAt as string) || new Date().toISOString(),
      };
    });

    return techs.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getExpertiseAreas(): Promise<ExpertiseAreaEntity[]> {
    const snap = await this.expertiseCollection.get();
    const areas: ExpertiseAreaEntity[] = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: (d.id as string) || doc.id,
        name: (d.name as string) || '',
        level: (d.level as string) || '',
        description: (d.description as string) || '',
        coreConcepts: Array.isArray(d.coreConcepts) ? (d.coreConcepts as string[]) : [],
        displayOrder: (d.displayOrder as number) ?? 1,
        status: (d.status as ExpertiseAreaEntity['status']) || 'published',
        updatedAt: (d.updatedAt as string) || new Date().toISOString(),
      };
    });

    return areas.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getStackDetails(): Promise<StackDetailsEntity> {
    const docRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.STACK_DETAILS);
    const snap = await docRef.get();

    if (!snap.exists) {
      throw new Error(
        `Stack details singleton "${FIRESTORE_SINGLETON_DOCS.STACK_DETAILS}" not found in Firestore site_config collection. Ensure migration has been executed.`
      );
    }

    const data = snap.data()!;
    return {
      id: 'current_stack',
      primaryBackend: Array.isArray(data.primaryBackend) ? data.primaryBackend : [],
      frontend: Array.isArray(data.frontend) ? data.frontend : [],
      infrastructure: Array.isArray(data.infrastructure) ? data.infrastructure : [],
      updatedAt: (data.updatedAt as string) || new Date().toISOString(),
    };
  }
}
