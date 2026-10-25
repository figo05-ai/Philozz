import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const VERIFY_DIR = path.resolve('/home/figo/Desktop/Philo/verification/phase07-skills-to-projects');
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
  console.log('=== PHILOZZ: PHASE 07 SKILLS TO PROJECTS TRANSITION VERIFICATION ===\n');
  const port = 9280;
  const { braveProcess, wsUrl } = await launchBrowser(port);
  const client = new CDPClient(wsUrl);

  try {
    await client.ready();
    await client.send('Page.enable');
    await client.setViewport(1440, 900);

    console.log('1. Navigating to portfolio...');
    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await wait(2500);

    const results = {
      tests: {},
      telemetry: {},
    };

    // Helper to evaluate and set progress on the skills-to-projects ScrollTrigger
    const setScrollProgress = async (progress) => {
      return await client.evaluate(`(() => {
        const st = window.ScrollTrigger ? window.ScrollTrigger.getById('skills-to-projects') : null;
        if (!st) return { found: false };
        const targetScroll = Math.round(st.start + (st.end - st.start) * ${progress});
        window.scrollTo({ top: targetScroll, behavior: 'instant' });
        st.scroll(targetScroll);
        st.update();
        return {
          found: true,
          progress: st.progress,
          start: st.start,
          end: st.end,
        };
      })()`);
    };

    // -------------------------------------------------------------
    // TEST 1: Progress 0% — Skills Resting State
    // -------------------------------------------------------------
    console.log('\n2. Testing Progress 0% (Skills Resting State)...');
    await setScrollProgress(0);
    await wait(400);

    const state00 = await client.evaluate(`(() => {
      const orbit = document.querySelector('.tech-orbit-stage');
      const overlay = document.querySelector('.skills-to-projects-transition-layer');
      const cards = Array.from(document.querySelectorAll('.gallery-project-card'));
      return {
        orbitOpacity: orbit ? parseFloat(window.getComputedStyle(orbit).opacity) : 0,
        orbitScale: orbit ? window.getComputedStyle(orbit).transform : '',
        overlayDisplay: overlay ? window.getComputedStyle(overlay).display : 'none',
        cardCount: cards.length,
      };
    })()`);
    console.log('Progress 0% state:', state00);
    results.tests.progress00SkillsAtRest = state00.orbitOpacity >= 0.9 && state00.overlayDisplay === 'none';

    const shot00 = path.join(VERIFY_DIR, 'phase07-01-progress-000-skills-rest.png');
    await client.captureScreenshot(shot00);

    // -------------------------------------------------------------
    // TEST 2: Progress 20% — Orbit Begins to Recede into Depth
    // -------------------------------------------------------------
    console.log('\n3. Testing Progress 20% (Orbit Begins Receding)...');
    await setScrollProgress(0.20);
    await wait(400);

    const state20 = await client.evaluate(`(() => {
      const orbit = document.querySelector('.tech-orbit-stage');
      const overlay = document.querySelector('.skills-to-projects-transition-layer');
      return {
        orbitTransform: orbit ? window.getComputedStyle(orbit).transform : '',
        orbitOpacity: orbit ? parseFloat(window.getComputedStyle(orbit).opacity) : 0,
        overlayDisplay: overlay ? window.getComputedStyle(overlay).display : 'none',
      };
    })()`);
    console.log('Progress 20% state:', state20);
    results.tests.progress20OrbitReceding = state20.orbitOpacity > 0.5 && state20.overlayDisplay === 'none';

    const shot20 = path.join(VERIFY_DIR, 'phase07-02-progress-020-orbit-recede.png');
    await client.captureScreenshot(shot20);

    // -------------------------------------------------------------
    // TEST 3: Progress 40% — Outer Rings Settle, Visual Prominence Reduced
    // -------------------------------------------------------------
    console.log('\n4. Testing Progress 40% (Orbital Composition Diminishing)...');
    await setScrollProgress(0.40);
    await wait(400);

    const state40 = await client.evaluate(`(() => {
      const orbit = document.querySelector('.tech-orbit-stage');
      const svg = document.querySelector('.tech-orbit-svg');
      const pedestals = Array.from(document.querySelectorAll('.tech-pedestal-node'));
      return {
        orbitOpacity: orbit ? parseFloat(window.getComputedStyle(orbit).opacity) : 0,
        svgOpacity: svg ? parseFloat(window.getComputedStyle(svg).opacity) : 0,
        pedestalsDimmed: pedestals.every(p => parseFloat(window.getComputedStyle(p).opacity) <= 0.6),
      };
    })()`);
    console.log('Progress 40% state:', state40);
    results.tests.progress40RingsSettling = state40.orbitOpacity >= 0.30 && state40.orbitOpacity <= 0.90;

    const shot40 = path.join(VERIFY_DIR, 'phase07-03-progress-040-rings-settle.png');
    await client.captureScreenshot(shot40);

    // -------------------------------------------------------------
    // TEST 4: Progress 60% — 3 Rectangular Frames Emerge from Depth
    // -------------------------------------------------------------
    console.log('\n5. Testing Progress 60% (3 Rectangular Frames Emerging from Depth)...');
    await setScrollProgress(0.60);
    await wait(400);

    const state60 = await client.evaluate(`(() => {
      const overlay = document.querySelector('.skills-to-projects-transition-layer');
      const frames = Array.from(document.querySelectorAll('.transition-wireframe-frame'));
      const orbit = document.querySelector('.tech-orbit-stage');
      const cards = Array.from(document.querySelectorAll('.gallery-project-card'));
      return {
        overlayDisplay: overlay ? window.getComputedStyle(overlay).display : 'none',
        framesCount: frames.length,
        frameOpacities: frames.map(f => parseFloat(window.getComputedStyle(f).opacity)),
        frameTransforms: frames.map(f => window.getComputedStyle(f).transform),
        orbitDissolved: orbit ? parseFloat(window.getComputedStyle(orbit).opacity) <= 0.15 : true,
      };
    })()`);
    console.log('Progress 60% state:', state60);
    results.tests.progress60FramesEmerging =
      (state60.overlayDisplay === 'block' || state60.overlayDisplay === 'flex' || state60.overlayDisplay === 'grid') &&
      state60.framesCount === 3 &&
      state60.frameOpacities.every(op => op >= 0.7);

    const shot60 = path.join(VERIFY_DIR, 'phase07-04-progress-060-frames-emerging.png');
    await client.captureScreenshot(shot60);

    // -------------------------------------------------------------
    // TEST 5: Progress 80% — Frames Align, Actual HTML Cards Revealed & 0% Heading Overlap
    // -------------------------------------------------------------
    console.log('\n6. Testing Progress 80% (Visual Alignment, Card Reveal & Zero Heading Overlap)...');
    await setScrollProgress(0.80);
    await wait(400);

    const state80 = await client.evaluate(`(() => {
      const frames = Array.from(document.querySelectorAll('.transition-wireframe-frame'));
      const cards = Array.from(document.querySelectorAll('.gallery-project-card'));
      const header = document.querySelector('.projects-header-wrapper');
      const headerRect = header ? header.getBoundingClientRect() : { top: 0, bottom: 0, left: 0, right: 0 };
      
      const overlapping = frames.some(f => {
        const fOp = parseFloat(window.getComputedStyle(f).opacity);
        if (fOp <= 0.05) return false;
        const fRect = f.getBoundingClientRect();
        return !(fRect.bottom <= headerRect.top || fRect.top >= headerRect.bottom || fRect.right <= headerRect.left || fRect.left >= headerRect.right);
      });

      return {
        cardOpacities: cards.slice(0, 3).map(c => parseFloat(window.getComputedStyle(c).opacity)),
        headerOpacity: header ? parseFloat(window.getComputedStyle(header).opacity) : 0,
        framesCount: frames.length,
        hasHeaderOverlap: overlapping,
      };
    })()`);
    console.log('Progress 80% state:', state80);
    results.tests.progress80CardsRevealed =
      state80.cardOpacities.some(op => op >= 0.7) && state80.headerOpacity >= 0.8;
    results.tests.progress80NoHeadingOverlap = !state80.hasHeaderOverlap;

    const shot80 = path.join(VERIFY_DIR, 'phase07-05-progress-080-frames-align-cards-reveal.png');
    await client.captureScreenshot(shot80);

    // -------------------------------------------------------------
    // TEST 6: Progress 100% — Projects Section Fully Visible & Resting
    // -------------------------------------------------------------
    console.log('\n7. Testing Progress 100% (Projects Resting State)...');
    await setScrollProgress(1.00);
    await wait(400);

    const state100 = await client.evaluate(`(() => {
      const overlay = document.querySelector('.skills-to-projects-transition-layer');
      const cards = Array.from(document.querySelectorAll('.gallery-project-card'));
      const links = Array.from(document.querySelectorAll('.gallery-explore-btn'));
      return {
        overlayDisplay: overlay ? window.getComputedStyle(overlay).display : 'none',
        cardOpacities: cards.slice(0, 3).map(c => parseFloat(window.getComputedStyle(c).opacity)),
        linksCount: links.length,
        linksInteractive: links.every(l => window.getComputedStyle(l).pointerEvents !== 'none'),
      };
    })()`);
    console.log('Progress 100% state:', state100);
    results.tests.progress100ProjectsAtRest =
      state100.overlayDisplay === 'none' &&
      state100.cardOpacities.every(op => op >= 0.95) &&
      state100.linksInteractive;

    const shot100 = path.join(VERIFY_DIR, 'phase07-06-progress-100-projects-rest.png');
    await client.captureScreenshot(shot100);

    // -------------------------------------------------------------
    // TEST 7: Reverse Scrolling — Zero Heading Overlap, Zero Empty Frames & Pristine Skills Restoration
    // -------------------------------------------------------------
    console.log('\n8. Testing Reverse Scrolling (100% -> 0% Verification)...');
    
    // Reverse checkpoint 1: 70% (Cards fading back to frames, verify 0% heading overlap)
    await setScrollProgress(0.70);
    await wait(250);
    const reverse70 = await client.evaluate(`(() => {
      const header = document.querySelector('.projects-header-wrapper');
      const headerRect = header ? header.getBoundingClientRect() : { top: 0, bottom: 0, left: 0, right: 0 };
      const frames = Array.from(document.querySelectorAll('.transition-wireframe-frame'));
      const overlapping = frames.some(f => {
        const fOp = parseFloat(window.getComputedStyle(f).opacity);
        if (fOp <= 0.05) return false;
        const fRect = f.getBoundingClientRect();
        return !(fRect.bottom <= headerRect.top || fRect.top >= headerRect.bottom || fRect.right <= headerRect.left || fRect.left >= headerRect.right);
      });
      return { hasHeaderOverlap: overlapping };
    })()`);
    results.tests.reverse70NoHeadingOverlap = !reverse70.hasHeaderOverlap;
    const shotRev70 = path.join(VERIFY_DIR, 'phase07-07a-reverse-070.png');
    await client.captureScreenshot(shotRev70);

    // Reverse checkpoint 2: 40% (Crucial check: Skills Orbit must be visible, NO EMPTY/BLACK VOID!)
    await setScrollProgress(0.40);
    await wait(250);
    const reverse40 = await client.evaluate(`(() => {
      const orbit = document.querySelector('.tech-orbit-stage');
      const frames = Array.from(document.querySelectorAll('.transition-wireframe-frame'));
      const orbitOp = orbit ? parseFloat(window.getComputedStyle(orbit).opacity) : 0;
      const maxFrameOp = Math.max(...frames.map(f => parseFloat(window.getComputedStyle(f).opacity)), 0);
      return {
        orbitOpacity: orbitOp,
        maxFrameOpacity: maxFrameOp,
        hasVisualContinuity: orbitOp >= 0.30 || maxFrameOp >= 0.40,
      };
    })()`);
    console.log('Reverse 40% state (Visual Continuity):', reverse40);
    results.tests.reverse40VisualContinuity = reverse40.hasVisualContinuity && reverse40.orbitOpacity >= 0.30;
    const shotRev40 = path.join(VERIFY_DIR, 'phase07-07b-reverse-040.png');
    await client.captureScreenshot(shotRev40);

    // Reverse checkpoint 3: 0% (Skills completely restored to pristine rest state)
    await setScrollProgress(0.00);
    await wait(500);

    const reverseState = await client.evaluate(`(() => {
      const orbit = document.querySelector('.tech-orbit-stage');
      const pedestals = Array.from(document.querySelectorAll('.tech-pedestal-node'));
      const overlay = document.querySelector('.skills-to-projects-transition-layer');
      return {
        orbitOpacity: orbit ? parseFloat(window.getComputedStyle(orbit).opacity) : 0,
        pedestalsActive: pedestals.length === 9,
        overlayDisplay: overlay ? window.getComputedStyle(overlay).display : 'none',
      };
    })()`);
    console.log('Reverse state at 0%:', reverseState);
    results.tests.reverseScrollRestoration =
      reverseState.orbitOpacity >= 0.95 &&
      reverseState.pedestalsActive &&
      reverseState.overlayDisplay === 'none';

    const shotReverse = path.join(VERIFY_DIR, 'phase07-07-reverse-restored-skills.png');
    await client.captureScreenshot(shotReverse);

    // -------------------------------------------------------------
    // TEST 8: Mobile Adaptation (390x844) — Single-Card Perspective Reveal
    // -------------------------------------------------------------
    console.log('\n9. Testing Mobile Adaptation (390x844)...');
    await client.setViewport(390, 844, true);
    await wait(500);
    await setScrollProgress(0.60);
    await wait(300);

    const mobileState60 = await client.evaluate(`(() => {
      const overlay = document.querySelector('.skills-to-projects-transition-layer');
      const frame1 = document.querySelector('.transition-wireframe-frame.frame-1');
      const frame2 = document.querySelector('.transition-wireframe-frame.frame-2');
      const frame3 = document.querySelector('.transition-wireframe-frame.frame-3');
      const scrollWidth = document.documentElement.scrollWidth;
      return {
        scrollWidth,
        hasNoOverflow: scrollWidth <= 390,
        frame1Opacity: frame1 ? parseFloat(window.getComputedStyle(frame1).opacity) : 0,
        frame2Hidden: frame2 ? window.getComputedStyle(frame2).display === 'none' : true,
        frame3Hidden: frame3 ? window.getComputedStyle(frame3).display === 'none' : true,
      };
    })()`);
    console.log('Mobile progress 60% state:', mobileState60);
    results.tests.mobileSingleCardPerspective =
      mobileState60.hasNoOverflow &&
      mobileState60.frame1Opacity >= 0.8 &&
      mobileState60.frame2Hidden &&
      mobileState60.frame3Hidden;

    const shotMobile60 = path.join(VERIFY_DIR, 'phase07-08-mobile-progress-060.png');
    await client.captureScreenshot(shotMobile60);

    await setScrollProgress(1.00);
    await wait(300);

    const mobileState100 = await client.evaluate(`(() => {
      const cards = Array.from(document.querySelectorAll('.gallery-project-card'));
      return {
        hasNoOverflow: document.documentElement.scrollWidth <= 390,
        card1Visible: cards[0] ? parseFloat(window.getComputedStyle(cards[0]).opacity) >= 0.95 : false,
      };
    })()`);
    results.tests.mobile100Rest = mobileState100.hasNoOverflow && mobileState100.card1Visible;

    const shotMobile100 = path.join(VERIFY_DIR, 'phase07-09-mobile-progress-100.png');
    await client.captureScreenshot(shotMobile100);

    // -------------------------------------------------------------
    // TEST 9: Forward and Reverse Screen Recording (MP4)
    // -------------------------------------------------------------
    console.log('\n10. Generating Forward and Reverse Screen Recording...');
    await client.setViewport(1440, 900, false);
    await wait(400);

    let frameCount = 0;
    // Forward pass: 0% -> 100% in 25 frames
    for (let i = 0; i <= 25; i++) {
      const p = i / 25;
      await setScrollProgress(p);
      await wait(45);
      const fPath = path.join(FRAMES_DIR, `frame_${String(frameCount++).padStart(4, '0')}.png`);
      await client.captureScreenshot(fPath);
    }
    // Pause at 100% for 5 frames
    for (let i = 0; i < 5; i++) {
      const fPath = path.join(FRAMES_DIR, `frame_${String(frameCount++).padStart(4, '0')}.png`);
      await client.captureScreenshot(fPath);
    }
    // Reverse pass: 100% -> 0% in 25 frames
    for (let i = 25; i >= 0; i--) {
      const p = i / 25;
      await setScrollProgress(p);
      await wait(45);
      const fPath = path.join(FRAMES_DIR, `frame_${String(frameCount++).padStart(4, '0')}.png`);
      await client.captureScreenshot(fPath);
    }
    // Pause at 0% for 5 frames
    for (let i = 0; i < 5; i++) {
      const fPath = path.join(FRAMES_DIR, `frame_${String(frameCount++).padStart(4, '0')}.png`);
      await client.captureScreenshot(fPath);
    }

    console.log(`Captured ${frameCount} animation frames. Compiling MP4 video with ffmpeg...`);
    const mp4Path = path.join(VERIFY_DIR, 'phase07-skills-to-projects-cinematic-scroll.mp4');
    if (fs.existsSync(mp4Path)) fs.unlinkSync(mp4Path);

    await new Promise((resolve, reject) => {
      const ffmpeg = spawn('/usr/bin/ffmpeg', [
        '-y',
        '-framerate',
        '24',
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
    console.log('Video compiled successfully:', mp4Path);

    // -------------------------------------------------------------
    // Copy artifacts to brain directory
    // -------------------------------------------------------------
    console.log('\n11. Copying artifacts to brain directory...');
    const filesToCopy = [
      'phase07-01-progress-000-skills-rest.png',
      'phase07-02-progress-020-orbit-recede.png',
      'phase07-03-progress-040-rings-settle.png',
      'phase07-04-progress-060-frames-emerging.png',
      'phase07-05-progress-080-frames-align-cards-reveal.png',
      'phase07-06-progress-100-projects-rest.png',
      'phase07-07a-reverse-070.png',
      'phase07-07b-reverse-040.png',
      'phase07-07-reverse-restored-skills.png',
      'phase07-08-mobile-progress-060.png',
      'phase07-09-mobile-progress-100.png',
      'phase07-skills-to-projects-cinematic-scroll.mp4',
    ];

    for (const f of filesToCopy) {
      const src = path.join(VERIFY_DIR, f);
      const dest = path.join(ARTIFACT_DIR, f);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`Copied ${f} -> brain artifact directory`);
      }
    }

    console.log('\n=== ALL PHASE 07 VERIFICATION CHECKS COMPLETED ===');
    console.log(JSON.stringify(results.tests, null, 2));

    fs.writeFileSync(
      path.join(VERIFY_DIR, 'verification-results.json'),
      JSON.stringify(results, null, 2)
    );
  } finally {
    client.close();
    braveProcess.kill('SIGKILL');
  }
}

runVerification().catch((err) => {
  console.error('Phase 07 verification failed:', err);
  process.exit(1);
});
