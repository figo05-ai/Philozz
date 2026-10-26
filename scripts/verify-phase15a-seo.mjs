const PORT = 3005;
const BASE_URL = `http://localhost:${PORT}`;

async function testSeo() {
  console.log(`\n======================================================`);
  console.log(`PHILOZZ — Phase 15A Technical SEO Verification Suite`);
  console.log(`Targeting Production Server: ${BASE_URL}`);
  console.log(`======================================================\n`);

  let failures = 0;
  function assert(condition, message) {
    if (!condition) {
      console.error(`  ❌ FAIL: ${message}`);
      failures++;
    } else {
      console.log(`  ✓ PASS: ${message}`);
    }
  }

  // 1. Robots.txt Test
  console.log(`[Test 1] Inspecting /robots.txt`);
  const robotsRes = await fetch(`${BASE_URL}/robots.txt`);
  assert(robotsRes.status === 200, `/robots.txt responded with 200`);
  const robotsTxt = await robotsRes.text();
  assert(robotsTxt.includes('User-Agent: *') || robotsTxt.includes('user-agent: *') || robotsTxt.includes('User-agent: *'), `Specifies user-agent: *`);
  assert(robotsTxt.includes('Sitemap: https://philozz.com/sitemap.xml'), `Points to production sitemap https://philozz.com/sitemap.xml`);
  assert(robotsTxt.includes('Disallow: /api/'), `Disallows /api/`);
  assert(!robotsTxt.includes('Disallow: /_next/'), `Does not block Next.js assets via /_next/`);
  assert(!robotsTxt.includes('localhost'), `Does not reference localhost`);

  // 2. Sitemap.xml Test
  console.log(`\n[Test 2] Inspecting /sitemap.xml`);
  const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`);
  assert(sitemapRes.status === 200, `/sitemap.xml responded with 200`);
  const sitemapXml = await sitemapRes.text();
  const urlMatches = sitemapXml.match(/<loc>([^<]+)<\/loc>/g) || [];
  const urls = urlMatches.map((m) => m.replace(/<\/?loc>/g, ''));
  console.log(`  -> Total sitemap URLs discovered: ${urls.length}`);
  assert(urls.length === 18, `Expected exactly 18 published canonical URLs (1 homepage + 1 projects + 1 blog + 8 case studies + 7 notes)`);
  assert(urls.every((u) => u.startsWith('https://philozz.com')), `Every sitemap URL starts with production domain https://philozz.com`);
  assert(urls.includes('https://philozz.com'), `Sitemap includes homepage`);
  assert(urls.includes('https://philozz.com/projects'), `Sitemap includes /projects`);
  assert(urls.includes('https://philozz.com/blog'), `Sitemap includes /blog`);
  assert(urls.includes('https://philozz.com/work/skillup-platform'), `Sitemap includes /work/skillup-platform`);
  assert(urls.includes('https://philozz.com/notes/building-scalable-apis-with-laravel'), `Sitemap includes /notes/building-scalable-apis-with-laravel`);

  // Helper to extract meta tags
  function parseHtmlMetadata(html) {
    const getMeta = (propOrName) => {
      const match =
        html.match(new RegExp(`<meta[^>]*(?:property|name)=["']${propOrName}["'][^>]*content=["']([^"']*)["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${propOrName}["']`, 'i'));
      return match ? match[1] : null;
    };
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : null;

    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
    const canonical = canonicalMatch ? canonicalMatch[1] : null;

    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
    const jsonLdObjects = [];
    for (const tag of jsonLdMatches) {
      const content = tag.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
      try {
        jsonLdObjects.push(JSON.parse(content));
      } catch {
        console.error('Invalid JSON-LD chunk:', content);
      }
    }

    return {
      title,
      description: getMeta('description'),
      canonical,
      ogTitle: getMeta('og:title'),
      ogDescription: getMeta('og:description'),
      ogUrl: getMeta('og:url'),
      ogType: getMeta('og:type'),
      ogImage: getMeta('og:image'),
      twitterCard: getMeta('twitter:card'),
      twitterTitle: getMeta('twitter:title'),
      twitterImage: getMeta('twitter:image'),
      robots: getMeta('robots'),
      jsonLdObjects,
    };
  }

  // 3. Homepage Test
  console.log(`\n[Test 3] Inspecting Homepage (/)`);
  const homeRes = await fetch(`${BASE_URL}/`);
  const homeHtml = await homeRes.text();
  const homeMeta = parseHtmlMetadata(homeHtml);
  assert(homeMeta.title === 'PHILOZZ // Full-Stack Software Engineer', `Homepage title: "${homeMeta.title}"`);
  assert(homeMeta.description && homeMeta.description.includes('Felopater Nabil'), `Homepage description mentions Felopater Nabil`);
  assert(homeMeta.canonical === 'https://philozz.com' || homeMeta.canonical === 'https://philozz.com/', `Canonical URL is production https://philozz.com`);
  assert(homeMeta.ogType === 'website', `og:type is website`);
  assert(homeMeta.ogImage && homeMeta.ogImage.includes('philozz-cinematic-hero.png'), `og:image references approved brand hero image`);
  assert(homeMeta.twitterCard === 'summary_large_image', `twitter:card is summary_large_image`);
  assert(homeMeta.jsonLdObjects.length > 0, `JSON-LD structured data detected`);
  const personSchema = homeMeta.jsonLdObjects.flatMap((obj) => (obj['@graph'] ? obj['@graph'] : [obj])).find((o) => o['@type'] === 'Person');
  assert(personSchema && personSchema.name === 'Felopater Nabil', `Person Schema.org structured data valid with name Felopater Nabil`);

  // 4. Projects Archive Test
  console.log(`\n[Test 4] Inspecting Projects Archive (/projects)`);
  const projRes = await fetch(`${BASE_URL}/projects`);
  const projHtml = await projRes.text();
  const projMeta = parseHtmlMetadata(projHtml);
  assert(projMeta.title.includes('Selected Engineering Projects'), `Projects title: "${projMeta.title}"`);
  assert(projMeta.canonical === 'https://philozz.com/projects', `Canonical is https://philozz.com/projects`);
  assert(projMeta.ogUrl === 'https://philozz.com/projects', `og:url is https://philozz.com/projects`);
  const projBreadcrumb = projMeta.jsonLdObjects.find((o) => o['@type'] === 'BreadcrumbList');
  assert(projBreadcrumb && projBreadcrumb.itemListElement.length === 2, `BreadcrumbList structured data has 2 items`);

  // 5. Blog Archive Test
  console.log(`\n[Test 5] Inspecting Blog Archive (/blog)`);
  const blogRes = await fetch(`${BASE_URL}/blog`);
  const blogHtml = await blogRes.text();
  const blogMeta = parseHtmlMetadata(blogHtml);
  assert(blogMeta.title.includes('Engineering Journal'), `Blog title: "${blogMeta.title}"`);
  assert(blogMeta.canonical === 'https://philozz.com/blog', `Canonical is https://philozz.com/blog`);
  const blogBreadcrumb = blogMeta.jsonLdObjects.find((o) => o['@type'] === 'BreadcrumbList');
  assert(blogBreadcrumb && blogBreadcrumb.itemListElement.length === 2, `BreadcrumbList structured data has 2 items`);

  // 6. Case Study Test
  console.log(`\n[Test 6] Inspecting Case Study (/work/skillup-platform)`);
  const caseRes = await fetch(`${BASE_URL}/work/skillup-platform`);
  const caseHtml = await caseRes.text();
  const caseMeta = parseHtmlMetadata(caseHtml);
  assert(caseMeta.title.includes('SkillUp Platform'), `Case study title: "${caseMeta.title}"`);
  assert(caseMeta.canonical === 'https://philozz.com/work/skillup-platform', `Canonical is https://philozz.com/work/skillup-platform`);
  assert(caseMeta.ogType === 'article', `og:type is article`);
  const caseArticleSchema = caseMeta.jsonLdObjects.find((o) => o['@type'] === 'TechArticle');
  assert(caseArticleSchema && caseArticleSchema.headline.includes('SkillUp Platform'), `TechArticle Schema.org has headline`);

  // 7. Note / Article Detail Test
  console.log(`\n[Test 7] Inspecting Note Detail (/notes/building-scalable-apis-with-laravel)`);
  const noteRes = await fetch(`${BASE_URL}/notes/building-scalable-apis-with-laravel`);
  const noteHtml = await noteRes.text();
  const noteMeta = parseHtmlMetadata(noteHtml);
  assert(noteMeta.title.includes('Building Scalable APIs with Laravel'), `Note title: "${noteMeta.title}"`);
  assert(noteMeta.canonical === 'https://philozz.com/notes/building-scalable-apis-with-laravel', `Canonical is https://philozz.com/notes/building-scalable-apis-with-laravel`);
  assert(noteMeta.ogType === 'article', `og:type is article`);
  const noteArticleSchema = noteMeta.jsonLdObjects.find((o) => o['@type'] === 'TechArticle');
  assert(noteArticleSchema && noteArticleSchema.datePublished, `TechArticle Schema.org has valid datePublished: ${noteArticleSchema?.datePublished}`);

  // 8. 404 Unknown Route & Slug Handling
  console.log(`\n[Test 8] Inspecting 404 Handling`);
  const notFoundRoute = await fetch(`${BASE_URL}/non-existent-page-xyz`);
  assert(notFoundRoute.status === 404, `/non-existent-page-xyz returned 404`);
  const notFoundHtml = await notFoundRoute.text();
  const notFoundMeta = parseHtmlMetadata(notFoundHtml);
  assert(notFoundMeta.robots && notFoundMeta.robots.includes('noindex'), `404 page has robots noindex directive`);

  const notFoundSlug = await fetch(`${BASE_URL}/work/invalid-slug-12345`);
  const notFoundSlugHtml = await notFoundSlug.text();
  assert(
    notFoundSlug.status === 404 || notFoundSlugHtml.includes('NEXT_HTTP_ERROR_FALLBACK;404') || notFoundSlugHtml.includes('RESOURCE NOT LOCATED'),
    `/work/invalid-slug-12345 correctly triggers 404 notFound (HTTP ${notFoundSlug.status})`
  );

  const notFoundNote = await fetch(`${BASE_URL}/notes/invalid-slug-999`);
  const notFoundNoteHtml = await notFoundNote.text();
  assert(
    notFoundNote.status === 404 || notFoundNoteHtml.includes('NEXT_HTTP_ERROR_FALLBACK;404') || notFoundNoteHtml.includes('RESOURCE NOT LOCATED'),
    `/notes/invalid-slug-999 correctly triggers 404 notFound (HTTP ${notFoundNote.status})`
  );

  console.log(`\n======================================================`);
  if (failures === 0) {
    console.log(`🎉 ALL 24 SEO TESTS PASSED CLEANLY WITH ZERO FAILURES!`);
  } else {
    console.error(`💥 ${failures} TEST FAILURES DETECTED!`);
  }
  console.log(`======================================================\n`);
  process.exit(failures === 0 ? 0 : 1);
}

testSeo().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
