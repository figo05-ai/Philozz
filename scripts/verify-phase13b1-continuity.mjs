import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = '/home/figo/Desktop/Philo/verification/phase13b1-verification';
const ARTIFACTS_DIR = '/home/figo/.gemini/antigravity/brain/6922c74a-36fb-4f62-b5ad-d94056efd60f';

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

async function run() {
  const port = 9388;
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
      consoleErrors.push(data.params.message.text);
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
    console.log(`[Screenshot Captured] ${filename}`);
  }

  try {
    await call('Page.enable');
    await call('DOM.enable');
    await call('Console.enable');
    await call('Runtime.enable');

    const viewports = [
      { name: '360x740_android_small', width: 360, height: 740, mobile: true },
      { name: '390x844_iphone13', width: 390, height: 844, mobile: true },
      { name: '430x932_iphone_max', width: 430, height: 932, mobile: true },
      { name: '1440x900_desktop', width: 1440, height: 900, mobile: false },
    ];

    for (const vp of viewports) {
      console.log(`\n========================================`);
      console.log(`TESTING VIEWPORT: ${vp.name} (${vp.width}x${vp.height})`);
      console.log(`========================================`);

      await call('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.mobile ? 2 : 1,
        mobile: vp.mobile,
        hasTouch: vp.mobile,
      });

      await call('Page.navigate', { url: 'http://localhost:3000' });
      await new Promise((r) => setTimeout(r, 2000));

      // Disable smooth scroll for deterministic instant stepping
      await call('Runtime.evaluate', {
        expression: 'document.documentElement.style.scrollBehavior = "auto"',
      });

      const scrollInfo = await call('Runtime.evaluate', {
        expression: `(() => ({
          maxScroll: document.documentElement.scrollHeight - window.innerHeight,
          winHeight: window.innerHeight,
        }))()`,
        returnByValue: true,
      });

      const maxScroll = scrollInfo.result.value.maxScroll;
      const winHeight = scrollInfo.result.value.winHeight;

      // 1. FORWARD SCROLL CONTINUITY CHECK
      console.log(`--- Checking Forward Scroll Continuity (${vp.name}) ---`);
      const step = 150;
      let prolongedDarkGapCount = 0;
      let consecutiveEmptyFrames = 0;

      for (let y = 0; y <= maxScroll; y += step) {
        await call('Runtime.evaluate', {
          expression: `window.scrollTo(0, ${y})`,
        });
        await new Promise((r) => setTimeout(r, 60));

        const state = await call('Runtime.evaluate', {
          expression: `(() => {
            // Count any meaningfully visible text, card, canvas, or transition element in viewport
            const selectors = [
              '.hero-editorial-title',
              '.hero-mobile-visual-frame',
              '.hero-editorial-cta-group',
              '.comp-card',
              '.editorial-narrative-card',
              '.mosaic-card',
              '.tech-title',
              '.tech-col-left',
              '.tech-orbit-stage',
              '.tech-col-right',
              '.transition-wireframe-frame',
              '.projects-editorial-heading',
              '.gallery-project-card',
              '.projects-toggle-wrapper',
              '.manuscript-folio',
              '.journal-editorial-heading',
              '.journal-featured-wrapper',
              '.journal-secondary-grid',
              '.final-commit-content',
              '.final-commit-line-wrap',
              '.contact-main-heading',
              '.contact-portrait-group',
              '.contact-cta-group',
            ];

            let visibleElements = [];
            for (const sel of selectors) {
              const els = document.querySelectorAll(sel);
              for (const el of els) {
                const style = window.getComputedStyle(el);
                if (style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0.08) {
                  const r = el.getBoundingClientRect();
                  if (r.bottom > 80 && r.top < window.innerHeight - 20) {
                    visibleElements.push(sel);
                  }
                }
              }
            }

            return {
              scrollY: window.scrollY,
              count: visibleElements.length,
              elements: visibleElements,
            };
          })()`,
          returnByValue: true,
        });

        const s = state.result.value;
        if (s.count === 0) {
          consecutiveEmptyFrames++;
          if (consecutiveEmptyFrames >= 2) {
            prolongedDarkGapCount++;
            console.log(`[EMPTY GAP AT scrollY=${s.scrollY}] ${vp.name}`);
          }
        } else {
          consecutiveEmptyFrames = 0;
        }

        // Capture milestone screenshots on iPhone 13
        if (vp.name === '390x844_iphone13') {
          if (y === 3900) await capture('forward-01-skills-to-projects-start.png');
          if (y === 4350) await capture('forward-02-skills-to-projects-emergence.png');
          if (y === 4800) await capture('forward-03-projects-real-cards.png');
          if (y === 6300) await capture('forward-04-projects-to-blog-manuscript.png');
          if (y === 6750) await capture('forward-05-blog-journal-arrival.png');
        }
      }

      console.log(`Forward scroll prolonged gaps (>200px empty): ${prolongedDarkGapCount}`);

      // 2. REVERSE SCROLL CONTINUITY CHECK
      console.log(`--- Checking Reverse Scroll Continuity (${vp.name}) ---`);
      let reverseDarkGapCount = 0;
      let reverseConsecutiveEmpty = 0;

      for (let y = maxScroll; y >= 0; y -= step) {
        await call('Runtime.evaluate', {
          expression: `window.scrollTo(0, ${y})`,
        });
        await new Promise((r) => setTimeout(r, 60));

        const state = await call('Runtime.evaluate', {
          expression: `(() => {
            const selectors = [
              '.hero-editorial-title',
              '.hero-mobile-visual-frame',
              '.hero-editorial-cta-group',
              '.comp-card',
              '.editorial-narrative-card',
              '.mosaic-card',
              '.tech-title',
              '.tech-col-left',
              '.tech-orbit-stage',
              '.tech-col-right',
              '.transition-wireframe-frame',
              '.projects-editorial-heading',
              '.gallery-project-card',
              '.projects-toggle-wrapper',
              '.manuscript-folio',
              '.journal-editorial-heading',
              '.journal-featured-wrapper',
              '.journal-secondary-grid',
              '.final-commit-content',
              '.final-commit-line-wrap',
              '.contact-main-heading',
              '.contact-portrait-group',
              '.contact-cta-group',
            ];

            let visibleElements = [];
            for (const sel of selectors) {
              const els = document.querySelectorAll(sel);
              for (const el of els) {
                const style = window.getComputedStyle(el);
                if (style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0.08) {
                  const r = el.getBoundingClientRect();
                  if (r.bottom > 80 && r.top < window.innerHeight - 20) {
                    visibleElements.push(sel);
                  }
                }
              }
            }

            return {
              scrollY: window.scrollY,
              count: visibleElements.length,
            };
          })()`,
          returnByValue: true,
        });

        const s = state.result.value;
        if (s.count === 0) {
          reverseConsecutiveEmpty++;
          if (reverseConsecutiveEmpty >= 2) {
            reverseDarkGapCount++;
            console.log(`[REVERSE EMPTY GAP AT scrollY=${s.scrollY}] ${vp.name}`);
          }
        } else {
          reverseConsecutiveEmpty = 0;
        }

        if (vp.name === '390x844_iphone13') {
          if (y === 6600) await capture('reverse-01-blog-to-projects.png');
          if (y === 4200) await capture('reverse-02-projects-to-skills.png');
        }
      }

      console.log(`Reverse scroll prolonged gaps (>200px empty): ${reverseDarkGapCount}`);
    }

    // 3. PREFERS-REDUCED-MOTION TEST
    console.log(`\n========================================`);
    console.log(`TESTING PREFERS-REDUCED-MOTION`);
    console.log(`========================================`);

    await call('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      hasTouch: true,
    });
    await call('Emulation.setEmulatedMedia', {
      media: 'screen',
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });

    await call('Page.navigate', { url: 'http://localhost:3000' });
    await new Promise((r) => setTimeout(r, 2000));

    const reducedMotionCheck = await call('Runtime.evaluate', {
      expression: `(() => {
        const sections = ['#home', '#about', '#skills', '#projects', '#blog', '#contact'];
        return sections.map(s => {
          const el = document.querySelector(s);
          return {
            id: s,
            exists: !!el,
            display: el ? window.getComputedStyle(el).display : 'none',
          };
        });
      })()`,
      returnByValue: true,
    });
    console.log('Reduced motion section check:', JSON.stringify(reducedMotionCheck.result.value, null, 2));
    await capture('verified-reduced-motion-mobile.png');

    console.log('\n--- Console Errors ---');
    console.log(consoleErrors.length === 0 ? 'ZERO console errors!' : consoleErrors);

  } finally {
    ws.close();
    brave.kill();
  }
}

run().catch((err) => {
  console.error('Continuity check failed:', err);
  process.exit(1);
});
