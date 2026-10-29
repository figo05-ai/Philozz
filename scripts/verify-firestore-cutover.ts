/**
 * PHILOZZ CMS — Phase 16F Firestore Live Cutover Verification Suite
 *
 * Verifies live Firestore CMS data source operations:
 * 1. ISiteContentRepository, IProjectRepository, IArticleRepository, IMediaRepository against live Firestore.
 * 2. 8 Projects, 7 Articles, 7 Categories, 9 Technologies, 6 Expertise Areas, 5 Singletons.
 * 3. 3-Card Featured Project Invariant & 9-Tech Orbit Geometry.
 * 4. Draft isolation in Firestore.
 * 5. Media reference preservation (8 static + 1 ImageKit live asset).
 * 6. Permanent remote deletion disabled in production safety guard.
 */

import './register-server-only.cjs';
import {
  FirestoreProjectRepository,
  FirestoreArticleRepository,
  FirestoreSiteContentRepository,
  FirestoreMediaRepository,
} from '../src/cms/repositories/firestore';
import {
  getPublishedProjects,
  getProjectBySlug,
  getPublishedNotes,
  getNoteBySlug,
  getDynamicSeoConfig,
} from '../src/lib/seoData';
import { executeSafeRemoteDeletion } from '../src/cms/media/mediaDeletionService';

let passed = 0;
let total = 0;

function assert(condition: boolean, name: string, detail?: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`  [PASS] ${name}`);
  } else {
    console.error(`  [FAIL] ${name} ${detail ? `- ${detail}` : ''}`);
    throw new Error(`Assertion failed: ${name}`);
  }
}

