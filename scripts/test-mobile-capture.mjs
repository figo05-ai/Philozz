import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = '/home/figo/Desktop/Philo/verification/handoff-fix/mobile';
fs.mkdirSync(OUT_DIR, { recursive: true });

const brave = spawn('/usr/bin/brave-browser', [
  '--headless=new',
  '--remote-debugging-port=9291',
  '--no-sandbox',
  '--disable-gpu',
]);

await new Promise((r) => setTimeout(r, 1200));
const list = await fetch('http://127.0.0.1:9291/json').then((r) => r.json());
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
  console.log(`Saved mobile screenshot: ${filename}`);
  return filepath;
}

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
console.log('Mobile ST info:', stInfo.result.value);
const { start, totalDistance } = stInfo.result.value;

const milestones = [
  { p: 0.00, name: 'm-01-progress-000-skills.png' },
  { p: 0.35, name: 'm-02-progress-035-emergence.png' },
  { p: 0.50, name: 'm-03-progress-050-heading.png' },
  { p: 0.75, name: 'm-04-progress-075-gallery.png' },
  { p: 0.85, name: 'm-05-progress-085-settled.png' },
  { p: 0.94, name: 'm-06-progress-094-crossfade.png' },
  { p: 1.00, name: 'm-07-progress-100-cards.png' },
];

for (const m of milestones) {
  const scrollY = Math.round(start + m.p * totalDistance);
  await call('Runtime.evaluate', {
    expression: `document.documentElement.scrollTop = ${scrollY}; window.scrollTo({ top: ${scrollY}, behavior: 'instant' });`,
  });
  await new Promise((r) => setTimeout(r, 150));
  await capture(m.name);
}

brave.kill();
process.exit(0);
