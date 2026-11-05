import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const VERIFY_DIR = path.resolve('/home/figo/Desktop/Philo/verification/sitewide-readability');
const BEFORE_DIR = path.join(VERIFY_DIR, 'before');
const AFTER_DIR = path.join(VERIFY_DIR, 'after');
const RESPONSIVE_DIR = path.join(VERIFY_DIR, 'responsive');

[BEFORE_DIR, AFTER_DIR, RESPONSIVE_DIR].forEach((dir) => {
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

function parseRgb(colorStr) {
  if (!colorStr) return [255, 255, 255];
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
  }
  return [255, 255, 255];
}

function getLuminance([r, g, b]) {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(rgb1, rgb2) {
  const l1 = getLuminance(rgb1);
  const l2 = getLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

async function run() {
  console.log(`=== RUNNING COMPREHENSIVE SITE-WIDE AFTER VERIFICATION ===\n`);
  const port = 9312;
  const { braveProcess, wsUrl } = await launchBrowser(port);
  const client = new CDPClient(wsUrl);
  await client.ready();
  await client.send('Page.enable');

  const afterReport = {
    timestamp: new Date().toISOString(),
    metrics: {},
    contrastAudit: {},
    responsiveMatrix: [],
  };

  try {
    // -------------------------------------------------------------
    // 1. CAPTURE AFTER SCREENSHOTS & COMPUTED METRICS (1440x900)
    // -------------------------------------------------------------
    await client.setViewport(1440, 900, false);
    console.log('Navigating to http://localhost:3000...');
    await client.navigate('http://localhost:3000');
    await wait(1000);

    // 1A. HERO & NAVBAR
    await client.evaluate(`window.scrollTo({ top: 0, behavior: 'instant' })`);
    await wait(800);
    const shotHero = path.join(AFTER_DIR, '01-navbar-hero.png');
    await client.captureScreenshot(shotHero);
    console.log(`Captured Screenshot 1 -> ${shotHero}`);

    afterReport.metrics.navbar = await client.evaluate(`(() => {
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
        brand: getStyle(document.querySelector('.nav-brand')),
        navLink: getStyle(document.querySelector('.nav-link-item')),
        resumeBtn: getStyle(document.querySelector('.nav-resume-btn')),
      };
    })()`);

    afterReport.metrics.hero = await client.evaluate(`(() => {
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
    const shotAbout = path.join(AFTER_DIR, '02-about-editorial.png');
    await client.captureScreenshot(shotAbout);
    console.log(`Captured Screenshot 2 -> ${shotAbout}`);

    afterReport.metrics.about = await client.evaluate(`(() => {
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
        leadText: getStyle(document.querySelector('.about-anim-text p:nth-of-type(1)')),
        subText: getStyle(document.querySelector('.about-anim-text p:nth-of-type(2)')),
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
    const shotSkills = path.join(AFTER_DIR, '03-skills-orbit-focus.png');
    await client.captureScreenshot(shotSkills);
    console.log(`Captured Screenshot 3 -> ${shotSkills}`);

    afterReport.metrics.skills = await client.evaluate(`(() => {
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
        intro: getStyle(document.querySelector('#skills .tech-col-left p')),
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
    const shotProjects = path.join(AFTER_DIR, '04-featured-projects.png');
    await client.captureScreenshot(shotProjects);
    console.log(`Captured Screenshot 4 -> ${shotProjects}`);

    // 1E. BLOG / ENGINEERING JOURNAL
    const notesPos = await client.evaluate(`(() => {
      const el = document.getElementById('blog') || document.getElementById('notes');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return Math.round(r.top + window.scrollY);
    })()`);

    if (notesPos) {
      await client.evaluate(`window.scrollTo({ top: ${notesPos - 40}, behavior: 'instant' })`);
      await wait(800);
    }
    const shotNotes = path.join(AFTER_DIR, '05-blog-journal.png');
    await client.captureScreenshot(shotNotes);
    console.log(`Captured Screenshot 5 -> ${shotNotes}`);

    afterReport.metrics.notes = await client.evaluate(`(() => {
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
        intro: getStyle(document.querySelector('#blog .container-editorial > div > p')),
        quote: getStyle(document.querySelector('.journal-quote-box blockquote')),
        quoteAuthor: getStyle(document.querySelector('.journal-quote-box > div:last-child')),
        cardTitle: getStyle(document.querySelector('.journal-article-title')),
        cardExcerpt: getStyle(document.querySelector('.journal-article-card p')),
        cardLink: getStyle(document.querySelector('.journal-article-card > div:last-child')),
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
    const shotContact = path.join(AFTER_DIR, '06-contact-footer.png');
    await client.captureScreenshot(shotContact);
    console.log(`Captured Screenshot 6 -> ${shotContact}`);

    afterReport.metrics.finale = await client.evaluate(`(() => {
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
        intro: getStyle(document.querySelector('#contact .finale-grid p')),
        contactPill: getStyle(document.querySelector('.contact-link-pill')),
        scriptBadge: getStyle(document.querySelector('.finale-script-badge div:last-child')),
        footerRole: getStyle(document.querySelector('.site-footer div:nth-child(1) div:last-child')),
        footerCopy: getStyle(document.querySelector('.site-footer div:last-child')),
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

    const shotArticle = path.join(AFTER_DIR, '07-blog-article.png');
    await client.captureScreenshot(shotArticle);
    console.log(`Captured Screenshot 7 -> ${shotArticle}`);

    afterReport.metrics.articlePage = await client.evaluate(`(() => {
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
        backBtn: getStyle(document.querySelector('header a[href="/#blog"]')),
        metaDate: getStyle(document.querySelector('header + main article header div span:nth-of-type(2)')),
        metaReadTime: getStyle(document.querySelector('header + main article header div span:nth-of-type(3)')),
        abstractLead: getStyle(document.querySelector('header + main article header p')),
        bodyHeading: getStyle(document.querySelector('header + main article section h2')),
        bodyParagraph: getStyle(document.querySelector('header + main article section p')),
        codeSnippet: getStyle(document.querySelector('header + main article pre code')),
        authorRole: getStyle(document.querySelector('header + main article .mosaic-card, header + main article div[style*="border-radius: 12px"] div:nth-child(2) div:nth-child(2)')),
        authorBio: getStyle(document.querySelector('header + main article div[style*="border-radius: 12px"] p')),
      };
    })()`);

    // -------------------------------------------------------------
    // 3. RESPONSIVE MATRIX TESTING (6 Viewports)
    // -------------------------------------------------------------
    console.log('\n=== TESTING RESPONSIVE MATRIX ACROSS 6 VIEWPORTS ===');
    const viewports = [
      { width: 1920, height: 1080, name: '1920x1080-desktop-large', mobile: false },
      { width: 1440, height: 900, name: '1440x900-desktop-standard', mobile: false },
      { width: 1024, height: 768, name: '1024x768-ipad-landscape', mobile: false },
      { width: 768, height: 1024, name: '768x1024-ipad-portrait', mobile: true },
      { width: 390, height: 844, name: '390x844-iphone14', mobile: true },
      { width: 360, height: 740, name: '360x740-compact-android', mobile: true },
    ];

    for (const vp of viewports) {
      await client.setViewport(vp.width, vp.height, vp.mobile);

      // Test Homepage
      await client.navigate('http://localhost:3000');
      await wait(600);

      const homeOverflow = await client.evaluate(`(() => {
        const docWidth = document.documentElement.scrollWidth;
        const bodyWidth = document.body.scrollWidth;
        const winWidth = window.innerWidth;
        const maxScroll = Math.max(docWidth, bodyWidth);
        return {
          windowWidth: winWidth,
          maxScrollWidth: maxScroll,
          hasHorizontalOverflow: maxScroll > winWidth,
          overflowDelta: Math.max(0, maxScroll - winWidth),
        };
      })()`);

      // Test Blog Article
      await client.navigate('http://localhost:3000/notes/building-scalable-apis-with-laravel');
      await wait(600);

      const articleOverflow = await client.evaluate(`(() => {
        const docWidth = document.documentElement.scrollWidth;
        const bodyWidth = document.body.scrollWidth;
        const winWidth = window.innerWidth;
        const maxScroll = Math.max(docWidth, bodyWidth);
        return {
          windowWidth: winWidth,
          maxScrollWidth: maxScroll,
          hasHorizontalOverflow: maxScroll > winWidth,
          overflowDelta: Math.max(0, maxScroll - winWidth),
        };
      })()`);

      afterReport.responsiveMatrix.push({
        viewport: `${vp.width}x${vp.height} (${vp.name})`,
        homepage: homeOverflow,
        articlePage: articleOverflow,
        status: !homeOverflow.hasHorizontalOverflow && !articleOverflow.hasHorizontalOverflow ? 'PASS' : 'FAIL',
      });

      console.log(`Viewport ${vp.width}x${vp.height} (${vp.name}): Home overflow: ${homeOverflow.hasHorizontalOverflow ? 'FAIL (' + homeOverflow.overflowDelta + 'px)' : 'PASS (0px)'} | Article overflow: ${articleOverflow.hasHorizontalOverflow ? 'FAIL (' + articleOverflow.overflowDelta + 'px)' : 'PASS (0px)'}`);

      // Capture representative responsive shots
      if (vp.width === 390) {
        await client.navigate('http://localhost:3000');
        await wait(600);
        const shotMobHome = path.join(AFTER_DIR, '08-mobile-homepage.png');
        await client.captureScreenshot(shotMobHome);
        console.log(`Captured Screenshot 8 -> ${shotMobHome}`);

        await client.navigate('http://localhost:3000/notes/building-scalable-apis-with-laravel');
        await wait(600);
        const shotMobArticle = path.join(AFTER_DIR, '09-mobile-blog-article.png');
        await client.captureScreenshot(shotMobArticle);
        console.log(`Captured Screenshot 9 -> ${shotMobArticle}`);
      }
    }

    // -------------------------------------------------------------
    // 4. WCAG CONTRAST COMPUTATION
    // -------------------------------------------------------------
    console.log('\n=== COMPUTING WCAG AA/AAA CONTRAST RATIOS ===');
    const darkBackdropRgb = [14, 14, 18]; // #0E0E12
    const charcoalCardRgb = [22, 22, 28]; // #16161C

    const elementsToCheck = [
      { name: 'Navbar Link Item', color: afterReport.metrics.navbar?.navLink?.color, bg: darkBackdropRgb },
      { name: 'Navbar Resume Button', color: afterReport.metrics.navbar?.resumeBtn?.color, bg: darkBackdropRgb },
      { name: 'Hero Eyebrow Tag', color: afterReport.metrics.hero?.eyebrow?.color, bg: darkBackdropRgb },
      { name: 'Hero Description', color: afterReport.metrics.hero?.description?.color, bg: darkBackdropRgb },
      { name: 'Hero Metric Label', color: afterReport.metrics.hero?.metricLbl?.color, bg: darkBackdropRgb },
      { name: 'About Narrative Lead', color: afterReport.metrics.about?.leadText?.color, bg: darkBackdropRgb },
      { name: 'About Narrative Sub', color: afterReport.metrics.about?.subText?.color, bg: darkBackdropRgb },
      { name: 'About Badge Text', color: afterReport.metrics.about?.badge?.color, bg: darkBackdropRgb },
      { name: 'About Comp Card Sub', color: afterReport.metrics.about?.compSub?.color, bg: charcoalCardRgb },
      { name: 'About IDE Code', color: afterReport.metrics.about?.ideCode?.color, bg: charcoalCardRgb },
      { name: 'About Timeline Detail', color: afterReport.metrics.about?.timelineInfo?.color, bg: charcoalCardRgb },
      { name: 'Skills Discipline Label', color: afterReport.metrics.skills?.disciplineLabel?.color, bg: charcoalCardRgb },
      { name: 'Skills Orbit Center Sub', color: afterReport.metrics.skills?.orbitCenterSub?.color, bg: darkBackdropRgb },
      { name: 'Skills Console Standby', color: afterReport.metrics.skills?.consoleStandby?.color, bg: charcoalCardRgb },
      { name: 'Notes Quote Author', color: afterReport.metrics.notes?.quoteAuthor?.color, bg: darkBackdropRgb },
      { name: 'Notes Card Excerpt', color: afterReport.metrics.notes?.cardExcerpt?.color, bg: charcoalCardRgb },
      { name: 'Notes Read Link', color: afterReport.metrics.notes?.cardLink?.color, bg: charcoalCardRgb },
      { name: 'Finale Contact Pill', color: afterReport.metrics.finale?.contactPill?.color, bg: charcoalCardRgb },
      { name: 'Finale Footer Role', color: afterReport.metrics.finale?.footerRole?.color, bg: darkBackdropRgb },
    ];

    for (const item of elementsToCheck) {
      if (!item.color) continue;
      const fgRgb = parseRgb(item.color);
      const ratio = getContrastRatio(fgRgb, item.bg);
      const passesAA = ratio >= 4.5;
      const passesAAA = ratio >= 7.0;
      afterReport.contrastAudit[item.name] = {
        color: item.color,
        ratio: `${ratio}:1`,
        wcagAA: passesAA ? 'PASS (≥ 4.5:1)' : 'FAIL',
        wcagAAA: passesAAA ? 'PASS (≥ 7.0:1)' : 'INFO',
      };
      console.log(`[Contrast] ${item.name}: ${ratio}:1 (${item.color}) -> ${passesAA ? 'PASS AA' : 'FAIL AA'}${passesAAA ? ' & AAA' : ''}`);
    }

    // Write final report
    const reportPath = path.join(VERIFY_DIR, 'audit-report-after.json');
    fs.writeFileSync(reportPath, JSON.stringify(afterReport, null, 2));
    console.log(`\nVerification report saved to: ${reportPath}`);

  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    client.close();
    braveProcess.kill('SIGKILL');
  }
}

run();
