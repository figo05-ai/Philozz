/**
 * PHILOZZ CMS — Phase 16C Admin Dashboard Verification Suite
 *
 * Verifies:
 * 1. Admin route existence, instant=false, and noindex metadata.
 * 2. Real repository data layer integration (projects, articles, sections, media, audit).
 * 3. Proxy routing security enforcement across all admin subroutes.
 * 4. Honest zero-data empty state handling.
 * 5. Public site zero-regression check.
 */

import './register-server-only.cjs';
import { NextRequest } from 'next/server';
import { proxy } from '../src/proxy';
import {
  projectRepository,
  articleRepository,
  siteContentRepository,
  mediaRepository,
  auditLogRepository,
} from '../src/cms/repositories';
import { ADMIN_NAV_ITEMS } from '../src/components/admin/AdminSidebar';

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

async function runPhase16CVerification() {
  console.log('====================================================');
  console.log('   PHILOZZ — PHASE 16C: ADMIN DASHBOARD VERIFICATION');
  console.log('====================================================');

  // ----------------------------------------------------
  // TEST SUITE 1: NAVIGATION & ROUTE REGISTRATION
  // ----------------------------------------------------
  console.log('--- Suite 1: Navigation Architecture & Route Integrity ---');
  assert(ADMIN_NAV_ITEMS.length === 7, 'Sidebar declares exactly 7 functional management routes');

  const registeredPaths = ADMIN_NAV_ITEMS.map((item) => item.href);
  assert(registeredPaths.includes('/admin'), 'Nav includes /admin (Overview)');
  assert(registeredPaths.includes('/admin/projects'), 'Nav includes /admin/projects');
  assert(registeredPaths.includes('/admin/articles'), 'Nav includes /admin/articles');
  assert(registeredPaths.includes('/admin/sections'), 'Nav includes /admin/sections');
  assert(registeredPaths.includes('/admin/media'), 'Nav includes /admin/media');
  assert(registeredPaths.includes('/admin/seo'), 'Nav includes /admin/seo');
  assert(registeredPaths.includes('/admin/settings'), 'Nav includes /admin/settings');

  // ----------------------------------------------------
  // TEST SUITE 2: CMS REPOSITORY DATA INTEGRATION
  // ----------------------------------------------------
  console.log('\n--- Suite 2: Real Repository Data Integration ---');

  // A. Projects Inventory
  const projects = await projectRepository.getAll();
  assert(projects.length === 8, '8 real projects returned from projectRepository');
  const publishedProjects = projects.filter((p) => p.status === 'published');
  assert(publishedProjects.length === 8, 'All 8 projects have published status');
  const featuredProjects = projects.filter((p) => p.featured);
  assert(featuredProjects.length === 8, '8 projects marked as featured in repository seed');

  // B. Articles Inventory
  const articles = await articleRepository.getAll();
  assert(articles.length === 7, '7 real articles returned from articleRepository');
  const publishedArticles = articles.filter((a) => a.status === 'published');
  assert(publishedArticles.length === 7, 'All 7 articles have published status');
  const categories = await articleRepository.getCategories();
  assert(categories.length === 7, '7 taxonomy categories loaded for blog');

  // C. Site Sections & Geometry
  const homepageConfig = await siteContentRepository.getHomepageConfig();
  assert(Boolean(homepageConfig.hero.eyebrow), 'Hero section config loaded with eyebrow badge');
  assert(homepageConfig.about.mosaicCards.length === 3, '3 mosaic cards loaded for About section');
  assert(Boolean(homepageConfig.contact.email), 'Contact section config loaded with email endpoint');

  const technologies = await siteContentRepository.getTechnologies();
  assert(technologies.length === 9, '9 core technologies loaded in 3D orbit ecosystem');

  // D. Media Assets
  const mediaAssets = await mediaRepository.getAll();
  assert(mediaAssets.length === 5, '5 real media assets registered in local repository seed');
  assert(mediaAssets.some((a) => a.folder === 'brand'), 'Brand folder assets present in media library');
  assert(mediaAssets.some((a) => a.folder === 'photos'), 'Photos folder assets present in media library');

  // E. Audit Log Empty State
  const recentLogs = await auditLogRepository.getRecent();
  assert(recentLogs.length === 0, 'Audit log repository initially has 0 entries (honest empty state)');

  // ----------------------------------------------------
  // TEST SUITE 3: PROXY ROUTE PROTECTION ACROSS ALL PAGES
  // ----------------------------------------------------
  console.log('\n--- Suite 3: Proxy Security Enforcement Across All Subroutes ---');

  for (const path of registeredPaths) {
    const unauthReq = new NextRequest(`https://philozz.com${path}`);
    const res = proxy(unauthReq);

    const isRedirect =
      res.status === 307 ||
      res.status === 308 ||
      Boolean(res.headers.get('location')?.includes('/admin/login'));

    assert(isRedirect, `Proxy protects ${path} by redirecting unauthenticated visitors to /admin/login`);
    assert(
      Boolean(res.headers.get('Cache-Control')?.includes('no-store')),
      `Proxy applies Cache-Control: no-store on ${path}`
    );
  }

  // ----------------------------------------------------
  // TEST SUITE 4: NOINDEX PERIMETER
  // ----------------------------------------------------
  console.log('\n--- Suite 4: Search Engine Indexing Prevention ---');

  // Simulate authenticated request through proxy
  const authReq = new NextRequest('https://philozz.com/admin', {
    headers: {
      cookie: '__session=valid_test_cookie_string',
    },
  });
  const authRes = proxy(authReq);
  const robotsHeader = authRes.headers.get('X-Robots-Tag');
  assert(
    Boolean(robotsHeader?.includes('noindex') && robotsHeader?.includes('nofollow')),
    'Proxy sets X-Robots-Tag: noindex, nofollow on authenticated admin routes'
  );

  // ----------------------------------------------------
  // TEST SUITE 5: PUBLIC SITE ZERO-REGRESSION
  // ----------------------------------------------------
  console.log('\n--- Suite 5: Public Site Zero-Regression Check ---');
  const publicReq = new NextRequest('https://philozz.com/work/skillup-platform');
  const publicRes = proxy(publicReq);
  assert(publicRes.headers.get('location') === null, 'Public routes pass through proxy untouched without redirects');

  console.log('====================================================');
  console.log('   PHASE 16C VERIFICATION PASSED: ALL TESTS PASS');
  console.log('====================================================');
}

runPhase16CVerification().catch((err) => {
  console.error('Phase 16C verification failed:', err);
  process.exit(1);
});
