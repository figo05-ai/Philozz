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
  ExpertiseAreaEntity,
  StackDetailsEntity,
} from '../../models/technology';
import { ISiteContentRepository } from '../types';

export class LocalSiteContentRepository implements ISiteContentRepository {
  private brandInfo: BrandInfoEntity;
  private homepageConfig: HomepageConfigEntity;
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

  async getHomepageConfig(): Promise<HomepageConfigEntity> {
    return { ...this.homepageConfig };
  }

  async updateHomepageConfig(data: Partial<HomepageConfigEntity>): Promise<HomepageConfigEntity> {
    this.homepageConfig = {
      ...this.homepageConfig,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return { ...this.homepageConfig };
  }

  async getTechnologies(): Promise<TechnologyEntity[]> {
    return [...this.technologies].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getExpertiseAreas(): Promise<ExpertiseAreaEntity[]> {
    return [...this.expertiseAreas].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getStackDetails(): Promise<StackDetailsEntity> {
    return { ...this.stackDetails };
  }
}
