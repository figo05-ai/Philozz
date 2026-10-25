import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = '/home/figo/Desktop/Philo/verification/handoff-fix';
fs.mkdirSync(OUT_DIR, { recursive: true });

const brave = spawn('/usr/bin/brave-browser', [
  '--headless=new',
  '--remote-debugging-port=9292',
  '--no-sandbox',
  '--disable-gpu',
]);

await new Promise((r) => setTimeout(r, 1200));
const list = await fetch('http://127.0.0.1:9292/json').then((r) => r.json());
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

async function capture(filename) {
  const res = await call('Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(res.data, 'base64');
  const filepath = path.join(OUT_DIR, filename);
  fs.writeFileSync(filepath, buf);
  console.log(`Saved screenshot: ${filename}`);
  return filepath;
}

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
    expression: '!!(window.ScrollTrigger && window.ScrollTrigger.getById("skills-to-projects"))',
    returnByValue: true,
  });
  if (check.result.value) break;
  await new Promise((r) => setTimeout(r, 300));
}

const stInfo = await call('Runtime.evaluate', {
  expression: `(() => {
    const st = window.ScrollTrigger.getById('skills-to-projects');
    return st ? { start: st.start, end: st.end, totalDistance: st.end - st.start } : null;
  })()`,
  returnByValue: true,
});
const { start, totalDistance } = stInfo.result.value;

const milestones = [
  { p: 0.00, name: '01-progress-000-skills-resting.png' },
  { p: 0.25, name: '02-progress-025-galaxy-collapse.png' },
  { p: 0.35, name: '03-progress-035-three-frames-emerging.png' },
  { p: 0.50, name: '04-progress-050-heading-completely-clear.png' },
  { p: 0.65, name: '05-progress-065-heading-unobstructed.png' },
  { p: 0.75, name: '06-progress-075-gallery-entering.png' },
  { p: 0.82, name: '07-progress-082-frames-settled-1to1.png' },
  { p: 0.88, name: '08-progress-088-seamless-crossfade.png' },
  { p: 0.94, name: '09-progress-094-handoff-complete.png' },
  { p: 1.00, name: '10-progress-100-projects-interactive.png' },
];

for (const m of milestones) {
  const scrollY = Math.round(start + m.p * totalDistance);
  await call('Runtime.evaluate', {
    expression: `document.documentElement.scrollTop = ${scrollY}; window.scrollTo({ top: ${scrollY}, behavior: 'instant' });`,
  });
  await new Promise((r) => setTimeout(r, 150));
  await capture(m.name);
}

// Test reverse scroll back to 0.00
const scrollY0 = Math.round(start);
await call('Runtime.evaluate', {
  expression: `document.documentElement.scrollTop = ${scrollY0}; window.scrollTo({ top: ${scrollY0}, behavior: 'instant' });`,
});
await new Promise((r) => setTimeout(r, 200));
await capture('11-reverse-progress-000-skills-restored.png');

brave.kill();
process.exit(0);
