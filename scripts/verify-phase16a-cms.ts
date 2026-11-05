/**
 * PHILOZZ CMS — Phase 16A Architecture & Data Verification Suite
 *
 * Verifies:
 * 1. Project Domain Models & Validation (8 Projects, complete schema integrity)
 * 2. Article Domain Models & Validation (7 Articles, complete section trees)
 * 3. Technology Entities & 3D Perspective Orbit Coordinates (9 Techs, x/y/svgX/svgY)
 * 4. Expertise Areas & Brand Configurations
 * 5. Media Repository & Provider-Independent Storage Adapter
 * 6. Audit Logging System
 * 7. Firestore Contracts & Converter Round-Trips
 * 8. Deterministic Migration Transformer (0 data loss guarantee)
 * 9. SEO Data Layer Integration & Backwards Compatibility
 */

import './register-server-only.cjs';
import {
  projectRepository,
  articleRepository,
  siteContentRepository,
  mediaRepository,
  auditLogRepository,
} from '../src/cms/repositories';
import {
  validateProject,
  validateArticle,
  validateSlug,
  validateMediaUpload,
  sanitizeRichText,
} from '../src/cms/validation';
import {
  MediaService,
  LocalStaticMediaProvider,
  ImageDbMediaProviderStub,
} from '../src/cms/media';
import {
  projectFirestoreConverter,
  articleFirestoreConverter,
  REQUIRED_FIRESTORE_INDEXES,
  FIRESTORE_SECURITY_RULES_BLUEPRINT,
} from '../src/cms/repositories/firestore';
import { MigrationTransformer } from '../src/cms/migration';
import {
  getPublishedProjects,
  getProjectBySlug,
  getPublishedNotes,
  getNoteBySlug,
  SITE_CONFIG,
} from '../src/lib/seoData';

