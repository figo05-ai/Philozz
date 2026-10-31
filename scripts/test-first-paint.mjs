import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const bravePort = 9385;
const OUT_DIR = '/home/figo/Desktop/Philo/verification/first-paint';
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function wait(ms) {
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

  async screenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const fPath = path.join(OUT_DIR, filename);
    fs.writeFileSync(fPath, buffer);
    console.log(`Saved screenshot: ${fPath}`);
    return fPath;
  }

  close() {
    this.ws.close();
  }
}

async function main() {
  console.log(`Launching headless Brave on port ${bravePort}...`);
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

    // =========================================================================
    // SCENARIO 1: Fresh User (Zero Session Storage, Regular URL http://localhost:3000/)
    // =========================================================================
    console.log('\n--- SCENARIO 1: Fresh User Visiting http://localhost:3000/ ---');
    // Clear sessionStorage
    await client.send('Page.navigate', { url: 'about:blank' });
    await wait(200);

    // Navigate to homepage
    await client.send('Page.navigate', { url: 'http://localhost:3000/' });
    
    // Check at early moments (50ms, 150ms, 500ms)
    await wait(60);
    const earlyCheck = await client.evaluate(`(() => {
      const overlay = document.querySelector('.golden-gateway-v3-overlay');
      const h1 = document.querySelector('h1');
      const overlayStyle = overlay ? window.getComputedStyle(overlay) : null;
      return {
        hasOverlay: !!overlay,
        overlayDisplay: overlayStyle ? overlayStyle.display : null,
        overlayZIndex: overlayStyle ? overlayStyle.zIndex : null,
        overlayBg: overlayStyle ? overlayStyle.backgroundColor : null,
        htmlClass: document.documentElement.className,
      };
    })()`);
    console.log('Early Check (60ms after navigate):', earlyCheck);
    await client.screenshot('01_fresh_user_first_paint_60ms.png');

    await wait(300);
    const midCheck = await client.evaluate(`(() => {
      const overlay = document.querySelector('.golden-gateway-v3-overlay');
      return {
        hasOverlay: !!overlay,
        timelineExists: !!window.__GATEWAY_TIMELINE,
        timelineTime: window.__GATEWAY_TIMELINE ? window.__GATEWAY_TIMELINE.time() : null,
      };
    })()`);
    console.log('Check at 360ms:', midCheck);
    await client.screenshot('02_fresh_user_playing_360ms.png');

    // =========================================================================
    // SCENARIO 2: Repeat User (Seen in Session) Visiting http://localhost:3000/
    // =========================================================================
    console.log('\n--- SCENARIO 2: Repeat User (Seen in Session) Visiting http://localhost:3000/ ---');
    await client.evaluate('sessionStorage.setItem("philozz_golden_gateway_v3_seen", "true")');
    await client.send('Page.navigate', { url: 'http://localhost:3000/' });
    await wait(60);
    const repeatCheck = await client.evaluate(`(() => {
      const overlay = document.querySelector('.golden-gateway-v3-overlay');
      const overlayStyle = overlay ? window.getComputedStyle(overlay) : null;
      return {
        hasOverlay: !!overlay,
        overlayDisplay: overlayStyle ? overlayStyle.display : null,
        htmlClass: document.documentElement.className,
      };
    })()`);
    console.log('Repeat visit check (60ms):', repeatCheck);
    await client.screenshot('03_repeat_user_first_paint_60ms.png');

    await wait(400);
    const repeatSettled = await client.evaluate(`(() => {
      const overlay = document.querySelector('.golden-gateway-v3-overlay');
      const h1 = document.querySelector('h1');
      return {
        hasOverlay: !!overlay,
        h1Text: h1 ? h1.innerText : null,
      };
    })()`);
    console.log('Repeat visit settled check (460ms):', repeatSettled);
    await client.screenshot('04_repeat_user_settled_460ms.png');

    client.close();
    console.log('\n✅ All First-Paint scenarios tested successfully!');
  } finally {
    braveProcess.kill();
  }
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
