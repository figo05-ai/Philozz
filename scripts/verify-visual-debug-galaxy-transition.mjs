import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const VERIFY_DIR = path.resolve('/home/figo/Desktop/Philo/verification/visual-debug-galaxy');
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
    await wait(2500);
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
  const port = 9245;
  const { braveProcess, wsUrl } = await launchBrowser(port);
  const client = new CDPClient(wsUrl);
  await client.ready();
  await client.send('Page.enable');

  console.log('--- Starting Visual Execution Debugging: Galaxy Collapse Transition ---');

  try {
    await client.setViewport(1440, 900);
    await client.navigate('http://localhost:3000');
    await wait(2000);

    // 1. Locate ScrollTrigger
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
    if (!stInfo.found) throw new Error('ScrollTrigger [skills-to-projects] not found!');

    const { start, end } = stInfo;
    const distance = end - start;

    // Helper to inspect elements and capture screenshot
    async function inspectAt(progress, label) {
      const targetScroll = Math.round(start + distance * progress);
      await client.evaluate(`window.scrollTo(0, ${targetScroll});`);
      await wait(350);

      const inspection = await client.evaluate(`(() => {
        const st = window.ScrollTrigger.getById('skills-to-projects');
        const p = st ? Math.round(st.progress * 100) / 100 : 0;

        const getBox = (el) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          const s = window.getComputedStyle(el);
          return {
            top: Math.round(r.top),
            bottom: Math.round(r.bottom),
            left: Math.round(r.left),
            right: Math.round(r.right),
            width: Math.round(r.width),
            height: Math.round(r.height),
            opacity: parseFloat(s.opacity),
            display: s.display,
            transform: s.transform,
            inViewport: r.top < window.innerHeight && r.bottom > 0,
          };
        };

        const orbitStage = document.querySelector('.tech-orbit-stage');
        const orbitBadge = document.querySelector('.orbit-center-badge');
        const overlay = document.querySelector('.skills-to-projects-transition-layer');
        const frame1 = document.querySelector('.skills-to-projects-grid .frame-1');
        const frame2 = document.querySelector('.skills-to-projects-grid .frame-2');
        const frame3 = document.querySelector('.skills-to-projects-grid .frame-3');
        const realCards = Array.from(document.querySelectorAll('.projects-horizontal-gallery .gallery-project-card'));
        const heading = document.getElementById('projects-title');

        const boxOrbit = getBox(orbitStage);
        const boxBadge = getBox(orbitBadge);
        const boxF1 = getBox(frame1);
        const boxF2 = getBox(frame2);
        const boxF3 = getBox(frame3);

        const bothGalaxyAndFramesInViewport =
          boxBadge && boxF1 && boxF2 && boxF3 &&
          boxBadge.inViewport &&
          boxF1.inViewport && boxF2.inViewport && boxF3.inViewport &&
          boxF1.opacity > 0.1 && boxBadge.opacity > 0.1;

        return {
          progress: p,
          scrollY: window.scrollY,
          orbitBadge: boxBadge,
          orbitStage: boxOrbit,
          overlay: getBox(overlay),
          frame1: boxF1,
          frame2: boxF2,
          frame3: boxF3,
          realCardsOpacities: realCards.map(c => parseFloat(window.getComputedStyle(c).opacity)),
          heading: getBox(heading),
          bothGalaxyAndFramesInViewport,
        };
      })()`);

      const imgPath = path.join(VERIFY_DIR, `${label}.png`);
      await client.captureScreenshot(imgPath);
      inspection.screenshot = imgPath;
      return inspection;
    }

    console.log('\n=== MANDATORY DEBUGGING AT PRECISE PROGRESS POSITIONS ===');

    // 0%
    const p0 = await inspectAt(0.0, '01-debug-progress-000');
    console.log(`[0%] Galaxy Resting: inViewport=${p0.orbitBadge?.inViewport}, opacity=${p0.orbitBadge?.opacity}, overlayDisplay=${p0.overlay?.display}`);

    // 20%
    const p20 = await inspectAt(0.20, '02-debug-progress-020');
    console.log(`[20%] Galaxy Pullback: inViewport=${p20.orbitBadge?.inViewport}, badgeScale=${p20.orbitBadge?.transform}`);

    // 35% - CRITICAL ACCEPTANCE CRITERIA
    const p35 = await inspectAt(0.35, '03-debug-progress-035-GALAXY-AND-FRAMES-COEXIST');
    console.log(`[35%] CRITICAL CHECK: Both Galaxy and Frames Co-Exist in Same Viewport: ${p35.bothGalaxyAndFramesInViewport}`);
    console.log(`      Galaxy Badge: top=${p35.orbitBadge?.top}, opacity=${p35.orbitBadge?.opacity}`);
    console.log(`      Frame 1: top=${p35.frame1?.top}, opacity=${p35.frame1?.opacity}, width=${p35.frame1?.width}`);
    console.log(`      Frame 2: top=${p35.frame2?.top}, opacity=${p35.frame2?.opacity}, width=${p35.frame2?.width}`);
    console.log(`      Frame 3: top=${p35.frame3?.top}, opacity=${p35.frame3?.opacity}, width=${p35.frame3?.width}`);

    // 50%
    const p50 = await inspectAt(0.50, '04-debug-progress-050');
    console.log(`[50%] Frames Traveling & Expanding: f1Top=${p50.frame1?.top}, f1Opacity=${p50.frame1?.opacity}, f1Width=${p50.frame1?.width}`);

    // 60%
    const p60 = await inspectAt(0.60, '05-debug-progress-060');
    console.log(`[60%] Frames Advancing into Columns: f1Top=${p60.frame1?.top}, f2Top=${p60.frame2?.top}, f3Top=${p60.frame3?.top}`);

    // 70%
    const p70 = await inspectAt(0.70, '06-debug-progress-070');
    console.log(`[70%] Frames Approaching Card Sites: f1Top=${p70.frame1?.top}, f1Width=${p70.frame1?.width}`);

    // 85%
    const p85 = await inspectAt(0.85, '07-debug-progress-085-ALIGNMENT-DISSOLVE');
    console.log(`[85%] Alignment & Dissolve: f1Opacity=${p85.frame1?.opacity}, realCardsOpacities=${JSON.stringify(p85.realCardsOpacities)}`);

    // 100%
    const p100 = await inspectAt(1.0, '08-debug-progress-100-PROJECTS-RESTING');
    console.log(`[100%] Projects Resting: overlayDisplay=${p100.overlay?.display}, realCardsOpacities=${JSON.stringify(p100.realCardsOpacities)}`);

    // Reverse Scrolling Tests
    console.log('\n=== REVERSE SCROLLING CHECKS ===');
    const r85 = await inspectAt(0.85, '09-reverse-progress-085');
    const r60 = await inspectAt(0.60, '10-reverse-progress-060');
    const r35 = await inspectAt(0.35, '11-reverse-progress-035');
    const r0 = await inspectAt(0.0, '12-reverse-progress-000-SKILLS-RESTORED');
    console.log(`[Reverse 0%] Skills Orbit Restored: opacity=${r0.orbitBadge?.opacity}, overlayDisplay=${r0.overlay?.display}`);

    // Mobile Viewport Check (390x844)
    console.log('\n=== MOBILE VIEWPORT CHECKS (390x844) ===');
    await client.setViewport(390, 844, true);
    await client.evaluate(`window.scrollTo(0, 0);`);
    await wait(1000);

    const mobileSt = await client.evaluate(`(() => {
      const st = window.ScrollTrigger ? window.ScrollTrigger.getById('skills-to-projects') : null;
      return st ? { start: st.start, end: st.end } : null;
    })()`);

    if (mobileSt) {
      const dist = mobileSt.end - mobileSt.start;
      // 0%
      await client.evaluate(`window.scrollTo(0, ${mobileSt.start});`);
      await wait(400);
      await client.captureScreenshot(path.join(VERIFY_DIR, '13-mobile-000-skills.png'));

      // 35%
      await client.evaluate(`window.scrollTo(0, ${Math.round(mobileSt.start + dist * 0.35)});`);
      await wait(400);
      await client.captureScreenshot(path.join(VERIFY_DIR, '14-mobile-035-emergence.png'));

      // 100%
      await client.evaluate(`window.scrollTo(0, ${mobileSt.end});`);
      await wait(400);
      await client.captureScreenshot(path.join(VERIFY_DIR, '15-mobile-100-projects.png'));
    }

    // Record Continuous Smooth MP4 Video at 24 FPS
    console.log('\n=== RECORDING SMOOTH MP4 VIDEO AT NORMAL SCROLLING SPEED ===');
    await client.setViewport(1440, 900);
    await client.evaluate(`window.scrollTo(0, ${start - 100});`);
    await wait(1000);

    let frameIdx = 0;
    const totalForwardFrames = 60;
    const totalReverseFrames = 60;

    // Forward smooth scroll
    for (let i = 0; i <= totalForwardFrames; i++) {
      const p = i / totalForwardFrames;
      const targetY = Math.round((start - 60) + (distance + 120) * p);
      await client.evaluate(`window.scrollTo(0, ${targetY});`);
      await wait(25);

      const fPath = path.join(FRAMES_DIR, `frame_${String(frameIdx++).padStart(4, '0')}.png`);
      await client.captureScreenshot(fPath);
    }

    // Pause at Projects resting
    for (let i = 0; i < 10; i++) {
      const fPath = path.join(FRAMES_DIR, `frame_${String(frameIdx++).padStart(4, '0')}.png`);
      await client.captureScreenshot(fPath);
    }

    // Reverse smooth scroll
    for (let i = 0; i <= totalReverseFrames; i++) {
      const p = 1.0 - (i / totalReverseFrames);
      const targetY = Math.round((start - 60) + (distance + 120) * p);
      await client.evaluate(`window.scrollTo(0, ${targetY});`);
      await wait(25);

      const fPath = path.join(FRAMES_DIR, `frame_${String(frameIdx++).padStart(4, '0')}.png`);
      await client.captureScreenshot(fPath);
    }

    // Pause at Skills resting
    for (let i = 0; i < 10; i++) {
      const fPath = path.join(FRAMES_DIR, `frame_${String(frameIdx++).padStart(4, '0')}.png`);
      await client.captureScreenshot(fPath);
    }

    console.log(`Captured ${frameIdx} frames. Compiling MP4 via ffmpeg...`);
    const outVideo = path.join(VERIFY_DIR, 'galaxy-collapse-transition.mp4');
    execSync(
      `ffmpeg -y -framerate 24 -i "${FRAMES_DIR}/frame_%04d.png" -c:v libx264 -pix_fmt yuv420p -crf 18 "${outVideo}"`,
      { stdio: 'inherit' }
    );
    console.log(`Video generated: ${outVideo}`);

    const report = {
      stInfo,
      milestones: { p0, p20, p35, p50, p60, p70, p85, p100 },
      reverse: { r85, r60, r35, r0 },
      acceptanceCriteria: {
        galaxyAndFramesCoExistAt35: p35.bothGalaxyAndFramesInViewport,
        screenshotPath: p35.screenshot,
        videoPath: outVideo,
      },
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(path.join(VERIFY_DIR, 'debug-report.json'), JSON.stringify(report, null, 2));
    console.log('\n=== VISUAL DEBUG VERIFICATION COMPLETE ===');
    console.log(`CRITICAL ACCEPTANCE CHECK PASSED: ${p35.bothGalaxyAndFramesInViewport}`);
  } catch (err) {
    console.error('Debug script error:', err);
  } finally {
    client.close();
    braveProcess.kill('SIGKILL');
  }
}

run();
