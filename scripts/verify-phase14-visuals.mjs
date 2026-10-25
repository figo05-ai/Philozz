import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = '/home/figo/Desktop/Philo/verification/phase14-verification';
const ARTIFACTS_DIR = '/home/figo/.gemini/antigravity/brain/6922c74a-36fb-4f62-b5ad-d94056efd60f';

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

async function run() {
  const port = 9555;
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
  const consoleErrors = [];

  ws.addEventListener('message', (e) => {
    const data = JSON.parse(e.data);
    if (data.id && pending.has(data.id)) {
      const resolve = pending.get(data.id);
      pending.delete(data.id);
      resolve(data.result);
    }
    if (data.method === 'Console.messageAdded' && data.params.message.level === 'error') {
      consoleErrors.push(data.params.message.text);
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

  // 1. Desktop Visual Fidelity Test (1440x900)
  console.log('\n--- Verifying Desktop (1440x900) ---');
  await call('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await call('Page.navigate', { url: 'http://localhost:3005/' });
  await new Promise((r) => setTimeout(r, 2000));

  await capture('phase14-desktop-01-hero.png');

  // Scroll to About
  await evaluate(`window.scrollTo({ top: window.innerHeight * 1.5, behavior: 'instant' });`);
  await new Promise((r) => setTimeout(r, 800));
  await capture('phase14-desktop-02-about.png');

  // Scroll to Skills
  await evaluate(`
    const el = document.getElementById('skills');
    if (el) window.scrollTo({ top: el.offsetTop, behavior: 'instant' });
  `);
  await new Promise((r) => setTimeout(r, 800));
  await capture('phase14-desktop-03-skills.png');

  // Scroll to Projects
  await evaluate(`
    const el = document.getElementById('projects');
    if (el) window.scrollTo({ top: el.offsetTop, behavior: 'instant' });
  `);
  await new Promise((r) => setTimeout(r, 800));
  await capture('phase14-desktop-04-projects.png');

  // Scroll to Blog / Journal
  await evaluate(`
    const el = document.getElementById('notes');
    if (el) window.scrollTo({ top: el.offsetTop, behavior: 'instant' });
  `);
  await new Promise((r) => setTimeout(r, 800));
  await capture('phase14-desktop-05-blog.png');

  // Scroll to Contact
  await evaluate(`
    const el = document.getElementById('contact');
    if (el) window.scrollTo({ top: el.offsetTop, behavior: 'instant' });
  `);
  await new Promise((r) => setTimeout(r, 800));
  await capture('phase14-desktop-06-contact.png');

  // 2. Mobile Visual Fidelity Test (390x844)
  console.log('\n--- Verifying Mobile (390x844) ---');
  await call('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true,
  });

  await call('Page.navigate', { url: 'http://localhost:3005/' });
  await new Promise((r) => setTimeout(r, 2000));
  await capture('phase14-mobile-01-hero.png');

  // Mobile About
  await evaluate(`
    const el = document.getElementById('about');
    if (el) window.scrollTo({ top: el.offsetTop, behavior: 'instant' });
  `);
  await new Promise((r) => setTimeout(r, 800));
  await capture('phase14-mobile-02-about.png');

  // Mobile Skills
  await evaluate(`
    const el = document.getElementById('skills');
    if (el) window.scrollTo({ top: el.offsetTop, behavior: 'instant' });
  `);
  await new Promise((r) => setTimeout(r, 800));
  await capture('phase14-mobile-03-skills.png');

  // Mobile Projects
  await evaluate(`
    const el = document.getElementById('projects');
    if (el) window.scrollTo({ top: el.offsetTop, behavior: 'instant' });
  `);
  await new Promise((r) => setTimeout(r, 800));
  await capture('phase14-mobile-04-projects.png');

  // Mobile Blog
  await evaluate(`
    const el = document.getElementById('notes');
    if (el) window.scrollTo({ top: el.offsetTop, behavior: 'instant' });
  `);
  await new Promise((r) => setTimeout(r, 800));
  await capture('phase14-mobile-05-blog.png');

  // Mobile Contact
  await evaluate(`
    const el = document.getElementById('contact');
    if (el) window.scrollTo({ top: el.offsetTop, behavior: 'instant' });
  `);
  await new Promise((r) => setTimeout(r, 800));
  await capture('phase14-mobile-06-contact.png');

  console.log(`\nVerification complete. Console errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('Console errors detected:', consoleErrors);
  }

  brave.kill('SIGKILL');
  process.exit(0);
}

run().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});
