/**
 * PHILOZZ CMS — Deterministic Migration Transformer & Data Seeder
 * Phase 16A: Dynamic CMS Architecture & Data Foundation
 *
 * Converts existing static portfolio data into normalized, validated CMS entities
 * ready for one-click deterministic seeding into Cloud Firestore with 0 data loss.
 */

import {
  projectRepository,
  articleRepository,
  siteContentRepository,
  mediaRepository,
} from '../repositories';
import { ProjectEntity } from '../models/project';
import { ArticleEntity, BlogCategoryEntity } from '../models/article';
import { BrandInfoEntity, HomepageConfigEntity } from '../models/site';
import { TechnologyEntity, ExpertiseAreaEntity, StackDetailsEntity } from '../models/technology';
import { MediaAssetEntity } from '../models/media';
import { validateProject, validateArticle } from '../validation/validators';

export interface MigrationSeedBundle {
  version: '1.0.0';
  exportedAt: string;
  counts: {
    projects: number;
    articles: number;
    categories: number;
    technologies: number;
    expertiseAreas: number;
    mediaAssets: number;
  };
  collections: {
    projects: ProjectEntity[];
    articles: ArticleEntity[];
    categories: BlogCategoryEntity[];
    technologies: TechnologyEntity[];
    expertiseAreas: ExpertiseAreaEntity[];
    mediaAssets: MediaAssetEntity[];
    brandInfo: BrandInfoEntity;
    homepageConfig: HomepageConfigEntity;
    stackDetails: StackDetailsEntity;
  };
  validationSummary: {
    passed: boolean;
    errors: Array<{ entity: string; id: string; error: string }>;
  };
}

export class MigrationTransformer {
  /**
   * Generates a complete, validated migration bundle from current repositories.
   */
  static async generateMigrationBundle(): Promise<MigrationSeedBundle> {
    const rawProjects = await projectRepository.getAll();
    // Enforce Phase 16D.0 Requirement 8: Critical featured content invariant
    // Only the top 3 projects are featured for the cinematic homepage gallery,
    // while all 8 remain published and fully visible in the projects archive.
    const projects: ProjectEntity[] = rawProjects.map((p, idx) => ({
      ...p,
      featured: idx < 3,
      featuredOrder: idx < 3 ? idx + 1 : undefined,
    }));
    const articles = await articleRepository.getAll();
    const categories = await articleRepository.getCategories();
    const brandInfo = await siteContentRepository.getBrandInfo();
    const homepageConfig = await siteContentRepository.getHomepageConfig();
    const technologies = await siteContentRepository.getTechnologies();
    const expertiseAreas = await siteContentRepository.getExpertiseAreas();
    const stackDetails = await siteContentRepository.getStackDetails();
    const mediaAssets = await mediaRepository.getAll();

    const validationErrors: Array<{ entity: string; id: string; error: string }> = [];

    // 1. Validate all projects
    for (const project of projects) {
      const result = validateProject(project);
      if (!result.valid) {
        Object.entries(result.errors).forEach(([field, msg]) => {
          validationErrors.push({
            entity: 'project',
            id: project.slug,
            error: `${field}: ${msg}`,
          });
        });
      }
    }

    // 2. Validate all articles
    for (const article of articles) {
      const result = validateArticle(article);
      if (!result.valid) {
        Object.entries(result.errors).forEach(([field, msg]) => {
          validationErrors.push({
            entity: 'article',
            id: article.slug,
            error: `${field}: ${msg}`,
          });
        });
      }
    }

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      counts: {
        projects: projects.length,
        articles: articles.length,
        categories: categories.length,
        technologies: technologies.length,
        expertiseAreas: expertiseAreas.length,
        mediaAssets: mediaAssets.length,
      },
      collections: {
        projects,
        articles,
        categories,
        technologies,
        expertiseAreas,
        mediaAssets,
        brandInfo,
        homepageConfig,
        stackDetails,
      },
      validationSummary: {
        passed: validationErrors.length === 0,
        errors: validationErrors,
      },
    };
  }
}
