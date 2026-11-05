import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const VERIFY_DIR = path.resolve('/home/figo/Desktop/Philo/verification/phase5-focus');
const FRAMES_DIR = path.resolve(VERIFY_DIR, 'frames');

if (!fs.existsSync(VERIFY_DIR)) {
  fs.mkdirSync(VERIFY_DIR, { recursive: true });
}
if (!fs.existsSync(FRAMES_DIR)) {
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
}

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
    const res = await this.send('Page.captureScreenshot', {
      format: 'png',
      quality: 100,
    });
    fs.writeFileSync(outputPath, Buffer.from(res.data, 'base64'));
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
      // Also invoke focus for reliability across environments
      await this.evaluate(`(() => {
        const el = document.getElementById('pedestal-${id}');
        if (el) el.focus();
      })()`);
    }
    await wait(350);
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

  async clickElement(id) {
    const rect = await this.evaluate(`(() => {
      const el = document.getElementById('pedestal-${id}');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`);
    if (rect) {
      const x = Math.round(rect.x);
      const y = Math.round(rect.y);
      await this.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
      await this.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
      await this.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    }
    await wait(350);
  }
}

async function main() {
  console.log('--- Phase 05: Technology Focus Mode Verification ---');

  const brave = spawn('/usr/bin/brave-browser', [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
  ]);

  try {
    await wait(1200);
    const list = await fetch('http://127.0.0.1:9225/json').then((r) => r.json());
    const wsUrl = list[0].webSocketDebuggerUrl;
    const client = new CDPClient(wsUrl);
    await client.ready();

    // 1. DESKTOP VERIFICATION (1440x900)
    console.log('1. Setting Desktop Viewport 1440x900...');
    await client.setViewport(1440, 900, false);
    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await wait(2200);

    // Scroll to Skills section (scrollY = 1800)
    console.log('Navigating and scrolling to #skills...');
    await client.evaluate(`window.scrollTo({ top: 1800, behavior: 'instant' })`);
    await wait(800);

    // Capture 1: Default State (Neutral Standby)
    console.log('Capturing: Default State (Neutral Standby)...');
    await client.unhover();
    const defaultInfo = await client.evaluate(`(() => {
      const consoleEl = document.querySelector('.tech-focus-console');
      const pedestals = document.querySelectorAll('.tech-pedestal-node');
      const activePedestal = document.querySelector('.tech-pedestal-node.is-focused');
      const beam = document.querySelector('.tech-focus-beam-group');
      return {
        consoleStandby: consoleEl?.classList.contains('is-standby'),
        pedestalsCount: pedestals.length,
        hasActivePedestal: !!activePedestal,
        hasBeam: !!beam
      };
    })()`);
    console.log('Default state metrics:', defaultInfo);
    await client.captureScreenshot(path.join(VERIFY_DIR, 'phase5-desktop-01-default-state.png'));

    // 2. Hover on Laravel
    console.log('Testing Hover on Laravel...');
    await client.hoverElement('laravel');
    const laravelInfo = await client.evaluate(`(() => {
      const laravel = document.getElementById('pedestal-laravel');
      const consoleEl = document.querySelector('.tech-focus-console');
      const techName = document.querySelector('.console-tech-name')?.textContent;
      const techCat = document.querySelector('.console-tech-category')?.textContent;
      const desc = document.querySelector('.console-description')?.textContent;
      const cap = document.querySelector('.console-capability-text')?.textContent;
      const beam = document.querySelector('.tech-focus-beam-active');
      const hubSub = document.querySelector('.orbit-center-sub')?.textContent;
      const otherPhp = document.getElementById('pedestal-php');
      return {
        laravelFocused: laravel?.classList.contains('is-focused'),
        consoleActive: consoleEl?.classList.contains('is-active'),
        techName,
        techCat,
        desc,
        cap,
        hasBeam: !!beam,
        hubSub,
        phpOpacity: window.getComputedStyle(otherPhp).opacity
      };
    })()`);
    console.log('Laravel focus inspection:', laravelInfo);
    await client.captureScreenshot(path.join(VERIFY_DIR, 'phase5-desktop-02-laravel-focused.png'));

    // 3. Hover on React
    console.log('Testing Hover on React...');
    await client.unhover();
    await client.hoverElement('react');
    const reactInfo = await client.evaluate(`(() => {
      const react = document.getElementById('pedestal-react');
      const techName = document.querySelector('.console-tech-name')?.textContent;
      const techCat = document.querySelector('.console-tech-category')?.textContent;
      const beam = document.querySelector('.tech-focus-beam-active');
      const hubSub = document.querySelector('.orbit-center-sub')?.textContent;
      return {
        reactFocused: react?.classList.contains('is-focused'),
        techName,
        techCat,
        hasBeam: !!beam,
        hubSub
      };
    })()`);
    console.log('React focus inspection:', reactInfo);
    await client.captureScreenshot(path.join(VERIFY_DIR, 'phase5-desktop-03-react-focused.png'));

    // 4. Hover on Redis
    console.log('Testing Hover on Redis...');
    await client.unhover();
    await client.hoverElement('redis');
    const redisInfo = await client.evaluate(`(() => {
      const redis = document.getElementById('pedestal-redis');
      const techName = document.querySelector('.console-tech-name')?.textContent;
      const beam = document.querySelector('.tech-focus-beam-active');
      return {
        redisFocused: redis?.classList.contains('is-focused'),
        techName,
        hasBeam: !!beam
      };
    })()`);
    console.log('Redis focus inspection:', redisInfo);
    await client.captureScreenshot(path.join(VERIFY_DIR, 'phase5-desktop-04-redis-focused.png'));

    // 5. Test Click-to-Lock and Pointer Leave
    console.log('Testing Click-to-Lock on Docker...');
    await client.unhover();
    await client.clickElement('docker');
    const clickLockInfo = await client.evaluate(`(() => {
      const docker = document.getElementById('pedestal-docker');
      const consoleTech = document.querySelector('.console-tech-name')?.textContent;
      return {
        dockerSelected: docker?.classList.contains('is-selected'),
        dockerFocused: docker?.classList.contains('is-focused'),
        consoleTech
      };
    })()`);
    console.log('Docker lock inspection:', clickLockInfo);

    // Clear lock
    await client.clickElement('docker');

    // 6. Test Keyboard Navigation (Enter on PHP)
    console.log('Testing Keyboard Selection (Enter on PHP)...');
    await client.evaluate(`(() => {
      const php = document.getElementById('pedestal-php');
      if (php) {
        php.focus();
        php.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      }
    })()`);
    await wait(350);
    const keyInfo = await client.evaluate(`(() => {
      const php = document.getElementById('pedestal-php');
      const techName = document.querySelector('.console-tech-name')?.textContent;
      return {
        phpFocused: php?.classList.contains('is-focused'),
        techName
      };
    })()`);
    console.log('Keyboard focus inspection:', keyInfo);

    // Deselect via Escape
    await client.evaluate(`(() => {
      const php = document.getElementById('pedestal-php');
      if (php) {
        php.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      }
    })()`);
    await wait(300);

    // 7. Video Recording of Technology Focus Mode
    console.log('Recording video of interactive technology switching...');
    let frameIdx = 0;
    const captureFrames = async (count) => {
      for (let i = 0; i < count; i++) {
        await wait(30);
        const fPath = path.join(FRAMES_DIR, `frame_${String(frameIdx++).padStart(4, '0')}.png`);
        await client.captureScreenshot(fPath);
      }
    };

    // Default standby frames
    await client.unhover();
    await captureFrames(8);

    // Switch to Laravel
    await client.hoverElement('laravel');
    await captureFrames(14);

    // Switch to PHP
    await client.unhover();
    await client.hoverElement('php');
    await captureFrames(14);

    // Switch to React
    await client.unhover();
    await client.hoverElement('react');
    await captureFrames(14);

    // Switch to Redis
    await client.unhover();
    await client.hoverElement('redis');
    await captureFrames(14);

    // Switch to Next.js
    await client.unhover();
    await client.hoverElement('nextjs');
    await captureFrames(14);

    // Back to standby
    await client.unhover();
    await captureFrames(12);

    // Encode MP4 video with ffmpeg
    const videoOut = path.join(VERIFY_DIR, 'technology-focus-mode.mp4');
    console.log('Encoding MP4 video with ffmpeg...');
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
    console.log('Video generated successfully:', videoOut);

    // 8. MOBILE VERIFICATION (390x844)
    console.log('8. Setting Mobile Viewport 390x844...');
    await client.setViewport(390, 844, true, 2);
    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await wait(2200);

    // Scroll to Skills
    const mobileSkillsTop = await client.evaluate(`(() => {
      const el = document.getElementById('skills');
      return el ? window.scrollY + el.getBoundingClientRect().top : 2600;
    })()`);
    console.log(`Scrolling mobile to ${mobileSkillsTop - 60}...`);
    await client.evaluate(`window.scrollTo({ top: ${mobileSkillsTop - 60}, behavior: 'instant' })`);
    await wait(600);

    // Tap Laravel chip on mobile
    console.log('Tapping Laravel chip on mobile...');
    await client.evaluate(`(() => {
      const chips = document.querySelectorAll('.tech-chip-btn');
      for (const c of chips) {
        if (c.textContent.includes('Laravel')) {
          c.click();
          break;
        }
      }
    })()`);
    await wait(450);

    const mobileSelectionInfo = await client.evaluate(`(() => {
      const consoleEl = document.querySelector('.tech-focus-console');
      const techName = document.querySelector('.console-tech-name')?.textContent;
      const activeChip = document.querySelector('.tech-chip-btn.is-selected')?.textContent;
      const overflow = document.documentElement.scrollWidth > window.innerWidth;
      return {
        consoleActive: consoleEl?.classList.contains('is-active'),
        techName,
        activeChip,
        hasHorizontalOverflow: overflow,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth
      };
    })()`);
    console.log('Mobile selection inspection:', mobileSelectionInfo);
    await client.captureScreenshot(path.join(VERIFY_DIR, 'phase5-mobile-390x844-selected.png'));

    console.log('--- Phase 05 Verification Complete ---');
  } finally {
    brave.kill();
  }
}

main().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});