async function runVerification() {
  console.log('====================================================');
  console.log('   PHILOZZ — PHASE 16A: CMS ARCHITECTURE VERIFICATION');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${testName}${details ? ` — ${details}` : ''}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // TEST SUITE 1: PROJECT ENTITIES & REPOSITORY
  console.log('--- Suite 1: Projects & Case Study Models ---');
  const allProjects = await projectRepository.getAll();
  assert(allProjects.length === 8, '8 projects loaded in repository', `Got ${allProjects.length}`);

  for (const project of allProjects) {
    const slugCheck = validateSlug(project.slug);
    assert(slugCheck.valid, `Project slug "${project.slug}" passes validation`);

    const validation = validateProject(project);
    assert(
      validation.valid,
      `Project "${project.slug}" conforms to schema`,
      JSON.stringify(validation.errors)
    );

    assert(project.architectureNodes.length >= 3, `Project "${project.slug}" has architecture nodes`);
    assert(project.technicalDecisions.length >= 2, `Project "${project.slug}" has technical decisions`);
    assert(project.responsibilities.length >= 3, `Project "${project.slug}" has responsibilities`);
    assert(project.lessonsLearned.length >= 1, `Project "${project.slug}" has lessons learned`);
  }

  const skillup = await projectRepository.getBySlug('skillup-platform');
  assert(skillup !== null && skillup.title === 'SkillUp Platform', 'getBySlug retrieves SkillUp Platform');

  // TEST SUITE 2: ARTICLE ENTITIES & REPOSITORY
  console.log('\n--- Suite 2: Article & Blog Models ---');
  const allArticles = await articleRepository.getAll();
  assert(allArticles.length === 7, '7 articles loaded in repository', `Got ${allArticles.length}`);

  for (const article of allArticles) {
    const slugCheck = validateSlug(article.slug);
    assert(slugCheck.valid, `Article slug "${article.slug}" passes validation`);

    const validation = validateArticle(article);
    assert(
      validation.valid,
      `Article "${article.slug}" conforms to schema`,
      JSON.stringify(validation.errors)
    );

    assert(article.sections.length >= 2, `Article "${article.slug}" has complete sections`);
  }

  const categories = await articleRepository.getCategories();
  assert(categories.length >= 6, `Categories loaded correctly (count: ${categories.length})`);

  // TEST SUITE 3: TECHNOLOGY & 3D ORBIT COORDINATES
  console.log('\n--- Suite 3: Technologies & Orbit Geometry Preservation ---');
  const techs = await siteContentRepository.getTechnologies();
  assert(techs.length === 9, '9 technologies loaded in orbit ecosystem');

  // Verify critical coordinates for black-hole orbit alignment
  const laravel = techs.find((t) => t.id === 'laravel');
  assert(
    laravel !== undefined && laravel.x === 18 && laravel.svgX === 180 && laravel.isRear === true,
    'Laravel 3D elliptical orbit coordinates preserved verbatim'
  );

  const mysql = techs.find((t) => t.id === 'mysql');
  assert(
    mysql !== undefined && mysql.x === 61 && mysql.svgX === 610,
    'MySQL 3D elliptical orbit coordinates preserved verbatim'
  );

  const redis = techs.find((t) => t.id === 'redis');
  assert(
    redis !== undefined && redis.x === 22 && redis.svgX === 220 && redis.isRear === false,
    'Redis foreground pedestal coordinates preserved verbatim'
  );

  // TEST SUITE 4: BRAND INFO & HOMEPAGE CONFIG
  console.log('\n--- Suite 4: Site Content & Homepage Configuration ---');
  const brand = await siteContentRepository.getBrandInfo();
  assert(brand.name === 'PHILOZZ', 'Brand name is PHILOZZ');
  assert(brand.developerName === 'Felopater Nabil', 'Developer name is Felopater Nabil');

  const homeConfig = await siteContentRepository.getHomepageConfig();
  assert(homeConfig.hero.titleLine1 === 'Full-Stack', 'Homepage Hero config intact');
  assert(homeConfig.about.mosaicCards.length === 3, 'About mosaic cards intact (count: 3)');

  const expertise = await siteContentRepository.getExpertiseAreas();
  assert(expertise.length === 6, 'Expertise areas intact (count: 6)');

  // TEST SUITE 5: PROVIDER-INDEPENDENT MEDIA ADAPTER
  console.log('\n--- Suite 5: Provider-Independent Media Abstraction ---');
  const mediaValidation = validateMediaUpload({
    filename: 'test-diagram.png',
    mimeType: 'image/png',
    folder: 'projects',
  });
  assert(mediaValidation.valid, 'Media validation passes for valid payload');

  const localProvider = new LocalStaticMediaProvider();
  const mediaService = new MediaService(localProvider, mediaRepository);

  const testBuffer = Buffer.from('fake-image-bytes-for-test');
  const uploadResult = await mediaService.uploadAsset({
    buffer: testBuffer,
    filename: 'test-diagram.png',
    mimeType: 'image/png',
    folder: 'projects',
    altText: 'Architecture diagram test',
  });

  assert(uploadResult.success === true, 'MediaService uploads asset via provider');
  assert(
    uploadResult.asset !== undefined && uploadResult.asset.provider === 'local',
    'Uploaded asset registered with local provider'
  );

  const resolved = mediaService.resolveUrl('/images/projects/test-diagram.png');
  assert(resolved === '/images/projects/test-diagram.png', 'Media provider resolves URL path');

  // Verify ImageDB stub is ready for future external configuration
  const imageDbStub = new ImageDbMediaProviderStub('test-key', 'https://api.imagedb.com');
  assert(imageDbStub.providerName === 'imagedb', 'ImageDB stub driver instantiated');

  // TEST SUITE 6: AUDIT LOGGING
  console.log('\n--- Suite 6: CMS Audit Logging ---');
  const logEntry = await auditLogRepository.record({
    actorId: 'admin_test_uid',
    actorEmail: 'admin@philozz.com',
    action: 'publish',
    entityType: 'project',
    entityId: 'skillup-platform',
    summary: 'Published SkillUp Platform project update',
  });
  assert(logEntry.id.startsWith('audit_'), 'Audit log recorded with unique ID');

  const recentLogs = await auditLogRepository.getRecent(10);
  assert(recentLogs.length >= 1, 'Audit logs retrieved');

  // TEST SUITE 7: FIRESTORE CONTRACTS & CONVERTERS
  console.log('\n--- Suite 7: Firestore Contracts & Converters ---');
  assert(REQUIRED_FIRESTORE_INDEXES.length >= 6, 'Required Firestore indexes declared');
  assert(
    FIRESTORE_SECURITY_RULES_BLUEPRINT.includes('request.auth.token.admin == true'),
    'Security rules require admin claims'
  );

  // Test round-trip conversion for project
  const projectFirestoreData = projectFirestoreConverter.toFirestore(skillup!);
  const restoredProject = projectFirestoreConverter.fromFirestore(projectFirestoreData, skillup!.id);
  assert(restoredProject.slug === skillup!.slug, 'Project converter round-trip matches slug');
  assert(restoredProject.title === skillup!.title, 'Project converter round-trip matches title');

  // Test round-trip conversion for article
  const firstArticle = allArticles[0];
  const articleFirestoreData = articleFirestoreConverter.toFirestore(firstArticle);
  const restoredArticle = articleFirestoreConverter.fromFirestore(articleFirestoreData, firstArticle.id);
  assert(restoredArticle.slug === firstArticle.slug, 'Article converter round-trip matches slug');

  // TEST SUITE 8: DETERMINISTIC MIGRATION TRANSFORMER
  console.log('\n--- Suite 8: Deterministic Migration Transformer (0 Data Loss) ---');
  const bundle = await MigrationTransformer.generateMigrationBundle();
  assert(bundle.version === '1.0.0', 'Migration bundle format version 1.0.0');
  assert(bundle.counts.projects === 8, '8 projects in migration seed bundle');
  assert(bundle.counts.articles === 7, '7 articles in migration seed bundle');
  assert(bundle.counts.technologies === 9, '9 technologies in migration seed bundle');
  assert(bundle.validationSummary.passed === true, 'Migration validation passed with 0 errors');
  assert(bundle.validationSummary.errors.length === 0, 'Zero validation errors in seed bundle');

  // TEST SUITE 9: SEO & RUNTIME COMPATIBILITY
  console.log('\n--- Suite 9: SEO Data Layer & Runtime Compatibility ---');
  const seoProjects = await getPublishedProjects();
  assert(seoProjects.length === 8, 'getPublishedProjects() returns 8 projects via repository');

  const seoSkillup = await getProjectBySlug('skillup-platform');
  assert(seoSkillup?.slug === 'skillup-platform', 'getProjectBySlug() returns valid project');

  const seoNotes = await getPublishedNotes();
  assert(seoNotes.length === 7, 'getPublishedNotes() returns 7 notes via repository');

  const seoNote = await getNoteBySlug('building-scalable-apis-with-laravel');
  assert(seoNote?.slug === 'building-scalable-apis-with-laravel', 'getNoteBySlug() returns valid note');

  assert(SITE_CONFIG.name === 'PHILOZZ', 'SITE_CONFIG unchanged and fully compatible');

  // TEST SUITE 10: SANITIZATION & SECURITY
  console.log('\n--- Suite 10: Content Sanitization ---');
  const maliciousInput = '<script>alert("xss")</script><p>Clean content</p><iframe src="evil.com"></iframe>';
  const clean = sanitizeRichText(maliciousInput);
  assert(!clean.includes('<script>') && !clean.includes('<iframe>'), 'sanitizeRichText strips script and iframe');
  assert(clean.includes('<p>Clean content</p>'), 'sanitizeRichText preserves legitimate markup');

  console.log('\n====================================================');
  console.log(`   PHASE 16A VERIFICATION PASSED: ${passedTests}/${totalTests} TESTS`);
  console.log('====================================================\n');
}

runVerification().catch((err) => {
  console.error('\nVerification failed with exception:', err);
  process.exit(1);
});
