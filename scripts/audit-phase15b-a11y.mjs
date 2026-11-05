import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 3005;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const AXE_SRC = fs.readFileSync(
  path.resolve(process.cwd(), 'node_modules/axe-core/axe.min.js'),
  'utf8'
);

const ROUTES = [
  { name: 'Homepage (Desktop)', path: '/', viewport: { width: 1440, height: 900 } },
  { name: 'Projects Archive', path: '/projects', viewport: { width: 1440, height: 900 } },
  { name: 'Blog Archive', path: '/blog', viewport: { width: 1440, height: 900 } },
  { name: 'Case Study (SkillUp)', path: '/work/skillup-platform', viewport: { width: 1440, height: 900 } },
  { name: 'Article (Laravel Scalable APIs)', path: '/notes/building-scalable-apis-with-laravel', viewport: { width: 1440, height: 900 } },
  { name: '404 Page', path: '/non-existent-page-xyz', viewport: { width: 1440, height: 900 } },
  { name: 'Homepage Mobile (Drawer Closed)', path: '/', viewport: { width: 390, height: 844, mobile: true } },
  { name: 'Homepage Mobile (Drawer Open)', path: '/', viewport: { width: 390, height: 844, mobile: true }, openDrawer: true },
];

async function main() {
  console.log(`[Phase 15B Audit] Starting headless browser...`);
  const brave = spawn('/usr/bin/brave-browser', [
    '--headless=new',
    '--remote-debugging-port=9444',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
  ]);

  let closed = false;
  const cleanup = () => {
    if (!closed) {
      closed = true;
      brave.kill();
    }
  };
  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);

  await new Promise((r) => setTimeout(r, 1500));

  let list;
  try {
    list = await fetch('http://127.0.0.1:9444/json').then((r) => r.json());
  } catch (err) {
    console.error('Failed to connect to browser CDP:', err);
    cleanup();
    process.exit(1);
  }

  const ws = new WebSocket(list[0].webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));

  let msgId = 1;
  const pending = new Map();
  ws.addEventListener('message', (e) => {
    const data = JSON.parse(e.data);
    if (data.id && pending.has(data.id)) {
      const resolve = pending.get(data.id);
      pending.delete(data.id);
      resolve(data.result);
    }
  });

  function call(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await call('Page.enable');
  await call('Runtime.enable');
  await call('DOM.enable');

  const allResults = [];

  for (const route of ROUTES) {
    console.log(`\n========================================`);
    console.log(`Auditing: ${route.name} (${route.path})`);
    console.log(`Viewport: ${route.viewport.width}x${route.viewport.height}`);

    await call('Emulation.setDeviceMetricsOverride', {
      width: route.viewport.width,
      height: route.viewport.height,
      deviceScaleFactor: route.viewport.mobile ? 3 : 1,
      mobile: Boolean(route.viewport.mobile),
    });

    if (route.viewport.mobile) {
      await call('Emulation.setUserAgentOverride', {
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      });
    }

    const url = `${BASE_URL}${route.path}`;
    await call('Page.navigate', { url });

    // Wait for page to settle
    await new Promise((r) => setTimeout(r, 2000));

    // If testing mobile drawer, click toggle
    if (route.openDrawer) {
      console.log(`Opening mobile navigation drawer...`);
      const toggleRes = await call('Runtime.evaluate', {
        expression: `(() => {
          const btn = document.querySelector('.nav-mobile-toggle');
          if (btn) {
            btn.click();
            return { found: true, expanded: btn.getAttribute('aria-expanded') };
          }
          return { found: false };
        })()`,
        returnByValue: true,
      });
      console.log('Mobile toggle result:', toggleRes?.result?.value);
      await new Promise((r) => setTimeout(r, 600));
    }

    // Inject axe-core
    await call('Runtime.evaluate', {
      expression: AXE_SRC,
    });

    // Run axe.run()
    const axeResult = await call('Runtime.evaluate', {
      expression: `(async () => {
        try {
          const results = await axe.run(document, {
            runOnly: {
              type: 'tag',
              values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']
            }
          });
          return {
            violations: results.violations.map(v => ({
              id: v.id,
              impact: v.impact,
              description: v.description,
              help: v.help,
              helpUrl: v.helpUrl,
              nodesCount: v.nodes.length,
              nodes: v.nodes.slice(0, 5).map(n => ({
                html: n.html.slice(0, 200),
                target: n.target,
                failureSummary: n.failureSummary
              }))
            })),
            passesCount: results.passes.length,
            inapplicableCount: results.inapplicable.length,
            incompleteCount: results.incomplete.length,
          };
        } catch (e) {
          return { error: e.toString() };
        }
      })()`,
      awaitPromise: true,
      returnByValue: true,
    });

    const val = axeResult?.result?.value;
    if (!val || val.error) {
      console.error(`Error running axe:`, val?.error);
      allResults.push({ route: route.name, error: val?.error });
      continue;
    }

    // Also inspect landmarks and headings
    const structureResult = await call('Runtime.evaluate', {
      expression: `(() => {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
          tag: h.tagName,
          text: h.textContent.trim().slice(0, 60),
          visible: h.offsetParent !== null
        }));
        const landmarks = {
          main: Boolean(document.querySelector('main')),
          mainId: document.querySelector('main')?.id,
          nav: document.querySelectorAll('nav').length,
          header: document.querySelectorAll('header').length,
          footer: document.querySelectorAll('footer').length,
        };
        const skipLink = Boolean(document.querySelector('.skip-link, [href="#main-content"]'));
        return { headings, landmarks, skipLink };
      })()`,
      returnByValue: true,
    });

    const struct = structureResult?.result?.value;

    console.log(`Violations Found: ${val.violations.length}`);
    console.log(`Passes: ${val.passesCount}, Incomplete: ${val.incompleteCount}`);
    console.log(`Landmarks: main=${struct?.landmarks.main} (#${struct?.landmarks.mainId}), nav=${struct?.landmarks.nav}, header=${struct?.landmarks.header}`);
    console.log(`Skip link present: ${struct?.skipLink}`);

    if (val.violations.length > 0) {
      for (const v of val.violations) {
        console.log(`  [${v.impact?.toUpperCase()}] ${v.id}: ${v.help} (${v.nodesCount} nodes)`);
        for (const n of v.nodes) {
          console.log(`    Target: ${n.target.join(' ')}`);
          console.log(`    Snippet: ${n.html}`);
          if (n.failureSummary) {
            console.log(`    Issue: ${n.failureSummary.split('\n')[0]}`);
          }
        }
      }
    }

    allResults.push({
      route: route.name,
      path: route.path,
      viewport: route.viewport,
      violations: val.violations,
      passesCount: val.passesCount,
      incompleteCount: val.incompleteCount,
      structure: struct,
    });
  }

  // Save baseline JSON
  const outPath = path.resolve(process.cwd(), 'scripts/phase15b-baseline.json');
  fs.writeFileSync(outPath, JSON.stringify(allResults, null, 2));
  console.log(`\n========================================`);
  console.log(`Audit complete. Baseline saved to ${outPath}`);

  cleanup();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
