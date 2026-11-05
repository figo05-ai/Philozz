import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const VERIFY_DIR = path.resolve('/home/figo/Desktop/Philo/verification/cards-refinement');
if (!fs.existsSync(VERIFY_DIR)) fs.mkdirSync(VERIFY_DIR, { recursive: true });

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
  console.log('=== VERIFYING ABOUT CARDS & FEATURED PROJECTS REFINEMENT ===\n');
  const port = 9330;
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

    const shotAbout = path.join(VERIFY_DIR, '01-desktop-about-cards.png');
    await client.captureScreenshot(shotAbout);
    console.log(`Captured About Cards: ${shotAbout}`);

    // Scroll to #projects
    const projectsPos = await client.evaluate(`(() => {
      const el = document.getElementById('projects') || document.querySelector('.scene-projects');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return Math.round(r.top + window.scrollY);
    })()`);

    if (projectsPos) {
      await client.evaluate(`window.scrollTo({ top: ${projectsPos + 180}, behavior: 'instant' })`);
      await wait(1000);
    }

    const shotProjects = path.join(VERIFY_DIR, '02-desktop-featured-projects.png');
    await client.captureScreenshot(shotProjects);
    console.log(`Captured Featured Projects: ${shotProjects}`);

    // Detailed metrics of Featured Projects cards
    const projectsDiagnostics = await client.evaluate(`(() => {
      const cards = Array.from(document.querySelectorAll('.projects-horizontal-gallery .gallery-project-card')).slice(0, 3);
      return cards.map((card, idx) => {
        const title = card.querySelector('.gallery-project-title')?.textContent.trim();
        const summary = card.querySelector('.gallery-project-summary')?.textContent.trim();
        const nodes = Array.from(card.querySelectorAll('.compact-node')).map(n => n.textContent.trim());
        const tag = card.querySelector('.compact-telemetry-tag')?.textContent.trim();
        const schematicWrap = card.querySelector('.compact-schematic-wrap');
        const lastNode = card.querySelectorAll('.compact-node')[2];

        const cardR = card.getBoundingClientRect();
        const lastNodeR = lastNode ? lastNode.getBoundingClientRect() : null;
        const isLastNodeWithinCard = lastNodeR ? (lastNodeR.right <= cardR.right + 2) : false;

        const summaryEl = card.querySelector('.gallery-project-summary');
        const isSummaryTruncated = summaryEl ? (summaryEl.scrollHeight > summaryEl.clientHeight + 2) : false;

        return {
          index: idx,
          title,
          summary,
          nodes,
          tag,
          isLastNodeWithinCard,
          isSummaryTruncated,
          cardWidth: Math.round(cardR.width),
          cardHeight: Math.round(cardR.height),
        };
      });
    })()`);

    console.log('Featured Projects Diagnostics:', JSON.stringify(projectsDiagnostics, null, 2));

    // 2. Mobile 390x844
    await client.setViewport(390, 844, true);
    await client.navigate('http://localhost:3000');
    await wait(1500);

    const mobileProjectsPos = await client.evaluate(`(() => {
      const el = document.getElementById('projects') || document.querySelector('.scene-projects');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return Math.round(r.top + window.scrollY);
    })()`);

    if (mobileProjectsPos) {
      await client.evaluate(`window.scrollTo({ top: ${mobileProjectsPos + 220}, behavior: 'instant' })`);
      await wait(1000);
    }

    const shotMobileProjects = path.join(VERIFY_DIR, '03-mobile-featured-projects.png');
    await client.captureScreenshot(shotMobileProjects);
    console.log(`Captured Mobile Featured Projects: ${shotMobileProjects}`);

    const report = {
      projectsDiagnostics,
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(path.join(VERIFY_DIR, 'diagnostics-refinement.json'), JSON.stringify(report, null, 2));
    console.log('Verification finished! Saved report to diagnostics-refinement.json');

  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    client.close();
    braveProcess.kill('SIGKILL');
  }
}

run();