async function verifyFirestoreCutover() {
  console.log('================================================================');
  console.log('   PHILOZZ CMS — FIRESTORE LIVE CUTOVER VERIFICATION');
  console.log('================================================================\n');

  // Enforce firestore data source for this suite
  process.env.CMS_DATA_SOURCE = 'firestore';

  const projectRepo = new FirestoreProjectRepository();
  const articleRepo = new FirestoreArticleRepository();
  const siteContentRepo = new FirestoreSiteContentRepository();
  const mediaRepo = new FirestoreMediaRepository();

  // 1. Projects collection
  console.log('--- 1. Live Firestore Projects ---');
  const projects = await projectRepo.getAll();
  assert(projects.length === 8, 'Firestore contains exactly 8 published projects', `Found ${projects.length}`);
  
  const featured = projects.filter((p) => p.featured);
  assert(featured.length === 3, 'Homepage featured invariant holds: exactly 3 featured projects in Firestore');
  const featuredSlugs = featured.map((p) => p.slug);
  assert(
    featuredSlugs.includes('skillup-platform') &&
    featuredSlugs.includes('smartpos-erp') &&
    featuredSlugs.includes('tanqia-skills'),
    'Featured projects match authoritative trio: skillup-platform, smartpos-erp, tanqia-skills'
  );

  // 2. Articles & Categories
  console.log('\n--- 2. Live Firestore Articles & Categories ---');
  const articles = await articleRepo.getAll();
  assert(articles.length === 7, 'Firestore contains exactly 7 published articles', `Found ${articles.length}`);

  const categories = await articleRepo.getCategories();
  assert(categories.length === 7, 'Firestore contains exactly 7 blog categories', `Found ${categories.length}`);

  // 3. Technologies & Orbit Slots
  console.log('\n--- 3. Live Firestore Technologies & Celestial Orbit ---');
  const technologies = await siteContentRepo.getTechnologies();
  assert(technologies.length === 9, 'Firestore contains exactly 9 technologies', `Found ${technologies.length}`);

  const rearTechs = technologies.filter((t) => t.isRear);
  const frontTechs = technologies.filter((t) => !t.isRear);
  assert(rearTechs.length === 4 && frontTechs.length === 5, '3D Skills Galaxy orbit maintains 4 rear and 5 front technologies');

  const orbitSlots = await siteContentRepo.getOrbitSlots();
  assert(orbitSlots.length === 9, 'Orbit slots tuple contains exactly 9 technology references', `Found ${orbitSlots.length}`);

  // 4. Expertise & Singletons
  console.log('\n--- 4. Live Firestore Expertise & Singletons ---');
  const expertise = await siteContentRepo.getExpertiseAreas();
  assert(expertise.length === 6, 'Firestore contains exactly 6 expertise areas', `Found ${expertise.length}`);

  const brand = await siteContentRepo.getBrandInfo();
  assert(brand.name === 'PHILOZZ', 'Brand info singleton verified from Firestore');
  assert(brand.developerName === 'Felopater Nabil', 'Developer name verified from Firestore');

  const homepageConfig = await siteContentRepo.getHomepageConfig();
  assert(homepageConfig.hero.titleLine1 === 'Full-Stack', 'Homepage config singleton verified from Firestore');

  const stackDetails = await siteContentRepo.getStackDetails();
  assert(stackDetails.primaryBackend.length > 0, 'Stack details singleton verified from Firestore');

  const seoConfig = await siteContentRepo.getSeoConfig();
  assert(seoConfig.siteTitle.includes('PHILOZZ'), 'SEO config singleton verified from Firestore');

  // 5. Media registry
  console.log('\n--- 5. Live Firestore Media Registry & Preservation ---');
  const allMedia = await mediaRepo.getAll({ includeDeleted: true });
  assert(allMedia.length === 9, 'Firestore media collection contains 9 total assets (8 local + 1 live ImageKit)', `Found ${allMedia.length}`);

  const imagekitDoc = allMedia.find((m) => m.provider === 'imagekit');
  assert(imagekitDoc !== undefined, 'Live ImageKit asset media_imagekit_6adfc14eead997d09a634a78 is preserved in Firestore');
  assert(imagekitDoc?.id === 'media_imagekit_6adfc14eead997d09a634a78', 'ImageKit asset ID matches exact live record');

  // 6. Public route helpers
  console.log('\n--- 6. Public Route Data Resolution ---');
  const pubProjects = await getPublishedProjects();
  assert(pubProjects.length === 8, 'getPublishedProjects() reads 8 published case studies');

  const pubNotes = await getPublishedNotes();
  assert(pubNotes.length === 7, 'getPublishedNotes() reads 7 published articles');

  const singleProject = await getProjectBySlug('smartpos-erp');
  assert(singleProject !== undefined && singleProject.title.includes('SmartPOS'), 'getProjectBySlug retrieves project by canonical slug');

  const singleNote = await getNoteBySlug('sql-query-optimization');
  assert(singleNote !== undefined && singleNote.title.includes('SQL'), 'getNoteBySlug retrieves article by canonical slug');

  const dynamicSeo = await getDynamicSeoConfig();
  assert(Boolean(dynamicSeo.homepage?.title?.includes('PHILOZZ')), 'Dynamic SEO config homepage title resolved');

  // 7. Draft isolation in Firestore
  console.log('\n--- 7. Draft Isolation in Firestore ---');
  const testDraft = await projectRepo.create({
    title: 'Firestore Test Draft Isolation',
    slug: 'firestore-test-draft-isolation',
    tagline: 'Draft Tagline',
    role: 'Architect',
    period: '2026',
    clientOrContext: 'Audit',
    category: 'Architecture',
    archiveCategory: 'backend',
    categoryLabel: 'Backend Engineering',
    technologies: ['PHP', 'MySQL'],
    primaryTechs: ['PHP'],
    summary: 'Draft summary.',
    shortSummary: 'Draft short.',
    challenge: 'Draft challenge.',
    responsibilities: ['Architecture'],
    architectureSummary: 'Architecture summary.',
    architectureNodes: [{ name: 'Nginx', tech: 'Nginx', description: 'Router' }],
    technicalDecisions: [{ title: 'PostgreSQL', rationale: 'ACID' }],
    demoVisualType: 'task-flow',
    lessonsLearned: ['Partitioning'],
    hasLiveDemo: false,
    status: 'draft',
    featured: false,
    displayOrder: 999,
  });

  const publishedAfterDraft = await getPublishedProjects();
  assert(
    !publishedAfterDraft.some((p) => p.slug === 'firestore-test-draft-isolation'),
    'Draft project in Firestore is strictly invisible to public published queries'
  );

  const draftLookup = await getProjectBySlug('firestore-test-draft-isolation');
  assert(draftLookup === undefined, 'Public getProjectBySlug() returns undefined for draft in Firestore');

  // Clean up test draft
  await projectRepo.delete(testDraft.id);

  // 8. Security Carryover Guard: Permanent Remote Deletion Disabled in Production
  console.log('\n--- 8. Security Carryover Guard (Production Remote Deletion) ---');
  const origNodeEnv = process.env.NODE_ENV;
  const origFlag = process.env.ENABLE_PERMANENT_REMOTE_DELETION;

  try {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    delete process.env.ENABLE_PERMANENT_REMOTE_DELETION;

    const prodResult = await executeSafeRemoteDeletion('any-asset-id', {
      uid: 'admin-owner',
      email: 'owner@philozz.internal',
    });

    assert(
      prodResult.success === false && prodResult.code === 'REMOTE_DELETION_DISABLED',
      'Permanent remote deletion is disabled in production (REMOTE_DELETION_DISABLED)'
    );
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = origNodeEnv;
    process.env.ENABLE_PERMANENT_REMOTE_DELETION = origFlag;
  }

  console.log('\n================================================================');
  console.log(`   PHILOZZ CMS — ALL ${passed}/${total} LIVE FIRESTORE CHECKS PASSED`);
  console.log('================================================================\n');
}

verifyFirestoreCutover().catch((err) => {
  console.error('\n[FATAL] Firestore cutover verification failed:', err);
  process.exit(1);
});
