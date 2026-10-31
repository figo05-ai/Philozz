/**
 * PHILOZZ CMS — Technology, Skills & Architecture Domain Models
 * Phase 16A / 16D.3B: Dynamic Technology Management & Fixed 3D Orbit Integration
 */

import { ContentStatus } from './project';

export const SUPPORTED_TECH_LOGOS = [
  'laravel',
  'php',
  'mysql',
  'javascript',
  'react',
  'nextjs',
  'redis',
  'docker',
  'linux',
] as const;

export type SupportedTechLogoKey = (typeof SUPPORTED_TECH_LOGOS)[number];

export function isSupportedLogoKey(key: string): key is SupportedTechLogoKey {
  return (SUPPORTED_TECH_LOGOS as readonly string[]).includes(key);
}

/**
 * The 9 fixed visual system positions in the approved 3D Orbit.
 * These coordinates, scales, depths, and delays are system-controlled
 * and locked to preserve 100% visual fidelity of the Black Hole Portals
 * and GSAP Galaxy Collapse choreography.
 */
export interface OrbitSlotGeometry {
  slotId: string; // 'slot-0' .. 'slot-8'
  label: string;
  x: number; // percentage left (0..100)
  y: number; // percentage top (0..100)
  svgX: number; // viewBox coordinate (0..1000)
  svgY: number; // viewBox coordinate (0..560)
  isRear: boolean;
  scale: number;
  floatDelay: string;
  logoSize: number;
}

export const FIXED_ORBIT_SLOT_GEOMETRY: readonly OrbitSlotGeometry[] = [
  // Rear Row (higher perspective elevation, receding in depth)
  {
    slotId: 'slot-0',
    label: 'Rear Orbit 1 (Left)',
    x: 18,
    y: 12,
    svgX: 180,
    svgY: 67,
    isRear: true,
    scale: 0.86,
    floatDelay: '0s',
    logoSize: 34,
  },
  {
    slotId: 'slot-1',
    label: 'Rear Orbit 2 (Center-Left)',
    x: 39,
    y: 6,
    svgX: 390,
    svgY: 34,
    isRear: true,
    scale: 0.84,
    floatDelay: '0.4s',
    logoSize: 38,
  },
  {
    slotId: 'slot-2',
    label: 'Rear Orbit 3 (Center-Right)',
    x: 61,
    y: 6,
    svgX: 610,
    svgY: 34,
    isRear: true,
    scale: 0.84,
    floatDelay: '0.8s',
    logoSize: 36,
  },
  {
    slotId: 'slot-3',
    label: 'Rear Orbit 4 (Right)',
    x: 82,
    y: 12,
    svgX: 820,
    svgY: 67,
    isRear: true,
    scale: 0.86,
    floatDelay: '1.2s',
    logoSize: 34,
  },
  // Front Row (foreground pedestals, lower Y)
  {
    slotId: 'slot-4',
    label: 'Front Orbit 1 (Far Left)',
    x: 10,
    y: 56,
    svgX: 100,
    svgY: 314,
    isRear: false,
    scale: 1.0,
    floatDelay: '1.6s',
    logoSize: 42,
  },
  {
    slotId: 'slot-5',
    label: 'Front Orbit 2 (Mid Left)',
    x: 29,
    y: 67,
    svgX: 290,
    svgY: 375,
    isRear: false,
    scale: 1.02,
    floatDelay: '2.0s',
    logoSize: 42,
  },
  {
    slotId: 'slot-6',
    label: 'Front Orbit 3 (Foreground Center Pedestal)',
    x: 50,
    y: 72,
    svgX: 500,
    svgY: 403,
    isRear: false,
    scale: 1.05,
    floatDelay: '0.2s',
    logoSize: 44,
  },
  {
    slotId: 'slot-7',
    label: 'Front Orbit 4 (Mid Right)',
    x: 71,
    y: 67,
    svgX: 710,
    svgY: 375,
    isRear: false,
    scale: 1.02,
    floatDelay: '0.6s',
    logoSize: 42,
  },
  {
    slotId: 'slot-8',
    label: 'Front Orbit 5 (Far Right)',
    x: 90,
    y: 56,
    svgX: 900,
    svgY: 314,
    isRear: false,
    scale: 1.0,
    floatDelay: '1.0s',
    logoSize: 42,
  },
] as const;

