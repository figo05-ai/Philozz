import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const VERIFY_DIR = path.resolve('/home/figo/Desktop/Philo/verification/golden-line-fix');
const ARTIFACT_DIR = path.resolve('/home/figo/.gemini/antigravity/brain/274a7a54-6102-4f59-ae57-8c71b544ec53');

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

  async captureScreenshot(outputPath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png', quality: 100 });
    fs.writeFileSync(outputPath, Buffer.from(res.data, 'base64'));
    const baseName = path.basename(outputPath);
    const artifactPath = path.join(ARTIFACT_DIR, baseName);
    fs.writeFileSync(artifactPath, Buffer.from(res.data, 'base64'));
    console.log(`Saved screenshot: ${baseName}`);
  }
}

async function main() {
  console.log('--- PHILOZZ: Surgical Golden Line Fix Verification ---');

  const brave = spawn('/usr/bin/brave-browser', [
    '--headless=new',
    '--remote-debugging-port=9234',
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
  ]);

  try {
    await wait(1200);
    const list = await fetch('http://127.0.0.1:9234/json').then((r) => r.json());
    const wsUrl = list[0].webSocketDebuggerUrl;
    const client = new CDPClient(wsUrl);
    await client.ready();

    // 1. Desktop Viewport (1440x900)
    console.log('1. Setting Desktop Viewport 1440x900...');
    await client.setViewport(1440, 900, false);
    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await wait(2500);

    // TEST A: Skills resting state (Natural scroll from top down to Skills at scrollY = 1650)
    console.log('Testing: Skills Resting State (scrollY = 1650)...');
    for (let s = 0; s <= 1650; s += 150) {
      await client.evaluate(`window.scrollTo({ top: ${s}, behavior: 'instant' })`);
      await wait(60);
    }
    await wait(500);

    const restingCheck = await client.evaluate(`(() => {
      const overlay = document.querySelector('.about-skills-circuit-overlay');
      const cs = overlay ? window.getComputedStyle(overlay) : null;
      const skills = document.getElementById('skills');
      const sR = skills ? skills.getBoundingClientRect() : null;
      const st = window.ScrollTrigger?.getById('about-to-skills');
      return {
        scrollY: window.scrollY,
        skillsTop: sR ? Math.round(sR.top) : null,
        stProgress: st ? Number(st.progress.toFixed(3)) : null,
        display: cs?.display,
        opacity: cs?.opacity,
        visibility: cs?.visibility,
      };
    })()`);
    console.log('Skills resting check at 1650:', restingCheck);
    await client.captureScreenshot(path.join(VERIFY_DIR, 'golden-line-01-skills-resting-1650.png'));

    // TEST B: Skills settled at 1800 (Full section settled)
    console.log('Testing: Skills Settled at scrollY = 1800...');
    await client.evaluate(`window.scrollTo({ top: 1800, behavior: 'instant' })`);
    await wait(400);

    const settledCheck = await client.evaluate(`(() => {
      const overlay = document.querySelector('.about-skills-circuit-overlay');
      const cs = overlay ? window.getComputedStyle(overlay) : null;
      return {
        scrollY: window.scrollY,
        display: cs?.display,
        opacity: cs?.opacity,
      };
    })()`);
    console.log('Skills settled check at 1800:', settledCheck);
    await client.captureScreenshot(path.join(VERIFY_DIR, 'golden-line-02-skills-settled-1800.png'));

    // TEST C: Mid-Transition Active State (scrollY = 1250, progress ≈ 0.5)
    // Scrolling back up to mid-transition
    console.log('Testing: Reverse Scroll into Transition (scrollY = 1250)...');
    for (let s = 1800; s >= 1250; s -= 100) {
      await client.evaluate(`window.scrollTo({ top: ${s}, behavior: 'instant' })`);
      await wait(60);
    }
    await wait(400);

    const midTransitionCheck = await client.evaluate(`(() => {
      const overlay = document.querySelector('.about-skills-circuit-overlay');
      const cs = overlay ? window.getComputedStyle(overlay) : null;
      const path = overlay?.querySelector('path:not([filter])') || overlay?.querySelector('path');
      const st = window.ScrollTrigger?.getById('about-to-skills');
      return {
        scrollY: window.scrollY,
        stProgress: st ? Number(st.progress.toFixed(3)) : null,
        display: cs?.display,
        opacity: cs?.opacity,
        hasPathD: !!path?.getAttribute('d'),
        pathD: path?.getAttribute('d'),
      };
    })()`);
    console.log('Mid-transition check at 1250:', midTransitionCheck);
    await client.captureScreenshot(path.join(VERIFY_DIR, 'golden-line-03-reverse-scroll-active-1250.png'));

    // TEST D: Reverse Scroll all the way back to About (scrollY = 700)
    console.log('Testing: Reverse Scroll back to About (scrollY = 700)...');
    for (let s = 1250; s >= 700; s -= 100) {
      await client.evaluate(`window.scrollTo({ top: ${s}, behavior: 'instant' })`);
      await wait(60);
    }
    await wait(400);

    const aboutRestingCheck = await client.evaluate(`(() => {
      const overlay = document.querySelector('.about-skills-circuit-overlay');
      const cs = overlay ? window.getComputedStyle(overlay) : null;
      return {
        scrollY: window.scrollY,
        display: cs?.display,
        opacity: cs?.opacity,
      };
    })()`);
    console.log('About resting check at 700:', aboutRestingCheck);
    await client.captureScreenshot(path.join(VERIFY_DIR, 'golden-line-04-reverse-about-settled-700.png'));

    // TEST E: Mobile Viewport (390x844)
    console.log('Testing: Mobile Viewport (390x844)...');
    await client.setViewport(390, 844, true);
    await wait(600);

    // Scroll to mobile skills
    const mobileSkillsY = await client.evaluate(`(() => {
      const s = document.getElementById('skills');
      return s ? s.getBoundingClientRect().top + window.scrollY : 2800;
    })()`);

    console.log('Mobile skills position:', mobileSkillsY);
    await client.evaluate(`window.scrollTo({ top: ${mobileSkillsY + 50}, behavior: 'instant' })`);
    await wait(500);

    const mobileCheck = await client.evaluate(`(() => {
      const overlay = document.querySelector('.about-skills-circuit-overlay');
      const cs = overlay ? window.getComputedStyle(overlay) : null;
      return {
        scrollY: window.scrollY,
        display: cs?.display,
        opacity: cs?.opacity,
      };
    })()`);
    console.log('Mobile check in Skills:', mobileCheck);
    await client.captureScreenshot(path.join(VERIFY_DIR, 'golden-line-05-mobile-skills-resting.png'));

    brave.kill();
    console.log('✓ All verification tests completed successfully!');
  } catch (err) {
    console.error('Verification error:', err);
    brave.kill();
    process.exit(1);
  }
}

main();
