import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const VERIFY_DIR = path.resolve('/home/figo/Desktop/Philo/verification/phase5-1-portals');
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

  async captureScreenshot(outputPath, clip = null) {
    const params = {
      format: 'png',
      quality: 100,
    };
    if (clip) {
      params.clip = { ...clip, scale: 1 };
    }
    const res = await this.send('Page.captureScreenshot', params);
    fs.writeFileSync(outputPath, Buffer.from(res.data, 'base64'));
    // Also copy to artifact dir if it exists
    const baseName = path.basename(outputPath);
    const artifactPath = path.join(ARTIFACT_DIR, baseName);
    fs.writeFileSync(artifactPath, Buffer.from(res.data, 'base64'));
  }

  async hoverElement(id) {
    const rect = await this.evaluate(`(() => {
      const el = document.getElementById('pedestal-${id}');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`);
    if (rect) {
      await this.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: Math.round(rect.x),
        y: Math.round(rect.y),
      });
      await this.evaluate(`(() => {
        const el = document.getElementById('pedestal-${id}');
        if (el) el.focus();
      })()`);
    }
    await wait(400);
  }

  async unhover() {
    await this.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: 10,
      y: 10,
    });
    await this.evaluate(`(() => {
      if (document.activeElement) document.activeElement.blur();
    })()`);
    await wait(350);
  }
}

