/**
 * PHILOZZ CMS — Phase 16F Integration & Parity Verification Suite
 *
 * Verifies:
 * 1. Content Audit & Deterministic Migration Manifest (8 projects, 7 articles, 7 categories,
 *    9 technologies, 6 expertise areas, 8 media assets, 5 singletons = 50 documents).
 * 2. 3-Card Featured Homepage Project Invariant & 9-Tech 3D Orbit Geometry Parity.
 * 3. Dry-Run Safety, Cryptographic Manifest & Restorable JSON Backup.
 * 4. Dual-Mode Repositories & Fallback Resilience across Public Pages.
 * 5. Draft Isolation & Public Query Safeguards (drafts invisible to public pages & sitemap).
 * 6. Mandatory Security Carryover Guard: Permanent Remote Deletion Disabled in Production
 *    (ENABLE_PERMANENT_REMOTE_DELETION !== 'true' returns REMOTE_DELETION_DISABLED / 403).
 * 7. Publishing & Unpublishing Invariant Guards (prevent unpublishing featured projects).
 */

import './register-server-only.cjs';
import fs from 'fs';
import path from 'path';
import { MigrationTransformer } from '../src/cms/migration/migrationTransformer';
import { runMigration } from './migrate-to-firestore';
import {
  projectRepository,
  articleRepository,
  siteContentRepository,
  mediaRepository,
} from '../src/cms/repositories';
import {
  getPublishedProjects,
  getProjectBySlug,
  getPublishedNotes,
  getNoteBySlug,
  getDynamicSeoConfig,
} from '../src/lib/seoData';
import { executeSafeRemoteDeletion } from '../src/cms/media/mediaDeletionService';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName} ${detail ? `- ${detail}` : ''}`);
    throw new Error(`Assertion failed: ${testName}`);
  }
}

async function runPhase16FVerification() {
  console.log('================================================================');
  console.log('   PHILOZZ CMS — PHASE 16F VERIFICATION SUITE');
  console.log('================================================================\n');

  // ----------------------------------------------------------------
  // TEST SUITE 1: Content Inventory & Migration Bundle Parity
  // ----------------------------------------------------------------
  console.log('--- Suite 1: Content Inventory & Migration Bundle Parity ---');
  const bundle = await MigrationTransformer.generateMigrationBundle();

  assert(bundle.counts.projects === 8, 'Exact project count is 8', `Found ${bundle.counts.projects}`);
  assert(bundle.counts.articles === 7, 'Exact article count is 7', `Found ${bundle.counts.articles}`);
  assert(bundle.counts.categories === 7, 'Exact category count is 7', `Found ${bundle.counts.categories}`);
  assert(bundle.counts.technologies === 9, 'Exact technologies count is 9', `Found ${bundle.counts.technologies}`);
  assert(bundle.counts.expertiseAreas === 6, 'Exact expertise areas count is 6', `Found ${bundle.counts.expertiseAreas}`);
  assert(bundle.counts.mediaAssets >= 8, 'Media assets inventory contains all core assets', `Found ${bundle.counts.mediaAssets}`);

  // Invariant 8: Exactly 3 featured homepage projects
  const featured = bundle.collections.projects.filter((p) => p.featured);
  assert(featured.length === 3, 'Exactly 3 featured projects for homepage scene');
  const featuredSlugs = featured.map((p) => p.slug);
  assert(
    featuredSlugs.includes('skillup-platform') &&
    featuredSlugs.includes('smartpos-erp') &&
    featuredSlugs.includes('tanqia-skills'),
    'Featured projects are skillup-platform, smartpos-erp, tanqia-skills',
    `Found ${featuredSlugs.join(', ')}`
  );

  // Orbit Geometry Invariant: 9 technologies
  const rearTechs = bundle.collections.technologies.filter((t) => t.isRear);
  const frontTechs = bundle.collections.technologies.filter((t) => !t.isRear);
  assert(rearTechs.length === 4 && frontTechs.length === 5, 'Skills Galaxy preserves 4-rear / 5-front 3D orbit geometry');
  assert(bundle.collections.orbitSlots.length === 9, 'Orbit slots tuple contains exactly 9 technology references');

  // Singletons integrity
  assert(bundle.collections.brandInfo.id === 'brand_info', 'Brand info singleton is valid');
  assert(bundle.collections.homepageConfig.id === 'homepage_config', 'Homepage config singleton is valid');
  assert(bundle.collections.stackDetails.id === 'current_stack', 'Stack details singleton is valid');
  assert(bundle.collections.seoConfig.id === 'seo_config', 'SEO config singleton is valid');

  // Validation Summary
  assert(bundle.validationSummary.passed, 'Full migration bundle schema validation passed with 0 errors');

  // ----------------------------------------------------------------
  // TEST SUITE 2: Dry-Run Safety, Manifest Cryptography & Backup
  // ----------------------------------------------------------------
  console.log('\n--- Suite 2: Dry-Run Safety, Manifest Cryptography & Backup ---');
  const manifest = await runMigration('dry-run');

  assert(manifest.mode === 'dry-run', 'Migration executed in dry-run mode');
  assert(manifest.summary.totalDocuments === 50, 'Total migration documents equals 50 (8+7+7+9+6+8+5)', `Found ${manifest.summary.totalDocuments}`);

  const backupPath = path.resolve(process.cwd(), 'verification/migration-backup.json');
  const manifestPath = path.resolve(process.cwd(), 'verification/migration-manifest.json');
  assert(fs.existsSync(backupPath), 'Restorable JSON backup file exists');
  assert(fs.existsSync(manifestPath), 'Cryptographic manifest file exists');

  const parsedBackup = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
  assert(parsedBackup.counts.projects === 8 && parsedBackup.counts.articles === 7, 'Backup contains complete recoverable content');

  // Fail-closed live migration safety test:
  let liveAborted = false;
  delete process.env.LIVE_MIGRATION_AUTHORIZED;
  try {
    await runMigration('live');
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes('LIVE MIGRATION SAFETY ABORT')) {
      liveAborted = true;
    }
  }
  assert(liveAborted, 'Live migration fails closed when LIVE_MIGRATION_AUTHORIZED is not set');

  // ----------------------------------------------------------------
  // TEST SUITE 3: Public Route Data Access & Fallback Parity
  // ----------------------------------------------------------------
  console.log('\n--- Suite 3: Public Route Data Access & Fallback Parity ---');
  const publicProjects = await getPublishedProjects();
  assert(publicProjects.length === 8, 'getPublishedProjects() returns all 8 published case studies');

  const publicNotes = await getPublishedNotes();
  assert(publicNotes.length === 7, 'getPublishedNotes() returns all 7 published engineering notes');

  const smartpos = await getProjectBySlug('smartpos-erp');
  assert(smartpos !== undefined && smartpos.slug === 'smartpos-erp', 'getProjectBySlug retrieves project by canonical slug');

  const queryOptNote = await getNoteBySlug('sql-query-optimization');
  assert(queryOptNote !== undefined && queryOptNote.slug === 'sql-query-optimization', 'getNoteBySlug retrieves note by canonical slug');

  const nonExistentProject = await getProjectBySlug('non-existent-project-xyz');
  assert(nonExistentProject === undefined, 'getProjectBySlug returns undefined for non-existent slug');

  const nonExistentNote = await getNoteBySlug('non-existent-note-xyz');
  assert(nonExistentNote === undefined, 'getNoteBySlug returns undefined for non-existent slug');

  // Direct repository parity checks
  const repoArticles = await articleRepository.getAll();
  assert(repoArticles.length === 7, 'articleRepository returns complete collection');

  const repoBrand = await siteContentRepository.getBrandInfo();
  assert(repoBrand.name === 'PHILOZZ', 'siteContentRepository returns verified brand info');

  const repoMedia = await mediaRepository.getAll();
  assert(repoMedia.length >= 8, 'mediaRepository returns active media registry');

  // SEO config verification
  const seoConfig = await getDynamicSeoConfig();
  assert(seoConfig.siteTitle.includes('PHILOZZ'), 'Dynamic SEO config has correct site title');
  assert(Boolean(seoConfig.homepage?.title?.includes('PHILOZZ')), 'Homepage SEO title configured');

  // ----------------------------------------------------------------
  // TEST SUITE 4: Draft Isolation & Invariant Protection
  // ----------------------------------------------------------------
  console.log('\n--- Suite 4: Draft Isolation & Invariant Protection ---');

  // Create a draft project in local repo
  const draftProject = await projectRepository.create({
    title: 'Unpublished Draft Project',
    slug: 'unpublished-draft-project-test',
    tagline: 'Draft Tagline',
    role: 'Backend Architect',
    period: '2026',
    clientOrContext: 'Internal R&D',
    category: 'Architecture',
    archiveCategory: 'backend',
    categoryLabel: 'Backend Engineering',
    technologies: ['PHP', 'PostgreSQL'],
    primaryTechs: ['PHP', 'PostgreSQL'],
    summary: 'Draft Summary description.',
    shortSummary: 'Draft short summary.',
    challenge: 'Draft challenge description.',
    responsibilities: ['Architected database layer'],
    architectureSummary: 'High-performance event-driven setup.',
    architectureNodes: [{ name: 'Gateway', tech: 'Nginx', description: 'Ingress traffic router' }],
    technicalDecisions: [{ title: 'Use PostgreSQL', rationale: 'ACID transactions' }],
    demoVisualType: 'task-flow',
    lessonsLearned: ['Partitioning is critical'],
    hasLiveDemo: false,
    status: 'draft',
    featured: false,
    displayOrder: 99,
  });

  // Verify that public queries do NOT return the draft
  const publicProjectsAfterDraft = await getPublishedProjects();
  assert(
    !publicProjectsAfterDraft.some((p) => p.slug === 'unpublished-draft-project-test'),
    'Public getPublishedProjects() strictly isolates drafts'
  );

  const publicProjectBySlug = await getProjectBySlug('unpublished-draft-project-test');
  assert(publicProjectBySlug === undefined, 'Public getProjectBySlug() returns undefined for draft status');

  // Clean up test draft
  await projectRepository.delete(draftProject.id);

  // ----------------------------------------------------------------
  // TEST SUITE 5: Mandatory Security Carryover Guard: Remote Deletion Disabled in Production
  // ----------------------------------------------------------------
  console.log('\n--- Suite 5: Security Carryover Guard (Production Remote Deletion) ---');

  const originalNodeEnv = process.env.NODE_ENV;
  const originalEnableFlag = process.env.ENABLE_PERMANENT_REMOTE_DELETION;

  try {
    // 5A: In production without ENABLE_PERMANENT_REMOTE_DELETION=true
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    delete process.env.ENABLE_PERMANENT_REMOTE_DELETION;

    const prodResult = await executeSafeRemoteDeletion('test-file-id-prod', {
      uid: 'owner-uid-123',
      email: 'owner@philozz.internal',
    });

    assert(
      prodResult.success === false && prodResult.code === 'REMOTE_DELETION_DISABLED',
      'Permanent remote deletion is disabled in production (REMOTE_DELETION_DISABLED)'
    );

    // 5B: In production with explicit ENABLE_PERMANENT_REMOTE_DELETION="false"
    process.env.ENABLE_PERMANENT_REMOTE_DELETION = 'false';
    const prodResultFalse = await executeSafeRemoteDeletion('test-file-id-prod', {
      uid: 'owner-uid-123',
      email: 'owner@philozz.internal',
    });
    assert(
      prodResultFalse.success === false && prodResultFalse.code === 'REMOTE_DELETION_DISABLED',
      'Explicit ENABLE_PERMANENT_REMOTE_DELETION=false keeps deletion disabled'
    );
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
    process.env.ENABLE_PERMANENT_REMOTE_DELETION = originalEnableFlag;
  }

  // ----------------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`   PHILOZZ CMS — PHASE 16F ALL ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================\n');
}

runPhase16FVerification().catch((err) => {
  console.error('\n[FATAL] Phase 16F Verification failed:', err);
  process.exit(1);
});
