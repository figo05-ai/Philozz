import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACTS_DIR = '/home/figo/.gemini/antigravity/brain/57edb8e6-b535-4569-8be3-9ca13f8823ac';
const OUT_DIR = '/home/figo/Desktop/Philo/verification/phase10-journal';

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

async function runJournalVerification() {
  const port = 9397;
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
    desktopLayout: {},
    mobileLayout: {},
    articleHierarchy: {},
    articleLinks: {},
    transitionForward: {},
    transitionReverse: {},
  };

  try {
    await call('Page.enable');
    await call('DOM.enable');

    // ========================================================
    // 1. DESKTOP JOURNAL RESTING STATE (1440x900)
    // ========================================================
    console.log('\n--- 1. Testing Desktop Journal Resting State (1440x900) ---');
    await setViewport(1440, 900, false);
    await call('Page.navigate', { url: 'http://localhost:3000/#blog' });
    await new Promise((r) => setTimeout(r, 2000));

    // Scroll to #blog resting state
    await call('Runtime.evaluate', {
      expression: `(() => {
        const blog = document.getElementById('blog');
        if (blog) blog.scrollIntoView({ behavior: 'instant', block: 'start' });
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1000));

    const desktopState = await call('Runtime.evaluate', {
      expression: `(() => {
        const heading = document.getElementById('notes-title')?.innerText.trim();
        const eyebrow = document.querySelector('.notes-header-wrapper .section-tag span')?.innerText.trim();
        const desc = document.querySelector('.journal-editorial-description')?.innerText.trim();
        const authorName = document.querySelector('.journal-author-name')?.innerText.trim();
        const authorRole = document.querySelector('.journal-author-role')?.innerText.trim();

        // Featured Article
        const featuredCard = document.querySelector('.journal-featured-card');
        const featuredTitle = featuredCard?.querySelector('.journal-featured-title')?.innerText.trim();
        const featuredDesc = featuredCard?.querySelector('.journal-featured-description')?.innerText.trim();
        const featuredLink = featuredCard?.getAttribute('href');
        const featuredVisual = !!document.querySelector('.journal-api-vis');

        // Secondary Articles
        const secondaryCards = Array.from(document.querySelectorAll('.journal-secondary-card'));
        const secondaryGrid = document.querySelector('.journal-secondary-grid');
        const secondaryGridStyle = secondaryGrid ? window.getComputedStyle(secondaryGrid).gridTemplateColumns : null;

        const secondaryData = secondaryCards.map(c => ({
          title: c.querySelector('.journal-secondary-title')?.innerText.trim(),
          category: c.querySelector('.badge-gold')?.innerText.trim(),
          desc: c.querySelector('.journal-secondary-description')?.innerText.trim(),
          link: c.getAttribute('href'),
          hasVisual: !!c.querySelector('.journal-secondary-visual-slot')
        }));

        return {
          heading,
          eyebrow,
          desc,
          author: { name: authorName, role: authorRole },
          featured: {
            title: featuredTitle,
            desc: featuredDesc,
            link: featuredLink,
            hasVisual: featuredVisual
          },
          secondaryGridColumns: secondaryGridStyle,
          secondaryCount: secondaryCards.length,
          secondaryArticles: secondaryData
        };
      })()`,
      returnByValue: true,
    });

    results.desktopLayout = desktopState.result.value;
    console.log('Desktop layout state:', JSON.stringify(results.desktopLayout, null, 2));
    await capture('phase10-01-journal-resting-desktop.png');

    // ========================================================
    // 2. MOBILE JOURNAL RESTING STATE (390x844)
    // ========================================================
    console.log('\n--- 2. Testing Mobile Journal Resting State (390x844) ---');
    await setViewport(390, 844, true);
    await new Promise((r) => setTimeout(r, 800));

    const mobileState = await call('Runtime.evaluate', {
      expression: `(() => {
        const featuredCard = document.querySelector('.journal-featured-card');
        const featuredStyle = featuredCard ? window.getComputedStyle(featuredCard).gridTemplateColumns : null;
        const secondaryGrid = document.querySelector('.journal-secondary-grid');
        const secondaryGridStyle = secondaryGrid ? window.getComputedStyle(secondaryGrid).gridTemplateColumns : null;
        const secondaryCards = Array.from(document.querySelectorAll('.journal-secondary-card'));

        return {
          featuredCardGrid: featuredStyle,
          secondaryGridColumns: secondaryGridStyle,
          secondaryCount: secondaryCards.length,
          featuredWidth: featuredCard?.getBoundingClientRect().width,
          secondaryCardWidth: secondaryCards[0]?.getBoundingClientRect().width,
          viewportWidth: window.innerWidth,
          hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
        };
      })()`,
      returnByValue: true,
    });

    results.mobileLayout = mobileState.result.value;
    console.log('Mobile layout state:', results.mobileLayout);
    await capture('phase10-02-journal-resting-mobile.png');

    // Reset to Desktop
    await setViewport(1440, 900, false);
    await new Promise((r) => setTimeout(r, 600));

    // ========================================================
    // 3. VERIFY SCROLL TRANSITION FROM PROJECTS INTO BLOG
    // ========================================================
    console.log('\n--- 3. Testing Forward Scroll Transition (Projects -> Blog) ---');
    await call('Runtime.evaluate', {
      expression: `(() => {
        const p = document.getElementById('projects');
        if (p) p.scrollIntoView({ behavior: 'instant', block: 'start' });
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Capture resting projects
    await capture('phase10-03-transition-origin-projects.png');

    // Scroll to transition progress 0.50 (manuscript spread unfolded)
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

    const progress50State = await call('Runtime.evaluate', {
      expression: `(() => {
        const st = window.ScrollTrigger.getById('projects-to-blog');
        const overlay = document.querySelector('.projects-to-blog-transition-layer');
        const folio = document.querySelector('.manuscript-folio');
        return {
          progress: Number(st?.progress?.toFixed(2)),
          overlayDisplay: overlay ? window.getComputedStyle(overlay).display : null,
          folioOpacity: folio ? window.getComputedStyle(folio).opacity : null
        };
      })()`,
      returnByValue: true,
    });
    results.transitionForward.p50 = progress50State.result.value;
    console.log('Transition progress 0.50 state:', results.transitionForward.p50);
    await capture('phase10-04-transition-p50-manuscript-unfolded.png');

    // Scroll to progress 0.65 (knowledge reveal & crossfade)
    await call('Runtime.evaluate', {
      expression: `(() => {
        const st = window.ScrollTrigger.getById('projects-to-blog');
        if (st) {
          const target = st.start + 0.65 * (st.end - st.start);
          window.scrollTo({ top: target, behavior: 'instant' });
          st.update();
        }
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1000));

    const progress65State = await call('Runtime.evaluate', {
      expression: `(() => {
        const st = window.ScrollTrigger.getById('projects-to-blog');
        const featuredCard = document.querySelector('.journal-featured-card');
        const author = document.querySelector('.journal-author-badge');
        return {
          progress: Number(st?.progress?.toFixed(2)),
          featuredOpacity: featuredCard ? window.getComputedStyle(featuredCard).opacity : null,
          authorOpacity: author ? window.getComputedStyle(author).opacity : null
        };
      })()`,
      returnByValue: true,
    });
    results.transitionForward.p65 = progress65State.result.value;
    console.log('Transition progress 0.65 state:', results.transitionForward.p65);
    await capture('phase10-05-transition-p65-knowledge-crossfade.png');

    // Scroll to progress 1.00 (Blog resting)
    await call('Runtime.evaluate', {
      expression: `(() => {
        const st = window.ScrollTrigger.getById('projects-to-blog');
        if (st) {
          window.scrollTo({ top: st.end + 20, behavior: 'instant' });
          st.update();
        }
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1000));

    const progress100State = await call('Runtime.evaluate', {
      expression: `(() => {
        const st = window.ScrollTrigger.getById('projects-to-blog');
        const overlay = document.querySelector('.projects-to-blog-transition-layer');
        const featuredCard = document.querySelector('.journal-featured-card');
        const secondaryCards = Array.from(document.querySelectorAll('.journal-secondary-card'));

        return {
          progress: Number(st?.progress?.toFixed(2)),
          overlayDisplay: overlay ? window.getComputedStyle(overlay).display : null,
          featuredOpacity: featuredCard ? window.getComputedStyle(featuredCard).opacity : null,
          secondaryOpacities: secondaryCards.map(c => window.getComputedStyle(c).opacity)
        };
      })()`,
      returnByValue: true,
    });
    results.transitionForward.p100 = progress100State.result.value;
    console.log('Transition progress 1.00 state:', results.transitionForward.p100);
    await capture('phase10-06-transition-p100-blog-resting.png');

    // ========================================================
    // 4. VERIFY REVERSE SCROLL BACK TO PROJECTS
    // ========================================================
    console.log('\n--- 4. Testing Reverse Scroll (Blog -> Projects) ---');
    await call('Runtime.evaluate', {
      expression: `(() => {
        const st = window.ScrollTrigger.getById('projects-to-blog');
        if (st) {
          window.scrollTo({ top: st.start - 50, behavior: 'instant' });
          st.update();
        }
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1200));

    const reverseState = await call('Runtime.evaluate', {
      expression: `(() => {
        const pCards = Array.from(document.querySelectorAll('.projects-horizontal-gallery .gallery-project-card'));
        const overlay = document.querySelector('.projects-to-blog-transition-layer');
        return {
          projectsVisible: pCards.length === 3,
          pCardOpacities: pCards.map(c => window.getComputedStyle(c).opacity),
          overlayDisplay: overlay ? window.getComputedStyle(overlay).display : null
        };
      })()`,
      returnByValue: true,
    });
    results.transitionReverse = reverseState.result.value;
    console.log('Reverse state back at Projects:', results.transitionReverse);
    await capture('phase10-07-reverse-back-to-projects.png');

    // Write complete summary JSON
    const summaryPath = path.join(OUT_DIR, 'phase10-verification-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'phase10-verification-summary.json'), JSON.stringify(results, null, 2));
    console.log(`\nVerification finished. Summary written to ${summaryPath}`);

  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    ws.close();
    brave.kill('SIGTERM');
  }
}

runJournalVerification();
