import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = '/home/figo/Desktop/Philo/verification/handoff-fix';
const FRAMES_DIR = path.join(OUT_DIR, 'video_frames');
const OUT_VIDEO = path.join(OUT_DIR, 'skills-to-projects-handoff-final.mp4');

fs.mkdirSync(FRAMES_DIR, { recursive: true });

// Clean old frames
for (const f of fs.readdirSync(FRAMES_DIR)) {
  if (f.endsWith('.png')) fs.unlinkSync(path.join(FRAMES_DIR, f));
}

const brave = spawn('/usr/bin/brave-browser', [
  '--headless=new',
  '--remote-debugging-port=9290',
  '--no-sandbox',
  '--disable-gpu',
]);

await new Promise((r) => setTimeout(r, 1200));
const list = await fetch('http://127.0.0.1:9290/json').then((r) => r.json());
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

let frameIdx = 0;
async function captureFrame() {
  const res = await call('Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(res.data, 'base64');
  const filename = `frame_${String(frameIdx++).padStart(4, '0')}.png`;
  fs.writeFileSync(path.join(FRAMES_DIR, filename), buf);
}

const steps = 30;
console.log('Recording forward scroll (0% -> 100%)...');
for (let i = 0; i <= steps; i++) {
  const p = i / steps;
  const scrollY = Math.round(start + p * totalDistance);
  await call('Runtime.evaluate', {
    expression: `document.documentElement.scrollTop = ${scrollY}; window.scrollTo({ top: ${scrollY}, behavior: 'instant' });`,
  });
  await new Promise((r) => setTimeout(r, 80));
  await captureFrame();
}

// Pause at 100%
for (let p = 0; p < 8; p++) {
  await captureFrame();
}

console.log('Recording reverse scroll (100% -> 0%)...');
for (let i = steps; i >= 0; i--) {
  const p = i / steps;
  const scrollY = Math.round(start + p * totalDistance);
  await call('Runtime.evaluate', {
    expression: `document.documentElement.scrollTop = ${scrollY}; window.scrollTo({ top: ${scrollY}, behavior: 'instant' });`,
  });
  await new Promise((r) => setTimeout(r, 80));
  await captureFrame();
}

// Pause at 0%
for (let p = 0; p < 8; p++) {
  await captureFrame();
}

brave.kill();

console.log(`Captured ${frameIdx} frames. Encoding MP4 video with ffmpeg...`);
const ffmpegProc = spawn(
  'ffmpeg',
  [
    '-y',
    '-framerate',
    '15',
    '-i',
    path.join(FRAMES_DIR, 'frame_%04d.png'),
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-crf',
    '20',
    OUT_VIDEO,
  ],
  { stdio: 'inherit' }
);

await new Promise((resolve, reject) => {
  ffmpegProc.on('close', (code) => {
    if (code === 0) resolve();
    else reject(new Error(`ffmpeg exited with code ${code}`));
  });
});

console.log(`Video created successfully at: ${OUT_VIDEO}`);
process.exit(0);
