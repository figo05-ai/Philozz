import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const FRAMES_DIR = path.resolve('/home/figo/Desktop/Philo/verification/phase2-transition/frames');
const OUT_VIDEO = path.resolve('/home/figo/Desktop/Philo/verification/phase2-transition/hero-to-about-transition.mp4');

if (!fs.existsSync(FRAMES_DIR)) {
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
}

// Clean old frames
const oldFiles = fs.readdirSync(FRAMES_DIR);
for (const f of oldFiles) {
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

  async setViewport(width, height) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    });
  }

  async captureFrame(frameIndex) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const filename = `frame_${String(frameIndex).padStart(4, '0')}.png`;
    const outPath = path.join(FRAMES_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    return outPath;
  }

  close() {
    this.ws.close();
  }
}

async function recordTransition() {
  const bravePort = 9362;
  console.log(`Launching headless Brave for video recording on port ${bravePort}...`);
  const braveProcess = spawn(
    '/opt/brave.com/brave/brave',
    [
      '--headless=new',
      '--enable-webgl',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--ignore-gpu-blocklist',
      `--remote-debugging-port=${bravePort}`,
      '--window-size=1440,900',
      '--no-sandbox',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  try {
    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
      await wait(300);
      try {
        const res = await fetch(`http://127.0.0.1:${bravePort}/json`);
        if (res.ok) {
          const list = await res.json();
          const page = list.find((t) => t.type === 'page');
          if (page && page.webSocketDebuggerUrl) {
            wsUrl = page.webSocketDebuggerUrl;
            break;
          }
        }
      } catch {}
    }

    if (!wsUrl) throw new Error('Failed to connect to Brave DevTools within 10s');

    console.log('Connected to CDP at', wsUrl);
    const client = new CDPClient(wsUrl);
    await client.ready();
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.setViewport(1440, 900);
    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await wait(2500);

    let frameIdx = 0;
    const maxScroll = 900;
    const totalSteps = 24;

    console.log('Recording forward transition (0px -> 900px)...');
    for (let i = 0; i <= totalSteps; i++) {
      const scrollPos = Math.round((i / totalSteps) * maxScroll);
      await client.evaluate(`window.scrollTo({ top: ${scrollPos}, behavior: "instant" })`);
      await wait(100);
      await client.captureFrame(frameIdx++);
    }

    // Pause 5 frames at 100%
    for (let p = 0; p < 5; p++) {
      await client.captureFrame(frameIdx++);
    }

    console.log('Recording reverse transition (900px -> 0px)...');
    for (let i = totalSteps; i >= 0; i--) {
      const scrollPos = Math.round((i / totalSteps) * maxScroll);
      await client.evaluate(`window.scrollTo({ top: ${scrollPos}, behavior: "instant" })`);
      await wait(100);
      await client.captureFrame(frameIdx++);
    }

    // Pause 5 frames at 0%
    for (let p = 0; p < 5; p++) {
      await client.captureFrame(frameIdx++);
    }

    client.close();
    console.log(`Captured ${frameIdx} frames. Encoding MP4 video with ffmpeg...`);

    const ffmpegProc = spawn(
      'ffmpeg',
      [
        '-y',
        '-framerate',
        '12',
        '-i',
        path.join(FRAMES_DIR, 'frame_%04d.png'),
        '-c:v',
        'libx264',
        '-pix_fmt',
        'yuv420p',
        '-crf',
        '22',
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

    console.log(`Video created successfully: ${OUT_VIDEO}`);
  } finally {
    braveProcess.kill('SIGTERM');
  }
}

recordTransition().catch((err) => {
  console.error('Recording failed:', err);
  process.exit(1);
});
