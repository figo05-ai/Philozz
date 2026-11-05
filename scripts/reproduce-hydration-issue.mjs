import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = '/home/figo/Desktop/Philo/verification/phase13a-investigation';
const ARTIFACTS_DIR = '/home/figo/.gemini/antigravity/brain/6922c74a-36fb-4f62-b5ad-d94056efd60f';

async function main() {
  const brave = spawn('/usr/bin/brave-browser', [
    '--headless=new',
    '--remote-debugging-port=9395',
    '--no-sandbox',
    '--disable-gpu',
  ]);
  await new Promise((r) => setTimeout(r, 1500));
  const list = await fetch('http://127.0.0.1:9395/json').then((r) => r.json());
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

  await call('Page.enable');
  await call('DOM.enable');
  await call('Console.enable');
  await call('Runtime.enable');
  await call('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      // Simulate the user's browser extension that injects rtl-enabled before hydration
      document.documentElement.classList.add('rtl-enabled');
    `,
  });

  console.log('Navigating to http://localhost:3000/ with extension simulation...');
  await call('Page.navigate', { url: 'http://localhost:3000/' });
  await new Promise((r) => setTimeout(r, 3500));

  // Capture screenshot of the homepage with the red badge
  const res = await call('Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(res.data, 'base64');
  fs.writeFileSync(path.join(OUT_DIR, 'reproduced-issue-homepage.png'), buf);
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'reproduced-issue-homepage.png'), buf);
  console.log('Saved screenshot: reproduced-issue-homepage.png');

  // Check overlay status
  const badgeInfo = await call('Runtime.evaluate', {
    expression: `(() => {
      const portal = document.querySelector('nextjs-portal');
      if (!portal || !portal.shadowRoot) return { found: false };
      const sr = portal.shadowRoot;
      const badge = sr.querySelector('[data-next-badge]');
      const toast = sr.querySelector('[data-nextjs-toast]');
      const issuesOpen = sr.querySelector('[data-issues-open]');
      return {
        found: true,
        isError: badge ? badge.getAttribute('data-error') : null,
        badgeText: badge ? badge.textContent : null,
        issuesOpenText: issuesOpen ? issuesOpen.textContent : null,
        toastClass: toast ? toast.className : null,
        srHtml: sr.innerHTML.slice(0, 3000),
      };
    })()`,
    returnByValue: true,
  });

  console.log('Badge Info:', JSON.stringify(badgeInfo.result.value, null, 2));

  // Click the issue button to open error details
  await call('Runtime.evaluate', {
    expression: `(() => {
      const portal = document.querySelector('nextjs-portal');
      if (portal && portal.shadowRoot) {
        const btn = portal.shadowRoot.querySelector('[data-issues-open]');
        if (btn) btn.click();
      }
    })()`,
  });
  await new Promise((r) => setTimeout(r, 1500));

  // Capture screenshot of open dialog
  const res2 = await call('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(OUT_DIR, 'reproduced-issue-dialog.png'), Buffer.from(res2.data, 'base64'));
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'reproduced-issue-dialog.png'), Buffer.from(res2.data, 'base64'));
  console.log('Saved screenshot: reproduced-issue-dialog.png');

  // Get dialog text
  const dialogText = await call('Runtime.evaluate', {
    expression: `(() => {
      const portal = document.querySelector('nextjs-portal');
      if (!portal || !portal.shadowRoot) return 'no portal';
      return portal.shadowRoot.innerText;
    })()`,
    returnByValue: true,
  });
  console.log('Dialog Text:', dialogText.result.value);

  const errors = consoleMessages.filter((m) => m.type === 'error' || m.level === 'error');
  console.log('Console Errors:', JSON.stringify(errors, null, 2));

  ws.close();
  brave.kill();
  process.exit(0);
}

main();
