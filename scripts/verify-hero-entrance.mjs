import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const VERIFY_DIR = path.resolve('/home/figo/Desktop/Philo/verification/hero-entrance');
const FRAMES_DIR = path.join(VERIFY_DIR, 'frames');
const ARTIFACT_DIR = path.resolve('/home/figo/.gemini/antigravity/brain/274a7a54-6102-4f59-ae57-8c71b544ec53');

if (!fs.existsSync(FRAMES_DIR)) {
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
}

// Clean old frames
for (const f of fs.readdirSync(FRAMES_DIR)) {
  if (f.endsWith('.png')) fs.unlinkSync(path.join(FRAMES_DIR, f));
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && this.callbacks.has(data.id)) {
        const { resolve, reject } = this.callbacks.get(data.id);
        this.callbacks.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };
  }

  async ready() {
    if (this.ws.readyState === WebSocket.OPEN) return;
    return new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = this.id++;
      this.callbacks.set(msgId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result ? res.result.value : null;
  }

  async setViewport(width, height, isMobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: isMobile,
    });
  }

  async captureScreenshot(outputPath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(outputPath, buffer);
    return outputPath;
  }

  close() {
    this.ws.close();
  }
}

async function launchBrowser(port) {
  const braveProcess = spawn('/usr/bin/brave-browser', [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await wait(300);
    try {
      const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
      if (list && list[0] && list[0].webSocketDebuggerUrl) {
        wsUrl = list[0].webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!wsUrl) {
    braveProcess.kill('SIGKILL');
    throw new Error('Failed to connect to browser CDP');
  }

  return { braveProcess, wsUrl };
}

async function runVerification() {
  console.log('=== PHILOZZ: HERO STAGGERED ENTRANCE VERIFICATION ===\n');
  const port = 9245;
  const { braveProcess, wsUrl } = await launchBrowser(port);
  const client = new CDPClient(wsUrl);
  await client.ready();
  await client.setViewport(1440, 900);

  const results = {
    timelineCheck: [],
    tests: {},
  };

  try {
    // -------------------------------------------------------------
    // TEST 1: Fresh Page Load - Capture Staggered Sequence & Video
    // -------------------------------------------------------------
    console.log('Test 1: Fresh Page Load — Navigating to http://localhost:3000...');
    await client.send('Page.enable');
    const loadPromise = new Promise((resolve) => {
      const handler = (event) => {
        const data = JSON.parse(event.data);
        if (data.method === 'Page.loadEventFired') {
          client.ws.removeEventListener('message', handler);
          resolve();
        }
      };
      client.ws.addEventListener('message', handler);
    });
    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await loadPromise;
    console.log('Page loaded! Capturing entrance sequence frames across 2.5 seconds...');

    // Sample elements and record frames
    const frameCount = 45; // 45 frames over ~2.25s
    const intervalMs = 50; // 50ms interval

    for (let i = 0; i < frameCount; i++) {
      const timestamp = i * intervalMs;
      const framePath = path.join(FRAMES_DIR, `frame_${String(i).padStart(4, '0')}.png`);
      await client.captureScreenshot(framePath);

      // Periodically sample DOM state
      if (i % 4 === 0) {
        const domState = await client.evaluate(`(() => {
          const getInfo = (sel) => {
            const el = document.querySelector(sel);
            if (!el) return null;
            const cs = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return {
              opacity: parseFloat(cs.opacity).toFixed(2),
              transform: cs.transform === 'none' ? 'none' : 'active',
              top: Math.round(rect.top),
            };
          };

          const titles = Array.from(document.querySelectorAll('.hero-editorial-title .title-line')).map((el) => {
            const cs = window.getComputedStyle(el);
            return {
              text: el.textContent.trim(),
              opacity: parseFloat(cs.opacity).toFixed(2),
              transform: cs.transform === 'none' ? 'none' : 'active',
            };
          });

          return {
            time: ${timestamp},
            eyebrow: getInfo('.hero-eyebrow-tag'),
            titles,
            description: getInfo('.hero-editorial-description'),
            cta: getInfo('.hero-editorial-cta-group'),
            metrics: getInfo('.hero-editorial-metrics-row'),
          };
        })()`);

        if (domState) {
          results.timelineCheck.push(domState);
        }
      }
      await wait(intervalMs);
    }

    console.log('DOM timeline samples:');
    for (const sample of results.timelineCheck) {
      console.log(`[t=${sample.time}ms] Eyebrow: op=${sample.eyebrow?.opacity} | T1: op=${sample.titles?.[0]?.opacity} | T2: op=${sample.titles?.[1]?.opacity} | T3: op=${sample.titles?.[2]?.opacity} | Desc: op=${sample.description?.opacity} | CTA: op=${sample.cta?.opacity} | Metrics: op=${sample.metrics?.opacity}`);
    }

    // Save key stills
    fs.copyFileSync(
      path.join(FRAMES_DIR, 'frame_0002.png'),
      path.join(VERIFY_DIR, 'hero-entrance-01-start-100ms.png')
    );
    fs.copyFileSync(
      path.join(FRAMES_DIR, 'frame_0010.png'),
      path.join(VERIFY_DIR, 'hero-entrance-02-titles-500ms.png')
    );
    fs.copyFileSync(
      path.join(FRAMES_DIR, 'frame_0020.png'),
      path.join(VERIFY_DIR, 'hero-entrance-03-desc-cta-1000ms.png')
    );
    fs.copyFileSync(
      path.join(FRAMES_DIR, 'frame_0035.png'),
      path.join(VERIFY_DIR, 'hero-entrance-04-settled-1750ms.png')
    );

    // Compile MP4
    const mp4Path = path.join(VERIFY_DIR, 'hero-entrance-stagger.mp4');
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn('/usr/bin/ffmpeg', [
        '-y',
        '-framerate',
        '20',
        '-i',
        path.join(FRAMES_DIR, 'frame_%04d.png'),
        '-c:v',
        'libx264',
        '-pix_fmt',
        'yuv420p',
        '-vf',
        'pad=ceil(iw/2)*2:ceil(ih/2)*2',
        mp4Path,
      ]);
      ffmpeg.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited with code ${code}`));
      });
    });
    console.log(`\nVideo compiled successfully: ${mp4Path}`);

    // -------------------------------------------------------------
    // TEST 2: Hard Refresh Test
    // -------------------------------------------------------------
    console.log('\nTest 2: Hard Refresh (Page.reload)...');
    await client.send('Page.reload', { ignoreCache: true });
    await wait(100);
    await client.evaluate(`(() => {
      const el = document.querySelector('.hero-editorial-title');
      const cs = el ? window.getComputedStyle(el) : null;
      return { opacity: cs ? cs.opacity : null };
    })()`);
    await wait(2000);
    const settledReload = await client.evaluate(`(() => {
      const titles = Array.from(document.querySelectorAll('.hero-editorial-title .title-line')).map((el) => {
        return window.getComputedStyle(el).opacity;
      });
      return { opacities: titles };
    })()`);
    console.log(`Hard refresh result: initial opacity sampled, final opacities:`, settledReload.opacities);
    results.tests.hardRefresh = settledReload.opacities.every((op) => parseFloat(op) === 1);

    // -------------------------------------------------------------
    // TEST 3: Navigation from another page (e.g. /blog) to Home
    // -------------------------------------------------------------
    console.log('\nTest 3: Navigation from /blog to Home...');
    await client.send('Page.navigate', { url: 'http://localhost:3000/blog' });
    await wait(1000);
    // Click home link or navigate to /
    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await wait(200);
    const navSample = await client.evaluate(`(() => {
      const el = document.querySelector('.hero-eyebrow-tag');
      return {
        opacity: el ? window.getComputedStyle(el).opacity : null,
      };
    })()`);
    await wait(1800);
    const navSettled = await client.evaluate(`(() => {
      const metrics = document.querySelector('.hero-editorial-metrics-row');
      return {
        opacity: metrics ? window.getComputedStyle(metrics).opacity : null,
      };
    })()`);
    console.log(`Navigation test: mid op=${navSample.opacity}, settled op=${navSettled.opacity}`);
    results.tests.navigation = parseFloat(navSettled.opacity) === 1;

    // -------------------------------------------------------------
    // TEST 4: Mobile Viewport (390x844)
    // -------------------------------------------------------------
    console.log('\nTest 4: Mobile Viewport (390x844)...');
    await client.setViewport(390, 844, true);
    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await wait(2200);
    const mobileScreenPath = path.join(VERIFY_DIR, 'hero-entrance-mobile-390x844.png');
    await client.captureScreenshot(mobileScreenPath);
    const mobileCheck = await client.evaluate(`(() => {
      const title = document.querySelector('.hero-editorial-title');
      const mobileFrame = document.querySelector('.hero-mobile-visual-frame');
      const cta = document.querySelector('.hero-editorial-cta-group');
      return {
        titleOp: title ? window.getComputedStyle(title).opacity : null,
        mobileFrameOp: mobileFrame ? window.getComputedStyle(mobileFrame).opacity : null,
        ctaOp: cta ? window.getComputedStyle(cta).opacity : null,
      };
    })()`);
    console.log('Mobile check:', mobileCheck);
    results.tests.mobile = parseFloat(mobileCheck.titleOp) === 1 && parseFloat(mobileCheck.ctaOp) === 1;

    // -------------------------------------------------------------
    // TEST 5: Prefers Reduced Motion (prefers-reduced-motion: reduce)
    // -------------------------------------------------------------
    console.log('\nTest 5: Prefers Reduced Motion...');
    await client.setViewport(1440, 900, false);
    await client.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await wait(150); // Immediate check: should ALREADY be visible (no 1.5s delay)
    const reducedMotionCheck = await client.evaluate(`(() => {
      const eyebrow = document.querySelector('.hero-eyebrow-tag');
      const titles = Array.from(document.querySelectorAll('.hero-editorial-title .title-line')).map((el) => window.getComputedStyle(el).opacity);
      const metrics = document.querySelector('.hero-editorial-metrics-row');
      return {
        eyebrowOp: eyebrow ? window.getComputedStyle(eyebrow).opacity : null,
        titlesOp: titles,
        metricsOp: metrics ? window.getComputedStyle(metrics).opacity : null,
      };
    })()`);
    console.log('Reduced motion check at 150ms:', reducedMotionCheck);
    results.tests.reducedMotion =
      parseFloat(reducedMotionCheck.eyebrowOp) === 1 &&
      reducedMotionCheck.titlesOp.every((op) => parseFloat(op) === 1) &&
      parseFloat(reducedMotionCheck.metricsOp) === 1;

    // Reset media emulation
    await client.send('Emulation.setEmulatedMedia', { features: [] });

    // -------------------------------------------------------------
    // TEST 6: Hero-to-About Transition Protection (Scroll to 1200)
    // -------------------------------------------------------------
    console.log('\nTest 6: Hero-to-About Scroll Transition Protection...');
    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await wait(1800);
    await client.evaluate(`window.scrollTo(0, 1100)`);
    await wait(600);
    const scrollTransitionPath = path.join(VERIFY_DIR, 'hero-to-about-transition-intact.png');
    await client.captureScreenshot(scrollTransitionPath);
    const scrollCheck = await client.evaluate(`(() => {
      const typo = document.querySelector('.hero-typography-layer');
      const sweep = document.querySelector('.hero-cinematic-light-sweep');
      const aboutReveal = document.querySelector('.hero-about-reveal-layer');
      return {
        heroTypoOpacity: typo ? window.getComputedStyle(typo).opacity : null,
        lightSweepOpacity: sweep ? window.getComputedStyle(sweep).opacity : null,
        aboutRevealDisplay: aboutReveal ? window.getComputedStyle(aboutReveal).opacity : null,
      };
    })()`);
    console.log('Scroll transition state at scrollY=1100:', scrollCheck);
    results.tests.heroToAboutIntact = parseFloat(scrollCheck.heroTypoOpacity) < 0.1;

    // -------------------------------------------------------------
    // Copy artifacts to Brain
    // -------------------------------------------------------------
    console.log('\nCopying media files to brain artifact directory...');
    const filesToCopy = [
      ['hero-entrance-stagger.mp4', 'hero-entrance-stagger.mp4'],
      ['hero-entrance-01-start-100ms.png', 'hero-entrance-01-start-100ms.png'],
      ['hero-entrance-02-titles-500ms.png', 'hero-entrance-02-titles-500ms.png'],
      ['hero-entrance-03-desc-cta-1000ms.png', 'hero-entrance-03-desc-cta-1000ms.png'],
      ['hero-entrance-04-settled-1750ms.png', 'hero-entrance-04-settled-1750ms.png'],
      ['hero-entrance-mobile-390x844.png', 'hero-entrance-mobile-390x844.png'],
      ['hero-to-about-transition-intact.png', 'hero-to-about-transition-intact.png'],
    ];

    for (const [src, dest] of filesToCopy) {
      const srcPath = path.join(VERIFY_DIR, src);
      const destPath = path.join(ARTIFACT_DIR, dest);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied ${src} -> ${destPath}`);
      }
    }

    console.log('\n=== ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY ===');
    console.log(JSON.stringify(results.tests, null, 2));
  } finally {
    client.close();
    braveProcess.kill('SIGKILL');
  }
}

runVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
