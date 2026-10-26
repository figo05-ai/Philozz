/**
 * PHILOZZ CMS — Technology, Skills & Architecture Domain Models
 * Phase 16A: Dynamic CMS Architecture & Data Foundation
 */

import { ContentStatus } from './project';

export interface TechnologyEntity {
  id: string; // e.g., 'laravel', 'php', 'mysql'
  name: string; // e.g., 'Laravel', 'PHP 8.3'
  label: string; // e.g., 'Laravel'
  category: string; // e.g., 'Backend Framework'
  role: string; // e.g., 'Service-Oriented MVC, Eloquent ORM, Horizon Queues'
  description: string;
  capability: string; // e.g., 'Eloquent ORM • Horizon Queues • Service Layers'
  logoKey: string; // Key mapping to logo renderer: 'laravel' | 'php' | 'mysql' | etc.
  logoSize: number;
  // Elliptical 3D perspective orbit coordinates (Preserved geometry)
  x: number; // percentage left (0..100)
  y: number; // percentage top (0..100)
  svgX: number; // viewBox coordinate (0..1000)
  svgY: number; // viewBox coordinate (0..560)
  isRear: boolean;
  scale: number;
  floatDelay: string;
  displayOrder: number;
  status: ContentStatus;
  updatedAt: string;
}

export interface ExpertiseAreaEntity {
  id: string;
  name: string;
  level: string;
  description: string;
  coreConcepts: string[];
  displayOrder: number;
  status: ContentStatus;
  updatedAt: string;
}

export interface StackDetailsEntity {
  id: 'current_stack';
  primaryBackend: string[];
  frontend: string[];
  infrastructure: string[];
  updatedAt: string;
}
