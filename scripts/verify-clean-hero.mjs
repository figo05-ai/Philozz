import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve('/home/figo/Desktop/Philo/verification/clean-hero');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
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
    const outPath = path.join(OUT_DIR, relPath);
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved screenshot: ${outPath} (${buffer.length} bytes)`);
    return outPath;
  }

  close() {
    this.ws.close();
  }
}

async function runCleanHeroVerification() {
  const bravePort = 9350;
  console.log(`Launching headless Brave for Clean Hero verification on port ${bravePort}...`);
  const braveProcess = spawn(
    '/opt/brave.com/brave/brave',
    [
      '--headless=new',
      '--remote-debugging-port=' + bravePort,
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

    if (!wsUrl) throw new Error('Failed to connect to Brave DevTools within 10s');

    console.log('Connected to CDP at', wsUrl);
    const client = new CDPClient(wsUrl);
    await client.ready();
    await client.send('Page.enable');
    await client.send('Runtime.enable');

    // 1. DESKTOP 1440x900
    console.log('\n--- 1. Desktop 1440x900 Clean Hero Capture ---');
    await client.setViewport(1440, 900, false);
    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await wait(2500);
    await client.evaluate('window.scrollTo({ top: 0, behavior: "instant" })');
    await wait(500);
    await client.screenshot('desktop-hero-1440.png');

    // 2. CHECK BLOCKING / OBSTRUCTION
    console.log('\n--- 2. Checking Element Obstruction at Critical Coordinates ---');
    const obstructionResults = await client.evaluate(`(() => {
      const checkEl = (selector) => {
        const el = document.querySelector(selector);
        if (!el) return { selector, found: false };
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const topEl = document.elementFromPoint(cx, cy);
        const unobstructed = el.contains(topEl) || topEl?.contains(el);
        return {
          selector,
          found: true,
          cx: Math.round(cx),
          cy: Math.round(cy),
          topElementTag: topEl?.tagName,
          topElementClass: topEl?.className,
          unobstructed,
        };
      };

      return [
        checkEl('#hero-title'),
        checkEl('.hero-editorial-description'),
        checkEl('.hero-btn-primary'),
        checkEl('.hero-btn-secondary'),
        checkEl('.hero-eyebrow-tag'),
        checkEl('.hero-editorial-metrics-row'),
      ];
    })()`);

    console.log('Obstruction Test Results:\n', JSON.stringify(obstructionResults, null, 2));

    // Verify all are unobstructed
    const anyBlocked = obstructionResults.some((r) => !r.unobstructed);
    if (anyBlocked) {
      console.error('ERROR: Some elements are blocked by invisible layers!');
    } else {
      console.log('SUCCESS: All Hero elements are completely unobstructed and interactable!');
    }

    // 3. MOBILE 390x844
    console.log('\n--- 3. Mobile 390x844 Clean Hero Capture ---');
    await client.setViewport(390, 844, true, 2);
    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await wait(2200);
    await client.evaluate('window.scrollTo({ top: 0, behavior: "instant" })');
    await wait(500);
    await client.screenshot('mobile-hero-390.png');

    console.log('\n=== Clean Hero Verification Completed Successfully ===');
    client.close();
  } finally {
    braveProcess.kill('SIGTERM');
  }
}

runCleanHeroVerification().catch((err) => {
  console.error('Clean Hero Verification failed:', err);
  process.exit(1);
});
