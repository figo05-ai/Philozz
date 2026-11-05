import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = '/home/figo/Desktop/Philo/verification/phase13a-investigation';
const ARTIFACTS_DIR = '/home/figo/.gemini/antigravity/brain/6922c74a-36fb-4f62-b5ad-d94056efd60f';

async function main() {
  const port = 9398;
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
  const exceptions = [];

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
        stackTrace: data.params.stackTrace,
      });
    }
    if (data.method === 'Runtime.exceptionThrown') {
      exceptions.push(data.params.exceptionDetails);
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
    console.log(`Saved screenshot: ${filename}`);
  }

  async function checkOverlayStatus() {
    return await call('Runtime.evaluate', {
      expression: `(() => {
        const portal = document.querySelector('nextjs-portal');
        if (!portal || !portal.shadowRoot) return { found: false };
        const sr = portal.shadowRoot;
        const badge = sr.querySelector('[data-next-badge]');
        const isError = badge ? badge.getAttribute('data-error') : null;
        const text = sr.textContent || '';
        const issuesOpen = sr.querySelector('[data-issues-open]');
        const issuesCount = sr.querySelector('[data-issues-count-animation]');
        const errorDialog = sr.querySelector('[data-nextjs-dialog]');
        const redElements = Array.from(sr.querySelectorAll('*')).filter(el => {
          const bg = window.getComputedStyle(el).backgroundColor;
          return bg.includes('202') || bg.includes('229') || bg.includes('red');
        });

        return {
          found: true,
          badgeExists: !!badge,
          isError,
          badgeText: badge ? badge.textContent : null,
          issuesOpenText: issuesOpen ? issuesOpen.textContent : null,
          issuesCountText: issuesCount ? issuesCount.textContent : null,
          errorDialog: errorDialog ? errorDialog.textContent : null,
          rawText: text.slice(0, 500),
        };
      })()`,
      returnByValue: true,
    });
  }

  try {
    await call('Page.enable');
    await call('DOM.enable');
    await call('Console.enable');
    await call('Runtime.enable');

    const routes = [
      '/',
      '/projects',
      '/blog',
      '/work/skillup-platform',
      '/notes/building-scalable-apis-laravel',
    ];

    for (const route of routes) {
      console.log(`\n========================================`);
      console.log(`Testing Route: ${route}`);
      console.log(`========================================`);
      consoleMessages.length = 0;
      exceptions.length = 0;

      await call('Page.navigate', { url: `http://localhost:3000${route}` });
      await new Promise((r) => setTimeout(r, 2500));

      const status = await checkOverlayStatus();
      console.log(`Status on ${route}:`, JSON.stringify(status.value, null, 2));

      const safeName = route.replace(/[^a-zA-Z0-9]/g, '_');
      await capture(`route${safeName}.png`);

      if (consoleMessages.length > 0) {
        console.log(`Console messages on ${route}:`, JSON.stringify(consoleMessages, null, 2));
      }
      if (exceptions.length > 0) {
        console.log(`Exceptions on ${route}:`, JSON.stringify(exceptions, null, 2));
      }
    }

    // Now test scrolling on Homepage
    console.log(`\n========================================`);
    console.log(`Testing Full Scroll on Homepage`);
    console.log(`========================================`);
    await call('Page.navigate', { url: 'http://localhost:3000/' });
    await new Promise((r) => setTimeout(r, 2500));

    // Scroll gradually through page
    const totalHeightRes = await call('Runtime.evaluate', {
      expression: 'document.documentElement.scrollHeight',
      returnByValue: true,
    });
    const totalHeight = totalHeightRes.value;
    console.log('Total scroll height:', totalHeight);

    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      const top = Math.round((i / steps) * totalHeight);
      await call('Runtime.evaluate', {
        expression: `window.scrollTo({ top: ${top}, behavior: 'instant' })`,
      });
      await new Promise((r) => setTimeout(r, 600));

      const status = await checkOverlayStatus();
      if (status.value && status.value.isError === 'true') {
        console.log(`!!! RED ERROR BADGE DETECTED at scroll ${top} (${(i/steps)*100}%) !!!`);
        console.log(JSON.stringify(status.value, null, 2));
        await capture(`error-at-scroll-${i}.png`);
        break;
      }
    }

    // Reverse scroll
    console.log('Testing Reverse Scroll ...');
    for (let i = steps - 1; i >= 0; i--) {
      const top = Math.round((i / steps) * totalHeight);
      await call('Runtime.evaluate', {
        expression: `window.scrollTo({ top: ${top}, behavior: 'instant' })`,
      });
      await new Promise((r) => setTimeout(r, 300));
    }

    const finalStatus = await checkOverlayStatus();
    console.log('Final Status after scroll:', JSON.stringify(finalStatus.value, null, 2));

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    ws.close();
    brave.kill();
    process.exit(0);
  }
}

main();
