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
    const baseName = path.basename(outputPath);
    const artifactPath = path.join(ARTIFACT_DIR, baseName);
    fs.writeFileSync(artifactPath, Buffer.from(res.data, 'base64'));
    console.log(`Saved screenshot: ${baseName}`);
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
    await wait(450);
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
    await wait(450);
  }
}

async function main() {
  console.log('--- Step 1: Validating Laravel Reference Platform (Resting vs Focused) ---');

  const brave = spawn('/usr/bin/brave-browser', [
    '--headless=new',
    '--remote-debugging-port=9227',
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
  ]);

  try {
    await wait(1200);
    const list = await fetch('http://127.0.0.1:9227/json').then((r) => r.json());
    const wsUrl = list[0].webSocketDebuggerUrl;
    const client = new CDPClient(wsUrl);
    await client.ready();

    await client.setViewport(1440, 900, false);
    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await wait(2500);

    // Scroll to Skills section
    await client.evaluate(`window.scrollTo({ top: 1800, behavior: 'instant' })`);
    await wait(1000);

    // Unhover to guarantee resting state
    await client.unhover();

    // Check DOM structure for Laravel
    const laravelDom = await client.evaluate(`(() => {
      const node = document.getElementById('pedestal-laravel');
      if (!node) return null;
      const chamber = node.querySelector('.portal-chamber');
      const backLayer = node.querySelector('.portal-back-layer');
      const logoWrap = node.querySelector('.portal-emerging-logo-wrap');
      const frontLayer = node.querySelector('.portal-front-layer');
      const label = node.querySelector('.portal-label');
      const r = node.getBoundingClientRect();
      const chamberR = chamber ? chamber.getBoundingClientRect() : null;
      const logoR = logoWrap ? logoWrap.getBoundingClientRect() : null;
      const frontR = frontLayer ? frontLayer.getBoundingClientRect() : null;
      return {
        found: true,
        hasChamber: !!chamber,
        hasBackLayer: !!backLayer,
        hasLogoWrap: !!logoWrap,
        hasFrontLayer: !!frontLayer,
        labelText: label?.textContent,
        nodeBox: { top: r.top, left: r.left, width: r.width, height: r.height },
        chamberBox: chamberR ? { top: chamberR.top, left: chamberR.left, width: chamberR.width, height: chamberR.height } : null,
        logoBox: logoR ? { top: logoR.top, bottom: logoR.bottom, height: logoR.height } : null,
        frontBox: frontR ? { top: frontR.top, bottom: frontR.bottom, height: frontR.height } : null,
      };
    })()`);
    console.log('Laravel Resting DOM Metrics:', JSON.stringify(laravelDom, null, 2));

    // Capture Laravel Resting State Closeup
    const restingCrop = await client.evaluate(`(() => {
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
    if (restingCrop) {
      await client.captureScreenshot(path.join(VERIFY_DIR, 'laravel-01-resting-closeup.png'), restingCrop);
    }

    // Now Focus/Hover Laravel
    console.log('Focusing / Hovering Laravel...');
    await client.hoverElement('laravel');

    const laravelFocusedDom = await client.evaluate(`(() => {
      const node = document.getElementById('pedestal-laravel');
      const logoWrap = node?.querySelector('.portal-emerging-logo-wrap');
      const r = node?.getBoundingClientRect();
      const logoR = logoWrap ? logoWrap.getBoundingClientRect() : null;
      return {
        isFocused: node?.classList.contains('is-focused'),
        nodeBox: r ? { top: r.top, left: r.left, width: r.width, height: r.height } : null,
        logoBox: logoR ? { top: logoR.top, bottom: logoR.bottom, height: logoR.height } : null,
      };
    })()`);
    console.log('Laravel Focused DOM Metrics:', JSON.stringify(laravelFocusedDom, null, 2));

    // Capture Laravel Focused State Closeup
    const focusedCrop = await client.evaluate(`(() => {
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
    if (focusedCrop) {
      await client.captureScreenshot(path.join(VERIFY_DIR, 'laravel-02-focused-closeup.png'), focusedCrop);
    }

    // Capture full ecosystem with Laravel focused
    await client.captureScreenshot(path.join(VERIFY_DIR, 'laravel-03-ecosystem-focused.png'));

    brave.kill();
    console.log('Finished Laravel reference verification.');
  } catch (err) {
    console.error('Error during verification:', err);
    brave.kill();
    process.exit(1);
  }
}

main();
