import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const bravePort = 9392;
const OUT_DIR = '/home/figo/Desktop/Philo/verification/scrollbar';
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function wait(ms) {
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
      awaitPromise: false,
    });
    return res.result ? res.result.value : null;
  }

  async setViewport(width, height) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    });
  }

  async screenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const fPath = path.join(OUT_DIR, filename);
    fs.writeFileSync(fPath, buffer);
    console.log(`Saved screenshot: ${fPath}`);
    return fPath;
  }

  close() {
    this.ws.close();
  }
}

async function main() {
  console.log(`Launching headless Brave on port ${bravePort}...`);
  const braveProcess = spawn(
    '/opt/brave.com/brave/brave',
    [
      '--headless=new',
      `--remote-debugging-port=${bravePort}`,
      '--no-sandbox',
      '--disable-gpu',
      '--hide-scrollbars=false', // Ensure scrollbars are rendered!
      '--user-data-dir=/tmp/brave-scrollbar-test',
    ],
    { stdio: 'ignore' }
  );

  let cdp = null;

  try {
    let versionData = null;
    for (let i = 0; i < 20; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${bravePort}/json/version`);
        if (res.ok) {
          versionData = await res.json();
          break;
        }
      } catch {
        // ignore
      }
      await wait(300);
    }

    if (!versionData) throw new Error('Brave remote debugging did not respond');

    const targetsRes = await fetch(`http://127.0.0.1:${bravePort}/json/list`);
    const targets = await targetsRes.json();
    const pageTarget = targets.find((t) => t.type === 'page') || targets[0];

    cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.ready();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.setViewport(1440, 900);

    console.log('Navigating to http://localhost:3000/projects...');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000/projects' });
    await wait(3000);

    // Check computed scrollbar properties
    const scrollbarStyles = await cdp.evaluate(`
      (() => {
        const htmlStyle = window.getComputedStyle(document.documentElement);
        const bodyStyle = window.getComputedStyle(document.body);
        return {
          htmlScrollbarColor: htmlStyle.scrollbarColor,
          htmlScrollbarWidth: htmlStyle.scrollbarWidth,
          bodyScrollbarColor: bodyStyle.scrollbarColor,
          bodyScrollbarWidth: bodyStyle.scrollbarWidth,
          thumbVar: htmlStyle.getPropertyValue('--scrollbar-thumb').trim(),
          trackVar: htmlStyle.getPropertyValue('--scrollbar-track').trim(),
          goldVar: htmlStyle.getPropertyValue('--color-gold').trim(),
          obsidianVar: htmlStyle.getPropertyValue('--color-obsidian').trim(),
          scrollHeight: document.documentElement.scrollHeight,
          clientHeight: document.documentElement.clientHeight,
        };
      })()
    `);

    console.log('Computed scrollbar info:', JSON.stringify(scrollbarStyles, null, 2));

    await cdp.screenshot('01_projects_page_scrollbar.png');

    // Scroll down to test scrolling
    await cdp.evaluate(`window.scrollBy({ top: 600, behavior: 'instant' });`);
    await wait(1000);

    await cdp.screenshot('02_projects_page_scrolled_scrollbar.png');

    // Also navigate to a case study page
    console.log('Navigating to http://localhost:3000/work/skillup-platform...');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000/work/skillup-platform' });
    await wait(3000);

    await cdp.evaluate(`window.scrollBy({ top: 800, behavior: 'instant' });`);
    await wait(1000);

    await cdp.screenshot('03_case_study_scrolled_scrollbar.png');

    console.log('Scrollbar verification completed successfully!');
  } finally {
    if (cdp) cdp.close();
    braveProcess.kill();
  }
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
