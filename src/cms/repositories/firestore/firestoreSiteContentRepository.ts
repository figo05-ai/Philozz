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
  SiteSeoConfigEntity,
  DEFAULT_SEO_CONFIG,
} from '../../models/site';
import {
  TechnologyEntity,
  CreateTechnologyInput,
  UpdateTechnologyInput,
  ExpertiseAreaEntity,
  CreateExpertiseAreaInput,
  UpdateExpertiseAreaInput,
  StackDetailsEntity,
  OrbitSlotsTuple,
  DEFAULT_ORBIT_SLOTS,
} from '../../models/technology';
import {
  validateTechnology,
  validateOrbitSlots,
  validateExpertiseArea,
} from '../../validation/validators';
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

  async getBrandInfo(options?: { preview?: boolean }): Promise<BrandInfoEntity> {
    if (options?.preview) {
      const draftRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.BRAND_INFO_DRAFT);
      const draftSnap = await draftRef.get();
      if (draftSnap.exists) {
        return {
          ...(draftSnap.data()! as BrandInfoEntity),
          id: 'brand_info',
        };
      }
    }

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

  async getBrandInfoDraft(): Promise<BrandInfoEntity | null> {
    const draftRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.BRAND_INFO_DRAFT);
    const snap = await draftRef.get();
    if (!snap.exists) return null;
    return {
      ...(snap.data()! as BrandInfoEntity),
      id: 'brand_info',
    };
  }

  async saveBrandInfoDraft(data: Partial<BrandInfoEntity>): Promise<BrandInfoEntity> {
    const draftRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.BRAND_INFO_DRAFT);
    const published = await this.getBrandInfo();
    const existingDraft = await this.getBrandInfoDraft();
    const base = existingDraft || published;
    const now = new Date().toISOString();

    const updatedDraft: BrandInfoEntity = {
      ...base,
      ...data,
      id: 'brand_info',
      publishStatus: 'draft',
      updatedAt: now,
    };

    await draftRef.set(updatedDraft);
    return updatedDraft;
  }

  async publishBrandInfo(data?: Partial<BrandInfoEntity>): Promise<BrandInfoEntity> {
    const firestore = getFirebaseFirestore();
    const publishedRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.BRAND_INFO);
    const prevRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.BRAND_INFO_PREV);
    const draftRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.BRAND_INFO_DRAFT);

    const published = await this.getBrandInfo();
    const existingDraft = await this.getBrandInfoDraft();
    const base = existingDraft || published;
    const now = new Date().toISOString();

    const newPublished: BrandInfoEntity = {
      ...base,
      ...(data || {}),
      id: 'brand_info',
      publishStatus: 'published',
      version: (published.version || 1) + 1,
      publishedAt: now,
      updatedAt: now,
    };

    const batch = firestore.batch();
    batch.set(prevRef, published);
    batch.set(publishedRef, newPublished);
    batch.delete(draftRef);
    await batch.commit();

    return newPublished;
  }

  async rollbackBrandInfo(): Promise<BrandInfoEntity> {
    const firestore = getFirebaseFirestore();
    const publishedRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.BRAND_INFO);
    const prevRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.BRAND_INFO_PREV);
    const draftRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.BRAND_INFO_DRAFT);

    const prevSnap = await prevRef.get();
    if (!prevSnap.exists) {
      throw new Error('No previous brand settings configuration found in Firestore for rollback.');
    }

    const prevData = prevSnap.data()! as BrandInfoEntity;
    const currentSnap = await publishedRef.get();
    const currentVersion = currentSnap.exists ? ((currentSnap.data()!.version as number) || 1) : 1;
    const now = new Date().toISOString();

    const restored: BrandInfoEntity = {
      ...prevData,
      id: 'brand_info',
      publishStatus: 'published',
      version: currentVersion + 1,
      updatedAt: now,
    };

    const batch = firestore.batch();
    batch.set(publishedRef, restored);
    batch.delete(draftRef);
    await batch.commit();

    return restored;
  }

  async updateBrandInfo(data: Partial<BrandInfoEntity>): Promise<BrandInfoEntity> {
    const docRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.BRAND_INFO);
    const updatedAt = new Date().toISOString();
    const snap = await docRef.get();
    const currentVersion = snap.exists ? ((snap.data()!.version as number) || 1) : 1;
    const updatePayload = {
      ...data,
      version: currentVersion + 1,
      updatedAt,
    };

    await docRef.set(updatePayload, { merge: true });
    const fresh = await docRef.get();
    return {
      ...(fresh.data()! as BrandInfoEntity),
      id: 'brand_info',
    };
  }

  // --- Site Settings Aliases ---
  async getSiteSettings(options?: { preview?: boolean }): Promise<BrandInfoEntity> {
    return this.getBrandInfo(options);
  }

  async getSiteSettingsDraft(): Promise<BrandInfoEntity | null> {
    return this.getBrandInfoDraft();
  }

  async saveSiteSettingsDraft(data: Partial<BrandInfoEntity>): Promise<BrandInfoEntity> {
    return this.saveBrandInfoDraft(data);
  }

  async publishSiteSettings(data?: Partial<BrandInfoEntity>): Promise<BrandInfoEntity> {
    return this.publishBrandInfo(data);
  }

  async rollbackSiteSettings(): Promise<BrandInfoEntity> {
    return this.rollbackBrandInfo();
  }

  async getHomepageConfig(options?: { preview?: boolean }): Promise<HomepageConfigEntity> {
    if (options?.preview) {
      const draftRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.HOMEPAGE_CONFIG_DRAFT);
      const draftSnap = await draftRef.get();
      if (draftSnap.exists) {
        return {
          ...(draftSnap.data()! as HomepageConfigEntity),
          id: 'homepage_config',
        };
      }
    }

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

  async getHomepageConfigDraft(): Promise<HomepageConfigEntity | null> {
    const draftRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.HOMEPAGE_CONFIG_DRAFT);
    const snap = await draftRef.get();
    if (!snap.exists) return null;
    return {
      ...(snap.data()! as HomepageConfigEntity),
      id: 'homepage_config',
    };
  }

  async saveHomepageConfigDraft(data: Partial<HomepageConfigEntity>): Promise<HomepageConfigEntity> {
    const draftRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.HOMEPAGE_CONFIG_DRAFT);
    const publishedConfig = await this.getHomepageConfig();
    const existingDraft = await this.getHomepageConfigDraft();
    const base = existingDraft || publishedConfig;
    const now = new Date().toISOString();

    const updatedDraft: HomepageConfigEntity = {
      ...base,
      ...data,
      hero: { ...base.hero, ...(data.hero || {}) },
      about: { ...base.about, ...(data.about || {}) },
      contact: { ...base.contact, ...(data.contact || {}) },
      id: 'homepage_config',
      status: 'draft',
      version: (base.version || 1) + 1,
      updatedAt: now,
    };

    await draftRef.set(updatedDraft);
    return updatedDraft;
  }

  async publishHomepageConfig(data?: Partial<HomepageConfigEntity>): Promise<HomepageConfigEntity> {
    const firestore = getFirebaseFirestore();
    const publishedRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.HOMEPAGE_CONFIG);
    const prevRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.HOMEPAGE_CONFIG_PREV);
    const draftRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.HOMEPAGE_CONFIG_DRAFT);

    const publishedConfig = await this.getHomepageConfig();
    const existingDraft = await this.getHomepageConfigDraft();
    const base = existingDraft || publishedConfig;
    const now = new Date().toISOString();

    const newPublished: HomepageConfigEntity = {
      ...base,
      ...(data || {}),
      hero: { ...base.hero, ...(data?.hero || {}) },
      about: { ...base.about, ...(data?.about || {}) },
      contact: { ...base.contact, ...(data?.contact || {}) },
      id: 'homepage_config',
      status: 'published',
      version: (publishedConfig.version || 1) + 1,
      updatedAt: now,
      publishedAt: now,
    };

    const batch = firestore.batch();
    // 1. Backup current published to prevRef
    batch.set(prevRef, publishedConfig);
    // 2. Set new published config
    batch.set(publishedRef, newPublished);
    // 3. Delete draft
    batch.delete(draftRef);

    await batch.commit();
    return newPublished;
  }

  async rollbackHomepageConfig(): Promise<HomepageConfigEntity> {
    const firestore = getFirebaseFirestore();
    const publishedRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.HOMEPAGE_CONFIG);
    const prevRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.HOMEPAGE_CONFIG_PREV);
    const draftRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.HOMEPAGE_CONFIG_DRAFT);

    const prevSnap = await prevRef.get();
    if (!prevSnap.exists) {
      throw new Error('No previous published homepage configuration available to restore.');
    }

    const current = await this.getHomepageConfig();
    const prevData = prevSnap.data()! as HomepageConfigEntity;
    const now = new Date().toISOString();

    const restored: HomepageConfigEntity = {
      ...prevData,
      id: 'homepage_config',
      status: 'published',
      version: (current.version || 1) + 1,
      updatedAt: now,
      publishedAt: now,
    };

    const batch = firestore.batch();
    batch.set(publishedRef, restored);
    batch.delete(draftRef);
    await batch.commit();

    return restored;
  }

  async updateHomepageConfig(
    data: Partial<HomepageConfigEntity>
  ): Promise<HomepageConfigEntity> {
    const docRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.HOMEPAGE_CONFIG);
    const current = await this.getHomepageConfig();
    const updatedAt = new Date().toISOString();
    const updated: HomepageConfigEntity = {
      ...current,
      ...data,
      hero: { ...current.hero, ...(data.hero || {}) },
      about: { ...current.about, ...(data.about || {}) },
      contact: { ...current.contact, ...(data.contact || {}) },
      version: (current.version || 1) + 1,
      updatedAt,
    };

    await docRef.set(updated, { merge: true });
    return updated;
  }

  // ==========================================
  // TECHNOLOGIES & INVENTORY MANAGEMENT
  // ==========================================

  async getTechnologies(_options?: { preview?: boolean }): Promise<TechnologyEntity[]> {
    const snap = await this.technologiesCollection.where('status', '==', 'published').get();
    const techs: TechnologyEntity[] = snap.docs.map((doc) => docToTechnology(doc.data(), doc.id));
    return techs.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getAllTechnologies(options?: { includeArchived?: boolean; preview?: boolean }): Promise<TechnologyEntity[]> {
    const snap = await this.technologiesCollection.get();
    let techs: TechnologyEntity[] = snap.docs.map((doc) => docToTechnology(doc.data(), doc.id));
    if (!options?.includeArchived) {
      techs = techs.filter((t) => t.status !== 'archived');
    }
    return techs.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getTechnologyById(id: string): Promise<TechnologyEntity | null> {
    const doc = await this.technologiesCollection.doc(id).get();
    if (!doc.exists) return null;
    return docToTechnology(doc.data()!, doc.id);
  }

  async createTechnology(data: CreateTechnologyInput): Promise<TechnologyEntity> {
    const validation = validateTechnology(data);
    if (!validation.valid) {
      throw new Error(`Validation failed for technology: ${JSON.stringify(validation.errors)}`);
    }

    const id = data.id || data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const docRef = this.technologiesCollection.doc(id);
    const existing = await docRef.get();
    if (existing.exists) {
      throw new Error(`Technology with ID "${id}" already exists.`);
    }

    const now = new Date().toISOString();
    const created: TechnologyEntity = {
      ...data,
      id,
      displayOrder: data.displayOrder || 1,
      status: data.status || 'published',
      version: 1,
      updatedAt: now,
    };

    await docRef.set(created);
    return created;
  }

  async updateTechnology(id: string, data: UpdateTechnologyInput): Promise<TechnologyEntity> {
    const docRef = this.technologiesCollection.doc(id);
    const snap = await docRef.get();
    if (!snap.exists) {
      throw new Error(`Technology with ID "${id}" not found.`);
    }

    const current = docToTechnology(snap.data()!, snap.id);

    // INVARIANT GUARD: Prevent archiving if currently occupying an active homepage Orbit slot
    if (data.status === 'archived') {
      const activeSlots = await this.getOrbitSlots();
      if (activeSlots.includes(id)) {
        throw new Error(
          `Cannot archive technology "${current.name}" while it occupies an active Homepage Orbit slot. Reassign the orbit slot before archiving.`
        );
      }
    }

    const merged = { ...current, ...data };
    const validation = validateTechnology(merged);
    if (!validation.valid) {
      throw new Error(`Validation failed for technology: ${JSON.stringify(validation.errors)}`);
    }

    const now = new Date().toISOString();
    const updated: TechnologyEntity = {
      ...current,
      ...data,
      id: current.id,
      x: current.x,
      y: current.y,
      svgX: current.svgX,
      svgY: current.svgY,
      isRear: current.isRear,
      scale: current.scale,
      floatDelay: current.floatDelay,
      version: (current.version || 1) + 1,
      updatedAt: now,
    };

    await docRef.set(updated, { merge: true });
    return updated;
  }

  async archiveTechnology(id: string): Promise<boolean> {
    await this.updateTechnology(id, { status: 'archived' });
    return true;
  }

  async restoreTechnology(id: string): Promise<boolean> {
    await this.updateTechnology(id, { status: 'draft' });
    return true;
  }

  async deleteTechnology(id: string): Promise<boolean> {
    const docRef = this.technologiesCollection.doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return false;

    // INVARIANT GUARD: Cannot delete if occupying an active orbit slot
    const activeSlots = await this.getOrbitSlots();
    if (activeSlots.includes(id)) {
      const tech = docToTechnology(snap.data()!, snap.id);
      throw new Error(
        `Cannot delete technology "${tech.name}" while it occupies an active Homepage Orbit slot. Reassign the orbit slot first.`
      );
    }

    await docRef.delete();
    return true;
  }

  async reorderTechnologies(orderedIds: string[]): Promise<boolean> {
    const firestore = getFirebaseFirestore();
    const batch = firestore.batch();
    const now = new Date().toISOString();

    orderedIds.forEach((id, idx) => {
      const ref = this.technologiesCollection.doc(id);
      batch.update(ref, {
        displayOrder: idx + 1,
        updatedAt: now,
      });
    });

    await batch.commit();
    return true;
  }

  // ==========================================
  // 9-SLOT 3D HOMEPAGE ORBIT MANAGEMENT
  // ==========================================

  async getOrbitSlots(options?: { preview?: boolean }): Promise<OrbitSlotsTuple> {
    if (options?.preview) {
      const draftRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.ORBIT_SLOTS_DRAFT);
      const draftSnap = await draftRef.get();
      if (draftSnap.exists) {
        const d = draftSnap.data()!;
        if (Array.isArray(d.slotTechnologyIds) && d.slotTechnologyIds.length === 9) {
          return d.slotTechnologyIds as OrbitSlotsTuple;
        }
      }
    }

    const docRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.ORBIT_SLOTS);
    const snap = await docRef.get();
    if (snap.exists) {
      const d = snap.data()!;
      if (Array.isArray(d.slotTechnologyIds) && d.slotTechnologyIds.length === 9) {
        return d.slotTechnologyIds as OrbitSlotsTuple;
      }
    }

    return [...DEFAULT_ORBIT_SLOTS];
  }

  async getOrbitSlotsDraft(): Promise<OrbitSlotsTuple | null> {
    const draftRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.ORBIT_SLOTS_DRAFT);
    const draftSnap = await draftRef.get();
    if (!draftSnap.exists) return null;
    const d = draftSnap.data()!;
    if (Array.isArray(d.slotTechnologyIds) && d.slotTechnologyIds.length === 9) {
      return d.slotTechnologyIds as OrbitSlotsTuple;
    }
    return null;
  }

  async saveOrbitSlotsDraft(slotTechnologyIds: OrbitSlotsTuple): Promise<OrbitSlotsTuple> {
    const techs = await this.getAllTechnologies();
    const validation = validateOrbitSlots(slotTechnologyIds, techs);
    if (!validation.valid) {
      throw new Error(`Validation failed for Orbit slots: ${JSON.stringify(validation.errors)}`);
    }

    const draftRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.ORBIT_SLOTS_DRAFT);
    const now = new Date().toISOString();
    await draftRef.set({
      id: FIRESTORE_SINGLETON_DOCS.ORBIT_SLOTS_DRAFT,
      status: 'draft',
      slotTechnologyIds,
      updatedAt: now,
    });

    return [...slotTechnologyIds];
  }

  async publishOrbitSlots(slotTechnologyIds?: OrbitSlotsTuple): Promise<OrbitSlotsTuple> {
    const currentSlots = await this.getOrbitSlots();
    const draft = await this.getOrbitSlotsDraft();
    const target = slotTechnologyIds || draft;
    if (!target) {
      throw new Error('NO_DRAFT_TO_PUBLISH: No draft orbit configuration exists to publish.');
    }
    const techs = await this.getAllTechnologies();
    const validation = validateOrbitSlots(target, techs);
    if (!validation.valid) {
      throw new Error(`Validation failed for Orbit slots: ${JSON.stringify(validation.errors)}`);
    }

    const firestore = getFirebaseFirestore();
    const publishedRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.ORBIT_SLOTS);
    const prevRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.ORBIT_SLOTS_PREV);
    const draftRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.ORBIT_SLOTS_DRAFT);

    const now = new Date().toISOString();
    const batch = firestore.batch();

    // 1. Snapshot previous published configuration for atomic rollback
    batch.set(prevRef, {
      id: FIRESTORE_SINGLETON_DOCS.ORBIT_SLOTS_PREV,
      status: 'published',
      slotTechnologyIds: currentSlots,
      updatedAt: now,
    });

    // 2. Publish new configuration
    batch.set(publishedRef, {
      id: FIRESTORE_SINGLETON_DOCS.ORBIT_SLOTS,
      status: 'published',
      slotTechnologyIds: target,
      updatedAt: now,
      publishedAt: now,
    });

    // 3. Clear draft
    batch.delete(draftRef);

    await batch.commit();
    return [...target];
  }

  async rollbackOrbitSlots(): Promise<OrbitSlotsTuple> {
    const prevRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.ORBIT_SLOTS_PREV);
    const prevSnap = await prevRef.get();
    if (!prevSnap.exists) {
      throw new Error('No previous published orbit slot configuration available to restore.');
    }

    const prevData = prevSnap.data()!;
    const restoredSlots = prevData.slotTechnologyIds as OrbitSlotsTuple;

    const firestore = getFirebaseFirestore();
    const publishedRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.ORBIT_SLOTS);
    const draftRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.ORBIT_SLOTS_DRAFT);

    const now = new Date().toISOString();
    const batch = firestore.batch();

    batch.set(publishedRef, {
      id: FIRESTORE_SINGLETON_DOCS.ORBIT_SLOTS,
      status: 'published',
      slotTechnologyIds: restoredSlots,
      updatedAt: now,
      publishedAt: now,
    });
    batch.delete(draftRef);

    await batch.commit();
    return [...restoredSlots];
  }

  // ==========================================
  // EXPERTISE AREAS (ENGINEERING DISCIPLINES)
  // ==========================================

  async getExpertiseAreas(_options?: { preview?: boolean }): Promise<ExpertiseAreaEntity[]> {
    const snap = await this.expertiseCollection.where('status', '==', 'published').get();
    const areas: ExpertiseAreaEntity[] = snap.docs.map((doc) => docToExpertiseArea(doc.data(), doc.id));
    return areas.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getAllExpertiseAreas(options?: { includeArchived?: boolean; preview?: boolean }): Promise<ExpertiseAreaEntity[]> {
    const snap = await this.expertiseCollection.get();
    let areas: ExpertiseAreaEntity[] = snap.docs.map((doc) => docToExpertiseArea(doc.data(), doc.id));
    if (!options?.includeArchived) {
      areas = areas.filter((a) => a.status !== 'archived');
    }
    return areas.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getExpertiseAreaById(id: string): Promise<ExpertiseAreaEntity | null> {
    const doc = await this.expertiseCollection.doc(id).get();
    if (!doc.exists) return null;
    return docToExpertiseArea(doc.data()!, doc.id);
  }

  async createExpertiseArea(data: CreateExpertiseAreaInput): Promise<ExpertiseAreaEntity> {
    const validation = validateExpertiseArea(data);
    if (!validation.valid) {
      throw new Error(`Validation failed for expertise area: ${JSON.stringify(validation.errors)}`);
    }

    const id = data.id || data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const docRef = this.expertiseCollection.doc(id);
    const existing = await docRef.get();
    if (existing.exists) {
      throw new Error(`Expertise area with ID "${id}" already exists.`);
    }

    const now = new Date().toISOString();
    const created: ExpertiseAreaEntity = {
      ...data,
      id,
      displayOrder: data.displayOrder || 1,
      status: data.status || 'published',
      version: 1,
      updatedAt: now,
    };

    await docRef.set(created);
    return created;
  }

  async updateExpertiseArea(id: string, data: UpdateExpertiseAreaInput): Promise<ExpertiseAreaEntity> {
    const docRef = this.expertiseCollection.doc(id);
    const snap = await docRef.get();
    if (!snap.exists) {
      throw new Error(`Expertise area with ID "${id}" not found.`);
    }

    const current = docToExpertiseArea(snap.data()!, snap.id);
    const merged = { ...current, ...data };
    const validation = validateExpertiseArea(merged);
    if (!validation.valid) {
      throw new Error(`Validation failed for expertise area: ${JSON.stringify(validation.errors)}`);
    }

    const now = new Date().toISOString();
    const updated: ExpertiseAreaEntity = {
      ...current,
      ...data,
      id: current.id,
      version: (current.version || 1) + 1,
      updatedAt: now,
    };

    await docRef.set(updated, { merge: true });
    return updated;
  }

  async archiveExpertiseArea(id: string): Promise<boolean> {
    await this.updateExpertiseArea(id, { status: 'archived' });
    return true;
  }

  async restoreExpertiseArea(id: string): Promise<boolean> {
    await this.updateExpertiseArea(id, { status: 'draft' });
    return true;
  }

  async deleteExpertiseArea(id: string): Promise<boolean> {
    const docRef = this.expertiseCollection.doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return false;
    await docRef.delete();
    return true;
  }

  async reorderExpertiseAreas(orderedIds: string[]): Promise<boolean> {
    const firestore = getFirebaseFirestore();
    const batch = firestore.batch();
    const now = new Date().toISOString();

    orderedIds.forEach((id, idx) => {
      const ref = this.expertiseCollection.doc(id);
      batch.update(ref, {
        displayOrder: idx + 1,
        updatedAt: now,
      });
    });

    await batch.commit();
    return true;
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

  // --- SEO Management ---

  async getSeoConfig(options?: { preview?: boolean }): Promise<SiteSeoConfigEntity> {
    if (options?.preview) {
      const draftRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.SEO_CONFIG_DRAFT);
      const draftSnap = await draftRef.get();
      if (draftSnap.exists) {
        return {
          ...(draftSnap.data()! as SiteSeoConfigEntity),
          id: 'seo_config',
        };
      }
    }

    const docRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.SEO_CONFIG);
    const snap = await docRef.get();

    if (!snap.exists) {
      return { ...DEFAULT_SEO_CONFIG };
    }

    const data = snap.data()!;
    return {
      ...(data as SiteSeoConfigEntity),
      id: 'seo_config',
    };
  }

  async getSeoConfigDraft(): Promise<SiteSeoConfigEntity | null> {
    const draftRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.SEO_CONFIG_DRAFT);
    const snap = await draftRef.get();
    if (!snap.exists) return null;
    return {
      ...(snap.data()! as SiteSeoConfigEntity),
      id: 'seo_config',
    };
  }

  async saveSeoConfigDraft(data: Partial<SiteSeoConfigEntity>): Promise<SiteSeoConfigEntity> {
    const draftRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.SEO_CONFIG_DRAFT);
    const published = await this.getSeoConfig();
    const existingDraft = await this.getSeoConfigDraft();
    const base = existingDraft || published;
    const now = new Date().toISOString();

    const updatedDraft: SiteSeoConfigEntity = {
      ...base,
      ...data,
      homepage:
        data.homepage !== undefined ? { ...(base.homepage || {}), ...data.homepage } : base.homepage,
      projectsArchive:
        data.projectsArchive !== undefined
          ? { ...(base.projectsArchive || {}), ...data.projectsArchive }
          : base.projectsArchive,
      blogArchive:
        data.blogArchive !== undefined
          ? { ...(base.blogArchive || {}), ...data.blogArchive }
          : base.blogArchive,
      id: 'seo_config',
      status: 'draft',
      version: (base.version || 1) + 1,
      updatedAt: now,
    };

    await draftRef.set(updatedDraft);
    return updatedDraft;
  }

  async publishSeoConfig(data?: Partial<SiteSeoConfigEntity>): Promise<SiteSeoConfigEntity> {
    const firestore = getFirebaseFirestore();
    const publishedRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.SEO_CONFIG);
    const prevRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.SEO_CONFIG_PREV);
    const draftRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.SEO_CONFIG_DRAFT);

    const published = await this.getSeoConfig();
    const existingDraft = await this.getSeoConfigDraft();
    const base = existingDraft || published;
    const now = new Date().toISOString();

    const newPublished: SiteSeoConfigEntity = {
      ...base,
      ...(data || {}),
      homepage:
        data?.homepage !== undefined
          ? { ...(base.homepage || {}), ...data.homepage }
          : base.homepage,
      projectsArchive:
        data?.projectsArchive !== undefined
          ? { ...(base.projectsArchive || {}), ...data.projectsArchive }
          : base.projectsArchive,
      blogArchive:
        data?.blogArchive !== undefined
          ? { ...(base.blogArchive || {}), ...data.blogArchive }
          : base.blogArchive,
      id: 'seo_config',
      status: 'published',
      version: (published.version || 1) + 1,
      updatedAt: now,
      publishedAt: now,
    };

    const batch = firestore.batch();
    batch.set(prevRef, published);
    batch.set(publishedRef, newPublished);
    batch.delete(draftRef);

    await batch.commit();
    return newPublished;
  }

  async rollbackSeoConfig(): Promise<SiteSeoConfigEntity> {
    const publishedRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.SEO_CONFIG);
    const prevRef = this.siteConfigCollection.doc(FIRESTORE_SINGLETON_DOCS.SEO_CONFIG_PREV);

    const prevSnap = await prevRef.get();
    if (!prevSnap.exists) {
      throw new Error('No previous published SEO configuration available to restore.');
    }

    const current = await this.getSeoConfig();
    const prevData = prevSnap.data()! as SiteSeoConfigEntity;
    const now = new Date().toISOString();

    const restored: SiteSeoConfigEntity = {
      ...prevData,
      version: (current.version || 1) + 1,
      updatedAt: now,
    };

    await publishedRef.set(restored);
    return restored;
  }
}

function docToTechnology(d: FirebaseFirestore.DocumentData, id: string): TechnologyEntity {
  return {
    id: (d.id as string) || id,
    name: (d.name as string) || '',
    label: (d.label as string) || '',
    category: (d.category as string) || '',
    role: (d.role as string) || '',
    description: (d.description as string) || '',
    capability: (d.capability as string) || '',
    logoKey: (d.logoKey as string) || id,
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
    version: (d.version as number) ?? 1,
    updatedAt: (d.updatedAt as string) || new Date().toISOString(),
  };
}

function docToExpertiseArea(d: FirebaseFirestore.DocumentData, id: string): ExpertiseAreaEntity {
  return {
    id: (d.id as string) || id,
    name: (d.name as string) || '',
    level: (d.level as string) || '',
    description: (d.description as string) || '',
    coreConcepts: Array.isArray(d.coreConcepts) ? (d.coreConcepts as string[]) : [],
    icon: (d.icon as string) || undefined,
    displayOrder: (d.displayOrder as number) ?? 1,
    status: (d.status as ExpertiseAreaEntity['status']) || 'published',
    version: (d.version as number) ?? 1,
    updatedAt: (d.updatedAt as string) || new Date().toISOString(),
  };
}