export type OrbitSlotsTuple = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

export const DEFAULT_ORBIT_SLOTS: OrbitSlotsTuple = [
  'laravel',
  'php',
  'mysql',
  'javascript',
  'react',
  'nextjs',
  'redis',
  'docker',
  'linux',
];

export interface OrbitSlotsConfigEntity {
  id: 'orbit_slots';
  status?: 'draft' | 'published';
  version?: number;
  slotTechnologyIds: OrbitSlotsTuple;
  updatedAt: string;
  publishedAt?: string;
}

export type LearningStatus = 'actively_using' | 'learning' | 'exploring' | 'previously_used';

export interface TechnologyEntity {
  id: string; // e.g., 'laravel', 'php', 'mysql'
  name: string; // e.g., 'Laravel', 'PHP 8.3'
  label: string; // e.g., 'Laravel'
  category: string; // e.g., 'Backend Framework'
  role: string; // e.g., 'Service-Oriented MVC, Eloquent ORM, Horizon Queues'
  description: string;
  capability: string; // e.g., 'Eloquent ORM • Horizon Queues • Service Layers'
  logoKey: string; // Key mapping to supported logo renderer or unassigned asset
  logoSize?: number;
  // Elliptical 3D perspective orbit coordinates (Preserved geometry)
  x?: number; // percentage left (0..100)
  y?: number; // percentage top (0..100)
  svgX?: number; // viewBox coordinate (0..1000)
  svgY?: number; // viewBox coordinate (0..560)
  isRear?: boolean;
  scale?: number;
  floatDelay?: string;
  displayOrder: number;
  status: ContentStatus;
  version?: number;
  updatedAt: string;

  // Engineering Atlas Knowledge Architecture Extensions
  disciplineId?: string; // Links to ExpertiseAreaEntity id (e.g. 'backend', 'database', etc.)
  learningStatus?: LearningStatus; // 'actively_using' | 'learning' | 'exploring' | 'previously_used'
  capabilitiesList?: string[]; // Granular documented capabilities
  coreConcepts?: string[]; // Technical engineering sub-concepts
  practicalExpertise?: string; // Real-world capabilities & what Philopater builds with it
  relatedTechIds?: string[]; // Architectural sibling technologies
  relatedProjectSlugs?: string[]; // Connected portfolio project slugs
  learningNotes?: string; // Continuous growth notes and current exploration focus
  associatedArticleSlugs?: string[]; // Connected engineering journal notes
}

export type CreateTechnologyInput = Omit<TechnologyEntity, 'id' | 'updatedAt' | 'version'> & { id?: string };
export type UpdateTechnologyInput = Partial<Omit<TechnologyEntity, 'id'>> & { id?: string };

export interface ExpertiseAreaEntity {
  id: string;
  name: string;
  level: string;
  description: string;
  coreConcepts: string[];
  icon?: string; // 'Layers' | 'Cpu' | 'Database' | 'Gauge' | 'GitBranch' | 'ShieldCheck'
  displayOrder: number;
  status: ContentStatus;
  version?: number;
  updatedAt: string;

  // Engineering Atlas Discipline Extensions
  associatedTechIds?: string[];
  associatedCapabilities?: string[];
  relatedProjectSlugs?: string[];
  learningTopics?: string[];
}

export type CreateExpertiseAreaInput = Omit<ExpertiseAreaEntity, 'id' | 'updatedAt' | 'version'> & { id?: string };
export type UpdateExpertiseAreaInput = Partial<Omit<ExpertiseAreaEntity, 'id'>> & { id?: string };

export interface StackDetailsEntity {
  id: 'current_stack';
  primaryBackend: string[];
  frontend: string[];
  infrastructure: string[];
  updatedAt: string;
}
