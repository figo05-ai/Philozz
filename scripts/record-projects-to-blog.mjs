import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACTS_DIR = '/home/figo/.gemini/antigravity/brain/57edb8e6-b535-4569-8be3-9ca13f8823ac';
const OUT_DIR = '/home/figo/Desktop/Philo/verification/projects-to-blog';
const DESKTOP_FRAMES_DIR = path.join(OUT_DIR, 'desktop_frames');
const MOBILE_FRAMES_DIR = path.join(OUT_DIR, 'mobile_frames');
const DESKTOP_VIDEO = path.join(OUT_DIR, 'projects-to-blog-desktop.mp4');
const MOBILE_VIDEO = path.join(OUT_DIR, 'projects-to-blog-mobile.mp4');

fs.mkdirSync(DESKTOP_FRAMES_DIR, { recursive: true });
fs.mkdirSync(MOBILE_FRAMES_DIR, { recursive: true });

async function recordViewport({ width, height, mobile, framesDir, outVideo }) {
  console.log(`\n========================================`);
  console.log(`Starting recording: ${width}x${height} (mobile: ${mobile})`);
  console.log(`========================================`);

  for (const f of fs.readdirSync(framesDir)) {
    if (f.endsWith('.png')) fs.unlinkSync(path.join(framesDir, f));
  }

  const port = 9294;
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

  await call('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: mobile ? 2 : 1,
    mobile,
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

  const stInfo = await call('Runtime.evaluate', {
    expression: `(() => {
      const st = window.ScrollTrigger.getById("projects-to-blog");
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
    fs.writeFileSync(path.join(framesDir, filename), buf);
  }

  const steps = 30;

  // Initial resting pause at 0%
  console.log('Capturing start resting frames (0%)...');
  const scrollY0 = Math.round(start);
  await call('Runtime.evaluate', {
    expression: `window.scrollTo({ top: ${scrollY0}, behavior: 'instant' });`,
  });
  await new Promise((r) => setTimeout(r, 200));
  for (let p = 0; p < 4; p++) await captureFrame();

  // Forward scroll 0% -> 100%
  console.log('Recording forward scroll (0% -> 100%)...');
  for (let i = 1; i <= steps; i++) {
    const p = i / steps;
    const scrollY = Math.round(start + p * totalDistance);
    await call('Runtime.evaluate', {
      expression: `window.scrollTo({ top: ${scrollY}, behavior: 'instant' });`,
    });
    await new Promise((r) => setTimeout(r, 70));
    await captureFrame();
  }

  // Resting pause at 100%
  console.log('Capturing destination resting frames (100%)...');
  for (let p = 0; p < 6; p++) await captureFrame();

  // Reverse scroll 100% -> 0%
  console.log('Recording reverse scroll (100% -> 0%)...');
  for (let i = steps - 1; i >= 0; i--) {
    const p = i / steps;
    const scrollY = Math.round(start + p * totalDistance);
    await call('Runtime.evaluate', {
      expression: `window.scrollTo({ top: ${scrollY}, behavior: 'instant' });`,
    });
    await new Promise((r) => setTimeout(r, 70));
    await captureFrame();
  }

  // Resting pause back at 0%
  console.log('Capturing restored resting frames (0%)...');
  for (let p = 0; p < 6; p++) await captureFrame();

  brave.kill();

  console.log(`Captured ${frameIdx} frames. Encoding MP4 video with ffmpeg...`);
  const ffmpegProc = spawn(
    'ffmpeg',
    [
      '-y',
      '-framerate',
      '15',
      '-i',
      path.join(framesDir, 'frame_%04d.png'),
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-crf',
      '20',
      outVideo,
    ],
    { stdio: 'inherit' }
  );

  await new Promise((resolve, reject) => {
    ffmpegProc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
  });

  console.log(`Video created successfully: ${outVideo}`);

  // Also copy to artifacts directory
  const artifactVideo = path.join(ARTIFACTS_DIR, path.basename(outVideo));
  fs.copyFileSync(outVideo, artifactVideo);

  // Generate lightweight preview GIF for artifacts
  const outGif = outVideo.replace('.mp4', '.gif');
  const artifactGif = path.join(ARTIFACTS_DIR, path.basename(outGif));
  const ffmpegGif = spawn('ffmpeg', [
    '-y',
    '-i',
    outVideo,
    '-vf',
    'fps=10,scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
    outGif,
  ]);
  await new Promise((resolve) => ffmpegGif.on('close', resolve));
  if (fs.existsSync(outGif)) {
    fs.copyFileSync(outGif, artifactGif);
    console.log(`GIF created successfully: ${outGif}`);
  }
}

// 1. Desktop Recording
await recordViewport({
  width: 1440,
  height: 900,
  mobile: false,
  framesDir: DESKTOP_FRAMES_DIR,
  outVideo: DESKTOP_VIDEO,
});

// 2. Mobile Recording
await recordViewport({
  width: 390,
  height: 844,
  mobile: true,
  framesDir: MOBILE_FRAMES_DIR,
  outVideo: MOBILE_VIDEO,
});

console.log('\nAll video recordings completed successfully!');
process.exit(0);
