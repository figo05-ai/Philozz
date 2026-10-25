import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = '/home/figo/Desktop/Philo/verification/phase13a-investigation';
const ARTIFACTS_DIR = '/home/figo/.gemini/antigravity/brain/6922c74a-36fb-4f62-b5ad-d94056efd60f';

async function main() {
  const brave = spawn('/usr/bin/brave-browser', [
    '--headless=new',
    '--remote-debugging-port=9396',
    '--no-sandbox',
    '--disable-gpu',
  ]);
  await new Promise((r) => setTimeout(r, 1500));
  const list = await fetch('http://127.0.0.1:9396/json').then((r) => r.json());
  const ws = new WebSocket(list[0].webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));

  let id = 1;
  const pending = new Map();
  const logs = [];
  const exceptions = [];

  ws.addEventListener('message', (e) => {
    const data = JSON.parse(e.data);
    if (data.id && pending.has(data.id)) {
      const resolve = pending.get(data.id);
      pending.delete(data.id);
      resolve(data.result);
    }
    if (data.method === 'Console.messageAdded') {
      logs.push(data.params.message);
    }
    if (data.method === 'Runtime.consoleAPICalled') {
      logs.push({
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

  async function checkBadge() {
    const res = await call('Runtime.evaluate', {
      expression: `(() => {
        const portal = document.querySelector('nextjs-portal');
        if (!portal || !portal.shadowRoot) return { exists: false };
        const badge = portal.shadowRoot.querySelector('[data-next-badge]');
        const issuesOpen = portal.shadowRoot.querySelector('[data-issues-open]');
        const isError = badge ? badge.getAttribute('data-error') : null;
        const text = portal.shadowRoot.textContent || '';
        return {
          exists: true,
          isError,
          badgeText: badge ? badge.textContent : null,
          issuesOpenText: issuesOpen ? issuesOpen.textContent : null,
          rawPreview: text.slice(0, 300),
        };
      })()`,
      returnByValue: true,
    });
    return res.result.value;
  }

  await call('Page.enable');
  await call('DOM.enable');
  await call('Console.enable');
  await call('Runtime.enable');
  await call('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  console.log('--- 1. Testing Homepage Initial Load ---');
  await call('Page.navigate', { url: 'http://localhost:3000/' });
  await new Promise((r) => setTimeout(r, 3000));
  let badge = await checkBadge();
  console.log('Badge status on homepage:', badge);

  console.log('--- 2. Testing Clicking Nav Links ---');
  const navLinks = ['#about', '#skills', '#projects', '#blog', '#contact'];
  for (const hash of navLinks) {
    await call('Runtime.evaluate', {
      expression: `(() => {
        const link = document.querySelector('a[href="${hash}"]');
        if (link) link.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1200));
    badge = await checkBadge();
    if (badge.isError === 'true') {
      console.log(`Badge became ERROR on nav to ${hash}:`, badge);
      await capture(`badge-error-${hash.replace('#','')}.png`);
    }
  }

  console.log('--- 3. Testing Skill Orbit Focus Mode & Portals ---');
  await call('Runtime.evaluate', {
    expression: `(() => {
      // Find interactive nodes or portal buttons in skills
      const buttons = Array.from(document.querySelectorAll('#skills button, #skills [role="button"], .portal-card, .tech-node'));
      if (buttons[0]) buttons[0].click();
    })()`,
  });
  await new Promise((r) => setTimeout(r, 1500));
  badge = await checkBadge();
  console.log('Badge after skill click:', badge);

  console.log('--- 4. Testing Navigation to /projects and back ---');
  await call('Page.navigate', { url: 'http://localhost:3000/projects' });
  await new Promise((r) => setTimeout(r, 2500));
  badge = await checkBadge();
  console.log('Badge on /projects:', badge);
  await capture('projects-view.png');

  // Click Back to Portfolio
  await call('Runtime.evaluate', {
    expression: `(() => {
      const back = document.querySelector('a[href="/"]');
      if (back) back.click();
    })()`,
  });
  await new Promise((r) => setTimeout(r, 2500));
  badge = await checkBadge();
  console.log('Badge after returning from /projects to /:', badge);

  console.log('--- 5. Testing Navigation to /blog and back ---');
  await call('Page.navigate', { url: 'http://localhost:3000/blog' });
  await new Promise((r) => setTimeout(r, 2500));
  badge = await checkBadge();
  console.log('Badge on /blog:', badge);
  await capture('blog-view.png');

  // Click Back to Portfolio
  await call('Runtime.evaluate', {
    expression: `(() => {
      const back = document.querySelector('a[href="/"]');
      if (back) back.click();
    })()`,
  });
  await new Promise((r) => setTimeout(r, 2500));
  badge = await checkBadge();
  console.log('Badge after returning from /blog to /:', badge);

  console.log('--- 6. Testing Navigation to Case Study /work/skillup-platform and back ---');
  await call('Page.navigate', { url: 'http://localhost:3000/work/skillup-platform' });
  await new Promise((r) => setTimeout(r, 2500));
  badge = await checkBadge();
  console.log('Badge on /work/skillup-platform:', badge);
  await capture('case-study-view.png');

  console.log('--- 7. Testing Navigation to Note /notes/building-scalable-apis-with-laravel and back ---');
  await call('Page.navigate', { url: 'http://localhost:3000/notes/building-scalable-apis-with-laravel' });
  await new Promise((r) => setTimeout(r, 2500));
  badge = await checkBadge();
  console.log('Badge on /notes/building-scalable-apis-with-laravel:', badge);
  await capture('note-detail-view.png');

  // Check if any exceptions were thrown
  console.log('\n--- Exceptions Summary ---');
  console.log('Total exceptions:', exceptions.length);
  if (exceptions.length > 0) {
    console.log(JSON.stringify(exceptions, null, 2));
  }

  // Check error-level logs
  const errorLogs = logs.filter((l) => l.level === 'error' || l.type === 'error');
  console.log('\n--- Error Logs Summary ---');
  console.log('Total error logs:', errorLogs.length);
  if (errorLogs.length > 0) {
    console.log(JSON.stringify(errorLogs, null, 2));
  }

  ws.close();
  brave.kill();
  process.exit(0);
}

main();
