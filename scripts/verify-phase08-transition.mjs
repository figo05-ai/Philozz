import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const VERIFY_DIR = path.resolve('/home/figo/Desktop/Philo/verification/phase08-transition');
const FRAMES_DIR = path.join(VERIFY_DIR, 'frames');
[VERIFY_DIR, FRAMES_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Clean old frames
fs.readdirSync(FRAMES_DIR).forEach((f) => {
  if (f.endsWith('.png')) fs.unlinkSync(path.join(FRAMES_DIR, f));
});

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

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

  async captureScreenshot(outputPath, clip = null) {
    const params = { format: 'png' };
    if (clip) params.clip = clip;
    const res = await this.send('Page.captureScreenshot', params);
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(outputPath, buffer);
    return outputPath;
  }

  async navigate(url) {
    const loadPromise = new Promise((resolve) => {
      const handler = (event) => {
        const data = JSON.parse(event.data);
        if (data.method === 'Page.loadEventFired') {
          this.ws.removeEventListener('message', handler);
          resolve();
        }
      };
      this.ws.addEventListener('message', handler);
    });
    await this.send('Page.navigate', { url });
    await loadPromise;
    await wait(2200);
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

async function run() {
  console.log('=== VERIFYING PROJECTS TO BLOG CINEMATIC TRANSITION ===\n');
  const port = 9340;
  const { braveProcess, wsUrl } = await launchBrowser(port);
  const client = new CDPClient(wsUrl);
  await client.ready();
  await client.send('Page.enable');

  try {
    // 1. Desktop 1440x900
    await client.setViewport(1440, 900, false);
    await client.navigate('http://localhost:3000');
    await wait(1500);

    // Get trigger bounds
    const triggerData = await client.evaluate(`(() => {
      const st = ScrollTrigger.getById('projects-to-blog');
      if (!st) return null;
      return {
        start: Math.round(st.start),
        end: Math.round(st.end),
        totalDistance: Math.round(st.end - st.start),
      };
    })()`);

    console.log('ScrollTrigger [projects-to-blog] bounds:', triggerData);

    if (!triggerData) {
      throw new Error('ScrollTrigger projects-to-blog not found!');
    }

    const { start, end, totalDistance } = triggerData;

    // Helper to scroll to specific progress
    async function scrollToProgress(progress) {
      const scrollY = Math.round(start + totalDistance * progress);
      await client.evaluate(`(() => {
        window.scrollTo({ top: ${scrollY}, behavior: 'instant' });
        const st = ScrollTrigger.getById('projects-to-blog');
        if (st) st.scroll(${scrollY});
      })()`);
      await wait(450);
    }

    // Capture Key Milestones
    // 0.00 — Projects Resting
    await scrollToProgress(0.0);
    const shot00 = path.join(VERIFY_DIR, '01-desktop-p00-projects-resting.png');
    await client.captureScreenshot(shot00);
    console.log(`Captured: ${shot00}`);

    // 0.25 — Projects Recede into Depth
    await scrollToProgress(0.25);
    const shot25 = path.join(VERIFY_DIR, '02-desktop-p25-projects-recede.png');
    await client.captureScreenshot(shot25);
    console.log(`Captured: ${shot25}`);

    // 0.50 — Editorial Folio Unfolding (Concept: FROM BUILDING SYSTEMS TO SHARING KNOWLEDGE)
    await scrollToProgress(0.50);
    const shot50 = path.join(VERIFY_DIR, '03-desktop-p50-editorial-folio.png');
    await client.captureScreenshot(shot50);
    console.log(`Captured: ${shot50}`);

    // 0.75 — Journal Reveal (Unmasking heading & articles)
    await scrollToProgress(0.75);
    const shot75 = path.join(VERIFY_DIR, '04-desktop-p75-journal-reveal.png');
    await client.captureScreenshot(shot75);
    console.log(`Captured: ${shot75}`);

    // 1.00 — Blog Resting
    await scrollToProgress(1.0);
    const shot100 = path.join(VERIFY_DIR, '05-desktop-p100-blog-resting.png');
    await client.captureScreenshot(shot100);
    console.log(`Captured: ${shot100}`);

    // Test Reversibility: Scroll back to 0.50 then 0.00
    await scrollToProgress(0.50);
    const shot50Rev = path.join(VERIFY_DIR, '06-desktop-p50-reverse.png');
    await client.captureScreenshot(shot50Rev);
    console.log(`Captured Reverse 50%: ${shot50Rev}`);

    await scrollToProgress(0.0);
    const shot00Rev = path.join(VERIFY_DIR, '07-desktop-p00-reverse-restored.png');
    await client.captureScreenshot(shot00Rev);
    console.log(`Captured Reverse Restored 0%: ${shot00Rev}`);

    // Measure states and verify DOM integrity
    const desktopIntegrity = await client.evaluate(`(() => {
      const cards = Array.from(document.querySelectorAll('.projects-horizontal-gallery .gallery-project-card'));
      const articles = Array.from(document.querySelectorAll('.journal-article-card'));
      const overlay = document.querySelector('.projects-to-blog-overlay');
      const folio = document.querySelector('.editorial-folio');

      const cardsRestored = cards.every(c => {
        const cs = window.getComputedStyle(c);
        return parseFloat(cs.opacity) >= 0.95;
      });

      return {
        cardsRestoredAtZero: cardsRestored,
        cardCount: cards.length,
        articleCount: articles.length,
        overlayDisplayAtZero: overlay ? window.getComputedStyle(overlay).display : null,
      };
    })()`);

    console.log('Desktop Integrity Checks:', desktopIntegrity);

    // 2. Mobile 390x844
    await client.setViewport(390, 844, true);
    await client.navigate('http://localhost:3000');
    await wait(1500);

    const mobileTrigger = await client.evaluate(`(() => {
      const st = ScrollTrigger.getById('projects-to-blog');
      if (!st) return null;
      return {
        start: Math.round(st.start),
        end: Math.round(st.end),
        totalDistance: Math.round(st.end - st.start),
      };
    })()`);

    if (mobileTrigger) {
      const mStart = mobileTrigger.start;
      const mDist = mobileTrigger.totalDistance;

      async function scrollMobileTo(p) {
        const y = Math.round(mStart + mDist * p);
        await client.evaluate(`(() => {
          window.scrollTo({ top: ${y}, behavior: 'instant' });
          const st = ScrollTrigger.getById('projects-to-blog');
          if (st) st.scroll(${y});
        })()`);
        await wait(450);
      }

      await scrollMobileTo(0.0);
      const shotMob00 = path.join(VERIFY_DIR, '08-mobile-p00-projects.png');
      await client.captureScreenshot(shotMob00);

      await scrollMobileTo(0.50);
      const shotMob50 = path.join(VERIFY_DIR, '09-mobile-p50-folio.png');
      await client.captureScreenshot(shotMob50);

      await scrollMobileTo(1.0);
      const shotMob100 = path.join(VERIFY_DIR, '10-mobile-p100-blog.png');
      await client.captureScreenshot(shotMob100);

      const mobileOverflow = await client.evaluate(`(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: window.innerWidth,
          hasOverflow: document.documentElement.scrollWidth > window.innerWidth,
        };
      })()`);

      console.log('Mobile 390 Overflow Check:', mobileOverflow);
    }

    // 3. Record Forward & Reverse Video
    console.log('\nCapturing animation frames for video...');
    await client.setViewport(1440, 900, false);
    await client.navigate('http://localhost:3000');
    await wait(1200);

    const steps = 40;
    let frameIdx = 0;

    // Forward pass (0.0 to 1.0)
    for (let i = 0; i <= steps; i++) {
      const p = i / steps;
      await scrollToProgress(p);
      const framePath = path.join(FRAMES_DIR, `frame_${String(frameIdx++).padStart(4, '0')}.png`);
      await client.captureScreenshot(framePath);
    }

    // Pause at 1.0
    for (let i = 0; i < 6; i++) {
      const framePath = path.join(FRAMES_DIR, `frame_${String(frameIdx++).padStart(4, '0')}.png`);
      await client.captureScreenshot(framePath);
    }

    // Reverse pass (1.0 to 0.0)
    for (let i = steps; i >= 0; i--) {
      const p = i / steps;
      await scrollToProgress(p);
      const framePath = path.join(FRAMES_DIR, `frame_${String(frameIdx++).padStart(4, '0')}.png`);
      await client.captureScreenshot(framePath);
    }

    // Pause at 0.0
    for (let i = 0; i < 6; i++) {
      const framePath = path.join(FRAMES_DIR, `frame_${String(frameIdx++).padStart(4, '0')}.png`);
      await client.captureScreenshot(framePath);
    }

    console.log(`Captured ${frameIdx} frames. Compiling MP4 video via ffmpeg...`);
    const outVideo = path.join(VERIFY_DIR, 'projects-to-blog-transition.mp4');
    execSync(`ffmpeg -y -framerate 24 -i "${FRAMES_DIR}/frame_%04d.png" -c:v libx264 -pix_fmt yuv420p -crf 18 "${outVideo}"`, { stdio: 'inherit' });
    console.log(`Video generated successfully: ${outVideo}`);

    const report = {
      triggerData,
      desktopIntegrity,
      videoPath: outVideo,
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(path.join(VERIFY_DIR, 'phase08-verification.json'), JSON.stringify(report, null, 2));
    console.log('\n=== ALL PHASE 08 CHECKS COMPLETE ===');

  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    client.close();
    braveProcess.kill('SIGKILL');
  }
}

run();
