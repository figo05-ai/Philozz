import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const VERIFY_DIR = path.resolve('/home/figo/Desktop/Philo/verification/sitewide-readability');
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
  console.log(`=== RUNNING SITE-WIDE READABILITY AUDIT & CAPTURE (${isAfterMode ? 'AFTER' : 'BEFORE'}) ===\n`);
  const port = 9311;
  const { braveProcess, wsUrl } = await launchBrowser(port);
  const client = new CDPClient(wsUrl);
  await client.ready();
  await client.send('Page.enable');

  const auditReport = {
    timestamp: new Date().toISOString(),
    mode: isAfterMode ? 'after' : 'before',
    navbar: {},
    hero: {},
    about: {},
    skills: {},
    projects: {},
    notes: {},
    finale: {},
    articlePage: {},
  };

  try {
    // -------------------------------------------------------------
    // 1. HOMEPAGE AUDIT (1440x900)
    // -------------------------------------------------------------
    await client.setViewport(1440, 900, false);
    console.log('Navigating to http://localhost:3000...');
    await client.navigate('http://localhost:3000');
    await wait(1000);

    // 1A. HERO & NAVBAR
    await client.evaluate(`window.scrollTo({ top: 0, behavior: 'instant' })`);
    await wait(800);
    const shotHero = path.join(targetDir, '01-navbar-hero.png');
    await client.captureScreenshot(shotHero);
    console.log(`Captured Screenshot 1 -> ${shotHero}`);

    auditReport.navbar = await client.evaluate(`(() => {
      function getStyle(el) {
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return {
          text: el.textContent.trim().substring(0, 40),
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          lineHeight: cs.lineHeight,
          color: cs.color,
        };
      }
      return {
        brand: getStyle(document.querySelector('.nav-brand-text')),
        navLink: getStyle(document.querySelector('.nav-link-item')),
        resumeBtn: getStyle(document.querySelector('.nav-resume-btn')),
      };
    })()`);

    auditReport.hero = await client.evaluate(`(() => {
      function getStyle(el) {
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return {
          text: el.textContent.trim().substring(0, 50),
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          lineHeight: cs.lineHeight,
          color: cs.color,
        };
      }
      return {
        eyebrow: getStyle(document.querySelector('.hero-eyebrow-tag')),
        description: getStyle(document.querySelector('.hero-editorial-description')),
        metricNum: getStyle(document.querySelector('.metric-num')),
        metricLbl: getStyle(document.querySelector('.metric-lbl')),
      };
    })()`);

    // 1B. ABOUT SECTION
    const aboutPos = await client.evaluate(`(() => {
      const el = document.getElementById('about');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return Math.round(r.top + window.scrollY);
    })()`);

    if (aboutPos) {
      await client.evaluate(`window.scrollTo({ top: ${aboutPos - 40}, behavior: 'instant' })`);
      await wait(800);
    }
    const shotAbout = path.join(targetDir, '02-about-editorial.png');
    await client.captureScreenshot(shotAbout);
    console.log(`Captured Screenshot 2 -> ${shotAbout}`);

    auditReport.about = await client.evaluate(`(() => {
      function getStyle(el) {
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return {
          text: el.textContent.trim().substring(0, 50),
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          lineHeight: cs.lineHeight,
          color: cs.color,
        };
      }
      return {
        leadText: getStyle(document.querySelector('.about-editorial-lead')),
        subText: getStyle(document.querySelector('.about-editorial-sub')),
        badge: getStyle(document.querySelector('.about-badge')),
        compTitle: getStyle(document.querySelector('.comp-card-title')),
        compSub: getStyle(document.querySelector('.comp-card-sub')),
        ideTab: getStyle(document.querySelector('.comp-ide-tab')),
        ideCode: getStyle(document.querySelector('.comp-ide-code')),
        ideTelemetry: getStyle(document.querySelector('.comp-ide-telemetry')),
        timelineHeading: getStyle(document.querySelector('.timeline-heading')),
        timelineInfo: getStyle(document.querySelector('.timeline-info')),
      };
    })()`);

    // 1C. SKILLS & ARCHITECTURE
    const skillsPos = await client.evaluate(`(() => {
      const el = document.getElementById('skills');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return Math.round(r.top + window.scrollY);
    })()`);

    if (skillsPos) {
      await client.evaluate(`window.scrollTo({ top: ${skillsPos - 40}, behavior: 'instant' })`);
      await wait(800);
    }
    const shotSkills = path.join(targetDir, '03-skills-orbit-focus.png');
    await client.captureScreenshot(shotSkills);
    console.log(`Captured Screenshot 3 -> ${shotSkills}`);

    auditReport.skills = await client.evaluate(`(() => {
      function getStyle(el) {
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return {
          text: el.textContent.trim().substring(0, 50),
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          lineHeight: cs.lineHeight,
          color: cs.color,
        };
      }
      return {
        intro: getStyle(document.querySelector('#skills p')),
        disciplineLabel: getStyle(document.querySelector('.discipline-compact-label')),
        orbitCenterSub: getStyle(document.querySelector('.orbit-center-sub')),
        orbitCenterEco: getStyle(document.querySelector('.orbit-center-eco')),
        portalLabel: getStyle(document.querySelector('.portal-label')),
        consoleStandby: getStyle(document.querySelector('.console-standby-text')),
      };
    })()`);

    // 1D. FEATURED PROJECTS
    const projectsPos = await client.evaluate(`(() => {
      const el = document.getElementById('projects');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return Math.round(r.top + window.scrollY);
    })()`);

    if (projectsPos) {
      await client.evaluate(`window.scrollTo({ top: ${projectsPos - 40}, behavior: 'instant' })`);
      await wait(800);
    }
    const shotProjects = path.join(targetDir, '04-featured-projects.png');
    await client.captureScreenshot(shotProjects);
    console.log(`Captured Screenshot 4 -> ${shotProjects}`);

    // 1E. BLOG / ENGINEERING JOURNAL
    const notesPos = await client.evaluate(`(() => {
      const el = document.getElementById('notes');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return Math.round(r.top + window.scrollY);
    })()`);

    if (notesPos) {
      await client.evaluate(`window.scrollTo({ top: ${notesPos - 40}, behavior: 'instant' })`);
      await wait(800);
    }
    const shotNotes = path.join(targetDir, '05-blog-journal.png');
    await client.captureScreenshot(shotNotes);
    console.log(`Captured Screenshot 5 -> ${shotNotes}`);

    auditReport.notes = await client.evaluate(`(() => {
      function getStyle(el) {
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return {
          text: el.textContent.trim().substring(0, 50),
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          lineHeight: cs.lineHeight,
          color: cs.color,
        };
      }
      return {
        intro: getStyle(document.querySelector('#notes p')),
        quote: getStyle(document.querySelector('.journal-quote-box blockquote')),
        quoteAuthor: getStyle(document.querySelector('.journal-quote-author')),
        cardTitle: getStyle(document.querySelector('.journal-card-title')),
        cardMeta: getStyle(document.querySelector('.journal-card-meta')),
        cardExcerpt: getStyle(document.querySelector('.journal-card-excerpt')),
        cardLink: getStyle(document.querySelector('.journal-read-link')),
      };
    })()`);

    // 1F. CONTACT & FOOTER
    const contactPos = await client.evaluate(`(() => {
      const el = document.getElementById('contact');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return Math.round(r.top + window.scrollY);
    })()`);

    if (contactPos) {
      await client.evaluate(`window.scrollTo({ top: ${contactPos - 40}, behavior: 'instant' })`);
      await wait(800);
    }
    const shotContact = path.join(targetDir, '06-contact-footer.png');
    await client.captureScreenshot(shotContact);
    console.log(`Captured Screenshot 6 -> ${shotContact}`);

    auditReport.finale = await client.evaluate(`(() => {
      function getStyle(el) {
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return {
          text: el.textContent.trim().substring(0, 50),
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          lineHeight: cs.lineHeight,
          color: cs.color,
        };
      }
      return {
        intro: getStyle(document.querySelector('#contact p')),
        contactPill: getStyle(document.querySelector('.contact-link-pill')),
        scriptBadge: getStyle(document.querySelector('.finale-script-badge')),
        footerText: getStyle(document.querySelector('.site-footer p')),
      };
    })()`);

    // -------------------------------------------------------------
    // 2. BLOG ARTICLE DETAIL PAGE (1440x900)
    // -------------------------------------------------------------
    console.log('\nNavigating to http://localhost:3000/notes/building-scalable-apis-with-laravel...');
    await client.navigate('http://localhost:3000/notes/building-scalable-apis-with-laravel');
    await wait(1000);
    await client.evaluate(`window.scrollTo({ top: 0, behavior: 'instant' })`);
    await wait(500);

    const shotArticle = path.join(targetDir, '07-blog-article.png');
    await client.captureScreenshot(shotArticle);
    console.log(`Captured Screenshot 7 -> ${shotArticle}`);

    auditReport.articlePage = await client.evaluate(`(() => {
      function getStyle(el) {
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return {
          text: el.textContent.trim().substring(0, 50),
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          lineHeight: cs.lineHeight,
          color: cs.color,
        };
      }
      return {
        metaHeader: getStyle(document.querySelector('.article-meta-header')),
        abstractLead: getStyle(document.querySelector('.article-abstract-lead')),
        bodyParagraph: getStyle(document.querySelector('.article-body p')),
        codeBlock: getStyle(document.querySelector('.article-body pre code')),
        authorBio: getStyle(document.querySelector('.article-author-bio')),
      };
    })()`);

    // -------------------------------------------------------------
    // 3. MOBILE VIEWPORTS (390x844)
    // -------------------------------------------------------------
    console.log('\nTesting Mobile Viewport 390x844...');
    await client.setViewport(390, 844, true);

    // Mobile Homepage
    await client.navigate('http://localhost:3000');
    await wait(1000);
    const shotMobileHome = path.join(targetDir, '08-mobile-homepage.png');
    await client.captureScreenshot(shotMobileHome);
    console.log(`Captured Screenshot 8 -> ${shotMobileHome}`);

    // Mobile Blog Article
    await client.navigate('http://localhost:3000/notes/building-scalable-apis-with-laravel');
    await wait(1000);
    const shotMobileArticle = path.join(targetDir, '09-mobile-blog-article.png');
    await client.captureScreenshot(shotMobileArticle);
    console.log(`Captured Screenshot 9 -> ${shotMobileArticle}`);

    // Write audit report file
    fs.writeFileSync(auditReportFile, JSON.stringify(auditReport, null, 2));
    console.log(`\nAudit Report written to: ${auditReportFile}`);

  } catch (err) {
    console.error('Audit run error:', err);
  } finally {
    client.close();
    braveProcess.kill('SIGKILL');
  }
}

run();
