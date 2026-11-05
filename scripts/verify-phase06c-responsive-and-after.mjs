import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const VERIFY_DIR = path.resolve('/home/figo/Desktop/Philo/verification/phase06c-readability');
const AFTER_DIR = path.join(VERIFY_DIR, 'after');
const RESPONSIVE_DIR = path.join(VERIFY_DIR, 'responsive');

[AFTER_DIR, RESPONSIVE_DIR].forEach((dir) => {
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

  async captureScreenshot(outputPath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
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

// WCAG relative luminance & contrast ratio calculation
function sRGBtoLin(c) {
  c = c / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function parseRgb(colorStr) {
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return { r: 255, g: 255, b: 255 };
  return { r: parseInt(match[1], 10), g: parseInt(match[2], 10), b: parseInt(match[3], 10) };
}
function calcLuminance(rgb) {
  return 0.2126 * sRGBtoLin(rgb.r) + 0.7152 * sRGBtoLin(rgb.g) + 0.0722 * sRGBtoLin(rgb.b);
}
function calcContrast(fgStr, bgStr = 'rgb(22, 22, 29)') {
  const L1 = calcLuminance(parseRgb(fgStr));
  const L2 = calcLuminance(parseRgb(bgStr));
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return +((lighter + 0.05) / (darker + 0.05)).toFixed(2);
}

async function run() {
  console.log('=== RUNNING AFTER-FIX VERIFICATION, CONTRAST CHECK & RESPONSIVE AUDIT ===\n');
  const port = 9320;
  const { braveProcess, wsUrl } = await launchBrowser(port);
  const client = new CDPClient(wsUrl);
  await client.ready();
  await client.send('Page.enable');

  const verificationResults = {
    timestamp: new Date().toISOString(),
    screenshots: {},
    responsiveViewports: {},
    afterComputedStyles: {},
    contrastAudit: {},
    comparisonSummary: {},
  };

  try {
    // -------------------------------------------------------------
    // PART 1: 6 MANDATORY AFTER SCREENSHOTS & COMPUTED STYLES
    // -------------------------------------------------------------
    console.log('1. Capturing Homepage Featured Projects (1440x900)...');
    await client.setViewport(1440, 900, false);
    await client.navigate('http://localhost:3000');

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

    const shot1 = path.join(AFTER_DIR, '01-homepage-featured-projects.png');
    await client.captureScreenshot(shot1);
    verificationResults.screenshots.homepage = shot1;
    console.log(`> Screenshot 1 captured: ${shot1}`);

    // Audit Homepage Card styles
    const hpStyles = await client.evaluate(`(() => {
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
      const cards = Array.from(document.querySelectorAll('.gallery-project-card'));
      return {
        cardCount: cards.length,
        cardHeights: cards.map(c => Math.round(c.getBoundingClientRect().height)),
        cardTops: cards.map(c => Math.round(c.getBoundingClientRect().top)),
        cardCategory: getStyle(card?.querySelector('.gallery-category-label')),
        cardTitle: getStyle(card?.querySelector('.gallery-project-title')),
        cardSummary: getStyle(card?.querySelector('.gallery-project-summary')),
        techBadge: getStyle(card?.querySelector('.gallery-tech-badge')),
        compactSchematicTitle: getStyle(card?.querySelector('.compact-schematic-title')),
        compactTelemetryTag: getStyle(card?.querySelector('.compact-telemetry-tag')),
        compactNode: getStyle(card?.querySelector('.compact-node')),
        compactFooter: getStyle(card?.querySelector('.compact-schematic-footer')),
      };
    })()`);
    verificationResults.afterComputedStyles.homepage = hpStyles;

    // -------------------------------------------------------------
    // PART 2: SKILLUP CASE STUDY SCREENSHOTS & COMPUTED STYLES
    // -------------------------------------------------------------
    console.log('\n2. Capturing SkillUp Case Study Sections (1440x900)...');
    await client.navigate('http://localhost:3000/work/skillup-platform');
    await wait(1000);

    // Screenshot 2: Intro
    await client.evaluate(`window.scrollTo({ top: 0, behavior: 'instant' })`);
    await wait(500);
    const shot2 = path.join(AFTER_DIR, '02-skillup-casestudy-intro.png');
    await client.captureScreenshot(shot2);
    verificationResults.screenshots.caseStudyIntro = shot2;
    console.log(`> Screenshot 2 captured: ${shot2}`);

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
    const shot3 = path.join(AFTER_DIR, '03-runtime-visualization.png');
    await client.captureScreenshot(shot3);
    verificationResults.screenshots.runtimeVisualization = shot3;
    console.log(`> Screenshot 3 captured: ${shot3}`);

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
    const shot4 = path.join(AFTER_DIR, '04-system-architecture.png');
    await client.captureScreenshot(shot4);
    verificationResults.screenshots.systemArchitecture = shot4;
    console.log(`> Screenshot 4 captured: ${shot4}`);

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
    const shot5 = path.join(AFTER_DIR, '05-technical-decisions.png');
    await client.captureScreenshot(shot5);
    verificationResults.screenshots.technicalDecisions = shot5;
    console.log(`> Screenshot 5 captured: ${shot5}`);

    // Audit Case Study Styles
    const csStyles = await client.evaluate(`(() => {
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
      const firstRespLi = document.querySelector('section:nth-of-type(4) ul li span');
      const archCard = document.querySelector('section:nth-of-type(5) div > div');
      const techDecisionCard = document.querySelector('section:nth-of-type(6) div > div');
      const lessonLi = document.querySelector('section:nth-of-type(8) li');
      const relatedCard = document.querySelector('section:nth-of-type(9) a');

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
        lessonItem: getStyle(lessonLi),
        relatedTitle: getStyle(relatedCard?.querySelector('h3')),
        relatedTagline: getStyle(relatedCard?.querySelector('p')),
      };
    })()`);
    verificationResults.afterComputedStyles.caseStudy = csStyles;

    // Screenshot 6: Mobile Case Study (390x844)
    console.log('\n3. Capturing Mobile Case Study (390x844)...');
    await client.setViewport(390, 844, true);
    await client.evaluate(`window.scrollTo({ top: 0, behavior: 'instant' })`);
    await wait(600);
    const shot6 = path.join(AFTER_DIR, '06-mobile-casestudy.png');
    await client.captureScreenshot(shot6);
    verificationResults.screenshots.mobileCaseStudy = shot6;
    console.log(`> Screenshot 6 captured: ${shot6}`);

    // -------------------------------------------------------------
    // PART 3: RESPONSIVE MATRIX TESTING (1920, 1440, 1024, 768, 390, 360)
    // -------------------------------------------------------------
    console.log('\n4. Running Responsive Validation across 6 required resolutions...');
    const viewports = [
      { width: 1920, height: 1080, mobile: false, name: 'desktop-1920' },
      { width: 1440, height: 900, mobile: false, name: 'desktop-1440' },
      { width: 1024, height: 768, mobile: false, name: 'desktop-1024' },
      { width: 768, height: 1024, mobile: false, name: 'tablet-768' },
      { width: 390, height: 844, mobile: true, name: 'mobile-390' },
      { width: 360, height: 740, mobile: true, name: 'mobile-360' },
    ];

    for (const vp of viewports) {
      console.log(`\nTesting ${vp.width}x${vp.height} (${vp.name})...`);
      await client.setViewport(vp.width, vp.height, vp.mobile);

      // Check Case Study
      await client.navigate('http://localhost:3000/work/skillup-platform');
      await wait(600);

      const csMetrics = await client.evaluate(`(() => {
        const bodyWidth = document.body.getBoundingClientRect().width;
        const scrollWidth = document.documentElement.scrollWidth;
        const hasHorizontalOverflow = scrollWidth > window.innerWidth;
        const pChallenge = document.querySelector('section:nth-of-type(3) p:first-of-type');
        const pCs = pChallenge ? window.getComputedStyle(pChallenge) : null;
        return {
          windowInnerWidth: window.innerWidth,
          scrollWidth,
          hasHorizontalOverflow,
          challengeFontSize: pCs?.fontSize,
          challengeLineHeight: pCs?.lineHeight,
        };
      })()`);

      // Check Homepage Projects
      await client.navigate('http://localhost:3000');
      const hpProjectsRect = await client.evaluate(`(() => {
        const el = document.getElementById('projects');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return Math.round(r.top + window.scrollY);
      })()`);
      if (hpProjectsRect) {
        await client.evaluate(`window.scrollTo({ top: ${hpProjectsRect - 60}, behavior: 'instant' })`);
        await wait(600);
      }

      const hpMetrics = await client.evaluate(`(() => {
        const scrollWidth = document.documentElement.scrollWidth;
        const hasHorizontalOverflow = scrollWidth > window.innerWidth;
        const cards = Array.from(document.querySelectorAll('.gallery-project-card'));
        const inOneRow = cards.length >= 3 && Math.abs(cards[0].getBoundingClientRect().top - cards[1].getBoundingClientRect().top) <= 3;
        return {
          windowInnerWidth: window.innerWidth,
          scrollWidth,
          hasHorizontalOverflow,
          cardCount: cards.length,
          inOneRowAtThreshold: inOneRow,
          cardTops: cards.slice(0, 3).map(c => Math.round(c.getBoundingClientRect().top)),
          cardHeights: cards.slice(0, 3).map(c => Math.round(c.getBoundingClientRect().height)),
        };
      })()`);

      const respShot = path.join(RESPONSIVE_DIR, `${vp.name}-projects.png`);
      await client.captureScreenshot(respShot);

      verificationResults.responsiveViewports[vp.name] = {
        viewport: `${vp.width}x${vp.height}`,
        mobile: vp.mobile,
        caseStudy: csMetrics,
        homepageProjects: hpMetrics,
        screenshot: respShot,
        passed: !csMetrics.hasHorizontalOverflow && !hpMetrics.hasHorizontalOverflow,
      };

      console.log(`> ${vp.name}: CaseStudy overflow=${csMetrics.hasHorizontalOverflow}, HP overflow=${hpMetrics.hasHorizontalOverflow}`);
    }

    // -------------------------------------------------------------
    // PART 4: CONTRAST RATIO AUDIT (WCAG AA & AAA)
    // -------------------------------------------------------------
    console.log('\n5. Auditing Color Contrast against Dark Backgrounds (WCAG AA >= 4.5:1)...');
    const contrastChecks = [
      { label: 'Card Category Tag', fg: hpStyles.cardCategory?.color, bg: 'rgb(22, 22, 29)' },
      { label: 'Card Title', fg: hpStyles.cardTitle?.color, bg: 'rgb(22, 22, 29)' },
      { label: 'Card Summary Paragraph', fg: hpStyles.cardSummary?.color, bg: 'rgb(22, 22, 29)' },
      { label: 'Card Tech Badge', fg: hpStyles.techBadge?.color, bg: 'rgb(22, 22, 29)' },
      { label: 'Compact Schematic Title', fg: hpStyles.compactSchematicTitle?.color, bg: 'rgb(11, 11, 15)' },
      { label: 'Compact Telemetry Tag', fg: hpStyles.compactTelemetryTag?.color, bg: 'rgb(11, 11, 15)' },
      { label: 'Compact Node Text', fg: hpStyles.compactNode?.color, bg: 'rgb(22, 22, 30)' },
      { label: 'Case Study Metadata Label', fg: csStyles.metadataLabel?.color, bg: 'rgb(22, 22, 29)' },
      { label: 'Case Study Metadata Value', fg: csStyles.metadataValue?.color, bg: 'rgb(22, 22, 29)' },
      { label: 'Case Study Challenge Body', fg: csStyles.challengePara?.color, bg: 'rgb(10, 10, 13)' },
      { label: 'Case Study Summary Body', fg: csStyles.summaryPara?.color, bg: 'rgb(10, 10, 13)' },
      { label: 'Case Study Responsibility', fg: csStyles.responsibilityItem?.color, bg: 'rgb(22, 22, 29)' },
      { label: 'Architecture Node Tech', fg: csStyles.archNodeTech?.color, bg: 'rgb(22, 22, 29)' },
      { label: 'Architecture Node Description', fg: csStyles.archNodeDesc?.color, bg: 'rgb(22, 22, 29)' },
      { label: 'Technical Decision Rationale', fg: csStyles.decisionRationale?.color, bg: 'rgb(22, 22, 29)' },
      { label: 'Schematic Title', fg: csStyles.schematicTitle?.color, bg: 'rgb(12, 12, 16)' },
      { label: 'Schematic Badge Spec', fg: csStyles.schematicBadgeSpec?.color, bg: 'rgb(12, 12, 16)' },
      { label: 'Schematic Action Button', fg: csStyles.schematicActionBtn?.color, bg: 'rgb(12, 12, 16)' },
      { label: 'Schematic Node Eyebrow', fg: csStyles.nodeEyebrow?.color, bg: 'rgb(22, 22, 32)' },
      { label: 'Schematic Node Title', fg: csStyles.nodeTitle?.color, bg: 'rgb(22, 22, 32)' },
      { label: 'Schematic Meta Spec', fg: csStyles.metaSpec?.color, bg: 'rgb(22, 22, 32)' },
      { label: 'Schematic Meta Stat', fg: csStyles.metaStat?.color, bg: 'rgb(22, 22, 32)' },
      { label: 'Schematic Node Pill', fg: csStyles.nodePill?.color, bg: 'rgb(22, 22, 32)' },
      { label: 'Schematic Metric Label', fg: csStyles.metricLbl?.color, bg: 'rgb(12, 12, 16)' },
      { label: 'Schematic Metric Value', fg: csStyles.metricVal?.color, bg: 'rgb(12, 12, 16)' },
      { label: 'Schematic Footer Log Code', fg: csStyles.footerLogCode?.color, bg: 'rgb(8, 8, 12)' },
      { label: 'Lessons Learned Body', fg: csStyles.lessonItem?.color, bg: 'rgb(22, 22, 29)' },
    ];

    verificationResults.contrastAudit = contrastChecks.map((item) => {
      const ratio = calcContrast(item.fg || 'rgb(246, 243, 236)', item.bg);
      const passesAA = ratio >= 4.5;
      const passesAAA = ratio >= 7.0;
      return {
        label: item.label,
        fgColor: item.fg,
        bgColor: item.bg,
        contrastRatio: `${ratio}:1`,
        passesAA,
        passesAAA,
      };
    });

    // -------------------------------------------------------------
    // PART 5: BEFORE VS AFTER COMPARISON SUMMARY
    // -------------------------------------------------------------
    const beforeAuditPath = path.join(VERIFY_DIR, 'audit-report-before.json');
    let beforeData = null;
    if (fs.existsSync(beforeAuditPath)) {
      beforeData = JSON.parse(fs.readFileSync(beforeAuditPath, 'utf8'));
    }

    if (beforeData) {
      verificationResults.comparisonSummary = {
        homepage: {
          cardCategory: {
            before: beforeData.homepage.cardCategory?.fontSize + ' (' + beforeData.homepage.cardCategory?.color + ')',
            after: hpStyles.cardCategory?.fontSize + ' (' + hpStyles.cardCategory?.color + ')',
          },
          cardSummary: {
            before: beforeData.homepage.cardSummary?.fontSize + ' (' + beforeData.homepage.cardSummary?.color + ')',
            after: hpStyles.cardSummary?.fontSize + ' (' + hpStyles.cardSummary?.color + ')',
          },
          techBadge: {
            before: beforeData.homepage.techBadge?.fontSize,
            after: hpStyles.techBadge?.fontSize,
          },
          compactSchematicTitle: {
            before: beforeData.homepage.compactSchematicTitle?.fontSize,
            after: hpStyles.compactSchematicTitle?.fontSize,
          },
          compactNode: {
            before: beforeData.homepage.compactNode?.fontSize,
            after: hpStyles.compactNode?.fontSize,
          },
          compactTelemetryTag: {
            before: beforeData.homepage.compactTelemetryTag?.fontSize + ' (' + beforeData.homepage.compactTelemetryTag?.color + ')',
            after: hpStyles.compactTelemetryTag?.fontSize + ' (' + hpStyles.compactTelemetryTag?.color + ')',
          },
        },
        caseStudy: {
          mainContainerMaxWidth: {
            before: beforeData.caseStudy.mainContainerMaxWidth,
            after: csStyles.mainContainerMaxWidth,
          },
          metadataLabel: {
            before: beforeData.caseStudy.metadataLabel?.fontSize,
            after: csStyles.metadataLabel?.fontSize,
          },
          metadataValue: {
            before: beforeData.caseStudy.metadataValue?.fontSize,
            after: csStyles.metadataValue?.fontSize,
          },
          challengePara: {
            before: beforeData.caseStudy.challengePara?.fontSize,
            after: csStyles.challengePara?.fontSize,
          },
          summaryPara: {
            before: beforeData.caseStudy.summaryPara?.fontSize + ' (' + beforeData.caseStudy.summaryPara?.color + ')',
            after: csStyles.summaryPara?.fontSize + ' (' + csStyles.summaryPara?.color + ')',
          },
          responsibilityItem: {
            before: beforeData.caseStudy.responsibilityItem?.fontSize,
            after: csStyles.responsibilityItem?.fontSize,
          },
          archNodeTech: {
            before: beforeData.caseStudy.archNodeTech?.fontSize,
            after: csStyles.archNodeTech?.fontSize,
          },
          archNodeDesc: {
            before: beforeData.caseStudy.archNodeDesc?.fontSize + ' (' + beforeData.caseStudy.archNodeDesc?.color + ')',
            after: csStyles.archNodeDesc?.fontSize + ' (' + csStyles.archNodeDesc?.color + ')',
          },
          decisionRationale: {
            before: beforeData.caseStudy.decisionRationale?.fontSize + ' (' + beforeData.caseStudy.decisionRationale?.color + ')',
            after: csStyles.decisionRationale?.fontSize + ' (' + csStyles.decisionRationale?.color + ')',
          },
          schematicTitle: {
            before: beforeData.caseStudy.schematicTitle?.fontSize,
            after: csStyles.schematicTitle?.fontSize,
          },
          nodeEyebrow: {
            before: beforeData.caseStudy.nodeEyebrow?.fontSize + ' (' + beforeData.caseStudy.nodeEyebrow?.color + ')',
            after: csStyles.nodeEyebrow?.fontSize + ' (' + csStyles.nodeEyebrow?.color + ')',
          },
          nodeTitle: {
            before: beforeData.caseStudy.nodeTitle?.fontSize,
            after: csStyles.nodeTitle?.fontSize,
          },
          metaSpec: {
            before: beforeData.caseStudy.metaSpec?.fontSize + ' (' + beforeData.caseStudy.metaSpec?.color + ')',
            after: csStyles.metaSpec?.fontSize + ' (' + csStyles.metaSpec?.color + ')',
          },
          nodePill: {
            before: beforeData.caseStudy.nodePill?.fontSize + ' (' + beforeData.caseStudy.nodePill?.color + ')',
            after: csStyles.nodePill?.fontSize + ' (' + csStyles.nodePill?.color + ')',
          },
          metricLbl: {
            before: beforeData.caseStudy.metricLbl?.fontSize + ' (' + beforeData.caseStudy.metricLbl?.color + ')',
            after: csStyles.metricLbl?.fontSize + ' (' + csStyles.metricLbl?.color + ')',
          },
          metricVal: {
            before: beforeData.caseStudy.metricVal?.fontSize,
            after: csStyles.metricVal?.fontSize,
          },
          footerLogCode: {
            before: beforeData.caseStudy.footerLogCode?.fontSize,
            after: csStyles.footerLogCode?.fontSize,
          },
        },
      };
    }

    const reportPath = path.join(VERIFY_DIR, 'verification-summary-phase06c.json');
    fs.writeFileSync(reportPath, JSON.stringify(verificationResults, null, 2));
    console.log(`\nVerification summary written to: ${reportPath}`);
  } finally {
    client.close();
    braveProcess.kill('SIGKILL');
  }
}

run().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
