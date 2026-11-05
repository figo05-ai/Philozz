import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const PROOF_DIR = '/home/figo/.gemini/antigravity/brain/dd7d4acf-4b15-4961-96b3-585935cd6504/projects-header-fix-proof';
const FRAMES_DIR = path.join(PROOF_DIR, 'video_frames');
const OUT_VIDEO = path.join(PROOF_DIR, 'projects-header-cinematic-fix.mp4');

fs.mkdirSync(FRAMES_DIR, { recursive: true });

// Clean old frames
for (const f of fs.readdirSync(FRAMES_DIR)) {
  if (f.endsWith('.png')) fs.unlinkSync(path.join(FRAMES_DIR, f));
}

console.log('Launching Brave Browser for Header Fix Verification...');
const brave = spawn('/usr/bin/brave-browser', [
  '--headless=new',
  '--remote-debugging-port=9294',
  '--no-sandbox',
  '--disable-gpu',
]);

await new Promise((r) => setTimeout(r, 1200));
const list = await fetch('http://127.0.0.1:9294/json').then((r) => r.json());
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

async function captureScreen(filePath) {
  const res = await call('Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(res.data, 'base64');
  fs.writeFileSync(filePath, buf);
}

// 1. Initial Desktop Setup (1440x900)
await call('Emulation.setDeviceMetricsOverride', {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await call('Page.navigate', { url: 'http://localhost:3000' });
await new Promise((r) => setTimeout(r, 2500));

// Wait for ScrollTrigger
for (let i = 0; i < 25; i++) {
  const check = await call('Runtime.evaluate', {
    expression: '!!(window.ScrollTrigger && window.ScrollTrigger.getById("skills-to-projects"))',
    returnByValue: true,
  });
  if (check.result.value) break;
  await new Promise((r) => setTimeout(r, 200));
}

const stInfo = await call('Runtime.evaluate', {
  expression: `(() => {
    const st = window.ScrollTrigger.getById('skills-to-projects');
    return st ? { start: st.start, end: st.end, totalDistance: st.end - st.start } : null;
  })()`,
  returnByValue: true,
});
const { start, totalDistance } = stInfo.result.value;
console.log(`ScrollTrigger: start=${start}, totalDistance=${totalDistance}`);

// 2. Inspect Computed Styles of .projects-header-wrapper
const headerComputed = await call('Runtime.evaluate', {
  expression: `(() => {
    const el = document.querySelector('.projects-header-wrapper');
    if (!el) return null;
    const style = window.getComputedStyle(el);
    return {
      background: style.background,
      backgroundColor: style.backgroundColor,
      boxShadow: style.boxShadow,
      border: style.border,
      zIndex: style.zIndex,
      isolation: style.isolation,
      maxWidth: style.maxWidth,
      position: style.position,
    };
  })()`,
  returnByValue: true,
});
console.log('Projects Header Computed Styles:', headerComputed.result.value);

// 3. Forward Milestones & Telemetry Check
const milestones = [
  { p: 0.00, name: '00_desktop_000_skills_resting.png', desc: 'Skills resting (galaxy orbit)' },
  { p: 0.25, name: '01_desktop_025_galaxy_collapsing.png', desc: 'Galaxy collapse into PHILOZZ hub' },
  { p: 0.35, name: '02_desktop_035_frames_emerging_heading_hidden.png', desc: 'Frames emerging; header hidden' },
  { p: 0.50, name: '03_desktop_050_staging_heading_revealing.png', desc: 'Staging hold; header gracefully revealing' },
  { p: 0.65, name: '04_desktop_065_heading_crisp_frames_glide.png', desc: 'Header 100% visible; frames descending' },
  { p: 0.80, name: '05_desktop_080_frames_settled.png', desc: 'Frames settled 1:1 onto card columns' },
  { p: 0.90, name: '06_desktop_090_materialization_crossfade.png', desc: 'Telemetry dissolve & card materialization' },
  { p: 1.00, name: '07_desktop_100_projects_resting.png', desc: 'Projects resting interactive gallery' },
];

console.log('\n--- EVALUATING FORWARD SCROLL MILESTONES ---');
for (const m of milestones) {
  const scrollY = Math.round(start + m.p * totalDistance);
  await call('Runtime.evaluate', {
    expression: `document.documentElement.scrollTop = ${scrollY}; window.scrollTo({ top: ${scrollY}, behavior: 'instant' });`,
  });
  await new Promise((r) => setTimeout(r, 150));

  const telemetry = await call('Runtime.evaluate', {
    expression: `(() => {
      const getR = sel => {
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
          opacity: parseFloat(window.getComputedStyle(el).opacity).toFixed(2),
          display: window.getComputedStyle(el).display,
        };
      };

      const header = getR('.projects-header-wrapper');
      const eyebrow = getR('.projects-header-wrapper .section-tag');
      const title = getR('.projects-editorial-heading');
      const desc = getR('.projects-editorial-description');
      const f1 = getR('.transition-wireframe-frame.frame-1');
      const f2 = getR('.transition-wireframe-frame.frame-2');
      const f3 = getR('.transition-wireframe-frame.frame-3');
      const c1 = getR('.gallery-project-card[data-project-index="1"]');

      const checkOverlap = f => {
        if (!f || !header || f.opacity === '0' || f.display === 'none') return false;
        const xOverlap = Math.max(0, Math.min(f.right, header.right) - Math.max(f.left, header.left));
        const yOverlap = Math.max(0, Math.min(f.bottom, header.bottom) - Math.max(f.top, header.top));
        return (xOverlap > 0 && yOverlap > 0);
      };

      return {
        header,
        eyebrow,
        title,
        desc,
        f1,
        f2,
        f3,
        c1,
        overlap: checkOverlap(f1) || checkOverlap(f2) || checkOverlap(f3),
      };
    })()`,
    returnByValue: true,
  });

  const t = telemetry.result.value;
  console.log(`[p=${m.p.toFixed(2)}] ${m.desc}`);
  console.log(`  Header Elements Opacity -> eyebrow: ${t.eyebrow?.opacity}, title: ${t.title?.opacity}, desc: ${t.desc?.opacity}`);
  console.log(`  Frames Opacity -> f1: ${t.f1?.opacity}, f2: ${t.f2?.opacity}, f3: ${t.f3?.opacity} | Real Card Opacity: ${t.c1?.opacity}`);
  console.log(`  Header Box: top=${t.header?.top}, bottom=${t.header?.bottom} | Overlap with frames: ${t.overlap ? 'COLLISION' : 'NONE (SAFE)'}`);

  await captureScreen(path.join(PROOF_DIR, m.name));
}

// 4. Reverse Scroll Check (1.0 -> 0.0)
console.log('\n--- TESTING REVERSE SCROLL ---');
for (const p of [0.75, 0.50, 0.30, 0.00]) {
  const scrollY = Math.round(start + p * totalDistance);
  await call('Runtime.evaluate', {
    expression: `document.documentElement.scrollTop = ${scrollY}; window.scrollTo({ top: ${scrollY}, behavior: 'instant' });`,
  });
  await new Promise((r) => setTimeout(r, 120));
}
// Scroll slightly above start to trigger onLeaveBack
const aboveStart = Math.max(0, start - 150);
await call('Runtime.evaluate', {
  expression: `document.documentElement.scrollTop = ${aboveStart}; window.scrollTo({ top: ${aboveStart}, behavior: 'instant' });`,
});
await new Promise((r) => setTimeout(r, 200));

const restoredCheck = await call('Runtime.evaluate', {
  expression: `(() => {
    const orbit = document.querySelector('.tech-orbit-stage');
    const badge = document.querySelector('.orbit-center-badge');
    return {
      orbitOpacity: orbit ? window.getComputedStyle(orbit).opacity : null,
      badgeOpacity: badge ? window.getComputedStyle(badge).opacity : null,
    };
  })()`,
  returnByValue: true,
});
console.log('Reverse to Skills Orbit Restoration:', restoredCheck.result.value);
await captureScreen(path.join(PROOF_DIR, '08_desktop_reverse_back_to_skills.png'));

// 5. Mobile Emulation (390x844 iPhone 14)
console.log('\n--- TESTING MOBILE RESPONSIVE (390x844) ---');
await call('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  mobile: true,
});
await call('Runtime.evaluate', {
  expression: `window.ScrollTrigger && window.ScrollTrigger.refresh();`,
});
await new Promise((r) => setTimeout(r, 800));

const stInfoMobile = await call('Runtime.evaluate', {
  expression: `(() => {
    const st = window.ScrollTrigger.getById('skills-to-projects');
    return st ? { start: st.start, end: st.end, totalDistance: st.end - st.start } : null;
  })()`,
  returnByValue: true,
});
const mStart = stInfoMobile.result.value.start;
const mDist = stInfoMobile.result.value.totalDistance;

// Mobile p=0.55 (staging / header reveal)
const mScroll55 = Math.round(mStart + 0.55 * mDist);
await call('Runtime.evaluate', {
  expression: `document.documentElement.scrollTop = ${mScroll55}; window.scrollTo({ top: ${mScroll55}, behavior: 'instant' });`,
});
await new Promise((r) => setTimeout(r, 200));
await captureScreen(path.join(PROOF_DIR, '09_mobile_390_transition_staging.png'));

// Mobile p=1.00 (resting)
const mScroll100 = Math.round(mStart + 1.00 * mDist);
await call('Runtime.evaluate', {
  expression: `document.documentElement.scrollTop = ${mScroll100}; window.scrollTo({ top: ${mScroll100}, behavior: 'instant' });`,
});
await new Promise((r) => setTimeout(r, 200));
await captureScreen(path.join(PROOF_DIR, '10_mobile_390_projects_resting.png'));

// 6. Record Smooth Video Sequence (Forward & Reverse)
console.log('\n--- RECORDING HIGH-FRAMERATE VIDEO FRAMES ---');
// Switch back to desktop
await call('Emulation.setDeviceMetricsOverride', {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await call('Runtime.evaluate', {
  expression: `window.ScrollTrigger && window.ScrollTrigger.refresh();`,
});
await new Promise((r) => setTimeout(r, 500));

let frameIdx = 0;
async function captureVideoFrame() {
  const res = await call('Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(res.data, 'base64');
  const filename = `frame_${String(frameIdx++).padStart(4, '0')}.png`;
  fs.writeFileSync(path.join(FRAMES_DIR, filename), buf);
}

const numSteps = 40;
console.log('Recording forward sequence...');
for (let i = 0; i <= numSteps; i++) {
  const p = i / numSteps;
  const scrollY = Math.round(start + p * totalDistance);
  await call('Runtime.evaluate', {
    expression: `document.documentElement.scrollTop = ${scrollY}; window.scrollTo({ top: ${scrollY}, behavior: 'instant' });`,
  });
  await new Promise((r) => setTimeout(r, 70));
  await captureVideoFrame();
}

console.log('Recording resting hold...');
for (let i = 0; i < 8; i++) {
  await captureVideoFrame();
}

console.log('Recording reverse sequence...');
for (let i = numSteps; i >= 0; i--) {
  const p = i / numSteps;
  const scrollY = Math.round(start + p * totalDistance);
  await call('Runtime.evaluate', {
    expression: `document.documentElement.scrollTop = ${scrollY}; window.scrollTo({ top: ${scrollY}, behavior: 'instant' });`,
  });
  await new Promise((r) => setTimeout(r, 70));
  await captureVideoFrame();
}

console.log('Recording initial skills hold...');
for (let i = 0; i < 8; i++) {
  await captureVideoFrame();
}

brave.kill();
console.log(`Captured ${frameIdx} video frames.`);

// 7. Compile Video via FFmpeg
console.log('Compiling video with ffmpeg...');
const ffmpeg = spawn('/usr/bin/ffmpeg', [
  '-y',
  '-framerate', '24',
  '-i', path.join(FRAMES_DIR, 'frame_%04d.png'),
  '-c:v', 'libx264',
  '-profile:v', 'high',
  '-crf', '18',
  '-pix_fmt', 'yuv420p',
  OUT_VIDEO,
]);

ffmpeg.on('close', (code) => {
  if (code === 0) {
    console.log(`Video created successfully: ${OUT_VIDEO}`);
  } else {
    console.error(`FFmpeg failed with code ${code}`);
  }
  process.exit(code);
});
