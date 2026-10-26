/**
 * PHILOZZ CMS — Local Project Repository Implementation
 * Phase 16D.1: Projects & Case Studies Full CRUD
 *
 * Provides a concrete, in-memory repository wrapping the existing portfolio data.
 * Adheres strictly to IProjectRepository with full soft deletion, restoration,
 * and atomic homepage featured 3-slot invariant enforcement.
 */

import { PROJECTS, COMPACT_PROJECT_META } from '@/data/portfolioData';
import {
  ProjectEntity,
  CreateProjectInput,
  UpdateProjectInput,
  ContentStatus,
} from '../../models/project';
import { IProjectRepository } from '../types';

function mapToProjectEntity(slug: string, index: number): ProjectEntity {
  const p = PROJECTS.find((item) => item.slug === slug);
  if (!p) {
    throw new Error(`Project with slug "${slug}" not found in local data source.`);
  }

  const meta = COMPACT_PROJECT_META[slug as keyof typeof COMPACT_PROJECT_META] || {
    categoryLabel: p.category.toUpperCase(),
    archiveCategory: 'backend',
    shortSummary: p.summary,
    primaryTechs: p.technologies.slice(0, 3),
  };

  return {
    id: p.slug,
    slug: p.slug,
    title: p.title,
    tagline: p.tagline,
    role: p.role,
    period: p.period,
    clientOrContext: p.clientOrContext,
    category: p.category,
    archiveCategory: meta.archiveCategory,
    categoryLabel: meta.categoryLabel,
    technologies: [...p.technologies],
    primaryTechs: [...meta.primaryTechs],
    summary: p.summary,
    shortSummary: meta.shortSummary,
    challenge: p.challenge,
    responsibilities: [...p.responsibilities],
    architectureSummary: p.architectureSummary,
    architectureNodes: p.architectureNodes.map((n) => ({ ...n })),
    technicalDecisions: p.technicalDecisions.map((d) => ({ ...d })),
    demoVisualType: p.demoVisualType,
    lessonsLearned: [...p.lessonsLearned],
    hasLiveDemo: p.hasLiveDemo,
    demoUrl: p.demoUrl,
    githubUrl: p.githubUrl,
    status: 'published' as ContentStatus,
    featured: true, // Dev seed keeps 8 as featured for initial dev inventory tests
    featuredOrder: index + 1,
    displayOrder: index + 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-04-15T00:00:00.000Z',
    publishedAt: '2026-01-01T00:00:00.000Z',
    isDeleted: false,
  };
}

export class LocalProjectRepository implements IProjectRepository {
  private projects: ProjectEntity[];

  constructor() {
    this.projects = PROJECTS.map((p, idx) => mapToProjectEntity(p.slug, idx));
  }

