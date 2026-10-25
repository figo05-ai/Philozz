import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const FIDELITY_DIR = path.resolve('/home/figo/Desktop/Philo/verification/visual-fidelity');
if (!fs.existsSync(FIDELITY_DIR)) {
  fs.mkdirSync(FIDELITY_DIR, { recursive: true });
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

  async setViewport(width, height, isMobile = false, deviceScaleFactor = 1) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor,
      mobile: isMobile,
    });
  }

  async screenshot(relPath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(FIDELITY_DIR, relPath);
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved screenshot: ${outPath} (${buffer.length} bytes)`);
    return outPath;
  }

  close() {
    this.ws.close();
  }
}

async function runFidelityCapture() {
  const bravePort = 9335;
  console.log(`Launching headless Brave on port ${bravePort}...`);
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
      } catch {
        // Retry
      }
    }

    if (!wsUrl) {
      throw new Error('Failed to connect to Brave DevTools within 10s');
    }

    console.log('Connected to CDP at', wsUrl);
    const client = new CDPClient(wsUrl);
    await client.ready();
    await client.send('Page.enable');
    await client.send('Runtime.enable');

    // 1. DESKTOP 1440x900 - HERO
    console.log('\n--- 1. Desktop 1440x900: HERO CAPTURE ---');
    await client.setViewport(1440, 900, false);
    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await wait(3000);

    // Scroll to absolute top
    await client.evaluate('window.scrollTo({ top: 0, behavior: "instant" })');
    await wait(1000);
    await client.screenshot('desktop-hero-1440.png');

    // 2. DESKTOP 1024x768 - HERO
    console.log('\n--- 2. Desktop 1024x768: HERO CAPTURE ---');
    await client.setViewport(1024, 768, false);
    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await wait(2000);
    await client.evaluate('window.scrollTo({ top: 0, behavior: "instant" })');
    await wait(800);
    await client.screenshot('desktop-hero-1024.png');

    // 3. DESKTOP 1440x900 - TECH STACK
    console.log('\n--- 3. Desktop 1440x900: TECH STACK CAPTURE ---');
    await client.setViewport(1440, 900, false);
    await client.evaluate(`
      const skillsEl = document.querySelector("#skills");
      if (skillsEl) {
        skillsEl.scrollIntoView({ behavior: "instant", block: "center" });
      }
    `);
    await wait(1500);
    await client.screenshot('desktop-tech-stack-1440.png');

    // 3. MOBILE 390x844 - HERO
    console.log('\n--- 3. Mobile 390x844: HERO CAPTURE ---');
    await client.setViewport(390, 844, true, 2);
    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await wait(2500);
    await client.evaluate('window.scrollTo({ top: 0, behavior: "instant" })');
    await wait(800);
    await client.screenshot('mobile-hero-390.png');

    // 4. MOBILE 390x844 - TECH STACK
    console.log('\n--- 4. Mobile 390x844: TECH STACK CAPTURE ---');
    await client.evaluate(`
      const skillsEl = document.querySelector("#skills");
      if (skillsEl) {
        window.scrollTo({ top: skillsEl.offsetTop - 30, behavior: "instant" });
      }
    `);
    await wait(1500);
    await client.screenshot('mobile-tech-stack-390.png');

    // 5. TABLET 768x1024 - HERO
    console.log('\n--- 5. Tablet 768x1024: HERO CAPTURE ---');
    await client.setViewport(768, 1024, false);
    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await wait(2000);
    await client.evaluate('window.scrollTo({ top: 0, behavior: "instant" })');
    await wait(800);
    await client.screenshot('tablet-hero-768.png');

    // 6. SMALL MOBILE 360x740 - HERO
    console.log('\n--- 6. Small Mobile 360x740: HERO CAPTURE ---');
    await client.setViewport(360, 740, true, 2);
    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await wait(2000);
    await client.evaluate('window.scrollTo({ top: 0, behavior: "instant" })');
    await wait(800);
    await client.screenshot('mobile-hero-360.png');

    console.log('\nAll visual-fidelity screenshots successfully captured!');
    client.close();
  } finally {
    braveProcess.kill('SIGTERM');
  }
}

runFidelityCapture().catch((err) => {
  console.error('Visual fidelity capture failed:', err);
  process.exit(1);
});
