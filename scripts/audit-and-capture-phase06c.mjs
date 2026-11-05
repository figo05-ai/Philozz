import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const VERIFY_DIR = path.resolve('/home/figo/Desktop/Philo/verification/phase06c-readability');
const BEFORE_DIR = path.join(VERIFY_DIR, 'before');
const AFTER_DIR = path.join(VERIFY_DIR, 'after');

[BEFORE_DIR, AFTER_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

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
    await wait(1800);
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

const isAfterMode = process.argv.includes('--after');
const targetDir = isAfterMode ? AFTER_DIR : BEFORE_DIR;
const auditReportFile = path.join(VERIFY_DIR, isAfterMode ? 'audit-report-after.json' : 'audit-report-before.json');

async function run() {
  console.log(`=== RUNNING TYPOGRAPHY AUDIT & CAPTURE (${isAfterMode ? 'AFTER' : 'BEFORE'}) ===\n`);
  const port = 9310;
  const { braveProcess, wsUrl } = await launchBrowser(port);
  const client = new CDPClient(wsUrl);
  await client.ready();
  await client.send('Page.enable');

  const auditReport = {
    timestamp: new Date().toISOString(),
    mode: isAfterMode ? 'after' : 'before',
    homepage: {},
    caseStudy: {},
  };

  try {
    // -------------------------------------------------------------
    // 1. HOMEPAGE AUDIT & SCREENSHOT (1440x900)
    // -------------------------------------------------------------
    await client.setViewport(1440, 900, false);
    console.log('Navigating to http://localhost:3000...');
    await client.navigate('http://localhost:3000');

    // Scroll to #projects
    const projectsRect = await client.evaluate(`(() => {
      const el = document.getElementById('projects');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top + window.scrollY), height: Math.round(r.height) };
    })()`);

    if (projectsRect) {
      await client.evaluate(`window.scrollTo({ top: ${projectsRect.top - 60}, behavior: 'instant' })`);
      await wait(600);
    }

    // Capture Screenshot 1: Homepage Featured Projects
    const shot1 = path.join(targetDir, '01-homepage-featured-projects.png');
    await client.captureScreenshot(shot1);
    console.log(`Captured Screenshot 1 -> ${shot1}`);

    // Audit Homepage Project Card typography
    auditReport.homepage = await client.evaluate(`(() => {
      function getStyle(el) {
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return {
          text: el.textContent.trim().substring(0, 60),
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          lineHeight: cs.lineHeight,
          color: cs.color,
          letterSpacing: cs.letterSpacing,
        };
      }

      const card = document.querySelector('.gallery-project-card');
      if (!card) return null;

      return {
        cardCategory: getStyle(card.querySelector('.gallery-category-label')),
        cardTitle: getStyle(card.querySelector('.gallery-project-title')),
        cardSummary: getStyle(card.querySelector('.gallery-project-summary')),
        techBadge: getStyle(card.querySelector('.gallery-tech-badge')),
        compactSchematicTitle: getStyle(card.querySelector('.compact-schematic-title')),
        compactTelemetryTag: getStyle(card.querySelector('.compact-telemetry-tag')),
        compactNode: getStyle(card.querySelector('.compact-node')),
        compactFooter: getStyle(card.querySelector('.compact-schematic-footer')),
      };
    })()`);

    // -------------------------------------------------------------
    // 2. SKILLUP CASE STUDY AUDIT & SCREENSHOTS (1440x900)
    // -------------------------------------------------------------
    console.log('\nNavigating to http://localhost:3000/work/skillup-platform...');
    await client.navigate('http://localhost:3000/work/skillup-platform');
    await wait(1000);

    // Screenshot 2: SkillUp Case Study Introduction
    await client.evaluate(`window.scrollTo({ top: 0, behavior: 'instant' })`);
    await wait(500);
    const shot2 = path.join(targetDir, '02-skillup-casestudy-intro.png');
    await client.captureScreenshot(shot2);
    console.log(`Captured Screenshot 2 -> ${shot2}`);

    // Screenshot 3: Runtime Visualization
    const visualPos = await client.evaluate(`(() => {
      const el = document.querySelector('.schematic-container');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return Math.round(r.top + window.scrollY);
    })()`);

    if (visualPos) {
      await client.evaluate(`window.scrollTo({ top: ${visualPos - 100}, behavior: 'instant' })`);
      await wait(600);
    }
    const shot3 = path.join(targetDir, '03-runtime-visualization.png');
    await client.captureScreenshot(shot3);
    console.log(`Captured Screenshot 3 -> ${shot3}`);

    // Screenshot 4: System Architecture
    const archPos = await client.evaluate(`(() => {
      const headings = Array.from(document.querySelectorAll('h2'));
      const archH2 = headings.find(h => h.textContent.includes('System Architecture'));
      if (!archH2) return null;
      const r = archH2.getBoundingClientRect();
      return Math.round(r.top + window.scrollY);
    })()`);

    if (archPos) {
      await client.evaluate(`window.scrollTo({ top: ${archPos - 80}, behavior: 'instant' })`);
      await wait(600);
    }
    const shot4 = path.join(targetDir, '04-system-architecture.png');
    await client.captureScreenshot(shot4);
    console.log(`Captured Screenshot 4 -> ${shot4}`);

    // Screenshot 5: Technical Decisions
    const techDecPos = await client.evaluate(`(() => {
      const headings = Array.from(document.querySelectorAll('h2'));
      const tdH2 = headings.find(h => h.textContent.includes('Technical Decisions'));
      if (!tdH2) return null;
      const r = tdH2.getBoundingClientRect();
      return Math.round(r.top + window.scrollY);
    })()`);

    if (techDecPos) {
      await client.evaluate(`window.scrollTo({ top: ${techDecPos - 80}, behavior: 'instant' })`);
      await wait(600);
    }
    const shot5 = path.join(targetDir, '05-technical-decisions.png');
    await client.captureScreenshot(shot5);
    console.log(`Captured Screenshot 5 -> ${shot5}`);

    // Audit Case Study Typography
    auditReport.caseStudy = await client.evaluate(`(() => {
      function getStyle(el) {
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return {
          text: el.textContent.trim().substring(0, 60),
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          lineHeight: cs.lineHeight,
          color: cs.color,
          letterSpacing: cs.letterSpacing,
        };
      }

      const mainContainer = document.querySelector('main.container-editorial');
      const csMain = mainContainer ? window.getComputedStyle(mainContainer) : null;

      const schematic = document.querySelector('.schematic-container');
      const firstRespLi = document.querySelector('section:nth-of-type(4) ul li span') || document.querySelector('ul li span');
      const archCard = document.querySelector('section:nth-of-type(5) div > div');
      const techDecisionCard = document.querySelector('section:nth-of-type(6) div > div');

      return {
        mainContainerMaxWidth: csMain ? csMain.maxWidth : null,
        mainTitle: getStyle(document.querySelector('h1')),
        tagline: getStyle(document.querySelector('h1 + p')),
        metadataLabel: getStyle(document.querySelector('section > div > div > div:first-child')),
        metadataValue: getStyle(document.querySelector('section > div > div > div:nth-child(2)')),
        challengePara: getStyle(document.querySelector('section:nth-of-type(3) p:first-of-type')),
        summaryPara: getStyle(document.querySelector('section:nth-of-type(3) p:nth-of-type(2)')),
        responsibilityItem: getStyle(firstRespLi),
        archNodeTech: archCard ? getStyle(archCard.children[0]) : null,
        archNodeTitle: archCard ? getStyle(archCard.children[1]) : null,
        archNodeDesc: archCard ? getStyle(archCard.children[2]) : null,
        decisionTitle: techDecisionCard ? getStyle(techDecisionCard.querySelector('h3')) : null,
        decisionRationale: techDecisionCard ? getStyle(techDecisionCard.querySelector('p')) : null,
        schematicTitle: getStyle(schematic?.querySelector('.schematic-title')),
        schematicBadgeSpec: getStyle(schematic?.querySelector('.schematic-badge-spec')),
        schematicActionBtn: getStyle(schematic?.querySelector('.schematic-action-btn')),
        nodeEyebrow: getStyle(schematic?.querySelector('.node-eyebrow')),
        nodeTitle: getStyle(schematic?.querySelector('.node-title span')),
        metaSpec: getStyle(schematic?.querySelector('.meta-spec')),
        metaStat: getStyle(schematic?.querySelector('.meta-stat')),
        nodePill: getStyle(schematic?.querySelector('.node-pill')),
        metricLbl: getStyle(schematic?.querySelector('.metric-lbl')),
        metricVal: getStyle(schematic?.querySelector('.metric-val')),
        footerLogCode: getStyle(schematic?.querySelector('.footer-log code')),
      };
    })()`);

    // -------------------------------------------------------------
    // 3. MOBILE CASE STUDY AUDIT & SCREENSHOT (390x844)
    // -------------------------------------------------------------
    console.log('\nTesting Mobile Viewport 390x844...');
    await client.setViewport(390, 844, true);
    await client.evaluate(`window.scrollTo({ top: 0, behavior: 'instant' })`);
    await wait(600);

    const shot6 = path.join(targetDir, '06-mobile-casestudy.png');
    await client.captureScreenshot(shot6);
    console.log(`Captured Screenshot 6 -> ${shot6}`);

    fs.writeFileSync(auditReportFile, JSON.stringify(auditReport, null, 2));
    console.log(`\nAudit report saved to: ${auditReportFile}`);
  } finally {
    client.close();
    braveProcess.kill('SIGKILL');
  }
}

run().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
