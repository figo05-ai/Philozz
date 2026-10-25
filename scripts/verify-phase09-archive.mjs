import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACTS_DIR = '/home/figo/.gemini/antigravity/brain/57edb8e6-b535-4569-8be3-9ca13f8823ac';
const OUT_DIR = '/home/figo/Desktop/Philo/verification/phase09-archive';

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

async function runVerification() {
  const port = 9399;
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
    // 1. TEST HOMEPAGE PROJECTS SECTION (DESKTOP: 1440x900)
    // ========================================================
    console.log('\n--- 1. Testing Homepage Projects Section ---');
    await setViewport(1440, 900, false);
    await call('Page.navigate', { url: 'http://localhost:3000/#projects' });
    await new Promise((r) => setTimeout(r, 2000));

    // Scroll directly to #projects
    await call('Runtime.evaluate', {
      expression: `(() => {
        const p = document.getElementById('projects');
        if (p) p.scrollIntoView({ behavior: 'instant', block: 'start' });
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));

    const hpState = await call('Runtime.evaluate', {
      expression: `(() => {
        const cards = Array.from(document.querySelectorAll('.projects-horizontal-gallery .gallery-project-card'));
        const toggleBtn = document.querySelector('.projects-toggle-btn');
        const viewAllHref = toggleBtn ? toggleBtn.getAttribute('href') : null;
        const viewAllText = toggleBtn ? toggleBtn.innerText.trim() : null;
        const extraRows = document.querySelectorAll('.additional-gallery-row');

        return {
          cardCount: cards.length,
          cardTitles: cards.map(c => c.querySelector('.gallery-project-title')?.innerText.trim()),
          hasToggleBtn: !!toggleBtn,
          viewAllHref,
          viewAllText,
          extraRowCount: extraRows.length,
          docHeight: document.documentElement.scrollHeight
        };
      })()`,
      returnByValue: true,
    });

    results.homepage = hpState.result.value;
    console.log('Homepage state:', results.homepage);
    await capture('phase09-01-homepage-projects-resting.png');

    // ========================================================
    // 2. TEST DEDICATED PROJECT ARCHIVE (DESKTOP: 1440x900)
    // ========================================================
    console.log('\n--- 2. Testing Dedicated Project Archive (/projects) ---');
    await call('Page.navigate', { url: 'http://localhost:3000/projects' });
    await new Promise((r) => setTimeout(r, 2000));

    const archiveDesktopState = await call('Runtime.evaluate', {
      expression: `(() => {
        const title = document.getElementById('archive-title')?.innerText.trim();
        const eyebrow = document.querySelector('.archive-heading-eyebrow span')?.innerText.trim();
        const desc = document.querySelector('.archive-heading-desc')?.innerText.trim();
        const backLink = document.querySelector('.archive-back-link');
        const searchInput = document.querySelector('.archive-search-input');
        const filterPills = Array.from(document.querySelectorAll('.archive-filter-pill'));
        const cards = Array.from(document.querySelectorAll('.archive-grid .gallery-project-card'));
        const titles = cards.map(c => c.querySelector('.gallery-project-title')?.innerText.trim());
        const caseStudyLinks = cards.map(c => c.querySelector('.gallery-explore-btn')?.getAttribute('href'));

        return {
          title,
          eyebrow,
          desc,
          backLinkHref: backLink ? backLink.getAttribute('href') : null,
          hasSearchInput: !!searchInput,
          filterCategories: filterPills.map(p => p.querySelector('span')?.innerText.trim()),
          projectCount: cards.length,
          projectTitles: titles,
          caseStudyLinks
        };
      })()`,
      returnByValue: true,
    });

    results.archiveDesktop = archiveDesktopState.result.value;
    console.log('Archive Desktop state:', results.archiveDesktop);
    await capture('phase09-02-project-archive-desktop.png');

    // ========================================================
    // 3. TEST ARCHIVE RESPONSIVE (MOBILE: 390x844 & TABLET: 768x1024)
    // ========================================================
    console.log('\n--- 3. Testing Archive Mobile & Tablet ---');
    await setViewport(390, 844, true);
    await new Promise((r) => setTimeout(r, 600));

    const mobileState = await call('Runtime.evaluate', {
      expression: `(() => {
        const grid = document.querySelector('.archive-grid');
        const computed = grid ? window.getComputedStyle(grid) : null;
        const cards = Array.from(document.querySelectorAll('.archive-grid .gallery-project-card'));
        return {
          gridColumns: computed ? computed.gridTemplateColumns : null,
          cardCount: cards.length,
          cardWidth: cards[0] ? cards[0].getBoundingClientRect().width : null,
          viewportWidth: window.innerWidth
        };
      })()`,
      returnByValue: true,
    });
    results.archiveMobile = mobileState.result.value;
    console.log('Archive Mobile state:', results.archiveMobile);
    await capture('phase09-03-project-archive-mobile.png');

    // Tablet check
    await setViewport(768, 1024, false);
    await new Promise((r) => setTimeout(r, 600));
    const tabletState = await call('Runtime.evaluate', {
      expression: `(() => {
        const grid = document.querySelector('.archive-grid');
        const computed = grid ? window.getComputedStyle(grid) : null;
        return {
          gridColumns: computed ? computed.gridTemplateColumns : null,
          viewportWidth: window.innerWidth
        };
      })()`,
      returnByValue: true,
    });
    results.archiveTablet = tabletState.result.value;
    console.log('Archive Tablet state:', results.archiveTablet);
    await capture('phase09-03b-project-archive-tablet.png');

    // Reset to Desktop
    await setViewport(1440, 900, false);
    await new Promise((r) => setTimeout(r, 500));

    // ========================================================
    // 4. TEST CATEGORY FILTERING & SEARCH
    // ========================================================
    console.log('\n--- 4. Testing Category Filtering & Search ---');
    // Click "Backend Systems" filter pill
    await call('Runtime.evaluate', {
      expression: `(() => {
        const pills = Array.from(document.querySelectorAll('.archive-filter-pill'));
        const backendPill = pills.find(p => p.innerText.includes('Backend Systems'));
        if (backendPill) backendPill.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));

    const categoryFilterState = await call('Runtime.evaluate', {
      expression: `(() => {
        const cards = Array.from(document.querySelectorAll('.archive-grid .gallery-project-card'));
        return {
          filteredCount: cards.length,
          titles: cards.map(c => c.querySelector('.gallery-project-title')?.innerText.trim()),
          url: window.location.href
        };
      })()`,
      returnByValue: true,
    });
    results.filtering.backendCategory = categoryFilterState.result.value;
    console.log('Category filter state:', results.filtering.backendCategory);
    await capture('phase09-04-archive-filtering-category.png');

    // Reset category to all first
    await call('Runtime.evaluate', {
      expression: `(() => {
        const allPill = Array.from(document.querySelectorAll('.archive-filter-pill')).find(p => p.innerText.includes('All Projects'));
        if (allPill) allPill.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));

    // Test Search: Filter by "NativePHP"
    await call('Runtime.evaluate', {
      expression: `(() => {
        const input = document.querySelector('.archive-search-input');
        if (input) {
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeSetter.call(input, 'NativePHP');
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));

    const searchState = await call('Runtime.evaluate', {
      expression: `(() => {
        const cards = Array.from(document.querySelectorAll('.archive-grid .gallery-project-card'));
        return {
          matchCount: cards.length,
          titles: cards.map(c => c.querySelector('.gallery-project-title')?.innerText.trim()),
          url: window.location.href
        };
      })()`,
      returnByValue: true,
    });
    results.search.nativePhpSearch = searchState.result.value;
    console.log('Search state (NativePHP):', results.search.nativePhpSearch);
    await capture('phase09-05-archive-filtering-search.png');

    // Test Empty Search Results
    await call('Runtime.evaluate', {
      expression: `(() => {
        const input = document.querySelector('.archive-search-input');
        if (input) {
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeSetter.call(input, 'NonExistentTechnology999');
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));

    const emptyState = await call('Runtime.evaluate', {
      expression: `(() => {
        const empty = document.querySelector('.archive-empty-state');
        const emptyTitle = empty ? empty.querySelector('.archive-empty-title')?.innerText.trim() : null;
        const resetBtn = empty ? empty.querySelector('.archive-reset-btn') : null;
        return {
          hasEmptyState: !!empty,
          emptyTitle,
          hasResetBtn: !!resetBtn
        };
      })()`,
      returnByValue: true,
    });
    results.search.emptyState = emptyState.result.value;
    console.log('Empty state:', results.search.emptyState);
    await capture('phase09-06-archive-empty-state.png');

    // Reset filters using reset button
    await call('Runtime.evaluate', {
      expression: `(() => {
        const resetBtn = document.querySelector('.archive-reset-btn');
        if (resetBtn) resetBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));

    // ========================================================
    // 5. TEST DYNAMIC PAGINATION (USING ?size=3)
    // ========================================================
    console.log('\n--- 5. Testing Dynamic Pagination (size=3) ---');
    await call('Page.navigate', { url: 'http://localhost:3000/projects?size=3' });
    await new Promise((r) => setTimeout(r, 1200));

    const page1State = await call('Runtime.evaluate', {
      expression: `(() => {
        const cards = Array.from(document.querySelectorAll('.archive-grid .gallery-project-card'));
        const pagination = document.querySelector('.archive-pagination-wrap');
        const pageNums = Array.from(document.querySelectorAll('.archive-page-num'));
        return {
          cardCountOnPage1: cards.length,
          hasPagination: !!pagination,
          totalPages: pageNums.length,
          pageTitles: cards.map(c => c.querySelector('.gallery-project-title')?.innerText.trim())
        };
      })()`,
      returnByValue: true,
    });
    results.pagination.page1 = page1State.result.value;
    console.log('Pagination page 1:', results.pagination.page1);
    await capture('phase09-07-archive-pagination.png');

    // Navigate to Page 2
    await call('Runtime.evaluate', {
      expression: `(() => {
        const page2Btn = Array.from(document.querySelectorAll('.archive-page-num')).find(p => p.innerText.trim() === '2');
        if (page2Btn) page2Btn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));

    const page2State = await call('Runtime.evaluate', {
      expression: `(() => {
        const cards = Array.from(document.querySelectorAll('.archive-grid .gallery-project-card'));
        const activePage = document.querySelector('.archive-page-num.active')?.innerText.trim();
        return {
          cardCountOnPage2: cards.length,
          activePage,
          pageTitles: cards.map(c => c.querySelector('.gallery-project-title')?.innerText.trim()),
          url: window.location.href
        };
      })()`,
      returnByValue: true,
    });
    results.pagination.page2 = page2State.result.value;
    console.log('Pagination page 2:', results.pagination.page2);

    // ========================================================
    // 6. TEST RETURN-TO-PORTFOLIO NAVIGATION
    // ========================================================
    console.log('\n--- 6. Testing Return-to-Portfolio Navigation ---');
    await call('Runtime.evaluate', {
      expression: `(() => {
        const backLink = document.querySelector('.archive-back-link');
        if (backLink) backLink.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 2000));

    const returnState = await call('Runtime.evaluate', {
      expression: `(() => {
        return {
          url: window.location.href,
          scrollY: window.scrollY,
          projectsTop: document.getElementById('projects')?.getBoundingClientRect().top
        };
      })()`,
      returnByValue: true,
    });
    results.navigation.returnToPortfolio = returnState.result.value;
    console.log('Return state:', results.navigation.returnToPortfolio);
    await capture('phase09-08-returned-to-portfolio.png');

    // ========================================================
    // 7. VERIFY PROJECTS -> BLOG CINEMATIC TRANSITION INTEGRITY
    // ========================================================
    console.log('\n--- 7. Verifying Projects -> Blog Transition Integrity After Return ---');
    await call('Runtime.evaluate', {
      expression: `(() => {
        const st = window.ScrollTrigger.getById('projects-to-blog');
        if (st) {
          const target = st.start + 0.50 * (st.end - st.start);
          window.scrollTo({ top: target, behavior: 'instant' });
          st.update();
        }
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1000));

    const transitionState = await call('Runtime.evaluate', {
      expression: `(() => {
        const st = window.ScrollTrigger.getById('projects-to-blog');
        if (!st) return { active: false, reason: 'ScrollTrigger not found' };

        const overlay = document.querySelector('.projects-to-blog-transition-layer');
        const folio = document.querySelector('.manuscript-folio');
        const content = document.querySelector('.manuscript-spread');

        return {
          active: true,
          progress: Number(st.progress.toFixed(2)),
          overlayDisplay: overlay ? window.getComputedStyle(overlay).display : null,
          overlayOpacity: overlay ? window.getComputedStyle(overlay).opacity : null,
          folioOpacity: folio ? window.getComputedStyle(folio).opacity : null,
          contentOpacity: content ? window.getComputedStyle(content).opacity : null
        };
      })()`,
      returnByValue: true,
    });
    results.transitionIntegrity = transitionState.result.value;
    console.log('Projects -> Blog transition state at p=0.50:', results.transitionIntegrity);
    await capture('phase09-09-projects-to-blog-after-return.png');

    // Reset scroll back to #projects
    await call('Runtime.evaluate', {
      expression: `(() => {
        const st = window.ScrollTrigger.getById('projects-to-blog');
        if (st) st.scroll(0);
      })()`,
    });

    // Write complete summary JSON
    const summaryPath = path.join(OUT_DIR, 'phase09-verification-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'phase09-verification-summary.json'), JSON.stringify(results, null, 2));
    console.log(`\nVerification finished. Summary written to ${summaryPath}`);

  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    ws.close();
    brave.kill('SIGTERM');
  }
}

runVerification();
