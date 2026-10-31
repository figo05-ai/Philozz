import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve('/home/figo/Desktop/Philo/verification/gateway-v3-clean');
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
      awaitPromise: false,
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

async function main() {
  const bravePort = 9430;
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

    // TEST 1: 1920x1080 Desktop Milestones & Mathematical Precision
    console.log('\n=== TEST 1: Desktop 1920x1080 Milestone Capture & Alignment Audit ===');
    await client.setViewport(1920, 1080, false);
    await client.send('Page.navigate', { url: 'http://localhost:3000/?gateway=force' });

    let timelineReady = false;
    for (let i = 0; i < 40; i++) {
      await wait(100);
      const isReady = await client.evaluate('!!window.__GATEWAY_TIMELINE');
      if (isReady) {
        timelineReady = true;
        break;
      }
    }
    if (!timelineReady) throw new Error('Gateway timeline failed to initialize at 1920x1080');
    console.log('Gateway timeline initialized successfully at 1920x1080');

    // Pause timeline for deterministic programmatic evaluation
    await client.evaluate('(() => { window.__GATEWAY_TIMELINE?.pause(); return true; })()');

    // Verify mathematical alignment across the entire zoom and handoff window
    for (const t of [2.10, 2.23, 2.49, 2.60, 2.89]) {
      const alignment = await client.evaluate(`(() => {
        const tl = window.__GATEWAY_TIMELINE;
        if (tl) {
          tl.seek(${t});
          const v = document.querySelector('video');
          if (v) v.currentTime = Math.min(${t}, 2.13);
        }
        const svgPath = document.querySelector('svg path[stroke="#FFFDF8"]');
        const fullLine = document.querySelector('div[style*="height: 2px"]');
        
        let svgRect = svgPath ? svgPath.getBoundingClientRect() : null;
        let lineRect = fullLine ? fullLine.getBoundingClientRect() : null;

        const svgY = svgRect ? (svgRect.top + svgRect.height / 2) : null;
        const lineY = lineRect ? (lineRect.top + lineRect.height / 2) : null;
        const diff = (svgY !== null && lineY !== null) ? Math.abs(svgY - lineY) : null;

        return { t: ${t}, svgY, lineY, diff };
      })()`);
      console.log(`Alignment check at t=${t}s (1920x1080):`, alignment);
      if (alignment.diff !== null && alignment.diff > 2.0) {
        throw new Error(`Vertical alignment difference ${alignment.diff}px exceeds 2.0px at t=${t}s`);
      }
    }

    const marks1920 = [
      { sec: 1.75, name: '1920_01_1.75s_full_brand.png' },
      { sec: 2.10, name: '1920_02_2.10s_first_visible_seam.png' },
      { sec: 2.23, name: '1920_03_2.23s_mid_zoom_no_double_stroke.png' },
      { sec: 2.53, name: '1920_04_2.53s_only_horizontal_line.png' },
      { sec: 2.89, name: '1920_05_2.89s_crossbar_fills_width.png' },
      { sec: 3.18, name: '1920_06_3.18s_gateway_opens.png' },
      { sec: 3.51, name: '1920_07_3.51s_no_z_artifacts.png' },
      { sec: 3.82, name: '1920_08_3.82s_hero_through_portal.png' },
      { sec: 4.25, name: '1920_09_4.25s_completed_reveal.png' },
    ];

    for (const mark of marks1920) {
      await client.evaluate(`(() => {
        const tl = window.__GATEWAY_TIMELINE;
        if (tl) {
          tl.seek(${mark.sec});
          const v = document.querySelector('video');
          if (v) v.currentTime = Math.min(${mark.sec}, 2.13);
        }
        return true;
      })()`);
      await wait(120);
      await client.screenshot(mark.name);
    }

    // TEST 2: 1440x900 Desktop Viewport
    console.log('\n=== TEST 2: Desktop 1440x900 Viewport Verification ===');
    await client.setViewport(1440, 900, false);
    await client.send('Page.navigate', { url: 'http://localhost:3000/?gateway=force' });
    for (let i = 0; i < 40; i++) {
      await wait(100);
      const isReady = await client.evaluate('!!window.__GATEWAY_TIMELINE');
      if (isReady) break;
    }
    await client.evaluate('(() => { window.__GATEWAY_TIMELINE?.pause(); return true; })()');

    for (const t of [2.10, 2.25, 2.49, 2.89]) {
      const alignment = await client.evaluate(`(() => {
        const tl = window.__GATEWAY_TIMELINE;
        if (tl) {
          tl.seek(${t});
          const v = document.querySelector('video');
          if (v) v.currentTime = Math.min(${t}, 2.13);
        }
        const svgPath = document.querySelector('svg path[stroke="#FFFDF8"]');
        const fullLine = document.querySelector('div[style*="height: 2px"]');
        const svgY = svgPath ? (svgPath.getBoundingClientRect().top + svgPath.getBoundingClientRect().height / 2) : null;
        const lineY = fullLine ? (fullLine.getBoundingClientRect().top + fullLine.getBoundingClientRect().height / 2) : null;
        return { t: ${t}, svgY, lineY, diff: (svgY && lineY) ? Math.abs(svgY - lineY) : null };
      })()`);
      console.log(`Alignment check at t=${t}s (1440x900):`, alignment);
      if (alignment.diff !== null && alignment.diff > 2.0) {
        throw new Error(`Vertical difference ${alignment.diff}px exceeds 2.0px at 1440x900`);
      }
    }
    await client.evaluate('(() => { window.__GATEWAY_TIMELINE?.seek(2.25); return true; })()');
    await wait(120);
    await client.screenshot('1440_01_2.25s_mid_zoom.png');
    await client.evaluate('(() => { window.__GATEWAY_TIMELINE?.seek(3.20); return true; })()');
    await wait(120);
    await client.screenshot('1440_02_3.20s_portal_opening.png');

    // TEST 3: Mobile Portrait 390x844 (iPhone 14/15)
    console.log('\n=== TEST 3: Mobile Portrait 390x844 Viewport Verification ===');
    await client.setViewport(390, 844, true, 2);
    await client.send('Page.navigate', { url: 'http://localhost:3000/?gateway=force' });
    for (let i = 0; i < 40; i++) {
      await wait(100);
      const isReady = await client.evaluate('!!window.__GATEWAY_TIMELINE');
      if (isReady) break;
    }
    await client.evaluate('(() => { window.__GATEWAY_TIMELINE?.pause(); return true; })()');

    for (const t of [2.10, 2.25, 2.49, 2.89]) {
      const alignment = await client.evaluate(`(() => {
        const tl = window.__GATEWAY_TIMELINE;
        if (tl) {
          tl.seek(${t});
          const v = document.querySelector('video');
          if (v) v.currentTime = Math.min(${t}, 2.13);
        }
        const svgPath = document.querySelector('svg path[stroke="#FFFDF8"]');
        const fullLine = document.querySelector('div[style*="height: 2px"]');
        const svgY = svgPath ? (svgPath.getBoundingClientRect().top + svgPath.getBoundingClientRect().height / 2) : null;
        const lineY = fullLine ? (fullLine.getBoundingClientRect().top + fullLine.getBoundingClientRect().height / 2) : null;
        return { t: ${t}, svgY, lineY, diff: (svgY && lineY) ? Math.abs(svgY - lineY) : null };
      })()`);
      console.log(`Alignment check at t=${t}s (390x844):`, alignment);
      if (alignment.diff !== null && alignment.diff > 2.0) {
        throw new Error(`Vertical difference ${alignment.diff}px exceeds 2.0px at 390x844`);
      }
    }
    await client.evaluate('(() => { window.__GATEWAY_TIMELINE?.seek(2.25); return true; })()');
    await wait(120);
    await client.screenshot('mobile_01_2.25s_mid_zoom.png');
    await client.evaluate('(() => { window.__GATEWAY_TIMELINE?.seek(3.30); return true; })()');
    await wait(120);
    await client.screenshot('mobile_02_3.30s_portal_opening.png');
    await client.evaluate('(() => { window.__GATEWAY_TIMELINE?.seek(4.25); return true; })()');
    await wait(120);
    await client.screenshot('mobile_03_4.25s_mobile_home_settled.png');

    // TEST 4: Skip / ESC Keyboard Navigation Test
    console.log('\n=== TEST 4: Skip Button & ESC Key Verification ===');
    await client.setViewport(1920, 1080, false);
    await client.send('Page.navigate', { url: 'http://localhost:3000/?gateway=force' });
    for (let i = 0; i < 40; i++) {
      await wait(100);
      const isReady = await client.evaluate('!!window.__GATEWAY_TIMELINE');
      if (isReady) break;
    }
    // Simulate Escape key press at t = 1.0s
    await client.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await client.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await wait(350);
    const skipCheck = await client.evaluate(`(() => {
      const overlay = document.querySelector('[aria-label="PHILOZZ Gateway Introduction"]');
      const overflow = document.body.style.overflow;
      return { overlayPresent: !!overlay, bodyOverflow: overflow };
    })()`);
    console.log('Skip key result (should be unmounted, overflow empty):', skipCheck);
    if (skipCheck.overlayPresent) throw new Error('Overlay remained mounted after ESC key');

    // TEST 5: Reduced Motion Verification
    console.log('\n=== TEST 5: Reduced Motion Verification ===');
    await client.send('Page.navigate', { url: 'http://localhost:3000/?gateway=force&motion=off' });
    await wait(500);
    const motionCheck = await client.evaluate(`(() => {
      const overlay = document.querySelector('[aria-label="PHILOZZ Gateway Introduction"]');
      return { overlayPresent: !!overlay };
    })()`);
    console.log('Reduced motion result (should be overlayPresent=false):', motionCheck);
    if (motionCheck.overlayPresent) throw new Error('Overlay mounted despite reduced motion flag');

    // TEST 6: Session Memory Rule
    console.log('\n=== TEST 6: Session Memory Verification (One-time only per session) ===');
    await client.evaluate('sessionStorage.setItem("philozz_golden_gateway_v3_seen", "true")');
    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await wait(500);
    const sessionCheck = await client.evaluate(`(() => {
      const overlay = document.querySelector('[aria-label="PHILOZZ Gateway Introduction"]');
      return { overlayPresent: !!overlay };
    })()`);
    console.log('Session memory repeat visit result (should be overlayPresent=false):', sessionCheck);
    if (sessionCheck.overlayPresent) throw new Error('Overlay mounted on repeat session visit');

    // TEST 7: Live Homepage DOM Interactivity
    console.log('\n=== TEST 7: Live Homepage DOM Interactivity & Click Test ===');
    const domCheck = await client.evaluate(`(() => {
      const heading = document.querySelector('h1');
      const nav = document.querySelector('.nav-header');
      const button = document.querySelector('a[href*="projects"], button');
      return {
        headingText: heading ? heading.innerText.replace(/\\s+/g, ' ').trim() : null,
        navPresent: !!nav,
        buttonPresent: !!button,
        scrollUnlocked: document.body.style.overflow === ''
      };
    })()`);
    console.log('Live DOM interactivity check:', domCheck);
    if (!domCheck.headingText || !domCheck.scrollUnlocked) {
      throw new Error('Live homepage DOM not accessible after gateway unmount');
    }

    console.log('\n✅ ALL VERIFICATION TESTS PASSED WITH 0 ERRORS!');
    client.close();
  } finally {
    braveProcess.kill();
  }
}

main().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
