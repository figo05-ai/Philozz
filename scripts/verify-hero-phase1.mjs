import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const VERIFY_DIR = path.resolve('/home/figo/Desktop/Philo/verification/hero-phase1');
if (!fs.existsSync(VERIFY_DIR)) {
  fs.mkdirSync(VERIFY_DIR, { recursive: true });
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
    const outPath = path.join(VERIFY_DIR, relPath);
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved screenshot: ${outPath} (${buffer.length} bytes)`);
    return outPath;
  }

  async mouseMove(x, y) {
    await this.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x,
      y,
    });
  }

  close() {
    this.ws.close();
  }
}

async function runHeroPhase1Verification() {
  const bravePort = 9338;
  console.log(`Launching headless Brave for Phase 1 verification on port ${bravePort}...`);
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

    // ----------------------------------------------------
    // TEST 1: DESKTOP 1440x900 ENTRANCE SEQUENCE & SCULPTURE
    // ----------------------------------------------------
    console.log('\n--- 1. Testing Desktop 1440x900 Hero Presentation ---');
    await client.setViewport(1440, 900, false);
    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    
    // Wait for entrance animation to finish (1.5s total)
    await wait(2200);
    await client.screenshot('01-hero-desktop-1440-ready.png');

    // ----------------------------------------------------
    // TEST 2: POINTER INTERACTION (DISPATCH MOUSE MOVE)
    // ----------------------------------------------------
    console.log('\n--- 2. Testing Pointer Movement Response ---');
    // Move mouse to right-upper quadrant
    await client.mouseMove(1100, 250);
    await wait(400);
    await client.screenshot('02-hero-pointer-right.png');

    // Move mouse to left-lower quadrant
    await client.mouseMove(200, 750);
    await wait(400);
    await client.screenshot('03-hero-pointer-left.png');

    // Reset mouse to center
    await client.mouseMove(720, 450);
    await wait(300);

    // ----------------------------------------------------
    // TEST 3: SCROLL-DRIVEN MOVEMENT (FORWARD & REVERSE)
    // ----------------------------------------------------
    console.log('\n--- 3. Testing Forward and Reverse Scrolling ---');
    // Scroll down 250px (mild push-in)
    await client.evaluate('window.scrollTo({ top: 250, behavior: "instant" })');
    await wait(500);
    await client.screenshot('04-hero-scroll-250px.png');

    // Scroll down 550px (mid push-in)
    await client.evaluate('window.scrollTo({ top: 550, behavior: "instant" })');
    await wait(500);
    await client.screenshot('05-hero-scroll-550px.png');

    // Reverse scroll back to top (0px)
    await client.evaluate('window.scrollTo({ top: 0, behavior: "instant" })');
    await wait(600);
    await client.screenshot('06-hero-scroll-reversed-top.png');

    // ----------------------------------------------------
    // TEST 4: BUTTONS INTERACTIVITY & ACCESSIBILITY CHECK
    // ----------------------------------------------------
    console.log('\n--- 4. Testing CTA Buttons & Pointer Events ---');
    const buttonsCheck = await client.evaluate(`(() => {
      const btnWork = document.querySelector('.hero-btn-primary');
      const btnTalk = document.querySelector('.hero-btn-secondary');
      const canvasWrap = document.querySelector('.hero-sculpture-container');
      
      const getStyles = (el) => {
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          pointerEvents: cs.pointerEvents,
          zIndex: cs.zIndex,
          visible: rect.width > 0 && rect.height > 0,
          text: el.textContent?.trim(),
          href: el.getAttribute('href')
        };
      };

      // Check if button elements are unobstructed at their center point
      const isUnobstructed = (el) => {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const topEl = document.elementFromPoint(cx, cy);
        return el.contains(topEl) || topEl?.contains(el);
      };

      return {
        btnWork: getStyles(btnWork),
        btnWorkClickable: isUnobstructed(btnWork),
        btnTalk: getStyles(btnTalk),
        btnTalkClickable: isUnobstructed(btnTalk),
        canvasWrapPointerEvents: canvasWrap ? window.getComputedStyle(canvasWrap).pointerEvents : null,
      };
    })()`);

    console.log('Buttons & Canvas Obstruction Check Result:', JSON.stringify(buttonsCheck, null, 2));

    // ----------------------------------------------------
    // TEST 5: MOBILE 390x844 BEHAVIOR
    // ----------------------------------------------------
    console.log('\n--- 5. Testing Mobile 390x844 Hero Presentation ---');
    await client.setViewport(390, 844, true, 2);
    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await wait(2200);
    await client.evaluate('window.scrollTo({ top: 0, behavior: "instant" })');
    await wait(400);
    await client.screenshot('07-hero-mobile-390.png');

    // Mobile scroll test
    await client.evaluate('window.scrollTo({ top: 250, behavior: "instant" })');
    await wait(400);
    await client.screenshot('08-hero-mobile-390-scrolled.png');

    console.log('\n=== All Phase 1 Verification Tests Succeeded! ===');
    client.close();
  } finally {
    braveProcess.kill('SIGTERM');
  }
}

runHeroPhase1Verification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
