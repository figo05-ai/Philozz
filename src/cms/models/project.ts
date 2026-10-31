/**
 * PHILOZZ CMS — Project & Case Study Domain Models
 * Phase 16A: Dynamic CMS Architecture & Data Foundation
 */

export type ContentStatus = 'draft' | 'published' | 'archived';

export interface ArchitectureNode {
  name: string;
  description: string;
  tech: string;
}

export interface TechnicalDecision {
  title: string;
  rationale: string;
}

export type DemoVisualType =
  | 'task-flow'
  | 'license-matrix'
  | 'security-topology'
  | 'skillup-horizon'
  | 'smartpos-hardware'
  | 'tanqia-pipeline';

export interface ProjectEntity {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  role: string;
  period: string;
  clientOrContext: string;
  category: string;
  archiveCategory: string;
  categoryLabel: string;
  technologies: string[];
  primaryTechs: string[];
  summary: string;
  shortSummary: string;
  challenge: string;
  responsibilities: string[];
  architectureSummary: string;
  architectureNodes: ArchitectureNode[];
  technicalDecisions: TechnicalDecision[];
  demoVisualType: DemoVisualType;
  lessonsLearned: string[];
  hasLiveDemo: boolean;
  demoUrl?: string;
  productionUrl?: string;
  githubUrl?: string;
  status: ContentStatus;
  featured: boolean;
  featuredOrder?: number;
  displayOrder: number;
  coverImageUrl?: string;
  thumbnailUrl?: string;
  galleryImages?: string[];
  ogImageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export type CreateProjectInput = Omit<ProjectEntity, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProjectInput = Partial<CreateProjectInput>;
