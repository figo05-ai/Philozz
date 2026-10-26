import { spawn } from 'node:child_process';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runE2ECheck() {
  const PORT = 3008;
  console.log(`Starting Next.js production server on port ${PORT}...`);
  const server = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    cwd: '/home/figo/Desktop/Philo/portfolio',
    stdio: 'inherit',
  });

  // Wait for server to be responsive
  let ready = false;
  for (let i = 0; i < 30; i++) {
    await wait(300);
    try {
      const res = await fetch(`http://localhost:${PORT}/robots.txt`);
      if (res.status === 200) {
        ready = true;
        break;
      }
    } catch {}
  }

  if (!ready) {
    server.kill('SIGTERM');
    throw new Error('Production server failed to respond on port ' + PORT);
  }

  console.log('✓ Server is ready! Running end-to-end route tests...');

  // 1. Test unauthenticated /admin redirect to /admin/login
  const unauthRes = await fetch(`http://localhost:${PORT}/admin`, { redirect: 'manual' });
  const isRedirect = unauthRes.status === 307 || unauthRes.status === 308;
  const location = unauthRes.headers.get('location');
  console.log(`  [Test 1] GET /admin status: ${unauthRes.status}, location: ${location}`);
  if (!isRedirect || !location?.includes('/admin/login')) {
    server.kill('SIGTERM');
    throw new Error('Expected redirect to /admin/login, got: ' + location);
  }
  console.log('  [PASS] Unauthenticated /admin correctly redirects to /admin/login with status 307');

  // 2. Test /admin/login serves 200 with noindex headers
  const loginRes = await fetch(`http://localhost:${PORT}/admin/login`);
  const loginHtml = await loginRes.text();
  console.log(`  [Test 2] GET /admin/login status: ${loginRes.status}, length: ${loginHtml.length}`);
  const loginRobots = loginRes.headers.get('x-robots-tag');
  console.log(`  [Test 2] X-Robots-Tag: ${loginRobots}`);
  if (loginRes.status !== 200 || !loginRobots?.includes('noindex')) {
    server.kill('SIGTERM');
    throw new Error('Expected 200 and noindex on /admin/login');
  }
  console.log('  [PASS] /admin/login renders successfully with X-Robots-Tag: noindex');

  // 3. Test public homepage is 200 and unchanged
  const homeRes = await fetch(`http://localhost:${PORT}/`);
  const homeHtml = await homeRes.text();
  if (homeRes.status !== 200 || !homeHtml.includes('PHILOZZ')) {
    server.kill('SIGTERM');
    throw new Error('Homepage regression detected');
  }
  console.log('  [PASS] Public homepage is 200 OK and brand identity intact');

  // 4. Test robots.txt crawlability
  const robotsRes = await fetch(`http://localhost:${PORT}/robots.txt`);
  const robotsTxt = await robotsRes.text();
  if (robotsTxt.includes('Disallow: /_next/')) {
    server.kill('SIGTERM');
    throw new Error('Phase 15A.1 regression: Disallow: /_next/ found in robots.txt');
  }
  console.log('  [PASS] robots.txt crawlability preserved (no /_next/ blanket blocking)');

  // 5. Test sitemap.xml
  const sitemapRes = await fetch(`http://localhost:${PORT}/sitemap.xml`);
  const sitemapXml = await sitemapRes.text();
  if (!sitemapXml.includes('https://philozz.com') || !sitemapXml.includes('/work/skillup-platform')) {
    server.kill('SIGTERM');
    throw new Error('Sitemap verification failed');
  }
  console.log('  [PASS] Dynamic sitemap.xml generated with canonical case study URLs');

  server.kill('SIGTERM');
  console.log('✓ All end-to-end production server checks passed!');
}

runE2ECheck().catch((err) => {
  console.error('E2E Check Failed:', err);
  process.exit(1);
});
