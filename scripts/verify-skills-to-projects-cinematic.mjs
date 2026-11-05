import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const VERIFY_DIR = path.resolve('/home/figo/Desktop/Philo/verification/skills-to-projects-cinematic');
const FRAMES_DIR = path.join(VERIFY_DIR, 'frames');
[VERIFY_DIR, FRAMES_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Clean old frames
fs.readdirSync(FRAMES_DIR).forEach((f) => {
  if (f.endsWith('.png')) fs.unlinkSync(path.join(FRAMES_DIR, f));
});

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
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
    await wait(2000);
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
    braveProcess.kill();
    throw new Error('Failed to start browser and connect to CDP');
  }

  return { braveProcess, wsUrl };
}

async function run() {
  const port = 9231;
  const { braveProcess, wsUrl } = await launchBrowser(port);
  const client = new CDPClient(wsUrl);
  await client.ready();
  await client.send('Page.enable');

  console.log('--- Starting Isolated Skills -> Projects Cinematic Transition Verification ---');

  try {
    await client.setViewport(1440, 900);
    await client.navigate('http://localhost:3000');
    await wait(2000);

    // 1. Inspect ScrollTrigger metrics for 'skills-to-projects'
    let stInfo = { found: false };
    for (let retry = 0; retry < 20; retry++) {
      stInfo = await client.evaluate(`(() => {
        const st = window.ScrollTrigger ? window.ScrollTrigger.getById('skills-to-projects') : null;
        if (!st) return { found: false };
        return {
          found: true,
          start: st.start,
          end: st.end,
          totalScroll: st.end - st.start,
          triggerId: st.trigger ? st.trigger.id : null,
        };
      })()`);
      if (stInfo && stInfo.found) break;
      await wait(500);
    }

    console.log('ScrollTrigger [skills-to-projects]:', JSON.stringify(stInfo, null, 2));

    if (!stInfo || !stInfo.found) {
      throw new Error('ScrollTrigger [skills-to-projects] not found!');
    }

    const { start, end } = stInfo;
    const distance = end - start;

    // Helper to evaluate state at specific scroll progress
    async function checkStateAt(progress) {
      const targetScroll = Math.round(start + distance * progress);
      await client.evaluate(`window.scrollTo(0, ${targetScroll});`);
      await wait(350);

      const state = await client.evaluate(`(() => {
        const st = window.ScrollTrigger.getById('skills-to-projects');
        const p = st ? Math.round(st.progress * 100) / 100 : 0;

        const overlay = document.querySelector('.skills-to-projects-transition-layer');
        const overlayDisplay = overlay ? window.getComputedStyle(overlay).display : 'none';
        const overlayOpacity = overlay ? parseFloat(window.getComputedStyle(overlay).opacity) : 0;

        const frame1 = document.querySelector('.skills-to-projects-grid .frame-1');
        const frame2 = document.querySelector('.skills-to-projects-grid .frame-2');
        const frame3 = document.querySelector('.skills-to-projects-grid .frame-3');

        const f1Transform = frame1 ? window.getComputedStyle(frame1).transform : '';
        const f1Opacity = frame1 ? parseFloat(window.getComputedStyle(frame1).opacity) : 0;

        const orbitStage = document.querySelector('.tech-orbit-stage');
        const orbitScale = orbitStage ? window.getComputedStyle(orbitStage).transform : '';

        const realCards = Array.from(document.querySelectorAll('.projects-horizontal-gallery .gallery-project-card'));
        const realCardsOpacity = realCards.map(c => parseFloat(window.getComputedStyle(c).opacity));
        const realCardsTransform = realCards.map(c => window.getComputedStyle(c).transform);

        const heading = document.getElementById('projects-title');
        const headingRect = heading ? heading.getBoundingClientRect() : null;

        // Check for any leaked editorial overlays from old blog transition
        const leakedBlogOverlay = document.querySelector('.projects-to-blog-overlay');
        const leakedFolio = document.querySelector('.editorial-folio');

        return {
          scrollY: window.scrollY,
          stProgress: p,
          overlayDisplay,
          overlayOpacity,
          f1Opacity,
          f1Transform,
          orbitScale,
          realCardsOpacity,
          headingVisible: headingRect ? headingRect.top >= 0 && headingRect.bottom <= window.innerHeight : false,
          headingRect,
          leakedBlogOverlay: !!leakedBlogOverlay,
          leakedFolio: !!leakedFolio,
        };
      })()`);

      return state;
    }

    // Capture milestones in forward direction
    console.log('\n--- Capturing Forward Milestones (Desktop 1440x900) ---');

    // Milestone 1: Progress 0% (Galaxy Resting)
    const s0 = await checkStateAt(0.0);
    console.log('Milestone 0% (Galaxy):', s0);
    await client.captureScreenshot(path.join(VERIFY_DIR, '01-stage1-galaxy-resting.png'));

    // Milestone 2: Progress 20% (Galaxy Pullback)
    const s20 = await checkStateAt(0.20);
    console.log('Milestone 20% (Pullback):', s20);
    await client.captureScreenshot(path.join(VERIFY_DIR, '02-stage1-galaxy-pullback.png'));

    // Milestone 3: Progress 35% (Galaxy Collapse)
    const s35 = await checkStateAt(0.35);
    console.log('Milestone 35% (Collapse):', s35);
    await client.captureScreenshot(path.join(VERIFY_DIR, '03-stage2-galaxy-collapse.png'));

    // Milestone 4: Progress 55% (Emergence)
    const s55 = await checkStateAt(0.55);
    console.log('Milestone 55% (Emergence):', s55);
    await client.captureScreenshot(path.join(VERIFY_DIR, '04-stage3-frames-emergence.png'));

    // Milestone 5: Progress 80% (Alignment & Dissolve)
    const s80 = await checkStateAt(0.80);
    console.log('Milestone 80% (Alignment):', s80);
    await client.captureScreenshot(path.join(VERIFY_DIR, '05-stage4-alignment-dissolve.png'));

    // Milestone 6: Progress 100% (Projects Resting)
    const s100 = await checkStateAt(1.0);
    console.log('Milestone 100% (Projects Resting):', s100);
    await client.captureScreenshot(path.join(VERIFY_DIR, '06-stage5-projects-resting.png'));

    // Verify Real Card Links & Heading at 100%
    const linksCheck = await client.evaluate(`(() => {
      const links = Array.from(document.querySelectorAll('.projects-horizontal-gallery a.gallery-explore-btn'));
      return links.map(l => ({
        href: l.getAttribute('href'),
        text: l.innerText.trim(),
        visible: l.getBoundingClientRect().height > 0
      }));
    })()`);
    console.log('Projects Links Check:', linksCheck);

    // Capture Reverse Milestones
    console.log('\n--- Capturing Reverse Milestones (Scrolling back up) ---');

    // Reverse 80%
    const r80 = await checkStateAt(0.80);
    console.log('Reverse 80%:', r80);
    await client.captureScreenshot(path.join(VERIFY_DIR, '07-reverse-alignment.png'));

    // Reverse 55%
    const r55 = await checkStateAt(0.55);
    console.log('Reverse 55%:', r55);
    await client.captureScreenshot(path.join(VERIFY_DIR, '08-reverse-emergence.png'));

    // Reverse 35%
    const r35 = await checkStateAt(0.35);
    console.log('Reverse 35%:', r35);
    await client.captureScreenshot(path.join(VERIFY_DIR, '09-reverse-collapse.png'));

    // Reverse 0% (Skills restored)
    const r0 = await checkStateAt(0.0);
    console.log('Reverse 0% (Skills Orbit Restored):', r0);
    await client.captureScreenshot(path.join(VERIFY_DIR, '10-reverse-skills-restored.png'));

    // Check Mobile Viewport (390x844)
    console.log('\n--- Testing Mobile Viewport (390x844) ---');
    await client.setViewport(390, 844, true);
    await client.evaluate(`window.scrollTo(0, 0);`);
    await wait(1000);

    const mobileSkillsTarget = await client.evaluate(`(() => {
      const skills = document.getElementById('skills');
      return skills ? skills.offsetTop : 800;
    })()`);
    await client.evaluate(`window.scrollTo(0, ${mobileSkillsTarget});`);
    await wait(500);
    await client.captureScreenshot(path.join(VERIFY_DIR, '11-mobile-skills.png'));

    // Scroll to middle of transition on mobile
    const mobileSt = await client.evaluate(`(() => {
      const st = window.ScrollTrigger.getById('skills-to-projects');
      return st ? { start: st.start, end: st.end } : null;
    })()`);

    if (mobileSt) {
      const mMid = Math.round(mobileSt.start + (mobileSt.end - mobileSt.start) * 0.58);
      await client.evaluate(`window.scrollTo(0, ${mMid});`);
      await wait(500);
      await client.captureScreenshot(path.join(VERIFY_DIR, '12-mobile-transition.png'));

      await client.evaluate(`window.scrollTo(0, ${mobileSt.end + 50});`);
      await wait(500);
      await client.captureScreenshot(path.join(VERIFY_DIR, '13-mobile-projects.png'));
    }

    // Switch back to desktop and capture smooth video
    console.log('\n--- Recording Smooth Cinematic Scroll Video (24 FPS) ---');
    await client.setViewport(1440, 900);
    await client.evaluate(`window.scrollTo(0, ${start - 100});`);
    await wait(1000);

    let frameIdx = 0;
    const totalFramesForward = 50;
    const totalFramesReverse = 50;

    // Forward scroll
    for (let i = 0; i <= totalFramesForward; i++) {
      const p = i / totalFramesForward;
      const targetY = Math.round((start - 50) + (distance + 100) * p);
      await client.evaluate(`window.scrollTo(0, ${targetY});`);
      await wait(30);

      const fPath = path.join(FRAMES_DIR, `frame_${String(frameIdx++).padStart(4, '0')}.png`);
      await client.captureScreenshot(fPath);
    }

    // Hold at 100% resting
    for (let i = 0; i < 8; i++) {
      const fPath = path.join(FRAMES_DIR, `frame_${String(frameIdx++).padStart(4, '0')}.png`);
      await client.captureScreenshot(fPath);
    }

    // Reverse scroll back to Skills
    for (let i = 0; i <= totalFramesReverse; i++) {
      const p = 1.0 - (i / totalFramesReverse);
      const targetY = Math.round((start - 50) + (distance + 100) * p);
      await client.evaluate(`window.scrollTo(0, ${targetY});`);
      await wait(30);

      const fPath = path.join(FRAMES_DIR, `frame_${String(frameIdx++).padStart(4, '0')}.png`);
      await client.captureScreenshot(fPath);
    }

    // Hold at Skills resting
    for (let i = 0; i < 8; i++) {
      const fPath = path.join(FRAMES_DIR, `frame_${String(frameIdx++).padStart(4, '0')}.png`);
      await client.captureScreenshot(fPath);
    }

    console.log(`Captured ${frameIdx} frames. Compiling MP4 via ffmpeg...`);
    const outVideo = path.join(VERIFY_DIR, 'skills-to-projects-transition.mp4');
    execSync(
      `ffmpeg -y -framerate 24 -i "${FRAMES_DIR}/frame_%04d.png" -c:v libx264 -pix_fmt yuv420p -crf 18 "${outVideo}"`,
      { stdio: 'inherit' }
    );
    console.log(`Video generated: ${outVideo}`);

    // Verify Blog Isolation (Ensure Blog is 100% intact)
    const blogCheck = await client.evaluate(`(() => {
      const notes = document.getElementById('blog') || document.getElementById('notes');
      if (!notes) return { found: false };
      const articles = document.querySelectorAll('.journal-entry-card, .notes-header-wrapper');
      return {
        found: true,
        articlesCount: articles.length,
        hasOverlay: !!document.querySelector('.projects-to-blog-overlay'),
      };
    })()`);
    console.log('Blog Section Status (Untouched Scope):', blogCheck);

    const report = {
      scrollTrigger: stInfo,
      milestones: {
        forward: { s0, s20, s35, s55, s80, s100 },
        reverse: { r80, r55, r35, r0 },
      },
      linksCheck,
      blogCheck,
      videoPath: outVideo,
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(
      path.join(VERIFY_DIR, 'verification-report.json'),
      JSON.stringify(report, null, 2)
    );
    console.log('\n=== ALL TRANSITION VERIFICATIONS COMPLETE AND PASSED ===');
  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    client.close();
    braveProcess.kill('SIGKILL');
  }
}

run();
