import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 3005;
const CDP_PORT = 9444;

const TEST_PAGES = [
  { name: 'Homepage', url: `http://localhost:${PORT}/` },
  { name: 'Projects Archive', url: `http://localhost:${PORT}/projects` },
  { name: 'Blog Archive', url: `http://localhost:${PORT}/blog` },
  { name: 'Case Study: SkillUp', url: `http://localhost:${PORT}/work/skillup-platform` },
  { name: 'Article: Scalable APIs', url: `http://localhost:${PORT}/notes/building-scalable-apis-with-laravel` },
];

async function run() {
  const mode = process.argv[2] || 'baseline';
  console.log(`\n==================================================`);
  console.log(`Starting Phase 14 Performance Benchmark [Mode: ${mode.toUpperCase()}]`);
  console.log(`==================================================\n`);

  const brave = spawn('/usr/bin/brave-browser', [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--no-sandbox',
    '--disable-gpu',
    '--enable-features=NetworkService,NetworkServiceInProcess',
  ]);

  await new Promise((r) => setTimeout(r, 1500));
  const list = await fetch(`http://127.0.0.1:${CDP_PORT}/json`).then((r) => r.json());
  const ws = new WebSocket(list[0].webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));

  let id = 1;
  const pending = new Map();
  let networkBytes = { js: 0, css: 0, img: 0, font: 0, total: 0, count: 0 };

  ws.addEventListener('message', (e) => {
    const data = JSON.parse(e.data);
    if (data.id && pending.has(data.id)) {
      const resolve = pending.get(data.id);
      pending.delete(data.id);
      resolve(data.result);
    }
    if (data.method === 'Network.responseReceived') {
      networkBytes.count++;
      // We will also track in dataReceived / loadingFinished
    }
    if (data.method === 'Network.dataReceived') {
      const len = data.params.encodedDataLength || data.params.dataLength || 0;
      networkBytes.total += len;
    }
  });

  function call(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async function evaluate(expression) {
    const res = await call('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res && res.result ? res.result.value : null;
  }

  await call('Page.enable');
  await call('DOM.enable');
  await call('Network.enable');

  const results = [];

  for (const profile of ['Desktop', 'Mobile']) {
    console.log(`\n--- Profiling Profile: ${profile} ---`);

    for (const testPage of TEST_PAGES) {
      networkBytes = { js: 0, css: 0, img: 0, font: 0, total: 0, count: 0 };
      await call('Network.clearBrowserCache');
      await call('Network.clearBrowserCookies');

      if (profile === 'Desktop') {
        await call('Emulation.setDeviceMetricsOverride', {
          width: 1440,
          height: 900,
          deviceScaleFactor: 1,
          mobile: false,
        });
        await call('Emulation.setCPUThrottlingRate', { rate: 1 });
        await call('Network.emulateNetworkConditions', {
          offline: false,
          latency: 0,
          downloadThroughput: -1,
          uploadThroughput: -1,
        });
      } else {
        await call('Emulation.setDeviceMetricsOverride', {
          width: 390,
          height: 844,
          deviceScaleFactor: 3,
          mobile: true,
        });
        await call('Emulation.setCPUThrottlingRate', { rate: 4 }); // 4x mobile CPU slowdown
        await call('Network.emulateNetworkConditions', {
          offline: false,
          latency: 40,
          downloadThroughput: (4 * 1024 * 1024) / 8, // Fast 4G / simulated mobile
          uploadThroughput: (1.5 * 1024 * 1024) / 8,
        });
      }

      // Inject observer before page load
      await call('Page.addScriptToEvaluateOnNewDocument', {
        source: `
          window.__perfMetrics = {
            fcp: 0,
            lcp: 0,
            cls: 0,
            tbt: 0,
            longTasks: [],
            lcpElement: '',
          };
          
          try {
            // FCP
            new PerformanceObserver((entryList) => {
              for (const entry of entryList.getEntries()) {
                if (entry.name === 'first-contentful-paint') {
                  window.__perfMetrics.fcp = entry.startTime;
                }
              }
            }).observe({ type: 'paint', buffered: true });

            // LCP
            new PerformanceObserver((entryList) => {
              const entries = entryList.getEntries();
              const lastEntry = entries[entries.length - 1];
              if (lastEntry) {
                window.__perfMetrics.lcp = lastEntry.startTime;
                if (lastEntry.element) {
                  window.__perfMetrics.lcpElement = (lastEntry.element.tagName || '') + '.' + (lastEntry.element.className || '');
                }
              }
            }).observe({ type: 'largest-contentful-paint', buffered: true });

            // CLS
            new PerformanceObserver((entryList) => {
              for (const entry of entryList.getEntries()) {
                if (!entry.hadRecentInput) {
                  window.__perfMetrics.cls += entry.value;
                }
              }
            }).observe({ type: 'layout-shift', buffered: true });

            // Long tasks / TBT calculation
            new PerformanceObserver((entryList) => {
              for (const entry of entryList.getEntries()) {
                window.__perfMetrics.longTasks.push({
                  startTime: entry.startTime,
                  duration: entry.duration,
                });
                if (entry.duration > 50) {
                  window.__perfMetrics.tbt += (entry.duration - 50);
                }
              }
            }).observe({ type: 'longtask', buffered: true });
          } catch (e) {
            console.error('PerfObserver init error', e);
          }
        `,
      });

      console.log(`[Measuring] ${testPage.name} (${profile})...`);
      await call('Page.navigate', { url: testPage.url });
      await new Promise((r) => setTimeout(r, profile === 'Mobile' ? 3500 : 2500));

      // Extract metrics
      const clientMetrics = await evaluate(`
        (() => {
          const nav = performance.getEntriesByType('navigation')[0] || {};
          const resources = performance.getEntriesByType('resource');
          let jsBytes = 0, cssBytes = 0, imgBytes = 0, fontBytes = 0, totalBytes = 0;
          for (const r of resources) {
            const size = r.transferSize || r.encodedBodySize || 0;
            totalBytes += size;
            const initiator = r.initiatorType;
            const name = r.name.toLowerCase();
            if (initiator === 'script' || name.endsWith('.js') || name.includes('/_next/static/chunks/')) {
              jsBytes += size;
            } else if (initiator === 'css' || name.endsWith('.css')) {
              cssBytes += size;
            } else if (initiator === 'img' || name.match(/\\.(png|jpg|jpeg|webp|avif|svg)/)) {
              imgBytes += size;
            } else if (name.match(/fonts\\.(googleapis|gstatic)\\.com/) || name.match(/\\.(woff2?|ttf|otf)/)) {
              fontBytes += size;
            }
          }
          const memory = performance.memory ? {
            usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024 * 10) / 10,
            totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024 * 10) / 10,
          } : null;

          return {
            fcp: Math.round(window.__perfMetrics.fcp || (performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0)),
            lcp: Math.round(window.__perfMetrics.lcp || 0),
            lcpElement: window.__perfMetrics.lcpElement || '',
            cls: Number(window.__perfMetrics.cls.toFixed(4)),
            tbt: Math.round(window.__perfMetrics.tbt),
            domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
            loadComplete: Math.round(nav.loadEventEnd || 0),
            resourceCount: resources.length,
            jsBytes: Math.round(jsBytes / 1024),
            cssBytes: Math.round(cssBytes / 1024),
            imgBytes: Math.round(imgBytes / 1024),
            fontBytes: Math.round(fontBytes / 1024),
            totalTransferKB: Math.round(totalBytes / 1024),
            memory,
            longTaskCount: window.__perfMetrics.longTasks.length,
          };
        })()
      `);

      // Test scroll responsiveness
      const scrollResult = await evaluate(`
        new Promise((resolve) => {
          let frames = 0;
          let lastTime = performance.now();
          const start = performance.now();
          const totalDistance = Math.min(document.body.scrollHeight - window.innerHeight, 3000);
          
          function onFrame(now) {
            frames++;
            const elapsed = now - start;
            if (elapsed < 1500) {
              const progress = elapsed / 1500;
              window.scrollTo(0, progress * totalDistance);
              requestAnimationFrame(onFrame);
            } else {
              window.scrollTo(0, 0);
              const totalElapsed = (now - start) / 1000;
              const fps = Math.round(frames / totalElapsed);
              resolve({ fps, frames });
            }
          }
          requestAnimationFrame(onFrame);
        })
      `);

      const resObj = {
        page: testPage.name,
        profile,
        url: testPage.url,
        metrics: clientMetrics,
        scrollFPS: scrollResult ? scrollResult.fps : null,
      };

      console.log(
        `  -> FCP: ${clientMetrics.fcp}ms | LCP: ${clientMetrics.lcp}ms (${clientMetrics.lcpElement || 'none'}) | CLS: ${clientMetrics.cls} | TBT: ${clientMetrics.tbt}ms | JS: ${clientMetrics.jsBytes}KB | Total: ${clientMetrics.totalTransferKB}KB | ScrollFPS: ${scrollResult?.fps || 'N/A'}`
      );

      results.push(resObj);
    }
  }

  const outPath = path.join(process.cwd(), `perf-audit-${mode}.json`);
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\nAudit results written to: ${outPath}`);

  brave.kill('SIGKILL');
  process.exit(0);
}

run().catch((err) => {
  console.error('Benchmark error:', err);
  process.exit(1);
});
