import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const VERIFY_DIR = path.resolve('/home/figo/Desktop/Philo/verification/phase4-transition');
const FRAMES_DIR = path.resolve(VERIFY_DIR, 'frames');

if (!fs.existsSync(VERIFY_DIR)) {
  fs.mkdirSync(VERIFY_DIR, { recursive: true });
}
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

  async setViewport(width, height, isMobile = false, deviceScaleFactor = 1) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor,
      mobile: isMobile,
    });
  }

  async captureScreenshot(outputPath) {
    const res = await this.send('Page.captureScreenshot', {
      format: 'png',
      quality: 100,
    });
    fs.writeFileSync(outputPath, Buffer.from(res.data, 'base64'));
  }
}

async function main() {
  console.log('--- Phase 04: Visual & Technical Transition Verification ---');

  const brave = spawn('/usr/bin/brave-browser', [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
  ]);

  try {
    await wait(1200);
    const list = await fetch('http://127.0.0.1:9224/json').then((r) => r.json());
    const wsUrl = list[0].webSocketDebuggerUrl;
    const client = new CDPClient(wsUrl);
    await client.ready();

    // 1. DESKTOP VERIFICATION (1440x900)
    console.log('1. Setting Desktop Viewport 1440x900...');
    await client.setViewport(1440, 900, false);
    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await wait(2200);

    // Initial check of layout
    const initialInfo = await client.evaluate(`(() => {
      const hero = document.querySelector('.scene-hero-cinematic')?.getBoundingClientRect();
      const skills = document.querySelector('#skills')?.getBoundingClientRect();
      const building = document.querySelector('.comp-card-building')?.getBoundingClientRect();
      return {
        heroTop: hero?.top,
        skillsTop: skills?.top,
        buildingTop: building?.top,
        buildingLeft: building?.left
      };
    })()`);
    console.log('Initial geometry:', initialInfo);

    // Milestones definition:
    // Scroll distance from 900 to 1800
    const milestones = [
      { pct: 0, scrollY: 900, label: '000-about-resting', desc: 'Stage 01: About Resting' },
      { pct: 20, scrollY: 1080, label: '020-code-activation', desc: 'Stage 02: Code Activation' },
      { pct: 40, scrollY: 1260, label: '040-data-flow', desc: 'Stage 03: Data Flow Circuit' },
      { pct: 60, scrollY: 1440, label: '060-depth-transition', desc: 'Stage 04: Depth Transition' },
      { pct: 80, scrollY: 1620, label: '080-skills-reveal', desc: 'Stage 05: Skills Reveal' },
      { pct: 100, scrollY: 1800, label: '100-skills-resting', desc: 'Stage 06: Skills Resting' },
    ];

    for (const m of milestones) {
      console.log(`Capturing Desktop ${m.pct}% (scrollY = ${m.scrollY})... [${m.desc}]`);
      await client.evaluate(`window.scrollTo({ top: ${m.scrollY}, behavior: 'instant' })`);
      await wait(450);

      const inspection = await client.evaluate(`(() => {
        const ideBox = document.querySelector('.comp-ide-box');
        const ideCode = document.querySelector('.comp-ide-code');
        const overlay = document.querySelector('.about-skills-circuit-overlay');
        const path = document.querySelector('.about-skills-svg path:last-of-type');
        const aboutLayer = document.querySelector('.hero-about-reveal-layer');
        const skillsCol = document.querySelector('.tech-col-left');
        return {
          scrollY: window.scrollY,
          codeActivated: ideBox?.classList.contains('building-code-activated'),
          lineHighlighted: ideCode?.classList.contains('building-line-highlight'),
          overlayDisplay: overlay ? window.getComputedStyle(overlay).display : null,
          overlayOpacity: overlay ? window.getComputedStyle(overlay).opacity : null,
          pathLength: path?.getTotalLength ? path.getTotalLength() : null,
          strokeDashoffset: path?.style.strokeDashoffset,
          aboutOpacity: aboutLayer ? window.getComputedStyle(aboutLayer).opacity : null,
          aboutTransform: aboutLayer ? window.getComputedStyle(aboutLayer).transform : null,
          skillsOpacity: skillsCol ? window.getComputedStyle(skillsCol).opacity : null,
        };
      })()`);
      console.log(`  Inspection at ${m.pct}%:`, inspection);

      const screenshotPath = path.join(VERIFY_DIR, `phase4-desktop-${m.label}.png`);
      await client.captureScreenshot(screenshotPath);
    }

    // Reverse scroll check: 100% -> 0%
    console.log('Testing reverse scrolling 100% -> 0%...');
    const reverseMilestones = [
      { pct: 60, scrollY: 1440, label: 'reverse-060-depth' },
      { pct: 20, scrollY: 1080, label: 'reverse-020-activation' },
      { pct: 0, scrollY: 900, label: 'reverse-000-about-settled' },
    ];

    for (const rm of reverseMilestones) {
      console.log(`Capturing Reverse ${rm.pct}% (scrollY = ${rm.scrollY})...`);
      await client.evaluate(`window.scrollTo({ top: ${rm.scrollY}, behavior: 'instant' })`);
      await wait(450);
      const screenshotPath = path.join(VERIFY_DIR, `phase4-desktop-${rm.label}.png`);
      await client.captureScreenshot(screenshotPath);
    }

    // 2. VIDEO RECORDING OF FORWARD & REVERSE TRANSITION
    console.log('Recording video frames forward and reverse...');
    let frameIdx = 0;
    // Forward from 850 to 1850 in steps of 25px
    for (let y = 850; y <= 1850; y += 25) {
      await client.evaluate(`window.scrollTo({ top: ${y}, behavior: 'instant' })`);
      await wait(40);
      const framePath = path.join(FRAMES_DIR, `frame_${String(frameIdx++).padStart(4, '0')}.png`);
      await client.captureScreenshot(framePath);
    }
    // Pause 5 frames at 100%
    for (let p = 0; p < 6; p++) {
      const framePath = path.join(FRAMES_DIR, `frame_${String(frameIdx++).padStart(4, '0')}.png`);
      await client.captureScreenshot(framePath);
    }
    // Reverse from 1850 down to 850 in steps of 30px
    for (let y = 1850; y >= 850; y -= 30) {
      await client.evaluate(`window.scrollTo({ top: ${y}, behavior: 'instant' })`);
      await wait(40);
      const framePath = path.join(FRAMES_DIR, `frame_${String(frameIdx++).padStart(4, '0')}.png`);
      await client.captureScreenshot(framePath);
    }

    // Assemble MP4 with ffmpeg
    const videoOut = path.join(VERIFY_DIR, 'about-to-skills-transition.mp4');
    console.log('Encoding MP4 video with ffmpeg...');
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-y',
        '-framerate', '24',
        '-i', path.join(FRAMES_DIR, 'frame_%04d.png'),
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-crf', '20',
        videoOut,
      ]);
      ffmpeg.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited with code ${code}`));
      });
    });
    console.log('Video generated successfully:', videoOut);

    // 3. MOBILE VERIFICATION (390x844)
    console.log('3. Setting Mobile Viewport 390x844...');
    await client.setViewport(390, 844, true, 2);
    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await wait(2200);

    const mobilePositions = await client.evaluate(`(() => {
      const hero = document.querySelector('.scene-hero-cinematic')?.getBoundingClientRect();
      const about = document.querySelector('.hero-mobile-about-section')?.getBoundingClientRect();
      const building = document.querySelector('.comp-card-building')?.getBoundingClientRect();
      const skills = document.querySelector('#skills')?.getBoundingClientRect();
      return {
        aboutTop: about ? window.scrollY + about.top : null,
        buildingTop: building ? window.scrollY + building.top : null,
        skillsTop: skills ? window.scrollY + skills.top : null,
        scrollWidth: document.documentElement.scrollWidth,
        windowWidth: window.innerWidth
      };
    })()`);
    console.log('Mobile positions:', mobilePositions);

    // Capture mobile at About and Skills
    const mobileAboutY = Math.max(0, Math.round((mobilePositions.buildingTop || 900) - 150));
    const mobileSkillsY = Math.max(0, Math.round((mobilePositions.skillsTop || 1800) - 80));

    console.log(`Capturing Mobile About (scrollY = ${mobileAboutY})...`);
    await client.evaluate(`window.scrollTo({ top: ${mobileAboutY}, behavior: 'instant' })`);
    await wait(450);
    await client.captureScreenshot(path.join(VERIFY_DIR, 'phase4-mobile-390x844-about.png'));

    console.log(`Capturing Mobile Skills (scrollY = ${mobileSkillsY})...`);
    await client.evaluate(`window.scrollTo({ top: ${mobileSkillsY}, behavior: 'instant' })`);
    await wait(450);
    await client.captureScreenshot(path.join(VERIFY_DIR, 'phase4-mobile-390x844-skills.png'));

    // Check overflow
    const overflowCheck = await client.evaluate(`(() => {
      return {
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth
      };
    })()`);
    console.log('Mobile horizontal overflow check:', overflowCheck);

    console.log('--- Phase 04 Verification Complete ---');
  } finally {
    brave.kill();
  }
}

main().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});
