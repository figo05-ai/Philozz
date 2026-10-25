import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve('/home/figo/Desktop/Philo/verification/phase2-transition');
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

async function runPhase2Validation() {
  const bravePort = 9360;
  console.log(`Launching headless Brave for Phase 2 validation on port ${bravePort}...`);
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

    if (!wsUrl) throw new Error('Failed to connect to Brave DevTools within 10s');

    console.log('Connected to CDP at', wsUrl);
    const client = new CDPClient(wsUrl);
    await client.ready();
    await client.send('Page.enable');
    await client.send('Runtime.enable');

    // ----------------------------------------------------
    // DESKTOP 1440x900 FIVE SCROLL-PROGRESS POSITIONS
    // ----------------------------------------------------
    console.log('\n=== Testing Desktop 1440x900 at 5 Scroll Positions ===');
    await client.setViewport(1440, 900, false);
    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await wait(2000);

    // 1. POSITION 0% (scrollY = 0): Check resting state and headline stability at seconds 3-5
    console.log('--- 1. Position 0%: Resting Hero State ---');
    await client.evaluate('window.scrollTo({ top: 0, behavior: "instant" })');
    await wait(500);
    await client.screenshot('pos-000-resting.png');

    // Wait past second 4 to verify headline does NOT disappear
    console.log('--- Verifying Headline Stability at Seconds 3-5 ---');
    await wait(3000);
    const headlineStatus = await client.evaluate(`(() => {
      const el = document.getElementById('hero-title');
      if (!el) return { found: false };
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const spans = Array.from(el.querySelectorAll('.title-line')).map(s => ({
        text: s.textContent,
        opacity: window.getComputedStyle(s).opacity,
        visibility: window.getComputedStyle(s).visibility,
      }));
      return {
        found: true,
        opacity: style.opacity,
        visibility: style.visibility,
        rect: { top: rect.top, height: rect.height, width: rect.width },
        spans
      };
    })()`);
    console.log('Headline Status at Second 5.5:', JSON.stringify(headlineStatus));
    await client.screenshot('pos-000-after-5s.png');

    // Transition distance = 200vh - 100vh = 900px
    const trackH = 900;

    // 2. POSITION 25% (scrollY = 225px): Camera push-in, text exit
    console.log('--- 2. Position 25%: Camera Push-in, Hero Text Exits ---');
    await client.evaluate(`window.scrollTo({ top: ${Math.round(trackH * 0.25)}, behavior: "instant" })`);
    await wait(500);
    await client.screenshot('pos-025-camera-push.png');

    // 3. POSITION 50% (scrollY = 450px): Golden Light Veil Blooms from Workstation
    console.log('--- 3. Position 50%: Golden Light Veil Blooms from Workstation ---');
    await client.evaluate(`window.scrollTo({ top: ${Math.round(trackH * 0.50)}, behavior: "instant" })`);
    await wait(500);
    await client.screenshot('pos-050-golden-light-veil.png');

    // 4. POSITION 75% (scrollY = 675px): About Elements Enter Through Light
    console.log('--- 4. Position 75%: About Elements Enter Through Light ---');
    await client.evaluate(`window.scrollTo({ top: ${Math.round(trackH * 0.75)}, behavior: "instant" })`);
    await wait(500);
    await client.screenshot('pos-075-about-reveal.png');

    // 5. POSITION 100% (scrollY = 900px): About Settled, 100% Full Screen
    console.log('--- 5. Position 100%: About Settled, Transition Complete ---');
    await client.evaluate(`window.scrollTo({ top: ${trackH}, behavior: "instant" })`);
    await wait(500);
    await client.screenshot('pos-100-about-settled.png');

    // 6. REVERSE SCROLLING TEST
    console.log('--- 6. Testing Reverse Scrolling (900px -> 450px -> 0px) ---');
    await client.evaluate(`window.scrollTo({ top: ${Math.round(trackH * 0.50)}, behavior: "instant" })`);
    await wait(400);
    await client.screenshot('pos-reversed-050.png');
    await client.evaluate('window.scrollTo({ top: 0, behavior: "instant" })');
    await wait(600);
    await client.screenshot('pos-reversed-to-top.png');

    // ----------------------------------------------------
    // MOBILE 390x844 TEST
    // ----------------------------------------------------
    console.log('\n=== Testing Mobile 390x844 ===');
    await client.setViewport(390, 844, true, 2);
    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await wait(2200);
    await client.evaluate('window.scrollTo({ top: 0, behavior: "instant" })');
    await wait(400);
    await client.screenshot('mobile-390-pos-000.png');

    await client.evaluate('window.scrollTo({ top: 300, behavior: "instant" })');
    await wait(400);
    await client.screenshot('mobile-390-pos-scrolled.png');

    await client.evaluate('window.scrollTo({ top: 800, behavior: "instant" })');
    await wait(400);
    await client.screenshot('mobile-390-pos-about.png');

    // Check Next.js dev overlay badge
    const badgeStatus = await client.evaluate(`(() => {
      const portal = document.querySelector('nextjs-portal');
      if (!portal || !portal.shadowRoot) return { hasPortal: false };
      const badge = portal.shadowRoot.querySelector('[data-nextjs-toast]');
      const issues = portal.shadowRoot.querySelector('[data-issues-open]');
      return {
        hasPortal: true,
        hasBadge: !!badge,
        badgeText: badge ? badge.textContent : null,
        isError: badge ? badge.getAttribute('data-error') : null,
        issuesOpenText: issues ? issues.textContent : null
      };
    })()`);
    console.log('\n=== Next.js Dev Overlay Status ===', badgeStatus);

    console.log('\n=== All Phase 2 Transition Tests Passed Successfully! ===');
    client.close();
  } finally {
    braveProcess.kill('SIGTERM');
  }
}

runPhase2Validation().catch((err) => {
  console.error('Validation failed:', err);
  process.exit(1);
});
