import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const brave = spawn('/usr/bin/brave-browser', [
  '--headless=new',
  '--remote-debugging-port=9293',
  '--no-sandbox',
  '--disable-gpu',
]);

await new Promise((r) => setTimeout(r, 1200));
const list = await fetch('http://127.0.0.1:9293/json').then((r) => r.json());
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

await call('Emulation.setDeviceMetricsOverride', {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await call('Page.navigate', { url: 'http://localhost:3000' });
await new Promise((r) => setTimeout(r, 2500));

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

const stInfo = await call('Runtime.evaluate', {
  expression: `(() => {
    const st = window.ScrollTrigger.getById('skills-to-projects');
    return st ? { start: st.start, end: st.end, totalDistance: st.end - st.start } : null;
  })()`,
  returnByValue: true,
});
console.log('ScrollTrigger Info:', stInfo.result.value);
const { start, end, totalDistance } = stInfo.result.value;

const checkPoints = [0, 0.25, 0.35, 0.50, 0.65, 0.75, 0.80, 0.85, 0.90, 0.94, 1.0];
const results = [];

for (const p of checkPoints) {
  const scrollY = Math.round(start + p * totalDistance);
  await call('Runtime.evaluate', {
    expression: `document.documentElement.scrollTop = ${scrollY}; window.scrollTo({ top: ${scrollY}, behavior: 'instant' });`,
  });
  await new Promise((r) => setTimeout(r, 120));

  const res = await call('Runtime.evaluate', {
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
          opacity: window.getComputedStyle(el).opacity,
          display: window.getComputedStyle(el).display,
        };
      };

      const h = getR('.projects-header-wrapper');
      const f1 = getR('.transition-wireframe-frame.frame-1');
      const f2 = getR('.transition-wireframe-frame.frame-2');
      const f3 = getR('.transition-wireframe-frame.frame-3');
      const c1 = getR('.gallery-project-card[data-project-index="1"]');

      // Check vertical intersection with header
      const checkIntersection = f => {
        if (!f || !h || f.opacity === '0' || f.display === 'none') return false;
        // Intersection in 2D rectangle
        const xOverlap = Math.max(0, Math.min(f.right, h.right) - Math.max(f.left, h.left));
        const yOverlap = Math.max(0, Math.min(f.bottom, h.bottom) - Math.max(f.top, h.top));
        return (xOverlap > 0 && yOverlap > 0) ? { xOverlap, yOverlap } : false;
      };

      return {
        progress: ${p},
        scrollY: window.scrollY,
        header: h,
        frame1: f1,
        frame2: f2,
        frame3: f3,
        card1: c1,
        overlap1: checkIntersection(f1),
        overlap2: checkIntersection(f2),
        overlap3: checkIntersection(f3),
      };
    })()`,
    returnByValue: true,
  });

  results.push(res.result.value);
  const v = res.result.value;
  console.log(`p=${p.toFixed(2)} | scrollY=${v.scrollY} | H.top=${v.header?.top} H.bot=${v.header?.bottom} | F1.top=${v.frame1?.top} F1.bot=${v.frame1?.bottom} | C1.top=${v.card1?.top} | F1.op=${v.frame1?.opacity} C1.op=${v.card1?.opacity} | Overlap:`, v.overlap1 || v.overlap2 || v.overlap3 ? 'YES' : 'NONE');
}

brave.kill();
process.exit(0);
