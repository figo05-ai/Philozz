import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = '/home/figo/Desktop/Philo/verification/spatial-continuity';
fs.mkdirSync(OUT_DIR, { recursive: true });

const brave = spawn('/usr/bin/brave-browser', [
  '--headless=new',
  '--remote-debugging-port=9295',
  '--no-sandbox',
  '--disable-gpu',
]);

await new Promise((r) => setTimeout(r, 1200));
const list = await fetch('http://127.0.0.1:9295/json').then((r) => r.json());
const ws = new WebSocket(list[0].webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));

let id = 1;
function call(method, params = {}) {
  return new Promise((resolve) => {
    const msgId = id++;
    const handler = (e) => {
      const data = JSON.parse(e.data);
      if (data.id === msgId) {
        ws.removeEventListener('message', handler);
        resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
}

async function setViewport(width, height, isMobile = false) {
  await call('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: isMobile,
  });
}

async function capture(filename) {
  const res = await call('Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(res.data, 'base64');
  const filepath = path.join(OUT_DIR, filename);
  fs.writeFileSync(filepath, buf);
  return filepath;
}

await setViewport(1440, 900);
await call('Page.navigate', { url: 'http://localhost:3000' });
await new Promise((r) => setTimeout(r, 2500));

// Wait for ScrollTrigger to be ready
let ready = false;
for (let i = 0; i < 20; i++) {
  const check = await call('Runtime.evaluate', {
    expression: '!!(window.ScrollTrigger && window.ScrollTrigger.getById("skills-to-projects"))',
    returnByValue: true,
  });
  if (check.result.value) {
    ready = true;
    break;
  }
  await new Promise((r) => setTimeout(r, 300));
}
console.log('ScrollTrigger ready:', ready);

const triggerInfo = await call('Runtime.evaluate', {
  expression: `(() => {
    const st = window.ScrollTrigger.getById("skills-to-projects");
    return st ? { start: st.start, end: st.end, totalDistance: st.end - st.start } : null;
  })()`,
  returnByValue: true,
});
console.log('Trigger info:', JSON.stringify(triggerInfo.result.value, null, 2));

const { start, end, totalDistance } = triggerInfo.result.value;

async function scrollToProgress(p) {
  const scrollY = Math.round(start + p * totalDistance);
  await call('Runtime.evaluate', {
    expression: `document.documentElement.scrollTop = ${scrollY}; window.scrollTo({ top: ${scrollY}, behavior: 'instant' });`,
  });
  await new Promise((r) => setTimeout(r, 120));
  return scrollY;
}

async function getMetrics() {
  const res = await call('Runtime.evaluate', {
    expression: `(() => {
      const getR = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          top: Math.round(r.top),
          bottom: Math.round(r.bottom),
          left: Math.round(r.left),
          right: Math.round(r.right),
          width: Math.round(r.width),
          height: Math.round(r.height),
          opacity: parseFloat(window.getComputedStyle(el).opacity),
          inViewport: r.bottom > 0 && r.top < window.innerHeight,
        };
      };

      const st = window.ScrollTrigger.getById("skills-to-projects");

      return {
        progress: st ? parseFloat(st.progress.toFixed(4)) : 0,
        scrollY: window.scrollY,
        orbitStage: getR('.tech-orbit-stage'),
        orbitBadge: getR('.orbit-center-badge'),
        heading: getR('.projects-header-wrapper'),
        galleryWrapper: getR('.projects-gallery-wrapper'),
        frame1: getR('.transition-wireframe-frame.frame-1'),
        frame2: getR('.transition-wireframe-frame.frame-2'),
        frame3: getR('.transition-wireframe-frame.frame-3'),
        realCard1: getR('.gallery-project-card[data-project-index="1"]'),
        realCard2: getR('.gallery-project-card[data-project-index="2"]'),
        realCard3: getR('.gallery-project-card[data-project-index="3"]'),
      };
    })()`,
    returnByValue: true,
  });
  return res.result.value;
}

const milestones = {};

// 1. Galaxy visibly collapsing (p = 0.20)
await scrollToProgress(0.20);
milestones.collapse = await getMetrics();
await capture('01-galaxy-visibly-collapsing.png');
console.log('Milestone 1 captured (Galaxy visibly collapsing):', {
  orbitBadge: milestones.collapse.orbitBadge,
  progress: milestones.collapse.progress,
});

// 2. Three project frames emerging from PHILOZZ center (p = 0.35)
await scrollToProgress(0.35);
milestones.emergence = await getMetrics();
await capture('02-three-frames-emerging.png');
console.log('Milestone 2 captured (Three frames emerging):', {
  orbitBadge: milestones.emergence.orbitBadge,
  frame1: milestones.emergence.frame1,
  frame2: milestones.emergence.frame2,
  frame3: milestones.emergence.frame3,
});

// 3. Three frames clearly separated in perspective (p = 0.55)
await scrollToProgress(0.55);
milestones.perspective = await getMetrics();
await capture('03-frames-separated-perspective.png');
console.log('Milestone 3 captured (Perspective separation & heading avoidance):', {
  heading: milestones.perspective.heading,
  frame1: milestones.perspective.frame1,
  frame2: milestones.perspective.frame2,
  frame3: milestones.perspective.frame3,
});

// 4. Frames approaching their exact project card positions (p = 0.78)
await scrollToProgress(0.78);
milestones.approach = await getMetrics();
await capture('04-frames-approaching-cards.png');
console.log('Milestone 4 captured (Frames approaching cards):', {
  frame1Top: milestones.approach.frame1?.top,
  galleryTop: milestones.approach.galleryWrapper?.top,
});

// 5. Temporary frames and real cards visually matching during handoff (p = 0.90)
await scrollToProgress(0.90);
milestones.handoff = await getMetrics();
await capture('05-visual-geometry-handoff.png');
console.log('Milestone 5 captured (Handoff alignment):', {
  frame1: milestones.handoff.frame1,
  realCard1: milestones.handoff.realCard1,
});

// 6. Fully settled Projects Gallery (p = 1.0)
await scrollToProgress(1.0);
milestones.settled = await getMetrics();
await capture('06-projects-gallery-settled.png');
console.log('Milestone 6 captured (Settled projects gallery):', {
  realCard1: milestones.settled.realCard1,
});

// Capture video frames for smooth video recording (forward & reverse scroll)
console.log('Recording video frames (forward and reverse)...');
const VIDEO_FRAMES_DIR = path.join(OUT_DIR, 'frames');
fs.mkdirSync(VIDEO_FRAMES_DIR, { recursive: true });

let frameIdx = 0;
// Forward scroll: 0.00 -> 1.00 in 60 steps
for (let p = 0; p <= 1.0; p += 0.0166) {
  await scrollToProgress(p);
  const screenshot = await call('Page.captureScreenshot', { format: 'png' });
  const filename = path.join(VIDEO_FRAMES_DIR, `frame_${String(frameIdx++).padStart(4, '0')}.png`);
  fs.writeFileSync(filename, Buffer.from(screenshot.data, 'base64'));
}
// Pause at end
for (let i = 0; i < 12; i++) {
  const screenshot = await call('Page.captureScreenshot', { format: 'png' });
  const filename = path.join(VIDEO_FRAMES_DIR, `frame_${String(frameIdx++).padStart(4, '0')}.png`);
  fs.writeFileSync(filename, Buffer.from(screenshot.data, 'base64'));
}
// Reverse scroll: 1.00 -> 0.00 in 60 steps
for (let p = 1.0; p >= 0; p -= 0.0166) {
  await scrollToProgress(p);
  const screenshot = await call('Page.captureScreenshot', { format: 'png' });
  const filename = path.join(VIDEO_FRAMES_DIR, `frame_${String(frameIdx++).padStart(4, '0')}.png`);
  fs.writeFileSync(filename, Buffer.from(screenshot.data, 'base64'));
}
// Pause at start (Skills restored)
for (let i = 0; i < 12; i++) {
  const screenshot = await call('Page.captureScreenshot', { format: 'png' });
  const filename = path.join(VIDEO_FRAMES_DIR, `frame_${String(frameIdx++).padStart(4, '0')}.png`);
  fs.writeFileSync(filename, Buffer.from(screenshot.data, 'base64'));
}

// Reverse milestone screenshot
await scrollToProgress(0);
milestones.reverseRestored = await getMetrics();
await capture('07-reverse-skills-restored.png');

// Mobile test (390x844)
console.log('Testing mobile viewport (390px)...');
await setViewport(390, 844, true);
await call('Page.navigate', { url: 'http://localhost:3000' });
await new Promise((r) => setTimeout(r, 2000));

await scrollToProgress(0.35);
await capture('08-mobile-035-emergence.png');
await scrollToProgress(0.90);
await capture('09-mobile-090-handoff.png');
await scrollToProgress(1.0);
await capture('10-mobile-100-projects.png');

fs.writeFileSync(path.join(OUT_DIR, 'spatial-continuity-report.json'), JSON.stringify(milestones, null, 2));

brave.kill();
console.log('Verification capture complete. Saved all assets to', OUT_DIR);
process.exit(0);