  async getAll(options?: {
    status?: ContentStatus;
    featuredOnly?: boolean;
    includeDeleted?: boolean;
  }): Promise<ProjectEntity[]> {
    let result = [...this.projects];

    if (!options?.includeDeleted) {
      result = result.filter((p) => !p.isDeleted);
    }

    if (options?.status) {
      result = result.filter((p) => p.status === options.status);
    }

    if (options?.featuredOnly) {
      result = result.filter((p) => p.featured);
    }

    if (options?.featuredOnly) {
      return result.sort(
        (a, b) => (a.featuredOrder ?? a.displayOrder) - (b.featuredOrder ?? b.displayOrder)
      );
    }

    return result.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getBySlug(slug: string, options?: { includeDeleted?: boolean }): Promise<ProjectEntity | null> {
    const found = this.projects.find((p) => p.slug === slug);
    if (!found) return null;
    if (found.isDeleted && !options?.includeDeleted) return null;
    return { ...found };
  }

  async getById(id: string, options?: { includeDeleted?: boolean }): Promise<ProjectEntity | null> {
    const found = this.projects.find((p) => p.id === id);
    if (!found) return null;
    if (found.isDeleted && !options?.includeDeleted) return null;
    return { ...found };
  }

  async create(data: CreateProjectInput): Promise<ProjectEntity> {
    const now = new Date().toISOString();
    const id = data.slug || `proj_${Date.now()}`;
    const newEntity: ProjectEntity = {
      ...data,
      id,
      slug: data.slug || id,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };
    this.projects.push(newEntity);
    return { ...newEntity };
  }

  async update(id: string, data: UpdateProjectInput): Promise<ProjectEntity> {
    const idx = this.projects.findIndex((p) => p.id === id);
    if (idx === -1) {
      throw new Error(`Project with id "${id}" not found.`);
    }

    const current = this.projects[idx];

    // Protect 3-featured invariant: cannot unpublish or delete if currently featured on home
    if (current.featured && (data.status === 'draft' || data.status === 'archived' || data.isDeleted)) {
      throw new Error(
        `Cannot unpublish or delete "${current.title}" because it is currently assigned to a Homepage Featured Slot. Please reassign the featured slot first.`
      );
    }

    const updated: ProjectEntity = {
      ...current,
      ...data,
      id: current.id,
      slug: current.slug, // Prevent arbitrary slug mutation in this phase
      updatedAt: new Date().toISOString(),
    };
    this.projects[idx] = updated;
    return { ...updated };
  }

  async softDelete(id: string): Promise<boolean> {
    const idx = this.projects.findIndex((p) => p.id === id);
    if (idx === -1) return false;

    const current = this.projects[idx];
    if (current.featured && current.status === 'published') {
      throw new Error(
        `Cannot delete "${current.title}" because it is currently assigned to a Homepage Featured Slot. Please reassign the featured slot first.`
      );
    }

    current.isDeleted = true;
    current.deletedAt = new Date().toISOString();
    current.updatedAt = new Date().toISOString();
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const idx = this.projects.findIndex((p) => p.id === id);
    if (idx === -1) return false;

    const current = this.projects[idx];
    current.isDeleted = false;
    current.deletedAt = undefined;
    current.updatedAt = new Date().toISOString();
    return true;
  }

  async delete(id: string, permanent: boolean = false): Promise<boolean> {
    if (!permanent) {
      return this.softDelete(id);
    }

    const idx = this.projects.findIndex((p) => p.id === id);
    if (idx === -1) return false;

    const current = this.projects[idx];
    if (current.featured && current.status === 'published') {
      throw new Error(
        `Cannot permanently delete "${current.title}" while it is assigned to a Homepage Featured Slot.`
      );
    }

    this.projects.splice(idx, 1);
    return true;
  }

  async reorder(orderedIds: string[]): Promise<boolean> {
    orderedIds.forEach((id, index) => {
      const p = this.projects.find((item) => item.id === id);
      if (p) {
        p.displayOrder = index + 1;
        p.updatedAt = new Date().toISOString();
      }
    });
    return true;
  }

  async setFeaturedSlots(slotProjectIds: [string, string, string]): Promise<boolean> {
    const uniqueIds = Array.from(new Set(slotProjectIds));
    if (uniqueIds.length !== 3) {
      throw new Error('Homepage Featured selection must specify exactly 3 distinct project IDs.');
    }

    // Verify all 3 projects exist, are published, and are not deleted
    for (const id of slotProjectIds) {
      const p = this.projects.find((item) => item.id === id);
      if (!p) {
        throw new Error(`Project with ID "${id}" does not exist.`);
      }
      if (p.isDeleted) {
        throw new Error(`Cannot feature deleted project "${p.title}".`);
      }
      if (p.status !== 'published') {
        throw new Error(`Cannot feature unpublished project "${p.title}" (status: ${p.status}).`);
      }
    }

    // Clear featured status from all projects
    for (const p of this.projects) {
      p.featured = false;
      p.featuredOrder = undefined;
    }

    // Assign featured status and order 1, 2, 3 to chosen projects
    slotProjectIds.forEach((id, idx) => {
      const p = this.projects.find((item) => item.id === id);
      if (p) {
        p.featured = true;
        p.featuredOrder = idx + 1;
        p.updatedAt = new Date().toISOString();
      }
    });

    return true;
  }
}
