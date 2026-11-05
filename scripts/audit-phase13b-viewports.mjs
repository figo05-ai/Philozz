import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = '/home/figo/Desktop/Philo/verification/phase13b-audit';
const ARTIFACTS_DIR = '/home/figo/.gemini/antigravity/brain/6922c74a-36fb-4f62-b5ad-d94056efd60f';

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

const VIEWPORTS = [
  { name: '360x740_android', width: 360, height: 740, mobile: true },
  { name: '375x812_iphone_mini', width: 375, height: 812, mobile: true },
  { name: '390x844_iphone13', width: 390, height: 844, mobile: true },
  { name: '430x932_iphone_max', width: 430, height: 932, mobile: true },
  { name: '768x1024_ipad_portrait', width: 768, height: 1024, mobile: true },
  { name: '1024x768_tablet_landscape', width: 1024, height: 768, mobile: false },
  { name: '1440x900_desktop', width: 1440, height: 900, mobile: false },
];

async function main() {
  const port = 9388;
  const brave = spawn('/usr/bin/brave-browser', [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--no-sandbox',
    '--disable-gpu',
  ]);

  await new Promise((r) => setTimeout(r, 1500));
  const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
  const ws = new WebSocket(list[0].webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));

  let id = 1;
  const pending = new Map();
  const consoleMessages = [];

  ws.addEventListener('message', (e) => {
    const data = JSON.parse(e.data);
    if (data.id && pending.has(data.id)) {
      const resolve = pending.get(data.id);
      pending.delete(data.id);
      resolve(data.result);
    }
    if (data.method === 'Console.messageAdded') {
      consoleMessages.push(data.params.message);
    }
    if (data.method === 'Runtime.consoleAPICalled') {
      consoleMessages.push({
        type: data.params.type,
        args: data.params.args.map((a) => a.value || a.description || a),
      });
    }
  });

  function call(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async function capture(filename) {
    const res = await call('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(res.data, 'base64');
    fs.writeFileSync(path.join(OUT_DIR, filename), buf);
    fs.writeFileSync(path.join(ARTIFACTS_DIR, filename), buf);
    console.log(`[Captured] ${filename}`);
  }

  await call('Page.enable');
  await call('DOM.enable');
  await call('Console.enable');
  await call('Runtime.enable');

  const auditReport = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n======================================================`);
    console.log(`Auditing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`======================================================`);

    await call('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.mobile ? 2 : 1,
      mobile: vp.mobile,
    });

    await call('Page.navigate', { url: 'http://localhost:3000' });
    await new Promise((r) => setTimeout(r, 2200));

    // Audit 1: Check Horizontal Overflow on initial load
    const overflowMetrics = await call('Runtime.evaluate', {
      expression: `(() => {
        const docWidth = document.documentElement.scrollWidth;
        const bodyWidth = document.body.scrollWidth;
        const winWidth = window.innerWidth;
        const hasOverflow = docWidth > winWidth || bodyWidth > winWidth;
        
        // Find offending elements causing horizontal overflow if any
        const offendingElements = [];
        if (hasOverflow) {
          document.querySelectorAll('*').forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.right > winWidth + 1) {
              offendingElements.push({
                tag: el.tagName,
                className: el.className,
                id: el.id,
                right: rect.right,
                width: rect.width,
              });
            }
          });
        }

        return {
          winWidth,
          docWidth,
          bodyWidth,
          hasOverflow,
          overflowDelta: Math.max(docWidth, bodyWidth) - winWidth,
          offendingElements: offendingElements.slice(0, 10),
        };
      })()`,
      returnByValue: true,
    });

    // Audit 2: Hero Section Elements
    const heroMetrics = await call('Runtime.evaluate', {
      expression: `(() => {
        const headline = document.querySelector('.hero-headline, h1');
        const portrait = document.querySelector('.hero-mobile-visual-img, .hero-cinematic-portrait, .hero-portrait-wrap img');
        const frame = document.querySelector('.hero-mobile-visual-frame');
        const ctas = Array.from(document.querySelectorAll('.hero-actions a, .hero-cta a, .btn-primary-gold, .btn-outline-gold')).map(el => {
          const r = el.getBoundingClientRect();
          return { text: el.textContent.trim(), width: r.width, height: r.height };
        });
        const hamburger = document.querySelector('.nav-mobile-toggle');
        const hamburgerRect = hamburger ? hamburger.getBoundingClientRect() : null;

        return {
          headlineText: headline ? headline.textContent.trim().slice(0, 50) : null,
          frameDisplay: frame ? window.getComputedStyle(frame).display : null,
          portraitVisible: !!portrait,
          ctas,
          hamburger: hamburgerRect ? { width: hamburgerRect.width, height: hamburgerRect.height } : null,
        };
      })()`,
      returnByValue: true,
    });

    // Audit 3: Section Headers & Cards Readability
    const sectionsStatus = await call('Runtime.evaluate', {
      expression: `(() => {
        const sections = ['#home', '#about', '#skills', '#projects', '#blog', '#contact'];
        return sections.map(id => {
          const el = document.querySelector(id);
          if (!el) return { id, exists: false };
          const rect = el.getBoundingClientRect();
          const headings = Array.from(el.querySelectorAll('h2, h3')).map(h => ({
            tag: h.tagName,
            text: h.textContent.trim().slice(0, 40),
            fontSize: window.getComputedStyle(h).fontSize,
          }));
          return {
            id,
            exists: true,
            height: rect.height,
            headings,
          };
        });
      })()`,
      returnByValue: true,
    });

    console.log('Overflow status:', overflowMetrics.result.value);
    console.log('Hero metrics:', heroMetrics.result.value);

    await capture(`audit-${vp.name}-hero.png`);

    // Scroll to Skills and check tech orbit / portals on this viewport
    await call('Runtime.evaluate', {
      expression: `(() => {
        const el = document.querySelector('#skills');
        if (el) el.scrollIntoView({ behavior: 'instant' });
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));

    // Audit 4: Tech Orbit & Focus Mode interactive metrics
    const skillsMetrics = await call('Runtime.evaluate', {
      expression: `(() => {
        const techNodes = Array.from(document.querySelectorAll('.tech-node, .orbit-node, [data-tech]')).map(el => {
          const r = el.getBoundingClientRect();
          return { id: el.getAttribute('data-tech') || el.textContent.trim(), width: r.width, height: r.height };
        });
        const portals = Array.from(document.querySelectorAll('.portal-card, .blackhole-card')).map(el => {
          const r = el.getBoundingClientRect();
          return { text: el.textContent.trim().slice(0, 30), width: r.width, height: r.height };
        });
        const focusCard = document.querySelector('.tech-focus-card, .tech-detail-panel');
        return {
          techNodesCount: techNodes.length,
          techNodesSample: techNodes.slice(0, 3),
          portalsCount: portals.length,
          portalsSample: portals.slice(0, 2),
          hasFocusCard: !!focusCard,
        };
      })()`,
      returnByValue: true,
    });
    console.log('Skills metrics:', skillsMetrics.result.value);
    await capture(`audit-${vp.name}-skills.png`);

    // Scroll through all sections and check for overflow at each section
    const sectionOverflows = [];
    for (const sec of ['#about', '#projects', '#blog', '#contact']) {
      await call('Runtime.evaluate', {
        expression: `(() => {
          const el = document.querySelector('${sec}');
          if (el) el.scrollIntoView({ behavior: 'instant' });
        })()`,
      });
      await new Promise((r) => setTimeout(r, 500));
      const check = await call('Runtime.evaluate', {
        expression: `(() => {
          const docW = document.documentElement.scrollWidth;
          const winW = window.innerWidth;
          return { sec: '${sec}', hasOverflow: docW > winW, delta: docW - winW };
        })()`,
        returnByValue: true,
      });
      if (check.result.value.hasOverflow) {
        sectionOverflows.push(check.result.value);
      }
    }

    if (sectionOverflows.length > 0) {
      console.warn(`[WARNING] Overflow detected on ${vp.name}:`, sectionOverflows);
    } else {
      console.log(`[PASS] No overflow detected at any section on ${vp.name}`);
    }

    auditReport.push({
      viewport: vp.name,
      dimensions: `${vp.width}x${vp.height}`,
      overflow: overflowMetrics.result.value,
      sectionOverflows,
      hero: heroMetrics.result.value,
      skills: skillsMetrics.result.value,
      sections: sectionsStatus.result.value,
    });
  }

  // Summary output
  console.log('\n======================================================');
  console.log('FULL AUDIT REPORT SUMMARY');
  console.log('======================================================');
  for (const rep of auditReport) {
    console.log(`${rep.viewport} (${rep.dimensions}): Overflow=${rep.overflow.hasOverflow ? 'YES (+' + rep.overflow.overflowDelta + 'px)' : 'NO'}, SectionOverflows=${rep.sectionOverflows.length}`);
    if (rep.overflow.hasOverflow) {
      console.log('Offenders:', rep.overflow.offendingElements);
    }
  }

  ws.close();
  brave.kill();
  process.exit(0);
}

main();
