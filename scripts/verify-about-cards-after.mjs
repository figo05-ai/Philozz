import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const VERIFY_DIR = path.resolve('/home/figo/Desktop/Philo/verification/about-cards-fix');
const AFTER_DIR = path.join(VERIFY_DIR, 'after');
if (!fs.existsSync(AFTER_DIR)) fs.mkdirSync(AFTER_DIR, { recursive: true });

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

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

  async setViewport(width, height, isMobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: isMobile,
    });
  }

  async captureScreenshot(outputPath, clip = null) {
    const params = { format: 'png' };
    if (clip) params.clip = clip;
    const res = await this.send('Page.captureScreenshot', params);
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(outputPath, buffer);
    return outputPath;
  }

  async navigate(url) {
    const loadPromise = new Promise((resolve) => {
      const handler = (event) => {
        const data = JSON.parse(event.data);
        if (data.method === 'Page.loadEventFired') {
          this.ws.removeEventListener('message', handler);
          resolve();
        }
      };
      this.ws.addEventListener('message', handler);
    });
    await this.send('Page.navigate', { url });
    await loadPromise;
    await wait(2000);
  }

  close() {
    this.ws.close();
  }
}

async function launchBrowser(port) {
  const braveProcess = spawn('/usr/bin/brave-browser', [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await wait(300);
    try {
      const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
      if (list && list[0] && list[0].webSocketDebuggerUrl) {
        wsUrl = list[0].webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!wsUrl) {
    braveProcess.kill('SIGKILL');
    throw new Error('Failed to connect to browser CDP');
  }

  return { braveProcess, wsUrl };
}

async function run() {
  console.log('=== VERIFYING ABOUT CARDS (AFTER FIX) ===\n');
  const port = 9325;
  const { braveProcess, wsUrl } = await launchBrowser(port);
  const client = new CDPClient(wsUrl);
  await client.ready();
  await client.send('Page.enable');

  try {
    // 1. Desktop 1440x900
    await client.setViewport(1440, 900, false);
    await client.navigate('http://localhost:3000');
    await wait(1500);

    // Scroll to #about
    const aboutPos = await client.evaluate(`(() => {
      const el = document.getElementById('about') || document.querySelector('.scene-about');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return Math.round(r.top + window.scrollY);
    })()`);

    if (aboutPos) {
      await client.evaluate(`window.scrollTo({ top: ${aboutPos - 20}, behavior: 'instant' })`);
      await wait(1000);
    }

    // Capture Desktop AFTER Full Section
    const shotDesktop = path.join(AFTER_DIR, '01-desktop-about-cards.png');
    await client.captureScreenshot(shotDesktop);
    console.log(`Captured Desktop: ${shotDesktop}`);

    // Capture specifically the mosaic cards bounding rect
    const mosaicClip = await client.evaluate(`(() => {
      const el = document.querySelector('.mosaic-grid');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: Math.max(0, Math.round(r.x)),
        y: Math.max(0, Math.round(r.y)),
        width: Math.round(r.width),
        height: Math.round(r.height),
        scale: 1
      };
    })()`);

    if (mosaicClip) {
      const shotMosaic = path.join(AFTER_DIR, '02-desktop-mosaic-zoom.png');
      await client.captureScreenshot(shotMosaic, mosaicClip);
      console.log(`Captured Mosaic Close-up: ${shotMosaic}`);
    }

    // Detailed measurements of all 3 cards on Desktop
    const desktopDiagnostics = await client.evaluate(`(() => {
      function getMetrics(el) {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const cs = window.getComputedStyle(el);
        return {
          width: Math.round(r.width),
          height: Math.round(r.height),
          top: Math.round(r.top),
          bottom: Math.round(r.bottom),
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          isClippedY: el.scrollHeight > el.clientHeight,
          isClippedX: el.scrollWidth > el.clientWidth,
          overflow: cs.overflow,
          position: cs.position,
        };
      }

      const mosaicGrid = document.querySelector('.mosaic-grid');
      const portraitCard = document.querySelector('.comp-card-portrait');
      const portraitInner = portraitCard ? portraitCard.querySelector('.comp-card-inner') : null;
      const portraitImg = portraitCard ? portraitCard.querySelector('img') : null;
      const portraitOverlay = portraitCard ? portraitCard.querySelector('.comp-portrait-overlay') : null;

      const buildingCard = document.querySelector('.comp-card-building');
      const buildingInner = buildingCard ? buildingCard.querySelector('.comp-building-canvas') : null;
      const ideBox = buildingCard ? buildingCard.querySelector('.comp-ide-box') : null;
      const ideCode = buildingCard ? buildingCard.querySelector('.comp-ide-code') : null;

      const journeyCard = document.querySelector('.comp-card-journey');
      const journeyInner = journeyCard ? journeyCard.querySelector('.comp-journey-inner') : null;
      const journeyTimeline = journeyCard ? journeyCard.querySelector('.comp-journey-timeline') : null;
      const timelineRows = journeyCard ? Array.from(journeyCard.querySelectorAll('.timeline-row')).map((row, idx) => {
        const heading = row.querySelector('.timeline-heading')?.textContent.trim();
        const info = row.querySelector('.timeline-info')?.textContent.trim();
        const r = row.getBoundingClientRect();
        const parentR = journeyCard.getBoundingClientRect();
        return {
          index: idx,
          heading,
          info,
          rect: { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height) },
          isWithinCard: r.bottom <= parentR.bottom + 2,
        };
      }) : [];

      const innerBottom = portraitInner ? portraitInner.getBoundingClientRect().bottom : 0;
      const cardBottom = portraitCard ? portraitCard.getBoundingClientRect().bottom : 0;
      const thinkingVoidGap = Math.max(0, Math.round(cardBottom - innerBottom));

      return {
        mosaicGrid: getMetrics(mosaicGrid),
        thinking: {
          card: getMetrics(portraitCard),
          inner: getMetrics(portraitInner),
          img: getMetrics(portraitImg),
          overlay: getMetrics(portraitOverlay),
          deadVoidGapPx: thinkingVoidGap,
          hasVoidGap: thinkingVoidGap > 5,
        },
        building: {
          card: getMetrics(buildingCard),
          canvas: getMetrics(buildingInner),
          ideBox: getMetrics(ideBox),
          ideCode: getMetrics(ideCode),
          isCodeVisible: ideCode ? ideCode.clientHeight > 20 : false,
        },
        journey: {
          card: getMetrics(journeyCard),
          inner: getMetrics(journeyInner),
          timeline: getMetrics(journeyTimeline),
          rows: timelineRows,
          allRowsVisible: timelineRows.every(r => r.isWithinCard),
        }
      };
    })()`);

    console.log('Desktop Diagnostics:', JSON.stringify(desktopDiagnostics, null, 2));

    // 2. Mobile 390x844
    await client.setViewport(390, 844, true);
    await client.navigate('http://localhost:3000');
    await wait(1500);

    const mobileAboutPos = await client.evaluate(`(() => {
      const el = document.querySelector('.hero-mobile-about-section') || document.querySelector('.scene-about');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return Math.round(r.top + window.scrollY);
    })()`);

    if (mobileAboutPos) {
      await client.evaluate(`window.scrollTo({ top: ${mobileAboutPos - 20}, behavior: 'instant' })`);
      await wait(1000);
    }

    const shotMobile390 = path.join(AFTER_DIR, '03-mobile-about-cards-390.png');
    await client.captureScreenshot(shotMobile390);
    console.log(`Captured Mobile 390: ${shotMobile390}`);

    const mobile390Diagnostics = await client.evaluate(`(() => {
      const journeyCard = document.querySelector('.comp-card-journey');
      const timelineRows = journeyCard ? Array.from(journeyCard.querySelectorAll('.timeline-row')).map((row, idx) => {
        const heading = row.querySelector('.timeline-heading')?.textContent.trim();
        const r = row.getBoundingClientRect();
        const parentR = journeyCard.getBoundingClientRect();
        return {
          index: idx,
          heading,
          rect: { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height) },
          isWithinCard: r.bottom <= parentR.bottom + 2,
        };
      }) : [];

      const docWidth = document.documentElement.scrollWidth;
      const winWidth = window.innerWidth;

      return {
        hasHorizontalOverflow: docWidth > winWidth,
        docWidth,
        winWidth,
        timelineRows,
        allRowsVisible: timelineRows.every(r => r.isWithinCard),
      };
    })()`);

    console.log('Mobile 390 Diagnostics:', JSON.stringify(mobile390Diagnostics, null, 2));

    // 3. Mobile 360x780
    await client.setViewport(360, 780, true);
    await client.evaluate(`window.scrollTo({ top: ${mobileAboutPos - 20}, behavior: 'instant' })`);
    await wait(800);

    const shotMobile360 = path.join(AFTER_DIR, '04-mobile-about-cards-360.png');
    await client.captureScreenshot(shotMobile360);
    console.log(`Captured Mobile 360: ${shotMobile360}`);

    const report = {
      desktop: desktopDiagnostics,
      mobile390: mobile390Diagnostics,
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(path.join(VERIFY_DIR, 'diagnostics-after.json'), JSON.stringify(report, null, 2));
    console.log('\nVerification complete! Results written to diagnostics-after.json');

  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    client.close();
    braveProcess.kill('SIGKILL');
  }
}

run();
