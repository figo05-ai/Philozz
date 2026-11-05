import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACTS_DIR = '/home/figo/.gemini/antigravity/brain/57edb8e6-b535-4569-8be3-9ca13f8823ac';
const OUT_DIR = '/home/figo/Desktop/Philo/verification/final-polish';
const DESKTOP_FRAMES_DIR = path.join(OUT_DIR, 'desktop_frames');
const MOBILE_FRAMES_DIR = path.join(OUT_DIR, 'mobile_frames');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(DESKTOP_FRAMES_DIR, { recursive: true });
fs.mkdirSync(MOBILE_FRAMES_DIR, { recursive: true });

async function runVerification() {
  const port = 9296;
  const brave = spawn('/usr/bin/brave-browser', [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--no-sandbox',
    '--disable-gpu',
  ]);

  await new Promise((r) => setTimeout(r, 1200));
  const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
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

  async function capture(filename, framesDir = OUT_DIR) {
    const res = await call('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(res.data, 'base64');
    const filepath = path.join(framesDir, filename);
    fs.writeFileSync(filepath, buf);
    const artifactPath = path.join(ARTIFACTS_DIR, filename);
    fs.writeFileSync(artifactPath, buf);
    return filepath;
  }

  async function inspectState() {
    const res = await call('Runtime.evaluate', {
      expression: `(() => {
        const st = window.ScrollTrigger.getById('projects-to-blog');
        const overlay = document.querySelector('.projects-to-blog-transition-layer');
        const folio = document.querySelector('.manuscript-folio');
        const content = document.querySelector('.manuscript-spread');
        const realCards = Array.from(document.querySelectorAll('.projects-horizontal-gallery .gallery-project-card'));
        const blogHeader = document.querySelector('.notes-header-wrapper');
        const blogPortrait = document.querySelector('.journal-portrait-card');
        const blogArticles = Array.from(document.querySelectorAll('.journal-article-card'));

        const getStyle = (el) => el ? {
          display: window.getComputedStyle(el).display,
          opacity: Number(window.getComputedStyle(el).opacity).toFixed(3),
          visibility: window.getComputedStyle(el).visibility,
          pointerEvents: window.getComputedStyle(el).pointerEvents,
          transform: window.getComputedStyle(el).transform,
        } : null;

        const getRect = (el) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return {
            top: Math.round(r.top),
            bottom: Math.round(r.bottom),
            left: Math.round(r.left),
            right: Math.round(r.right),
            width: Math.round(r.width),
            height: Math.round(r.height)
          };
        };

        const isMobile = window.innerWidth < 1024;
        const originCard = isMobile ? (realCards[realCards.length - 1] || realCards[0]) : realCards[0];
        const notesTitle = document.getElementById('notes-title');
        const card0Link = document.querySelector('.projects-horizontal-gallery .gallery-project-card a');
        const firstArticleLink = document.querySelector('.journal-article-card');

        return {
          scrollY: Math.round(window.scrollY),
          stProgress: st ? Number(st.progress).toFixed(3) : null,
          overlayStyle: getStyle(overlay),
          folioRect: getRect(folio),
          folioOpacity: folio ? Number(window.getComputedStyle(folio).opacity).toFixed(3) : null,
          contentOpacity: content ? Number(window.getComputedStyle(content).opacity).toFixed(3) : null,
          originCardRect: getRect(originCard),
          originCardOpacity: originCard ? Number(window.getComputedStyle(originCard).opacity).toFixed(3) : null,
          blogHeaderRect: getRect(blogHeader),
          blogTitleOpacity: notesTitle ? Number(window.getComputedStyle(notesTitle).opacity).toFixed(3) : null,
          blogTitleClipPath: notesTitle ? window.getComputedStyle(notesTitle).clipPath : null,
          blogPortraitOpacity: blogPortrait ? Number(window.getComputedStyle(blogPortrait).opacity).toFixed(3) : null,
          firstArticleOpacity: blogArticles[0] ? Number(window.getComputedStyle(blogArticles[0]).opacity).toFixed(3) : null,
          card0Clickable: card0Link ? window.getComputedStyle(card0Link).pointerEvents : null,
          articleClickable: firstArticleLink ? window.getComputedStyle(firstArticleLink).pointerEvents : null,
        };
      })()`,
      returnByValue: true,
    });
    return res.result.value;
  }

  // ==========================================
  // 1. DESKTOP VERIFICATION
  // ==========================================
  console.log('\n======================================================');
  console.log('1. DESKTOP VERIFICATION (1440x900)');
  console.log('======================================================');

  await call('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await call('Page.navigate', { url: 'http://localhost:3000' });
  await new Promise((r) => setTimeout(r, 2500));

  for (let i = 0; i < 20; i++) {
    const check = await call('Runtime.evaluate', {
      expression: '!!(window.ScrollTrigger && window.ScrollTrigger.getById("projects-to-blog"))',
      returnByValue: true,
    });
    if (check.result.value) break;
    await new Promise((r) => setTimeout(r, 300));
  }

  const stInfoDesktop = await call('Runtime.evaluate', {
    expression: `(() => {
      const st = window.ScrollTrigger.getById("projects-to-blog");
      return st ? { start: st.start, end: st.end, totalDistance: st.end - st.start } : null;
    })()`,
    returnByValue: true,
  });
  const { start: dStart, totalDistance: dDist } = stInfoDesktop.result.value;
  console.log(`Desktop ScrollTrigger: start=${dStart}, end=${dStart + dDist}, distance=${dDist}`);

  const desktopMilestones = [
    { p: 0.00, file: 'desktop-polish-01-progress-000-projects-resting.png' },
    { p: 0.15, file: 'desktop-polish-02-progress-015-extraction-origin.png' },
    { p: 0.25, file: 'desktop-polish-03-progress-025-lifting-in-3d.png' },
    { p: 0.35, file: 'desktop-polish-04-progress-035-manuscript-unfolding.png' },
    { p: 0.50, file: 'desktop-polish-05-progress-050-full-spread.png' },
    { p: 0.65, file: 'desktop-polish-06-progress-065-luminous-crossfade.png' },
    { p: 0.75, file: 'desktop-polish-07-progress-075-knowledge-reveal.png' },
    { p: 1.00, file: 'desktop-polish-08-progress-100-blog-resting.png' },
    // Reverse Milestones
    { p: 0.75, reverse: true, file: 'desktop-polish-09-reverse-progress-075.png' },
    { p: 0.50, reverse: true, file: 'desktop-polish-10-reverse-progress-050.png' },
    { p: 0.25, reverse: true, file: 'desktop-polish-11-reverse-progress-025.png' },
    { p: 0.15, reverse: true, file: 'desktop-polish-12-reverse-progress-015-converged.png' },
    { p: 0.00, reverse: true, file: 'desktop-polish-13-reverse-progress-000-projects-restored.png' },
  ];

  const desktopLogs = [];
  for (const m of desktopMilestones) {
    const sy = Math.round(dStart + m.p * dDist);
    await call('Runtime.evaluate', {
      expression: `window.scrollTo({ top: ${sy}, behavior: 'instant' });`,
    });
    await new Promise((r) => setTimeout(r, 120));
    await capture(m.file);
    const state = await inspectState();
    desktopLogs.push({ milestone: m.file, p: m.p, reverse: !!m.reverse, state });
    console.log(`Captured ${m.file} (p=${m.p}, sy=${sy})`);
    console.log(`  Overlay: ${state.overlayStyle?.display}, FolioOp: ${state.folioOpacity}, BlogHdrOp: ${state.blogHeaderOpacity}, Card0Op: ${state.originCardOpacity}`);
  }

  // ==========================================
  // 2. MOBILE VERIFICATION
  // ==========================================
  console.log('\n======================================================');
  console.log('2. MOBILE VERIFICATION (390x844)');
  console.log('======================================================');

  await call('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });

  await call('Page.navigate', { url: 'http://localhost:3000' });
  await new Promise((r) => setTimeout(r, 2500));

  for (let i = 0; i < 20; i++) {
    const check = await call('Runtime.evaluate', {
      expression: '!!(window.ScrollTrigger && window.ScrollTrigger.getById("projects-to-blog"))',
      returnByValue: true,
    });
    if (check.result.value) break;
    await new Promise((r) => setTimeout(r, 300));
  }

  const stInfoMobile = await call('Runtime.evaluate', {
    expression: `(() => {
      const st = window.ScrollTrigger.getById("projects-to-blog");
      return st ? { start: st.start, end: st.end, totalDistance: st.end - st.start } : null;
    })()`,
    returnByValue: true,
  });
  const { start: mStart, totalDistance: mDist } = stInfoMobile.result.value;
  console.log(`Mobile ScrollTrigger: start=${mStart}, end=${mStart + mDist}, distance=${mDist}`);

  const mobileMilestones = [
    { p: 0.00, file: 'mobile-polish-01-progress-000-projects-resting.png' },
    { p: 0.15, file: 'mobile-polish-02-progress-015-extraction-origin.png' },
    { p: 0.25, file: 'mobile-polish-03-progress-025-lifting-in-3d.png' },
    { p: 0.35, file: 'mobile-polish-04-progress-035-manuscript-unfolding.png' },
    { p: 0.50, file: 'mobile-polish-05-progress-050-full-spread.png' },
    { p: 0.65, file: 'mobile-polish-06-progress-065-luminous-crossfade.png' },
    { p: 0.75, file: 'mobile-polish-07-progress-075-knowledge-reveal.png' },
    { p: 1.00, file: 'mobile-polish-08-progress-100-blog-resting.png' },
    // Reverse Milestones
    { p: 0.75, reverse: true, file: 'mobile-polish-09-reverse-progress-075.png' },
    { p: 0.50, reverse: true, file: 'mobile-polish-10-reverse-progress-050.png' },
    { p: 0.25, reverse: true, file: 'mobile-polish-11-reverse-progress-025.png' },
    { p: 0.15, reverse: true, file: 'mobile-polish-12-reverse-progress-015-converged.png' },
    { p: 0.00, reverse: true, file: 'mobile-polish-13-reverse-progress-000-projects-restored.png' },
  ];

  const mobileLogs = [];
  for (const m of mobileMilestones) {
    const sy = Math.round(mStart + m.p * mDist);
    await call('Runtime.evaluate', {
      expression: `window.scrollTo({ top: ${sy}, behavior: 'instant' });`,
    });
    await new Promise((r) => setTimeout(r, 120));
    await capture(m.file);
    const state = await inspectState();
    mobileLogs.push({ milestone: m.file, p: m.p, reverse: !!m.reverse, state });
    console.log(`Captured ${m.file} (p=${m.p}, sy=${sy})`);
    console.log(`  Overlay: ${state.overlayStyle?.display}, FolioOp: ${state.folioOpacity}, BlogHdrOp: ${state.blogHeaderOpacity}, Card0Op: ${state.originCardOpacity}`);
  }

  brave.kill();

  fs.writeFileSync(
    path.join(OUT_DIR, 'verification-summary.json'),
    JSON.stringify({ desktop: desktopLogs, mobile: mobileLogs }, null, 2)
  );
  console.log('\nVerification logs written to verification-summary.json');
}

await runVerification();
process.exit(0);
