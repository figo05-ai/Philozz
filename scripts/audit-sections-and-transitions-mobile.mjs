import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = '/home/figo/Desktop/Philo/verification/phase13b-sections';
const ARTIFACTS_DIR = '/home/figo/.gemini/antigravity/brain/6922c74a-36fb-4f62-b5ad-d94056efd60f';

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

async function run() {
  const port = 9387;
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
  const pending = new Map();
  const consoleErrors = [];

  ws.addEventListener('message', (e) => {
    const data = JSON.parse(e.data);
    if (data.id && pending.has(data.id)) {
      const resolve = pending.get(data.id);
      pending.delete(data.id);
      resolve(data.result);
    }
    if (data.method === 'Console.messageAdded' && data.params.message.level === 'error') {
      consoleErrors.push(data.params.message);
    }
  });

  function call(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async function capture(filename) {
    const res = await call('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(res.data, 'base64');
    fs.writeFileSync(path.join(OUT_DIR, filename), buf);
    fs.writeFileSync(path.join(ARTIFACTS_DIR, filename), buf);
    console.log(`[Captured] ${filename}`);
  }

  try {
    await call('Page.enable');
    await call('DOM.enable');
    await call('Console.enable');
    await call('Runtime.enable');

    console.log('--- Setting Viewport: iPhone 13 (390x844) ---');
    await call('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      hasTouch: true,
    });

    await call('Page.navigate', { url: 'http://localhost:3000' });
    await new Promise((r) => setTimeout(r, 2500));

    // 1. HERO AUDIT
    console.log('\n--- 1. Auditing Hero Section ---');
    await capture('sec-01-hero.png');

    // 2. HAMBURGER MENU AUDIT
    console.log('\n--- 2. Auditing Hamburger Navigation Drawer ---');
    // Open hamburger
    await call('Runtime.evaluate', {
      expression: `(() => {
        const toggle = document.querySelector('.nav-mobile-toggle');
        if (toggle) toggle.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));
    await capture('sec-02-hamburger-open.png');

    // Verify body scroll locked while menu open
    const isLockedWhileOpen = await call('Runtime.evaluate', {
      expression: 'document.body.style.overflow === "hidden"',
      returnByValue: true,
    });
    console.log('Body scroll locked while open:', isLockedWhileOpen.result.value);

    // Close hamburger
    await call('Runtime.evaluate', {
      expression: `(() => {
        const toggle = document.querySelector('.nav-mobile-toggle');
        if (toggle) toggle.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));

    // Verify body scroll unlocked after closing
    const isUnlockedAfterClose = await call('Runtime.evaluate', {
      expression: 'document.body.style.overflow === ""',
      returnByValue: true,
    });
    console.log('Body scroll restored after close:', isUnlockedAfterClose.result.value);

    // 3. ABOUT SECTION AUDIT
    console.log('\n--- 3. Auditing About Section ---');
    await call('Runtime.evaluate', {
      expression: `(() => {
        const el = document.querySelector('.hero-mobile-about-section, #about');
        if (el) el.scrollIntoView({ behavior: 'instant' });
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));
    await capture('sec-03-about.png');

    // Check About cards heights and clipping
    const aboutMetrics = await call('Runtime.evaluate', {
      expression: `(() => {
        const cards = Array.from(document.querySelectorAll('.comp-card, .editorial-narrative-card, .mosaic-card')).map(c => {
          const r = c.getBoundingClientRect();
          return {
            classes: c.className,
            width: r.width,
            height: r.height,
            isClipped: r.width > window.innerWidth,
          };
        });
        return cards;
      })()`,
      returnByValue: true,
    });
    console.log('About Cards metrics:', aboutMetrics.result.value);

    // 4. SKILLS SECTION & FOCUS MODE AUDIT
    console.log('\n--- 4. Auditing Skills Section & Focus Mode ---');
    await call('Runtime.evaluate', {
      expression: `(() => {
        const el = document.querySelector('#skills');
        if (el) el.scrollIntoView({ behavior: 'instant' });
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));
    await capture('sec-04-skills-resting.png');

    // Tap on Laravel pedestal node
    console.log('Tapping Laravel pedestal node to trigger Focus Mode ...');
    await call('Runtime.evaluate', {
      expression: `(() => {
        const nodes = Array.from(document.querySelectorAll('.tech-pedestal-node'));
        if (nodes[0]) nodes[0].click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));
    await capture('sec-04-skills-focus-mode.png');

    const focusCardMetrics = await call('Runtime.evaluate', {
      expression: `(() => {
        const card = document.querySelector('.tech-focus-card, .tech-detail-panel');
        if (!card) return { found: false };
        const r = card.getBoundingClientRect();
        return {
          found: true,
          width: r.width,
          height: r.height,
          top: r.top,
          text: card.textContent.slice(0, 100),
          isClipped: r.width > window.innerWidth || r.right > window.innerWidth,
        };
      })()`,
      returnByValue: true,
    });
    console.log('Focus Card Metrics:', focusCardMetrics.result.value);

    // 5. PROJECTS SECTION AUDIT
    console.log('\n--- 5. Auditing Projects Section ---');
    await call('Runtime.evaluate', {
      expression: `(() => {
        const el = document.querySelector('#projects');
        if (el) el.scrollIntoView({ behavior: 'instant' });
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));
    await capture('sec-05-projects.png');

    // Check project cards stacking & widths
    const projectCardsMetrics = await call('Runtime.evaluate', {
      expression: `(() => {
        const cards = Array.from(document.querySelectorAll('.compact-project-card, .project-featured-card')).map(c => {
          const r = c.getBoundingClientRect();
          return {
            title: c.querySelector('h3')?.textContent.trim(),
            width: r.width,
            height: r.height,
            isClipped: r.width > window.innerWidth || r.right > window.innerWidth,
          };
        });
        return cards;
      })()`,
      returnByValue: true,
    });
    console.log('Project Cards Metrics:', projectCardsMetrics.result.value);

    // 6. BLOG SECTION AUDIT
    console.log('\n--- 6. Auditing Blog Section ---');
    await call('Runtime.evaluate', {
      expression: `(() => {
        const el = document.querySelector('#blog');
        if (el) el.scrollIntoView({ behavior: 'instant' });
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));
    await capture('sec-06-blog.png');

    // Check Blog layout & code snippets on mobile
    const blogMetrics = await call('Runtime.evaluate', {
      expression: `(() => {
        const featured = document.querySelector('.journal-featured-card, .featured-article-card');
        const secondaries = Array.from(document.querySelectorAll('.journal-article-card, .secondary-article-card'));
        const codes = Array.from(document.querySelectorAll('#blog pre, #blog code')).map(c => {
          const r = c.getBoundingClientRect();
          return {
            scrollWidth: c.scrollWidth,
            clientWidth: c.clientWidth,
            hasInternalScroll: c.scrollWidth > c.clientWidth,
            overflowsPage: r.right > window.innerWidth,
          };
        });
        return {
          hasFeatured: !!featured,
          secondaryCount: secondaries.length,
          codeBlocks: codes,
        };
      })()`,
      returnByValue: true,
    });
    console.log('Blog Metrics:', blogMetrics.result.value);

    // 7. CONTACT SECTION AUDIT
    console.log('\n--- 7. Auditing Contact Section ---');
    await call('Runtime.evaluate', {
      expression: `(() => {
        const el = document.querySelector('#contact');
        if (el) el.scrollIntoView({ behavior: 'instant' });
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));
    await capture('sec-07-contact.png');

    // Check Contact elements
    const contactMetrics = await call('Runtime.evaluate', {
      expression: `(() => {
        const heading = document.querySelector('.contact-main-heading');
        const desc = document.querySelector('.contact-desc');
        const links = Array.from(document.querySelectorAll('.contact-link-pill, .btn-gold, .contact-cta-group a')).map(l => {
          const r = l.getBoundingClientRect();
          return {
            text: l.textContent.trim().slice(0, 30),
            width: r.width,
            height: r.height,
            isClickable: r.height >= 38 && r.width >= 100,
          };
        });
        return {
          headingText: heading?.textContent.trim(),
          descText: desc?.textContent.trim().slice(0, 60),
          links,
        };
      })()`,
      returnByValue: true,
    });
    console.log('Contact Metrics:', contactMetrics.result.value);

    // 8. TRANSITIONS SCROLL AUDIT (FORWARD & REVERSE)
    console.log('\n--- 8. Testing All 5 Cinematic Transitions on Mobile ---');
    const scrollHeightRes = await call('Runtime.evaluate', {
      expression: 'document.documentElement.scrollHeight',
      returnByValue: true,
    });
    const totalHeight = scrollHeightRes.result.value;
    console.log('Total Mobile Page Height:', totalHeight);

    // Forward scroll in 10 steps
    for (let step = 1; step <= 10; step++) {
      const top = Math.round((step / 10) * totalHeight);
      await call('Runtime.evaluate', {
        expression: `window.scrollTo({ top: ${top}, behavior: 'instant' })`,
      });
      await new Promise((r) => setTimeout(r, 300));
    }
    console.log('Forward scroll completed.');

    // Reverse scroll in 10 steps
    for (let step = 9; step >= 0; step--) {
      const top = Math.round((step / 10) * totalHeight);
      await call('Runtime.evaluate', {
        expression: `window.scrollTo({ top: ${top}, behavior: 'instant' })`,
      });
      await new Promise((r) => setTimeout(r, 200));
    }
    console.log('Reverse scroll completed.');

    // Capture resting top state after reverse
    await capture('sec-08-reverse-scroll-top-restored.png');

    console.log('\nConsole Errors count:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.log('Console Errors:', JSON.stringify(consoleErrors, null, 2));
    }

  } catch (err) {
    console.error('Audit failed:', err);
  } finally {
    ws.close();
    brave.kill();
    process.exit(0);
  }
}

run();
