import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = '/home/figo/Desktop/Philo/verification/phase13b1-diagnosis';
fs.mkdirSync(OUT_DIR, { recursive: true });

async function run() {
  const port = 9382;
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

  ws.addEventListener('message', (e) => {
    const data = JSON.parse(e.data);
    if (data.id && pending.has(data.id)) {
      const resolve = pending.get(data.id);
      pending.delete(data.id);
      resolve(data.result);
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
  }

  try {
    await call('Page.enable');
    await call('DOM.enable');
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

    // Get document height and section offsets
    const info = await call('Runtime.evaluate', {
      expression: `(() => {
        const sections = ['#home', '.hero-mobile-about-section', '#skills', '#projects', '#blog', '#contact'];
        const offsets = {};
        for (const s of sections) {
          const el = document.querySelector(s);
          if (el) {
            const r = el.getBoundingClientRect();
            offsets[s] = {
              offsetTop: el.offsetTop,
              height: el.offsetHeight,
              rectTop: r.top,
            };
          }
        }
        return {
          scrollHeight: document.documentElement.scrollHeight,
          windowHeight: window.innerHeight,
          offsets,
        };
      })()`,
      returnByValue: true,
    });
    console.log('Page layout info:', JSON.stringify(info.result.value, null, 2));

    const totalHeight = info.result.value.scrollHeight;
    const winHeight = info.result.value.windowHeight;

    // Diagnose continuous scroll: check viewport content at regular intervals
    // Especially around Skills -> Projects (approx 3084 -> 4723) and Projects -> Blog (approx 4723 -> 6968)
    const samples = [];
    const step = 150;

    for (let scrollY = 0; scrollY <= totalHeight - winHeight; scrollY += step) {
      await call('Runtime.evaluate', {
        expression: `window.scrollTo({ top: ${scrollY}, behavior: 'instant' })`,
      });
      await new Promise((r) => setTimeout(r, 120));

      const sample = await call('Runtime.evaluate', {
        expression: `(() => {
          // Check what is currently visible in viewport (y from 0 to ${winHeight})
          const isVisibleInViewport = (el) => {
            if (!el) return false;
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) < 0.05) return false;
            const r = el.getBoundingClientRect();
            return r.bottom > 80 && r.top < window.innerHeight;
          };

          // Check visible elements
          const visibleNodes = [];
          const candidates = [
            // Skills elements
            { name: 'skillsColLeft', el: document.querySelector('.tech-col-left') },
            { name: 'skillsColRight', el: document.querySelector('.tech-col-right') },
            { name: 'skillsOrbitStage', el: document.querySelector('.tech-orbit-stage') },
            { name: 'skillsPedestals', el: document.querySelector('.tech-pedestals-container') },
            // SkillsToProjects transition frames
            { name: 's2pOverlay', el: document.querySelector('.skills-to-projects-transition-layer') },
            { name: 's2pFrame1', el: document.querySelector('.skills-to-projects-transition-layer .frame-1') },
            // Projects elements
            { name: 'projectsHeader', el: document.querySelector('.projects-header-wrapper') },
            { name: 'projectCard0', el: document.querySelectorAll('.gallery-project-card')[0] },
            { name: 'projectCard1', el: document.querySelectorAll('.gallery-project-card')[1] },
            { name: 'projectCard2', el: document.querySelectorAll('.gallery-project-card')[2] },
            { name: 'projectsToggle', el: document.querySelector('.projects-toggle-wrapper') },
            // ProjectsToBlog transition elements
            { name: 'p2bOverlay', el: document.querySelector('.projects-to-blog-overlay') },
            { name: 'p2bFolio', el: document.querySelector('.manuscript-folio') },
            // Blog elements
            { name: 'blogHeader', el: document.querySelector('.notes-header-wrapper') },
            { name: 'blogFeatured', el: document.querySelector('.journal-featured-wrapper') },
            { name: 'blogSecondary', el: document.querySelector('.journal-secondary-grid') },
            // Contact elements
            { name: 'finalCommitOverlay', el: document.querySelector('.final-commit-overlay') },
            { name: 'contactHeader', el: document.querySelector('.contact-header') },
            { name: 'contactCtas', el: document.querySelector('.contact-actions') },
          ];

          for (const c of candidates) {
            if (isVisibleInViewport(c.el)) {
              const r = c.el.getBoundingClientRect();
              const style = window.getComputedStyle(c.el);
              visibleNodes.push({
                name: c.name,
                top: Math.round(r.top),
                bottom: Math.round(r.bottom),
                opacity: parseFloat(style.opacity).toFixed(2),
              });
            }
          }

          return {
            scrollY: window.scrollY,
            visibleCount: visibleNodes.length,
            visibleNodes,
          };
        })()`,
        returnByValue: true,
      });

      const s = sample.result.value;
      samples.push(s);

      // If very few or no visible elements, capture screenshot!
      if (s.visibleCount <= 1) {
        const fname = `gap-scrollY-${s.scrollY}.png`;
        await capture(fname);
        console.log(`[POTENTIAL GAP DETECTED] scrollY: ${s.scrollY}, visible:`, s.visibleNodes.map(n => n.name).join(', '));
      }
    }

    // Inspect heading clearance under navbar
    console.log('\n--- Checking Heading Clearances under Sticky Navbar ---');
    const clearances = await call('Runtime.evaluate', {
      expression: `(() => {
        const navHeight = 72; // typical nav height
        const headings = [
          { name: 'About Heading', el: document.querySelector('#about-title') },
          { name: 'Skills Heading', el: document.querySelector('.tech-title') },
          { name: 'Projects Heading', el: document.querySelector('.projects-editorial-heading') },
          { name: 'Blog Heading', el: document.querySelector('.journal-editorial-heading') },
          { name: 'Contact Heading', el: document.querySelector('.contact-title') },
        ];

        return headings.map(h => {
          if (!h.el) return { name: h.name, exists: false };
          const r = h.el.getBoundingClientRect();
          const style = window.getComputedStyle(h.el);
          return {
            name: h.name,
            exists: true,
            tagName: h.el.tagName,
            scrollMarginTop: style.scrollMarginTop,
          };
        });
      })()`,
      returnByValue: true,
    });
    console.log('Heading clearances:', JSON.stringify(clearances.result.value, null, 2));

  } finally {
    ws.close();
    brave.kill();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
