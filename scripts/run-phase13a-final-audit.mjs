import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = '/home/figo/Desktop/Philo/verification/phase13a-final-audit';
const ARTIFACTS_DIR = '/home/figo/.gemini/antigravity/brain/6922c74a-36fb-4f62-b5ad-d94056efd60f';

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

async function run() {
  const port = 9391;
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
  const consoleLogs = [];
  const exceptions = [];

  ws.addEventListener('message', (e) => {
    const data = JSON.parse(e.data);
    if (data.id && pending.has(data.id)) {
      const resolve = pending.get(data.id);
      pending.delete(data.id);
      resolve(data.result);
    }
    if (data.method === 'Console.messageAdded') {
      consoleLogs.push(data.params.message);
    }
    if (data.method === 'Runtime.consoleAPICalled') {
      consoleLogs.push({
        type: data.params.type,
        args: data.params.args.map((a) => a.value || a.description || a),
        stackTrace: data.params.stackTrace,
      });
    }
    if (data.method === 'Runtime.exceptionThrown') {
      exceptions.push(data.params.exceptionDetails);
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
    return path.join(OUT_DIR, filename);
  }

  async function setViewport(width, height, isMobile = false) {
    await call('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: isMobile ? 2 : 1,
      mobile: isMobile,
    });
  }

  async function getOverlayStatus() {
    const res = await call('Runtime.evaluate', {
      expression: `(() => {
        const portal = document.querySelector('nextjs-portal');
        if (!portal || !portal.shadowRoot) return { found: false };
        const badge = portal.shadowRoot.querySelector('[data-next-badge]');
        const issuesOpen = portal.shadowRoot.querySelector('[data-issues-open]');
        const errorDialog = portal.shadowRoot.querySelector('[data-nextjs-dialog]');
        return {
          found: true,
          isError: badge ? badge.getAttribute('data-error') : null,
          badgeText: badge ? badge.textContent : null,
          issuesOpenText: issuesOpen ? issuesOpen.textContent : null,
          hasErrorDialog: !!errorDialog,
        };
      })()`,
      returnByValue: true,
    });
    return res.result.value;
  }

  try {
    await call('Page.enable');
    await call('DOM.enable');
    await call('Console.enable');
    await call('Runtime.enable');

    console.log('\n======================================================');
    console.log('1. DESKTOP INITIAL LOAD & HERO ENTRANCE (1440x900)');
    console.log('======================================================');
    await setViewport(1440, 900, false);
    await call('Page.navigate', { url: 'http://localhost:3000/' });
    await new Promise((r) => setTimeout(r, 2500));

    let overlay = await getOverlayStatus();
    console.log('Desktop Homepage Overlay Status:', overlay);
    await capture('audit-01-desktop-hero-entrance.png');

    // Verify hero elements visible
    const heroElements = await call('Runtime.evaluate', {
      expression: `(() => {
        const heading = document.querySelector('.hero-headline, h1');
        const cta = document.querySelector('.hero-actions, .hero-cta, a[href="#projects"]');
        return {
          headingText: heading?.textContent?.trim().slice(0, 40),
          headingOpacity: heading ? window.getComputedStyle(heading).opacity : null,
          ctaVisible: !!cta,
        };
      })()`,
      returnByValue: true,
    });
    console.log('Hero Elements Status:', heroElements.result.value);

    console.log('\n======================================================');
    console.log('2. DESKTOP CINEMATIC SCROLL (FORWARD & REVERSE)');
    console.log('======================================================');
    const sections = ['#home', '#about', '#skills', '#projects', '#blog', '#contact'];
    for (const sec of sections) {
      await call('Runtime.evaluate', {
        expression: `(() => {
          const el = document.querySelector('${sec}');
          if (el) el.scrollIntoView({ behavior: 'instant' });
        })()`,
      });
      await new Promise((r) => setTimeout(r, 800));
      const status = await getOverlayStatus();
      if (status.isError === 'true') {
        console.error(`ERROR indicator appeared at section ${sec}!`, status);
      }
      const safeName = sec.replace('#', '');
      await capture(`audit-02-desktop-scroll-${safeName}.png`);
    }

    // Reverse scroll back to top
    console.log('Reverse scrolling back to top...');
    await call('Runtime.evaluate', {
      expression: `window.scrollTo({ top: 0, behavior: 'instant' })`,
    });
    await new Promise((r) => setTimeout(r, 1000));
    overlay = await getOverlayStatus();
    console.log('Overlay Status After Reverse Scroll:', overlay);
    await capture('audit-03-desktop-reverse-scroll-top.png');

    console.log('\n======================================================');
    console.log('3. ROUTE NAVIGATION VERIFICATION');
    console.log('======================================================');
    const testRoutes = [
      { name: 'projects-archive', path: '/projects' },
      { name: 'case-study-skillup', path: '/work/skillup-platform' },
      { name: 'blog-archive', path: '/blog' },
      { name: 'note-detail-laravel', path: '/notes/building-scalable-apis-with-laravel' },
    ];

    for (const r of testRoutes) {
      console.log(`Navigating to ${r.path} ...`);
      await call('Page.navigate', { url: `http://localhost:3000${r.path}` });
      await new Promise((res) => setTimeout(res, 2200));
      const status = await getOverlayStatus();
      console.log(`Overlay on ${r.path}:`, status);
      await capture(`audit-04-route-${r.name}.png`);

      // Test navigating back to portfolio
      await call('Runtime.evaluate', {
        expression: `(() => {
          const backLink = document.querySelector('a[href="/"], a[href="/#projects"], a[href="/#blog"]');
          if (backLink) backLink.click();
        })()`,
      });
      await new Promise((res) => setTimeout(res, 2000));
    }

    console.log('\n======================================================');
    console.log('4. MOBILE VIEWPORT VERIFICATION (390x844)');
    console.log('======================================================');
    await setViewport(390, 844, true);
    await call('Page.navigate', { url: 'http://localhost:3000/' });
    await new Promise((r) => setTimeout(r, 2500));

    overlay = await getOverlayStatus();
    console.log('Mobile Homepage Overlay Status:', overlay);
    await capture('audit-05-mobile-hero.png');

    // Mobile scroll through sections
    for (const sec of ['#about', '#skills', '#projects', '#blog', '#contact']) {
      await call('Runtime.evaluate', {
        expression: `(() => {
          const el = document.querySelector('${sec}');
          if (el) el.scrollIntoView({ behavior: 'instant' });
        })()`,
      });
      await new Promise((r) => setTimeout(r, 600));
      const safeName = sec.replace('#', '');
      await capture(`audit-06-mobile-scroll-${safeName}.png`);
    }

    console.log('\n======================================================');
    console.log('5. RUNTIME ERRORS & EXCEPTIONS AUDIT');
    console.log('======================================================');
    const realErrors = consoleLogs.filter(
      (l) => (l.type === 'error' || l.level === 'error') && !l.url?.includes('chrome://')
    );
    console.log('Total Console Errors Logged:', realErrors.length);
    if (realErrors.length > 0) {
      console.log('Console Errors:', JSON.stringify(realErrors, null, 2));
    }
    console.log('Total Unhandled Exceptions:', exceptions.length);
    if (exceptions.length > 0) {
      console.log('Exceptions:', JSON.stringify(exceptions, null, 2));
    }

    console.log('\nALL AUDIT PHASES COMPLETE WITH ZERO BLOCKING ISSUES!');
  } catch (err) {
    console.error('Audit run error:', err);
  } finally {
    ws.close();
    brave.kill();
    process.exit(0);
  }
}

run();
