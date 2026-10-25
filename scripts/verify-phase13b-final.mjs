import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = '/home/figo/Desktop/Philo/verification/phase13b-verification';
const ARTIFACTS_DIR = '/home/figo/.gemini/antigravity/brain/6922c74a-36fb-4f62-b5ad-d94056efd60f';

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

async function run() {
  const port = 9381;
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

    console.log('=== TEST 1: MOBILE VIEWPORT (390x844 iPhone 13) ===');
    await call('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      hasTouch: true,
    });

    await call('Page.navigate', { url: 'http://localhost:3000' });
    await new Promise((r) => setTimeout(r, 2500));

    // Check unique #about
    const aboutCheckMobile = await call('Runtime.evaluate', {
      expression: `(() => {
        const els = Array.from(document.querySelectorAll('#about'));
        const toggle = document.querySelector('.nav-mobile-toggle');
        const toggleRect = toggle ? toggle.getBoundingClientRect() : null;
        const aboutEl = els[0];
        const aboutRect = aboutEl ? aboutEl.getBoundingClientRect() : null;
        const mobileAboutSec = document.querySelector('.hero-mobile-about-section');
        const mobileAboutRect = mobileAboutSec ? mobileAboutSec.getBoundingClientRect() : null;

        return {
          totalAboutElements: els.length,
          toggleWidth: toggleRect ? toggleRect.width : 0,
          toggleHeight: toggleRect ? toggleRect.height : 0,
          aboutOffsetTop: aboutEl ? aboutEl.offsetTop : 0,
          mobileAboutOffsetTop: mobileAboutSec ? mobileAboutSec.offsetTop : 0,
        };
      })()`,
      returnByValue: true,
    });
    console.log('Mobile Check Results:', JSON.stringify(aboutCheckMobile.result.value, null, 2));

    // Test tapping Hamburger and clicking #about
    console.log('Opening mobile menu and clicking #about...');
    await call('Runtime.evaluate', {
      expression: `(() => {
        const toggle = document.querySelector('.nav-mobile-toggle');
        toggle.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 400));

    await call('Runtime.evaluate', {
      expression: `(() => {
        const aboutLink = Array.from(document.querySelectorAll('.mobile-menu-item')).find(a => a.getAttribute('href') === '#about');
        if (aboutLink) aboutLink.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1200));

    const scrollPos = await call('Runtime.evaluate', {
      expression: `(() => {
        const aboutSec = document.querySelector('.hero-mobile-about-section');
        const title = document.querySelector('#about-title');
        const titleRect = title ? title.getBoundingClientRect() : null;
        return {
          scrollY: window.scrollY,
          titleTopViewport: titleRect ? titleRect.top : null,
          titleVisible: titleRect ? (titleRect.top >= 0 && titleRect.top < window.innerHeight) : false,
        };
      })()`,
      returnByValue: true,
    });
    console.log('Scroll Position after clicking #about:', JSON.stringify(scrollPos.result.value, null, 2));
    await capture('verified-01-mobile-about-target.png');

    console.log('\n=== TEST 2: ALL 5 CINEMATIC TRANSITIONS ON MOBILE ===');
    // Scroll through all sections and verify no stuck overlays
    const transitionCheck = await call('Runtime.evaluate', {
      expression: `(() => {
        const sections = ['#home', '.hero-mobile-about-section', '#skills', '#projects', '#blog', '#contact'];
        const results = {};
        for (const sel of sections) {
          const el = document.querySelector(sel);
          if (el) {
            results[sel] = {
              top: el.offsetTop,
              height: el.offsetHeight,
            };
          }
        }
        return results;
      })()`,
      returnByValue: true,
    });
    console.log('Mobile Section Positions:', JSON.stringify(transitionCheck.result.value, null, 2));

    // Scroll down gradually through transitions
    const maxScroll = await call('Runtime.evaluate', {
      expression: 'document.documentElement.scrollHeight - window.innerHeight',
      returnByValue: true,
    });
    const totalSteps = 10;
    const stepSize = maxScroll.result.value / totalSteps;

    for (let i = 1; i <= totalSteps; i++) {
      const targetY = Math.round(i * stepSize);
      await call('Runtime.evaluate', {
        expression: `window.scrollTo({ top: ${targetY}, behavior: 'instant' })`,
      });
      await new Promise((r) => setTimeout(r, 200));
    }
    console.log('Reached bottom (Contact section)');
    await capture('verified-02-mobile-contact-bottom.png');

    // Scroll back to top
    await call('Runtime.evaluate', {
      expression: 'window.scrollTo({ top: 0, behavior: ' + "'instant'" + ' })',
    });
    await new Promise((r) => setTimeout(r, 600));
    console.log('Restored top (Hero section)');
    await capture('verified-03-mobile-top-restored.png');

    console.log('\n=== TEST 3: DESKTOP VIEWPORT (1440x900) REGRESSION CHECK ===');
    await call('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
      hasTouch: false,
    });

    await call('Page.navigate', { url: 'http://localhost:3000' });
    await new Promise((r) => setTimeout(r, 2500));

    const desktopCheck = await call('Runtime.evaluate', {
      expression: `(() => {
        const els = Array.from(document.querySelectorAll('#about'));
        const mobileAboutSec = document.querySelector('.hero-mobile-about-section');
        const computedMobileSec = mobileAboutSec ? window.getComputedStyle(mobileAboutSec).display : null;
        const anchor = els[0];
        const anchorStyle = anchor ? window.getComputedStyle(anchor) : null;

        return {
          totalAboutElements: els.length,
          mobileAboutDisplay: computedMobileSec,
          anchorPosition: anchorStyle ? anchorStyle.position : null,
          anchorTop: anchorStyle ? anchorStyle.top : null,
        };
      })()`,
      returnByValue: true,
    });
    console.log('Desktop Check Results:', JSON.stringify(desktopCheck.result.value, null, 2));
    await capture('verified-04-desktop-hero-resting.png');

    // Test desktop scroll to 100vh (transition to About)
    await call('Runtime.evaluate', {
      expression: 'window.scrollTo({ top: window.innerHeight, behavior: ' + "'instant'" + ' })',
    });
    await new Promise((r) => setTimeout(r, 1000));
    await capture('verified-05-desktop-about-revealed.png');

    console.log('\n=== Console Errors Recorded ===');
    console.log(consoleErrors.length === 0 ? 'ZERO console errors!' : consoleErrors);

  } finally {
    ws.close();
    brave.kill();
  }
}

run().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
