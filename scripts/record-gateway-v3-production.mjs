import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve('/home/figo/Desktop/Philo/verification/gateway-v3-clean');
const FRAMES_DIR = path.join(OUT_DIR, 'recording_frames');
const OUT_MP4 = path.join(OUT_DIR, 'PHILOZZ_Golden_Gateway_V3_Production.mp4');

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
      awaitPromise: false,
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

  async captureFrame(idx) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const fPath = path.join(FRAMES_DIR, `frame_${String(idx).padStart(4, '0')}.png`);
    fs.writeFileSync(fPath, buffer);
    return fPath;
  }

  close() {
    this.ws.close();
  }
}

async function main() {
  const bravePort = 9380;
  console.log(`Launching headless Brave for production video recording on port ${bravePort}...`);
  const braveProcess = spawn(
    '/opt/brave.com/brave/brave',
    [
      '--headless=new',
      '--remote-debugging-port=' + bravePort,
      '--window-size=1920,1080',
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
    const client = new CDPClient(wsUrl);
    await client.ready();
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.setViewport(1920, 1080);

    await client.send('Page.navigate', { url: 'http://localhost:3000/?gateway=force' });
    for (let i = 0; i < 40; i++) {
      await wait(100);
      const isReady = await client.evaluate('!!window.__GATEWAY_TIMELINE');
      if (isReady) break;
    }

    await client.evaluate('(() => { window.__GATEWAY_TIMELINE?.pause(); return true; })()');

    const totalSeconds = 4.25;
    const fps = 20;
    const totalFrames = Math.round(totalSeconds * fps);
    console.log(`Capturing ${totalFrames} frames across ${totalSeconds}s...`);

    for (let i = 0; i <= totalFrames; i++) {
      const sec = (i / totalFrames) * totalSeconds;
      await client.evaluate(`(() => {
        const tl = window.__GATEWAY_TIMELINE;
        if (tl) {
          tl.seek(${sec.toFixed(3)});
          const v = document.querySelector('video');
          if (v) v.currentTime = Math.min(${sec.toFixed(3)}, 2.13);
        }
        return true;
      })()`);
      await wait(80);
      await client.captureFrame(i);
      if (i % 15 === 0) console.log(`Frame ${i}/${totalFrames} (time: ${sec.toFixed(2)}s)`);
    }

    client.close();
    console.log('Finished capturing frames. Compiling video with ffmpeg...');

    const ffmpegProc = spawn(
      'ffmpeg',
      [
        '-y',
        '-framerate',
        String(fps),
        '-i',
        path.join(FRAMES_DIR, 'frame_%04d.png'),
        '-c:v',
        'libx264',
        '-pix_fmt',
        'yuv420p',
        '-crf',
        '20',
        '-preset',
        'fast',
        OUT_MP4,
      ],
      { stdio: 'inherit' }
    );

    await new Promise((resolve, reject) => {
      ffmpegProc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited with code ${code}`));
      });
    });

    console.log(`✅ Production MP4 created successfully at: ${OUT_MP4}`);
  } finally {
    braveProcess.kill();
  }
}

main().catch((err) => {
  console.error('Recording failed:', err);
  process.exit(1);
});
