/**
 * PHILOZZ CMS — Local Site Content Repository Implementation
 * Phase 16A: Dynamic CMS Architecture & Data Foundation
 *
 * Provides a concrete repository wrapping brand info, section configs,
 * technologies, and stack details.
 */

import { BRAND_INFO, EXPERTISE_AREAS, STACK_DETAILS, PHOTO_ASSETS } from '@/data/portfolioData';
import {
  BrandInfoEntity,
  HomepageConfigEntity,
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

export class LocalSiteContentRepository implements ISiteContentRepository {
  private brandInfo: BrandInfoEntity;
  private homepageConfig: HomepageConfigEntity;
  private homepageConfigDraft: HomepageConfigEntity | null = null;
  private previousHomepageConfig: HomepageConfigEntity | null = null;
  private orbitSlots: OrbitSlotsTuple = [...DEFAULT_ORBIT_SLOTS];
  private orbitSlotsDraft: OrbitSlotsTuple | null = null;
  private previousOrbitSlots: OrbitSlotsTuple | null = null;
  private technologies: TechnologyEntity[];
  private expertiseAreas: ExpertiseAreaEntity[];
  private stackDetails: StackDetailsEntity;

  constructor() {
    this.brandInfo = {
      id: 'brand_info',
      name: BRAND_INFO.name,
      developerName: BRAND_INFO.developerName,
      role: BRAND_INFO.role,
      specialization: BRAND_INFO.specialization,
      tagline: BRAND_INFO.tagline,
      statement: BRAND_INFO.statement,
      philosophy: BRAND_INFO.philosophy,
      transformationHeadline: BRAND_INFO.transformationHeadline,
      finaleHeadline: BRAND_INFO.finaleHeadline,
      email: BRAND_INFO.email,
      brandEmail: BRAND_INFO.brandEmail,
      domain: BRAND_INFO.domain,
      phone: BRAND_INFO.phone,
      location: BRAND_INFO.location,
      github: BRAND_INFO.github,
      linkedin: BRAND_INFO.linkedin,
      cvAvailable: BRAND_INFO.cvAvailable,
      cvUrl: BRAND_INFO.cvUrl,
      experienceYears: BRAND_INFO.experienceYears,
      projectsCount: BRAND_INFO.projectsCount,
      curiosity: BRAND_INFO.curiosity,
      status: BRAND_INFO.status,
      isDemoEnvironment: BRAND_INFO.isDemoEnvironment,
      updatedAt: '2026-04-15T00:00:00.000Z',
    };

    this.homepageConfig = {
      id: 'homepage_config',
      status: 'published',
      version: 1,
      publishedAt: '2026-04-15T00:00:00.000Z',
      hero: {
        eyebrow: 'FULL-STACK DEVELOPER',
        titleLine1: 'Full-Stack',
        titleLine2: 'Engineer.',
        titleLine3: 'Backend at Heart.',
        description:
          'Building performant, scalable, and meaningful web applications. I turn ideas into robust backend systems and delightful digital experiences.',
        primaryCtaLabel: 'View My Work',
        primaryCtaHref: '#projects',
        secondaryCtaLabel: "Let's Talk",
        secondaryCtaHref: '#contact',
        signatureWords: ['Code', 'Build', 'Improve', 'Repeat'],
        signatureCredentials: ['CLEAN CODE', 'SCALABLE SYSTEMS', 'REAL IMPACT'],
        heroImageUrl: '/images/philozz-cinematic-hero.png',
      },
      about: {
        sectionTag: 'ABOUT ME',
        titlePrefix: 'The Engineer',
        narrativeParagraph1:
          "I'm Felopater Nabil, a backend-focused Full-Stack Software Engineer specializing in PHP and Laravel. I build APIs, database-driven applications, and reliable backend workflows that turn complex requirements into practical software.",
        narrativeParagraph2:
          'My work spans RESTful API design, database optimization, Redis caching, background jobs, and clean application architecture. I enjoy solving engineering problems, exploring better approaches, and building systems that are easier to maintain and evolve.',
        badges: [
          { icon: 'MapPin', label: 'Alexandria, Egypt' },
          { icon: 'Layers', label: 'Backend Engineering' },
          { icon: 'Code2', label: 'Always Building' },
        ],
        ctaLabel: 'More About Me',
        ctaHref: '#skills',
        mosaicCards: [
          {
            id: 'thinking',
            badge: 'THINKING',
            title: 'The Mind Behind the Code',
            subtitle: 'Problem-solving, architecture decisions, and analytical reasoning.',
            imageUrl: PHOTO_ASSETS.portraitThinking,
            imageAlt: 'Felopater Nabil — The Mind Behind the Code',
          },
          {
            id: 'building',
            badge: 'BUILDING',
            title: 'Turning Architecture into Reality',
            subtitle: 'Designing APIs, backend workflows, and maintainable systems.',
            ideFilename: 'OrderPipeline.php',
            ideLang: 'PHP 8.3 / Laravel',
            ideSnippet:
              'DB::transaction(fn () => {\n  Horizon::queue($job);\n});',
            telemetryRoute: '/api/v1/orders',
            telemetryStatus: '200 OK • 18ms',
          },
          {
            id: 'journey',
            badge: 'THE JOURNEY',
            title: 'Continuous Evolution',
            subtitle: 'Learning, building, and refining my engineering craft.',
            timelineItems: [
              {
                heading: 'Sadat Academy',
                info: 'MIS Degree • Architecture Foundation (GPA 3.58)',
              },
              {
                heading: 'NTI & ITI Programs',
                info: 'Full-Stack PHP, Laravel & Databases',
              },
              {
                heading: 'SkillUp (2024 — Present)',
                info: 'High-concurrency APIs, Redis & Queues',
                isActive: true,
              },
            ],
          },
        ],
      },
      contact: {
        headline: 'Get In Touch',
        subheadline:
          'Whether you have an ambitious platform to build, an engineering challenge to solve, or an opportunity to explore, my inbox is open.',
        email: BRAND_INFO.email,
        phone: BRAND_INFO.phone,
        location: BRAND_INFO.location,
        socialLinks: [
          { platform: 'GitHub', url: BRAND_INFO.github, label: 'figo05-ai' },
          { platform: 'LinkedIn', url: BRAND_INFO.linkedin, label: 'felopter-alexandir' },
        ],
        footerTagline: 'Engineering with discipline. Designed for impact.',
      },
      updatedAt: '2026-04-15T00:00:00.000Z',
    };

    // 9 Technologies with orbit coordinates strictly preserved
    this.technologies = [
      {
        id: 'laravel',
        name: 'Laravel',
        label: 'Laravel',
        category: 'Backend Framework',
        role: 'Service-Oriented MVC, Eloquent ORM, Horizon Queues',
        description: 'REST APIs, background jobs, authentication, and maintainable application architecture.',
        capability: 'Eloquent ORM • Horizon Queues • Service Layers',
        logoKey: 'laravel',
        logoSize: 34,
        x: 18,
        y: 12,
        svgX: 180,
        svgY: 67,
        isRear: true,
        scale: 0.86,
        floatDelay: '0s',
        displayOrder: 1,
        status: 'published',
        updatedAt: '2026-04-15T00:00:00.000Z',
      },
      {
        id: 'php',
        name: 'PHP 8.3',
        label: 'PHP',
        category: 'Backend Language',
        role: 'Strict typing, attributes, fibers, memory profiling',
        description: 'Server-side engineering and robust application development.',
        capability: 'Strict Typing • PHP 8.3 • Memory Profiling',
        logoKey: 'php',
        logoSize: 38,
        x: 39,
        y: 6,
        svgX: 390,
        svgY: 34,
        isRear: true,
        scale: 0.84,
        floatDelay: '0.4s',
        displayOrder: 2,
        status: 'published',
        updatedAt: '2026-04-15T00:00:00.000Z',
      },
      {
        id: 'mysql',
        name: 'MySQL 8.0',
        label: 'MySQL',
        category: 'Relational Database',
        role: 'Composite indexing, EXPLAIN plan tuning, ACID locks',
        description: 'Database design, transactions, indexes, and query optimization.',
        capability: 'ACID Transactions • Index Tuning • EXPLAIN Plans',
        logoKey: 'mysql',
        logoSize: 36,
        x: 61,
        y: 6,
        svgX: 610,
        svgY: 34,
        isRear: true,
        scale: 0.84,
        floatDelay: '0.8s',
        displayOrder: 3,
        status: 'published',
        updatedAt: '2026-04-15T00:00:00.000Z',
      },
      {
        id: 'javascript',
        name: 'JavaScript',
        label: 'JavaScript',
        category: 'Programming Language',
        role: 'ES2024, async/await, event loop, native DOM APIs',
        description: 'Interactive web functionality and application logic.',
        capability: 'ES2024 • Async/Await • Native DOM APIs',
        logoKey: 'javascript',
        logoSize: 34,
        x: 82,
        y: 12,
        svgX: 820,
        svgY: 67,
        isRear: true,
        scale: 0.86,
        floatDelay: '1.2s',
        displayOrder: 4,
        status: 'published',
        updatedAt: '2026-04-15T00:00:00.000Z',
      },
      {
        id: 'react',
        name: 'React 19',
        label: 'React',
        category: 'Frontend Library',
        role: 'Server components, hooks, concurrent rendering, state machines',
        description: 'Modern user interfaces and component architecture.',
        capability: 'React 19 • Server Components • Concurrent Rendering',
        logoKey: 'react',
        logoSize: 36,
        x: 10,
        y: 42,
        svgX: 100,
        svgY: 235,
        isRear: false,
        scale: 0.94,
        floatDelay: '0.2s',
        displayOrder: 5,
        status: 'published',
        updatedAt: '2026-04-15T00:00:00.000Z',
      },
      {
        id: 'nextjs',
        name: 'Next.js 16',
        label: 'Next.js',
        category: 'Full-Stack Framework',
        role: 'App Router, streaming SSR, server actions, route handlers',
        description: 'Full-stack React applications with server-side rendering.',
        capability: 'Next.js 16 • App Router • Streaming SSR',
        logoKey: 'nextjs',
        logoSize: 34,
        x: 90,
        y: 42,
        svgX: 900,
        svgY: 235,
        isRear: false,
        scale: 0.94,
        floatDelay: '1.4s',
        displayOrder: 6,
        status: 'published',
        updatedAt: '2026-04-15T00:00:00.000Z',
      },
      {
        id: 'redis',
        name: 'Redis',
        label: 'Redis',
        category: 'In-Memory Store',
        role: 'Distributed locks, cache tags, Horizon queues, Pub/Sub',
        description: 'Caching, message queues, and real-time state management.',
        capability: 'Distributed Locks • Cache Tags • Pub/Sub',
        logoKey: 'redis',
        logoSize: 34,
        x: 22,
        y: 78,
        svgX: 220,
        svgY: 437,
        isRear: false,
        scale: 1.05,
        floatDelay: '0.6s',
        displayOrder: 7,
        status: 'published',
        updatedAt: '2026-04-15T00:00:00.000Z',
      },
      {
        id: 'docker',
        name: 'Docker',
        label: 'Docker',
        category: 'Containerization',
        role: 'Multi-stage builds, compose networks, volume persistence',
        description: 'Consistent development environments and containerized deployment.',
        capability: 'Multi-Stage Builds • Compose Networks • Volumes',
        logoKey: 'docker',
        logoSize: 36,
        x: 50,
        y: 86,
        svgX: 500,
        svgY: 482,
        isRear: false,
        scale: 1.1,
        floatDelay: '1.0s',
        displayOrder: 8,
        status: 'published',
        updatedAt: '2026-04-15T00:00:00.000Z',
      },
      {
        id: 'linux',
        name: 'Linux / SysAdmin',
        label: 'Linux',
        category: 'Infrastructure',
        role: 'Nginx reverse proxy, systemd daemons, security, shell scripts',
        description: 'Server management, deployment pipelines, and environment configuration.',
        capability: 'Nginx Topologies • systemd Daemons • Shell Pipelines',
        logoKey: 'linux',
        logoSize: 36,
        x: 78,
        y: 78,
        svgX: 780,
        svgY: 437,
        isRear: false,
        scale: 1.05,
        floatDelay: '1.6s',
        displayOrder: 9,
        status: 'published',
        updatedAt: '2026-04-15T00:00:00.000Z',
      },
    ];

    this.expertiseAreas = EXPERTISE_AREAS.map((ea, idx) => ({
      id: ea.id,
      name: ea.name,
      level: ea.level,
      description: ea.description,
      coreConcepts: [...ea.coreConcepts],
      displayOrder: idx + 1,
      status: 'published',
      updatedAt: '2026-04-15T00:00:00.000Z',
    }));

    this.stackDetails = {
      id: 'current_stack',
      primaryBackend: [...STACK_DETAILS.primaryBackend],
      frontend: [...STACK_DETAILS.frontend],
      infrastructure: [...STACK_DETAILS.infrastructure],
      updatedAt: '2026-04-15T00:00:00.000Z',
    };
  }

  async getBrandInfo(): Promise<BrandInfoEntity> {
    return { ...this.brandInfo };
  }

  async updateBrandInfo(data: Partial<BrandInfoEntity>): Promise<BrandInfoEntity> {
    this.brandInfo = {
      ...this.brandInfo,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return { ...this.brandInfo };
  }

  async getHomepageConfig(options?: { preview?: boolean }): Promise<HomepageConfigEntity> {
    if (options?.preview && this.homepageConfigDraft) {
      return JSON.parse(JSON.stringify(this.homepageConfigDraft));
    }
    return JSON.parse(JSON.stringify(this.homepageConfig));
  }

  async getHomepageConfigDraft(): Promise<HomepageConfigEntity | null> {
    if (!this.homepageConfigDraft) return null;
    return JSON.parse(JSON.stringify(this.homepageConfigDraft));
  }

  async saveHomepageConfigDraft(data: Partial<HomepageConfigEntity>): Promise<HomepageConfigEntity> {
    const base = this.homepageConfigDraft || this.homepageConfig;
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
    this.homepageConfigDraft = updatedDraft;
    return JSON.parse(JSON.stringify(updatedDraft));
  }

  async publishHomepageConfig(data?: Partial<HomepageConfigEntity>): Promise<HomepageConfigEntity> {
    const base = this.homepageConfigDraft || this.homepageConfig;
    const now = new Date().toISOString();
    // Backup current published config for rollback
    this.previousHomepageConfig = JSON.parse(JSON.stringify(this.homepageConfig));

    const updated: HomepageConfigEntity = {
      ...base,
      ...(data || {}),
      hero: { ...base.hero, ...(data?.hero || {}) },
      about: { ...base.about, ...(data?.about || {}) },
      contact: { ...base.contact, ...(data?.contact || {}) },
      id: 'homepage_config',
      status: 'published',
      version: (this.homepageConfig.version || 1) + 1,
      updatedAt: now,
      publishedAt: now,
    };

    this.homepageConfig = updated;
    this.homepageConfigDraft = null;
    return JSON.parse(JSON.stringify(updated));
  }

  async rollbackHomepageConfig(): Promise<HomepageConfigEntity> {
    if (!this.previousHomepageConfig) {
      throw new Error('No previous published homepage configuration available to restore.');
    }
    const now = new Date().toISOString();
    const restored: HomepageConfigEntity = {
      ...this.previousHomepageConfig,
      version: (this.homepageConfig.version || 1) + 1,
      updatedAt: now,
      publishedAt: now,
    };
    this.homepageConfig = restored;
    this.homepageConfigDraft = null;
    return JSON.parse(JSON.stringify(restored));
  }

  async updateHomepageConfig(data: Partial<HomepageConfigEntity>): Promise<HomepageConfigEntity> {
    const now = new Date().toISOString();
    this.homepageConfig = {
      ...this.homepageConfig,
      ...data,
      hero: { ...this.homepageConfig.hero, ...(data.hero || {}) },
      about: { ...this.homepageConfig.about, ...(data.about || {}) },
      contact: { ...this.homepageConfig.contact, ...(data.contact || {}) },
      version: (this.homepageConfig.version || 1) + 1,
      updatedAt: now,
    };
    return JSON.parse(JSON.stringify(this.homepageConfig));
  }

  // ==========================================
  // TECHNOLOGIES & INVENTORY MANAGEMENT
  // ==========================================

  async getTechnologies(_options?: { preview?: boolean }): Promise<TechnologyEntity[]> {
    return [...this.technologies]
      .filter((t) => t.status === 'published')
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getAllTechnologies(options?: { includeArchived?: boolean; preview?: boolean }): Promise<TechnologyEntity[]> {
    return [...this.technologies]
      .filter((t) => (options?.includeArchived ? true : t.status !== 'archived'))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getTechnologyById(id: string): Promise<TechnologyEntity | null> {
    const tech = this.technologies.find((t) => t.id === id);
    return tech ? JSON.parse(JSON.stringify(tech)) : null;
  }

  async createTechnology(data: CreateTechnologyInput): Promise<TechnologyEntity> {
    const validation = validateTechnology(data);
    if (!validation.valid) {
      throw new Error(`Validation failed for technology: ${JSON.stringify(validation.errors)}`);
    }

    const id = data.id || data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    if (this.technologies.some((t) => t.id === id)) {
      throw new Error(`Technology with ID "${id}" already exists.`);
    }

    const now = new Date().toISOString();
    const created: TechnologyEntity = {
      ...data,
      id,
      displayOrder: data.displayOrder || this.technologies.length + 1,
      status: data.status || 'published',
      version: 1,
      updatedAt: now,
    };

    this.technologies.push(created);
    return JSON.parse(JSON.stringify(created));
  }

  async updateTechnology(id: string, data: UpdateTechnologyInput): Promise<TechnologyEntity> {
    const index = this.technologies.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Technology with ID "${id}" not found.`);
    }

    const current = this.technologies[index];

    // INVARIANT GUARD: Prevent archiving if currently occupying an active homepage Orbit slot
    if (data.status === 'archived' && this.orbitSlots.includes(id)) {
      throw new Error(
        `Cannot archive technology "${current.name}" while it occupies an active Homepage Orbit slot. Reassign the orbit slot before archiving.`
      );
    }

    // Validate merged payload
    const merged = { ...current, ...data };
    const validation = validateTechnology(merged);
    if (!validation.valid) {
      throw new Error(`Validation failed for technology: ${JSON.stringify(validation.errors)}`);
    }

    const updated: TechnologyEntity = {
      ...current,
      ...data,
      id: current.id, // Immutable ID
      // Preserve system-controlled orbital coordinates
      x: current.x,
      y: current.y,
      svgX: current.svgX,
      svgY: current.svgY,
      isRear: current.isRear,
      scale: current.scale,
      floatDelay: current.floatDelay,
      version: (current.version || 1) + 1,
      updatedAt: new Date().toISOString(),
    };

    this.technologies[index] = updated;
    return JSON.parse(JSON.stringify(updated));
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
    const index = this.technologies.findIndex((t) => t.id === id);
    if (index === -1) {
      return false;
    }

    // INVARIANT GUARD: Cannot delete if occupying an active orbit slot
    if (this.orbitSlots.includes(id)) {
      throw new Error(
        `Cannot delete technology "${this.technologies[index].name}" while it occupies an active Homepage Orbit slot. Reassign the orbit slot first.`
      );
    }

    this.technologies.splice(index, 1);
    return true;
  }

  async reorderTechnologies(orderedIds: string[]): Promise<boolean> {
    const map = new Map(this.technologies.map((t) => [t.id, t]));
    orderedIds.forEach((id, idx) => {
      const tech = map.get(id);
      if (tech) {
        tech.displayOrder = idx + 1;
        tech.updatedAt = new Date().toISOString();
      }
    });
    return true;
  }

  // ==========================================
  // 9-SLOT 3D HOMEPAGE ORBIT MANAGEMENT
  // ==========================================

  async getOrbitSlots(options?: { preview?: boolean }): Promise<OrbitSlotsTuple> {
    if (options?.preview && this.orbitSlotsDraft) {
      return [...this.orbitSlotsDraft];
    }
    return [...this.orbitSlots];
  }

  async getOrbitSlotsDraft(): Promise<OrbitSlotsTuple | null> {
    return this.orbitSlotsDraft ? [...this.orbitSlotsDraft] : null;
  }

  async saveOrbitSlotsDraft(slotTechnologyIds: OrbitSlotsTuple): Promise<OrbitSlotsTuple> {
    const validation = validateOrbitSlots(slotTechnologyIds, this.technologies);
    if (!validation.valid) {
      throw new Error(`Validation failed for Orbit slots: ${JSON.stringify(validation.errors)}`);
    }

    this.orbitSlotsDraft = [...slotTechnologyIds];
    return [...this.orbitSlotsDraft];
  }

  async publishOrbitSlots(slotTechnologyIds?: OrbitSlotsTuple): Promise<OrbitSlotsTuple> {
    const target = slotTechnologyIds || this.orbitSlotsDraft;
    if (!target) {
      throw new Error('NO_DRAFT_TO_PUBLISH: No draft orbit configuration exists to publish.');
    }
    const validation = validateOrbitSlots(target, this.technologies);
    if (!validation.valid) {
      throw new Error(`Validation failed for Orbit slots: ${JSON.stringify(validation.errors)}`);
    }

    // Backup current for rollback
    this.previousOrbitSlots = [...this.orbitSlots];
    this.orbitSlots = [...target];
    this.orbitSlotsDraft = null;

    return [...this.orbitSlots];
  }

  async rollbackOrbitSlots(): Promise<OrbitSlotsTuple> {
    if (!this.previousOrbitSlots) {
      throw new Error('No previous published orbit slot configuration available to restore.');
    }

    this.orbitSlots = [...this.previousOrbitSlots];
    this.orbitSlotsDraft = null;
    return [...this.orbitSlots];
  }

  // ==========================================
  // EXPERTISE AREAS (ENGINEERING DISCIPLINES)
  // ==========================================

  async getExpertiseAreas(_options?: { preview?: boolean }): Promise<ExpertiseAreaEntity[]> {
    return [...this.expertiseAreas]
      .filter((a) => a.status === 'published')
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getAllExpertiseAreas(options?: { includeArchived?: boolean; preview?: boolean }): Promise<ExpertiseAreaEntity[]> {
    return [...this.expertiseAreas]
      .filter((a) => (options?.includeArchived ? true : a.status !== 'archived'))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getExpertiseAreaById(id: string): Promise<ExpertiseAreaEntity | null> {
    const area = this.expertiseAreas.find((a) => a.id === id);
    return area ? JSON.parse(JSON.stringify(area)) : null;
  }

  async createExpertiseArea(data: CreateExpertiseAreaInput): Promise<ExpertiseAreaEntity> {
    const validation = validateExpertiseArea(data);
    if (!validation.valid) {
      throw new Error(`Validation failed for expertise area: ${JSON.stringify(validation.errors)}`);
    }

    const id = data.id || data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    if (this.expertiseAreas.some((a) => a.id === id)) {
      throw new Error(`Expertise area with ID "${id}" already exists.`);
    }

    const created: ExpertiseAreaEntity = {
      ...data,
      id,
      displayOrder: data.displayOrder || this.expertiseAreas.length + 1,
      status: data.status || 'published',
      version: 1,
      updatedAt: new Date().toISOString(),
    };

    this.expertiseAreas.push(created);
    return JSON.parse(JSON.stringify(created));
  }

  async updateExpertiseArea(id: string, data: UpdateExpertiseAreaInput): Promise<ExpertiseAreaEntity> {
    const index = this.expertiseAreas.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error(`Expertise area with ID "${id}" not found.`);
    }

    const current = this.expertiseAreas[index];
    const merged = { ...current, ...data };
    const validation = validateExpertiseArea(merged);
    if (!validation.valid) {
      throw new Error(`Validation failed for expertise area: ${JSON.stringify(validation.errors)}`);
    }

    const updated: ExpertiseAreaEntity = {
      ...current,
      ...data,
      id: current.id,
      version: (current.version || 1) + 1,
      updatedAt: new Date().toISOString(),
    };

    this.expertiseAreas[index] = updated;
    return JSON.parse(JSON.stringify(updated));
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
    const index = this.expertiseAreas.findIndex((a) => a.id === id);
    if (index === -1) {
      return false;
    }
    this.expertiseAreas.splice(index, 1);
    return true;
  }

  async reorderExpertiseAreas(orderedIds: string[]): Promise<boolean> {
    const map = new Map(this.expertiseAreas.map((a) => [a.id, a]));
    orderedIds.forEach((id, idx) => {
      const area = map.get(id);
      if (area) {
        area.displayOrder = idx + 1;
        area.updatedAt = new Date().toISOString();
      }
    });
    return true;
  }

  async getStackDetails(): Promise<StackDetailsEntity> {
    return { ...this.stackDetails };
  }
}
