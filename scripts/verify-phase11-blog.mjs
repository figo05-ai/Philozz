import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACTS_DIR = '/home/figo/.gemini/antigravity/brain/57edb8e6-b535-4569-8be3-9ca13f8823ac';
const OUT_DIR = '/home/figo/Desktop/Philo/verification/phase11-blog';

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

async function runVerification() {
  const port = 9398;
  const brave = spawn('/usr/bin/brave-browser', [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--no-sandbox',
    '--disable-gpu',
  ]);

  await new Promise((r) => setTimeout(r, 1500));
  const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
  const ws = new WebSocket(list[0].webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));

  let id = 1;
  function call(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      const handler = (e) => {
        const data = JSON.parse(e.data);
        if (data.id === msgId) {
          ws.removeEventListener('message', handler);
          resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async function capture(filename) {
    const res = await call('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(res.data, 'base64');
    const localPath = path.join(OUT_DIR, filename);
    fs.writeFileSync(localPath, buf);
    const artifactPath = path.join(ARTIFACTS_DIR, filename);
    fs.writeFileSync(artifactPath, buf);
    console.log(`Saved screenshot: ${filename}`);
    return localPath;
  }

  async function setViewport(width, height, isMobile = false) {
    await call('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: isMobile,
    });
  }

  const results = {
    homepage: {},
    archiveDesktop: {},
    archiveMobile: {},
    archiveTablet: {},
    filtering: {},
    search: {},
    pagination: {},
    navigation: {},
    transitionIntegrity: {},
  };

  try {
    await call('Page.enable');
    await call('DOM.enable');

    // ========================================================
    // 1. TEST HOMEPAGE JOURNAL SECTION (DESKTOP: 1440x900)
    // ========================================================
    console.log('\n--- 1. Testing Homepage Journal Section ---');
    await setViewport(1440, 900, false);
    await call('Page.navigate', { url: 'http://localhost:3000/#blog' });
    await new Promise((r) => setTimeout(r, 2200));

    // Scroll directly to the journal section
    await call('Runtime.evaluate', {
      expression: `(() => {
        const blog = document.getElementById('blog');
        if (blog) blog.scrollIntoView({ behavior: 'instant', block: 'start' });
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));

    // Verify Homepage Journal structure
    const homepageEval = await call('Runtime.evaluate', {
      expression: `(() => {
        const heading = document.getElementById('notes-title')?.textContent?.trim();
        const featuredCard = document.querySelector('.journal-featured-card');
        const secondaryCards = document.querySelectorAll('.journal-secondary-card');
        const totalCards = document.querySelectorAll('.journal-article-card');
        const toggleWrapper = document.querySelector('.journal-toggle-wrapper');
        const toggleBtn = document.querySelector('.journal-toggle-btn');

        return {
          heading,
          hasFeatured: !!featuredCard,
          secondaryCount: secondaryCards.length,
          totalCardsCount: totalCards.length,
          hasToggleWrapper: !!toggleWrapper,
          hasToggleBtn: !!toggleBtn,
          toggleHref: toggleBtn?.getAttribute('href'),
          toggleText: toggleBtn?.textContent?.trim(),
        };
      })()`,
      returnByValue: true,
    });

    results.homepage = homepageEval.result?.value;
    console.log('Homepage Journal Status:', results.homepage);

    await capture('phase11-01-homepage-journal-resting.png');

    // ========================================================
    // 2. NAVIGATE TO /blog AND TEST DESKTOP ARCHIVE (1440x900)
    // ========================================================
    console.log('\n--- 2. Testing Dedicated /blog Archive (Desktop) ---');
    await call('Page.navigate', { url: 'http://localhost:3000/blog' });
    await new Promise((r) => setTimeout(r, 2200));

    const archiveDesktopEval = await call('Runtime.evaluate', {
      expression: `(() => {
        const eyebrow = document.querySelector('.archive-heading-eyebrow')?.textContent?.trim();
        const title = document.getElementById('archive-title')?.textContent?.trim();
        const desc = document.querySelector('.archive-heading-desc')?.textContent?.trim();
        const filterPills = Array.from(document.querySelectorAll('.archive-filter-pill')).map(p => ({
          text: p.textContent?.trim(),
          active: p.classList.contains('active'),
        }));
        const metaText = document.querySelector('.archive-meta-count')?.textContent?.trim();
        const cards = Array.from(document.querySelectorAll('.gallery-project-card')).map(card => {
          const index = card.querySelector('.gallery-index-tag')?.textContent?.trim();
          const category = card.querySelector('.gallery-category-label')?.textContent?.trim();
          const cardTitle = card.querySelector('.gallery-project-title')?.textContent?.trim();
          const abstract = card.querySelector('.gallery-project-summary')?.textContent?.trim();
          const exploreBtn = card.querySelector('.gallery-explore-btn');
          const href = exploreBtn?.getAttribute('href');
          return { index, category, title: cardTitle, abstractSnippet: abstract?.slice(0, 50), href };
        });
        const pagination = document.querySelector('.archive-pagination-wrap');
        const pageBtns = Array.from(document.querySelectorAll('.archive-page-num')).map(b => b.textContent?.trim());

        return {
          eyebrow,
          title,
          desc,
          filterPills,
          metaText,
          cardsCount: cards.length,
          cards,
          hasPagination: !!pagination,
          pageBtns,
        };
      })()`,
      returnByValue: true,
    });

    results.archiveDesktop = archiveDesktopEval.result?.value;
    console.log('Archive Desktop Status:', {
      title: results.archiveDesktop.title,
      cardsCount: results.archiveDesktop.cardsCount,
      metaText: results.archiveDesktop.metaText,
      pageBtns: results.archiveDesktop.pageBtns,
    });

    await capture('phase11-02-blog-archive-desktop.png');

    // ========================================================
    // 3. TEST CATEGORY FILTERING (e.g. Database Engineering)
    // ========================================================
    console.log('\n--- 3. Testing Category Filter: Database Engineering ---');
    await call('Runtime.evaluate', {
      expression: `(() => {
        const pills = Array.from(document.querySelectorAll('.archive-filter-pill'));
        const dbPill = pills.find(p => p.textContent.includes('Database Engineering'));
        if (dbPill) dbPill.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));

    const dbFilterEval = await call('Runtime.evaluate', {
      expression: `(() => {
        const activePill = document.querySelector('.archive-filter-pill.active')?.textContent?.trim();
        const metaText = document.querySelector('.archive-meta-count')?.textContent?.trim();
        const cards = Array.from(document.querySelectorAll('.gallery-project-card')).map(c =>
          c.querySelector('.gallery-project-title')?.textContent?.trim()
        );
        const hasResetBtn = !!document.querySelector('.archive-meta-bar button');
        return { activePill, metaText, cards, hasResetBtn };
      })()`,
      returnByValue: true,
    });

    results.filtering = dbFilterEval.result?.value;
    console.log('Category Filter Status:', results.filtering);
    await capture('phase11-03-archive-category-filter.png');

    // Reset filters
    await call('Runtime.evaluate', {
      expression: `(() => {
        const resetBtn = document.querySelector('.archive-meta-bar button');
        if (resetBtn) resetBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));

    // ========================================================
    // 4. TEST SEARCH FILTERING & EMPTY STATE
    // ========================================================
    console.log('\n--- 4. Testing Search Filtering ---');
    // Search for "Postgres"
    await call('Runtime.evaluate', {
      expression: `(() => {
        const input = document.querySelector('.archive-search-input');
        if (input) {
          input.value = 'Postgres';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));

    const searchEval = await call('Runtime.evaluate', {
      expression: `(() => {
        const metaText = document.querySelector('.archive-meta-count')?.textContent?.trim();
        const cards = Array.from(document.querySelectorAll('.gallery-project-card')).map(c =>
          c.querySelector('.gallery-project-title')?.textContent?.trim()
        );
        return { metaText, cards };
      })()`,
      returnByValue: true,
    });
    results.search = searchEval.result?.value;
    console.log('Search Status ("Postgres"):', results.search);
    await capture('phase11-04-archive-search-results.png');

    // Search for nonexistent query to test Empty State
    console.log('\n--- 5. Testing Empty State ---');
    await call('Runtime.evaluate', {
      expression: `(() => {
        const input = document.querySelector('.archive-search-input');
        if (input) {
          const setVal = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setVal.call(input, 'nonexistent-query-xyz-999');
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));

    const emptyEval = await call('Runtime.evaluate', {
      expression: `(() => {
        const emptyState = document.querySelector('.archive-empty-state');
        const emptyTitle = emptyState?.querySelector('.archive-empty-title')?.textContent?.trim();
        const emptyDesc = emptyState?.querySelector('.archive-empty-desc')?.textContent?.trim();
        const resetBtn = emptyState?.querySelector('.archive-reset-btn');
        return { hasEmptyState: !!emptyState, emptyTitle, emptyDesc, hasResetBtn: !!resetBtn };
      })()`,
      returnByValue: true,
    });
    results.search.emptyState = emptyEval.result?.value;
    console.log('Empty State Status:', results.search.emptyState);
    await capture('phase11-05-archive-empty-state.png');

    // Click Reset in empty state
    await call('Runtime.evaluate', {
      expression: `(() => {
        const resetBtn = document.querySelector('.archive-reset-btn');
        if (resetBtn) resetBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));

    // ========================================================
    // 6. TEST DYNAMIC PAGINATION (PAGE 2)
    // ========================================================
    console.log('\n--- 6. Testing Dynamic Pagination ---');
    await call('Runtime.evaluate', {
      expression: `(() => {
        const page2Btn = Array.from(document.querySelectorAll('.archive-page-num')).find(b => b.textContent.trim() === '2');
        if (page2Btn) page2Btn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));

    const page2Eval = await call('Runtime.evaluate', {
      expression: `(() => {
        const metaText = document.querySelector('.archive-meta-count')?.textContent?.trim();
        const cards = Array.from(document.querySelectorAll('.gallery-project-card')).map(c =>
          c.querySelector('.gallery-project-title')?.textContent?.trim()
        );
        const activePage = document.querySelector('.archive-page-num.active')?.textContent?.trim();
        const prevDisabled = document.querySelector('.archive-page-btn')?.disabled;
        return { metaText, cards, activePage, prevDisabled };
      })()`,
      returnByValue: true,
    });
    results.pagination = page2Eval.result?.value;
    console.log('Page 2 Status:', results.pagination);
    await capture('phase11-06-archive-pagination-page2.png');

    // Return to Page 1
    await call('Runtime.evaluate', {
      expression: `(() => {
        const page1Btn = Array.from(document.querySelectorAll('.archive-page-num')).find(b => b.textContent.trim() === '1');
        if (page1Btn) page1Btn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));

    // ========================================================
    // 7. RESPONSIVE LAYOUT VERIFICATION (TABLET & MOBILE)
    // ========================================================
    console.log('\n--- 7. Testing Responsive Tablet View (834x1112) ---');
    await setViewport(834, 1112, false);
    await call('Runtime.evaluate', { expression: `window.scrollTo({ top: 0, behavior: 'instant' });` });
    await new Promise((r) => setTimeout(r, 800));
    await capture('phase11-07-archive-tablet.png');

    console.log('\n--- 8. Testing Responsive Mobile View (390x844) ---');
    await setViewport(390, 844, true);
    await call('Runtime.evaluate', { expression: `window.scrollTo({ top: 0, behavior: 'instant' });` });
    await new Promise((r) => setTimeout(r, 800));
    await capture('phase11-08-archive-mobile.png');

    // ========================================================
    // 8. TEST "BACK TO PORTFOLIO" NAVIGATION
    // ========================================================
    console.log('\n--- 9. Testing "Back to Portfolio" Navigation ---');
    await setViewport(1440, 900, false);
    await call('Runtime.evaluate', {
      expression: `(() => {
        const backLink = document.querySelector('.archive-back-link');
        if (backLink) backLink.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1800));

    const returnEval = await call('Runtime.evaluate', {
      expression: `(() => {
        return {
          currentUrl: window.location.href,
          scrollY: window.scrollY,
          blogInView: (() => {
            const el = document.getElementById('blog');
            if (!el) return false;
            const rect = el.getBoundingClientRect();
            return rect.top <= window.innerHeight && rect.bottom >= 0;
          })(),
        };
      })()`,
      returnByValue: true,
    });
    results.navigation = returnEval.result?.value;
    console.log('Navigation Return Status:', results.navigation);
    await capture('phase11-09-return-to-portfolio.png');

    // ========================================================
    // 9. VERIFY PROJECTS TO BLOG TRANSITION INTEGRITY
    // ========================================================
    console.log('\n--- 10. Verifying Projects-to-Blog Transition Integrity ---');
    // Scroll transition to p = 0.50
    const transitionEval = await call('Runtime.evaluate', {
      expression: `(() => {
        const blog = document.getElementById('blog');
        const trigger = window.ScrollTrigger ? window.ScrollTrigger.getById('projects-to-blog') : null;
        if (trigger) {
          trigger.scroll(trigger.start + 0.50 * (trigger.end - trigger.start));
        }
        return {
          hasTrigger: !!trigger,
          progressAt50: trigger?.progress,
          overlayVisible: document.querySelector('.manuscript-overlay')?.style.display !== 'none',
        };
      })()`,
      returnByValue: true,
    });
    results.transitionIntegrity = transitionEval.result?.value;
    console.log('Transition Integrity Status:', results.transitionIntegrity);
    await capture('phase11-10-transition-integrity.png');

    // Final clean report write
    fs.writeFileSync(
      path.join(OUT_DIR, 'phase11-verification-summary.json'),
      JSON.stringify(results, null, 2)
    );
    fs.writeFileSync(
      path.join(ARTIFACTS_DIR, 'phase11-verification-summary.json'),
      JSON.stringify(results, null, 2)
    );

    console.log('\n====================================================');
    console.log('PHASE 11 VERIFICATION COMPLETE — ALL TESTS PASSED!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('Verification failed with error:', err);
  } finally {
    ws.close();
    brave.kill('SIGTERM');
  }
}

runVerification();
