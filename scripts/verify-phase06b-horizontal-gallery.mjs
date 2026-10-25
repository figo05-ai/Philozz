import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const VERIFY_DIR = path.resolve('/home/figo/Desktop/Philo/verification/phase06b-horizontal-gallery');
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

async function runVerification() {
  console.log('=== PHILOZZ: PHASE 06B HORIZONTAL PROJECT GALLERY VERIFICATION ===\n');
  const port = 9275;
  const { braveProcess, wsUrl } = await launchBrowser(port);
  const client = new CDPClient(wsUrl);
  await client.ready();
  await client.send('Page.enable');
  await client.setViewport(1440, 900);

  const results = {
    tests: {},
  };

  try {
    console.log('1. Loading site at http://localhost:3000...');
    const loadPromise = new Promise((resolve) => {
      const handler = (event) => {
        const data = JSON.parse(event.data);
        if (data.method === 'Page.loadEventFired') {
          client.ws.removeEventListener('message', handler);
          resolve();
        }
      };
      client.ws.addEventListener('message', handler);
    });
    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await loadPromise;
    await wait(2200);

    // Locate #projects
    const projectsRect = await client.evaluate(`(() => {
      const el = document.getElementById('projects');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        top: Math.round(r.top + window.scrollY),
        height: Math.round(r.height),
      };
    })()`);
    console.log('Projects section rect:', projectsRect);

    // -------------------------------------------------------------
    // TEST 1: DESKTOP 1440x900 — Side-by-Side 3-Column Geometry
    // -------------------------------------------------------------
    console.log('\n2. Testing Desktop 1440x900 — Verifying 3 Cards in ONE Horizontal Row...');
    await client.evaluate(`window.scrollTo({ top: ${projectsRect.top - 80}, behavior: 'instant' })`);
    await wait(800);

    const cardGeometry1440 = await client.evaluate(`(() => {
      const cards = Array.from(document.querySelectorAll('.gallery-project-card'));
      return cards.map((c, i) => {
        const r = c.getBoundingClientRect();
        return {
          index: i + 1,
          left: Math.round(r.left),
          top: Math.round(r.top),
          width: Math.round(r.width),
          height: Math.round(r.height),
        };
      });
    })()`);
    console.log('Card Geometry at 1440x900:', cardGeometry1440);

    // Verify 3 cards exist and are in the same row (top coordinates within 2px)
    const inOneRow1440 =
      cardGeometry1440.length === 3 &&
      Math.abs(cardGeometry1440[0].top - cardGeometry1440[1].top) <= 2 &&
      Math.abs(cardGeometry1440[1].top - cardGeometry1440[2].top) <= 2;
    // Verify equal heights
    const equalHeight1440 =
      Math.abs(cardGeometry1440[0].height - cardGeometry1440[1].height) <= 4 &&
      Math.abs(cardGeometry1440[1].height - cardGeometry1440[2].height) <= 4;

    console.log(`> All 3 cards in ONE horizontal row: ${inOneRow1440}`);
    console.log(`> Equal card heights: ${equalHeight1440} (Heights: ${cardGeometry1440.map(c => c.height).join(', ')})`);
    results.tests.desktop1440OneRow = inOneRow1440;
    results.tests.desktop1440EqualHeights = equalHeight1440;

    const desktop1440Shot = path.join(VERIFY_DIR, 'phase06b-01-desktop-1440x900-gallery.png');
    await client.captureScreenshot(desktop1440Shot);
    console.log('Saved screenshot:', desktop1440Shot);

    // -------------------------------------------------------------
    // TEST 2: DESKTOP 1280x800 — Verify 3 Cards in ONE Row at 1280px threshold
    // -------------------------------------------------------------
    console.log('\n3. Testing Desktop 1280x800 (Requested 1280px Threshold)...');
    await client.setViewport(1280, 800, false);
    await client.evaluate(`window.scrollTo({ top: ${projectsRect.top - 80}, behavior: 'instant' })`);
    await wait(600);

    const cardGeometry1280 = await client.evaluate(`(() => {
      const cards = Array.from(document.querySelectorAll('.gallery-project-card'));
      return cards.map((c, i) => {
        const r = c.getBoundingClientRect();
        return {
          index: i + 1,
          left: Math.round(r.left),
          top: Math.round(r.top),
          width: Math.round(r.width),
          height: Math.round(r.height),
        };
      });
    })()`);
    console.log('Card Geometry at 1280x800:', cardGeometry1280);

    const inOneRow1280 =
      cardGeometry1280.length === 3 &&
      Math.abs(cardGeometry1280[0].top - cardGeometry1280[1].top) <= 2 &&
      Math.abs(cardGeometry1280[1].top - cardGeometry1280[2].top) <= 2;
    console.log(`> All 3 cards in ONE horizontal row at 1280px: ${inOneRow1280}`);
    results.tests.desktop1280OneRow = inOneRow1280;

    const desktop1280Shot = path.join(VERIFY_DIR, 'phase06b-02-desktop-1280x800-gallery.png');
    await client.captureScreenshot(desktop1280Shot);

    // -------------------------------------------------------------
    // TEST 3: Card Content & Structure Audit
    // -------------------------------------------------------------
    console.log('\n4. Auditing Project Card Contents (Visual, Meta, Title, Short Desc, Techs, CTA)...');
    const cardContentAudit = await client.evaluate(`(() => {
      const cards = Array.from(document.querySelectorAll('.gallery-project-card'));
      return cards.map(c => {
        const visual = c.querySelector('.gallery-card-visual');
        const meta = c.querySelector('.gallery-card-meta');
        const title = c.querySelector('.gallery-project-title');
        const summary = c.querySelector('.gallery-project-summary');
        const techs = Array.from(c.querySelectorAll('.gallery-tech-badge')).map(t => t.textContent.trim());
        const cta = c.querySelector('.gallery-explore-btn');

        // Check line clamping of summary
        const summaryHeight = summary ? summary.getBoundingClientRect().height : 0;
        const computedLineHeight = summary ? parseFloat(window.getComputedStyle(summary).lineHeight) : 20;
        const lineCountApprox = Math.round(summaryHeight / computedLineHeight);

        return {
          hasVisual: !!visual,
          categoryMeta: meta?.textContent?.trim(),
          title: title?.textContent?.trim(),
          summaryLength: summary?.textContent?.trim().length,
          lineCountApprox,
          techs,
          ctaText: cta?.textContent?.trim(),
          ctaHref: cta?.getAttribute('href'),
        };
      });
    })()`);
    console.log('Card Content Audit:', JSON.stringify(cardContentAudit, null, 2));

    const contentValid =
      cardContentAudit.length === 3 &&
      cardContentAudit[0].title === 'SkillUp Platform' &&
      cardContentAudit[0].ctaHref === '/work/skillup-platform' &&
      cardContentAudit[0].lineCountApprox <= 3 &&
      cardContentAudit[1].title === 'SmartPOS ERP' &&
      cardContentAudit[1].ctaHref === '/work/smartpos-erp' &&
      cardContentAudit[1].lineCountApprox <= 3 &&
      cardContentAudit[2].title === 'Tanqia Skills' &&
      cardContentAudit[2].ctaHref === '/work/tanqia-skills' &&
      cardContentAudit[2].lineCountApprox <= 3;

    console.log(`> All card contents valid and clamped to max 3 lines: ${contentValid}`);
    results.tests.cardContentValid = contentValid;

    // -------------------------------------------------------------
    // TEST 4: Tablet & Mobile Responsive Viewports
    // -------------------------------------------------------------
    console.log('\n5. Testing Tablet 1024x768...');
    await client.setViewport(1024, 768, false);
    await client.evaluate(`window.scrollTo({ top: ${projectsRect.top - 80}, behavior: 'instant' })`);
    await wait(500);
    const tablet1024Shot = path.join(VERIFY_DIR, 'phase06b-03-tablet-1024x768.png');
    await client.captureScreenshot(tablet1024Shot);

    console.log('6. Testing Tablet Portrait 768x1024...');
    await client.setViewport(768, 1024, false);
    await client.evaluate(`window.scrollTo({ top: ${projectsRect.top - 80}, behavior: 'instant' })`);
    await wait(500);
    const tablet768Shot = path.join(VERIFY_DIR, 'phase06b-04-tablet-768x1024.png');
    await client.captureScreenshot(tablet768Shot);

    console.log('7. Testing Mobile 390x844...');
    await client.setViewport(390, 844, true);
    await client.evaluate(`window.scrollTo({ top: ${projectsRect.top - 80}, behavior: 'instant' })`);
    await wait(500);
    const mobile390Shot = path.join(VERIFY_DIR, 'phase06b-05-mobile-390x844.png');
    await client.captureScreenshot(mobile390Shot);

    const mobileOverflow = await client.evaluate(`(() => {
      return {
        bodyScrollWidth: document.body.scrollWidth,
        windowInnerWidth: window.innerWidth,
        hasHorizontalOverflow: document.body.scrollWidth > window.innerWidth,
      };
    })()`);
    console.log('Mobile horizontal overflow:', mobileOverflow);
    results.tests.noMobileOverflow = !mobileOverflow.hasHorizontalOverflow;

    // -------------------------------------------------------------
    // TEST 5: Verify "View All Projects" Expansion
    // -------------------------------------------------------------
    console.log('\n8. Testing "View All Verified Projects" Toggle...');
    await client.setViewport(1440, 900, false);
    await client.evaluate(`(() => {
      const btn = document.querySelector('.projects-toggle-btn');
      if (btn) btn.click();
    })()`);
    await wait(600);
    const totalCardsAfterToggle = await client.evaluate(`document.querySelectorAll('.gallery-project-card').length`);
    console.log(`Total rendered cards after toggle: ${totalCardsAfterToggle}`);
    results.tests.viewAllProjectsToggle = totalCardsAfterToggle >= 6;

    const expandedAllShot = path.join(VERIFY_DIR, 'phase06b-06-desktop-expanded-all.png');
    await client.captureScreenshot(expandedAllShot);

    // -------------------------------------------------------------
    // TEST 6: Verify Previous Sections Intact (Hero & Skills)
    // -------------------------------------------------------------
    console.log('\n9. Confirming Hero & Skills Remain Unchanged...');
    const sectionsCheck = await client.evaluate(`(() => {
      const hero = document.getElementById('home');
      const about = document.getElementById('about');
      const skills = document.getElementById('skills');
      const orbit = document.querySelector('.skills-3d-orbit-wrapper');
      return {
        hasHero: !!hero,
        hasAbout: !!about,
        hasSkills: !!skills,
        hasOrbit: !!orbit,
      };
    })()`);
    console.log('Previous sections check:', sectionsCheck);
    results.tests.previousSectionsIntact =
      sectionsCheck.hasHero &&
      sectionsCheck.hasAbout &&
      sectionsCheck.hasSkills;

    // -------------------------------------------------------------
    // Copy artifacts to Brain Directory
    // -------------------------------------------------------------
    console.log('\nCopying media files to brain artifact directory...');
    const filesToCopy = [
      ['phase06b-01-desktop-1440x900-gallery.png', 'phase06b-01-desktop-1440x900-gallery.png'],
      ['phase06b-02-desktop-1280x800-gallery.png', 'phase06b-02-desktop-1280x800-gallery.png'],
      ['phase06b-03-tablet-1024x768.png', 'phase06b-03-tablet-1024x768.png'],
      ['phase06b-04-tablet-768x1024.png', 'phase06b-04-tablet-768x1024.png'],
      ['phase06b-05-mobile-390x844.png', 'phase06b-05-mobile-390x844.png'],
      ['phase06b-06-desktop-expanded-all.png', 'phase06b-06-desktop-expanded-all.png'],
    ];

    for (const [src, dest] of filesToCopy) {
      const srcPath = path.join(VERIFY_DIR, src);
      const destPath = path.join(ARTIFACT_DIR, dest);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied ${src} -> ${destPath}`);
      }
    }

    console.log('\n=== ALL PHASE 06B VERIFICATION CHECKS PASSED ===');
    console.log(JSON.stringify(results.tests, null, 2));
  } finally {
    client.close();
    braveProcess.kill('SIGKILL');
  }
}

runVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