async function main() {
  console.log('--- Phase 05.1: Logo Accuracy & Black Hole Portals Verification ---');

  const brave = spawn('/usr/bin/brave-browser', [
    '--headless=new',
    '--remote-debugging-port=9226',
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
  ]);

  try {
    await wait(1200);
    const list = await fetch('http://127.0.0.1:9226/json').then((r) => r.json());
    const wsUrl = list[0].webSocketDebuggerUrl;
    const client = new CDPClient(wsUrl);
    await client.ready();

    // 1. DESKTOP VERIFICATION (1440x900)
    console.log('1. Setting Desktop Viewport 1440x900...');
    await client.setViewport(1440, 900, false);
    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await wait(2200);

    // Scroll to Skills section
    console.log('Scrolling to #skills...');
    await client.evaluate(`window.scrollTo({ top: 1800, behavior: 'instant' })`);
    await wait(900);

    // Capture 1: Default State (Neutral Standby with All 9 Portals)
    console.log('Capturing: Default State (All 9 Portals)...');
    await client.unhover();
    const defaultInfo = await client.evaluate(`(() => {
      const pedestals = document.querySelectorAll('.tech-pedestal-node');
      const portals = document.querySelectorAll('.portal-chamber');
      const emergingLogos = document.querySelectorAll('.portal-emerging-logo-wrap');
      return {
        pedestalsCount: pedestals.length,
        portalsCount: portals.length,
        emergingLogosCount: emergingLogos.length,
      };
    })()`);
    console.log('Default state metrics:', defaultInfo);
    await client.captureScreenshot(path.join(VERIFY_DIR, 'phase5-1-desktop-01-default.png'));

    // Capture 2: Reference Component Validation - Laravel Focused
    console.log('2. Validating Laravel Reference Platform...');
    await client.hoverElement('laravel');
    const laravelMetrics = await client.evaluate(`(() => {
      const node = document.getElementById('pedestal-laravel');
      const chamber = node?.querySelector('.portal-chamber');
      const logoWrap = node?.querySelector('.portal-emerging-logo-wrap');
      const frontCollar = node?.querySelector('.portal-front-collar');
      const label = node?.querySelector('.portal-label')?.textContent;
      const svg = node?.querySelector('.portal-logo-element svg');
      return {
        label,
        isFocused: node?.classList.contains('is-focused'),
        hasChamber: !!chamber,
        hasLogoWrap: !!logoWrap,
        hasFrontCollar: !!frontCollar,
        hasSvg: !!svg,
        viewBox: svg?.getAttribute('viewBox'),
      };
    })()`);
    console.log('Laravel metrics:', laravelMetrics);
    await client.captureScreenshot(path.join(VERIFY_DIR, 'phase5-1-desktop-02-laravel-focused.png'));

    // Capture 3: JavaScript Platform Validation (Verify authentic "JS", not "SJ")
    console.log('3. Validating JavaScript Platform (Authentic "JS")...');
    await client.hoverElement('javascript');
    const jsMetrics = await client.evaluate(`(() => {
      const node = document.getElementById('pedestal-javascript');
      const svg = node?.querySelector('.portal-logo-element svg');
      const paths = svg?.querySelectorAll('path');
      return {
        isFocused: node?.classList.contains('is-focused'),
        pathCount: paths?.length,
        viewBox: svg?.getAttribute('viewBox'),
      };
    })()`);
    console.log('JavaScript metrics:', jsMetrics);
    await client.captureScreenshot(path.join(VERIFY_DIR, 'phase5-1-desktop-03-javascript-focused.png'));

    // Capture 4: MySQL Platform Validation (Verify official Sakila dolphin)
    console.log('4. Validating MySQL Platform (Sakila Dolphin)...');
    await client.hoverElement('mysql');
    const mysqlMetrics = await client.evaluate(`(() => {
      const node = document.getElementById('pedestal-mysql');
      const svg = node?.querySelector('.portal-logo-element svg');
      return {
        isFocused: node?.classList.contains('is-focused'),
        hasSvg: !!svg,
        viewBox: svg?.getAttribute('viewBox'),
      };
    })()`);
    console.log('MySQL metrics:', mysqlMetrics);
    await client.captureScreenshot(path.join(VERIFY_DIR, 'phase5-1-desktop-04-mysql-focused.png'));

    // Capture 5: High-Resolution Close-Up Crop of Laravel Black Hole Portal
    console.log('5. Capturing Close-Up Portal Crops...');
    await client.hoverElement('laravel');
    const laravelCrop = await client.evaluate(`(() => {
      const node = document.getElementById('pedestal-laravel');
      if (!node) return null;
      const r = node.getBoundingClientRect();
      const pad = 24;
      return {
        x: Math.round(r.left + window.scrollX - pad),
        y: Math.round(r.top + window.scrollY - pad),
        width: Math.round(r.width + pad * 2),
        height: Math.round(r.height + pad * 2),
      };
    })()`);
    if (laravelCrop) {
      await client.captureScreenshot(path.join(VERIFY_DIR, 'phase5-1-desktop-05-portal-closeup.png'), laravelCrop);
    }

    // Capture JS Closeup
    await client.hoverElement('javascript');
    const jsCrop = await client.evaluate(`(() => {
      const node = document.getElementById('pedestal-javascript');
      if (!node) return null;
      const r = node.getBoundingClientRect();
      const pad = 24;
      return {
        x: Math.round(r.left + window.scrollX - pad),
        y: Math.round(r.top + window.scrollY - pad),
        width: Math.round(r.width + pad * 2),
        height: Math.round(r.height + pad * 2),
      };
    })()`);
    if (jsCrop) {
      await client.captureScreenshot(path.join(VERIFY_DIR, 'phase5-1-desktop-06-javascript-closeup.png'), jsCrop);
    }

    // Capture MySQL Closeup
    await client.hoverElement('mysql');
    const mysqlCrop = await client.evaluate(`(() => {
      const node = document.getElementById('pedestal-mysql');
      if (!node) return null;
      const r = node.getBoundingClientRect();
      const pad = 24;
      return {
        x: Math.round(r.left + window.scrollX - pad),
        y: Math.round(r.top + window.scrollY - pad),
        width: Math.round(r.width + pad * 2),
        height: Math.round(r.height + pad * 2),
      };
    })()`);
    if (mysqlCrop) {
      await client.captureScreenshot(path.join(VERIFY_DIR, 'phase5-1-desktop-07-mysql-closeup.png'), mysqlCrop);
    }

    // Capture 6: Mobile Layout (390x844)
    console.log('6. Validating Mobile Viewport (390x844)...');
    await client.setViewport(390, 844, true);
    await wait(600);
    const mobileSkillsY = await client.evaluate(`(() => {
      const s = document.getElementById('skills');
      return s ? s.getBoundingClientRect().top + window.scrollY : 2400;
    })()`);
    console.log('Mobile #skills Y position:', mobileSkillsY);
    await client.evaluate(`window.scrollTo({ top: ${mobileSkillsY + 80}, behavior: 'instant' })`);
    await wait(800);
    // Tap on Laravel chip
    await client.evaluate(`(() => {
      const chips = document.querySelectorAll('.tech-chip-btn');
      if (chips.length > 0) chips[0].click();
    })()`);
    await wait(500);
    await client.captureScreenshot(path.join(VERIFY_DIR, 'phase5-1-mobile-390x844.png'));

    // 7. Video Recording of Black Hole Portals Interactive Ecosystem
    console.log('7. Recording video of interactive portal emergence and focus switching...');
    const FRAMES_DIR = path.resolve(VERIFY_DIR, 'frames');
    if (!fs.existsSync(FRAMES_DIR)) fs.mkdirSync(FRAMES_DIR, { recursive: true });
    for (const f of fs.readdirSync(FRAMES_DIR)) {
      if (f.endsWith('.png')) fs.unlinkSync(path.join(FRAMES_DIR, f));
    }

    // Switch back to desktop viewport
    await client.setViewport(1440, 900, false);
    await client.evaluate(`window.scrollTo({ top: 1800, behavior: 'instant' })`);
    await wait(700);

    let frameIdx = 0;
    const captureFrames = async (count) => {
      for (let i = 0; i < count; i++) {
        await wait(35);
        const fPath = path.join(FRAMES_DIR, `frame_${String(frameIdx++).padStart(4, '0')}.png`);
        const res = await client.send('Page.captureScreenshot', { format: 'png', quality: 100 });
        fs.writeFileSync(fPath, Buffer.from(res.data, 'base64'));
      }
    };

    // 1. Standby state
    await client.unhover();
    await captureFrames(8);

    // 2. Focus Laravel
    await client.hoverElement('laravel');
    await captureFrames(14);

    // 3. Focus JavaScript
    await client.unhover();
    await client.hoverElement('javascript');
    await captureFrames(14);

    // 4. Focus MySQL
    await client.unhover();
    await client.hoverElement('mysql');
    await captureFrames(14);

    // 5. Focus React
    await client.unhover();
    await client.hoverElement('react');
    await captureFrames(14);

    // 6. Focus Linux
    await client.unhover();
    await client.hoverElement('linux');
    await captureFrames(14);

    // 7. Back to Standby
    await client.unhover();
    await captureFrames(10);

    const videoOut = path.join(VERIFY_DIR, 'black-hole-portals-ecosystem.mp4');
    console.log('Compiling video with ffmpeg...');
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-y',
        '-framerate', '24',
        '-i', path.join(FRAMES_DIR, 'frame_%04d.png'),
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-crf', '20',
        videoOut,
      ]);
      ffmpeg.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited with code ${code}`));
      });
    });

    // Copy MP4 to artifact directory
    fs.copyFileSync(videoOut, path.join(ARTIFACT_DIR, 'black-hole-portals-ecosystem.mp4'));
    console.log('✓ Video generated and copied to artifacts!');

    console.log('✓ All Phase 05.1 verification captures completed successfully!');
  } finally {
    brave.kill('SIGTERM');
  }
}

main().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
