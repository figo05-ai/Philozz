import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const SCREENSHOT_DIR = path.resolve('/home/figo/Desktop/Philo/verification');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

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

  async setViewport(width, height, isMobile = false, deviceScaleFactor = 1) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor,
      mobile: isMobile,
    });
  }

  async screenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(SCREENSHOT_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved screenshot: ${outPath} (${buffer.length} bytes)`);
    return outPath;
  }

  close() {
    this.ws.close();
  }
}

async function runAudit() {
  const bravePort = 9333;
  console.log('Launching headless Brave on port ' + bravePort + '...');
  const braveProcess = spawn(
    '/opt/brave.com/brave/brave',
    [
      '--headless=new',
      '--disable-gpu',
      `--remote-debugging-port=${bravePort}`,
      '--window-size=1440,900',
      '--no-sandbox',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  try {
    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
      await wait(300);
      try {
        const res = await fetch(`http://127.0.0.1:${bravePort}/json`);
        if (res.ok) {
          const list = await res.json();
          const page = list.find((t) => t.type === 'page');
          if (page && page.webSocketDebuggerUrl) {
            wsUrl = page.webSocketDebuggerUrl;
            break;
          }
        }
      } catch {
        // Retry
      }
    }

    if (!wsUrl) {
      throw new Error('Failed to connect to Brave DevTools within 10s');
    }

    console.log('Connected to CDP at', wsUrl);
    const client = new CDPClient(wsUrl);
    await client.ready();
    await client.send('Page.enable');
    await client.send('Runtime.enable');

    // 1. DESKTOP VIEWPORT AUDIT (1440 x 900)
    console.log('\n--- 1. DESKTOP VIEWPORT AUDIT (1440x900) ---');
    await client.setViewport(1440, 900, false);
    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await wait(2500);

    const totalHeight = await client.evaluate(
      'document.documentElement.scrollHeight - window.innerHeight'
    );
    console.log(`Page scroll range: 0 to ${totalHeight}px`);

    // Verify brand name & title
    const brandName = await client.evaluate('document.querySelector(".brand-name")?.innerText');
    console.log('Brand text:', brandName);

    // Section 1: Hero (#home)
    console.log('Capturing Section 1: Hero (#home)...');
    await client.evaluate('window.scrollTo({ top: 0, behavior: "instant" })');
    await wait(1000);
    await client.screenshot('desktop-01-hero.png');

    // Section 2: About Me (#about)
    console.log('Capturing Section 2: About (#about)...');
    await client.evaluate('window.scrollTo({ top: document.querySelector("#about").offsetTop + 50, behavior: "instant" })');
    await wait(1000);
    await client.screenshot('desktop-02-about.png');

    // Section 3: Tech Stack (#skills)
    console.log('Capturing Section 3: Tech Stack (#skills)...');
    await client.evaluate('window.scrollTo({ top: document.querySelector("#skills").offsetTop + 50, behavior: "instant" })');
    await wait(1000);
    await client.screenshot('desktop-03-tech-stack.png');

    // Section 4: Projects (#projects)
    console.log('Capturing Section 4: Projects (#projects)...');
    await client.evaluate('window.scrollTo({ top: document.querySelector("#projects").offsetTop + 50, behavior: "instant" })');
    await wait(1000);
    await client.screenshot('desktop-04-projects.png');

    // Section 5: Blog / Journal (#blog)
    console.log('Capturing Section 5: Journal / Blog (#blog)...');
    await client.evaluate('window.scrollTo({ top: document.querySelector("#blog").offsetTop + 50, behavior: "instant" })');
    await wait(1000);
    await client.screenshot('desktop-05-journal.png');

    // Section 6: Finale / Contact (#contact)
    console.log('Capturing Section 6: Finale / Contact (#contact)...');
    await client.evaluate('window.scrollTo({ top: document.querySelector("#contact").offsetTop + 50, behavior: "instant" })');
    await wait(1000);
    await client.screenshot('desktop-06-contact.png');

    // 2. CASE STUDY ROUTE TEST
    console.log('\n--- 2. CASE STUDY ROUTE TEST ---');
    await client.send('Page.navigate', { url: 'http://localhost:3000/work/skillup-platform' });
    await wait(1500);
    const caseTitle = await client.evaluate('document.querySelector("h1")?.innerText');
    console.log('Case Study Title:', caseTitle);
    await client.screenshot('casestudy-skillup-1440.png');

    // 3. NOTE ROUTE TEST
    console.log('\n--- 3. NOTE / JOURNAL ROUTE TEST ---');
    await client.send('Page.navigate', { url: 'http://localhost:3000/notes/building-scalable-apis-with-laravel' });
    await wait(1500);
    const noteTitle = await client.evaluate('document.querySelector("h1")?.innerText');
    console.log('Journal Note Title:', noteTitle);
    await client.screenshot('note-laravel-apis-1440.png');

    // 4. TABLET VIEWPORT AUDIT (768 x 1024)
    console.log('\n--- 4. TABLET VIEWPORT AUDIT (768x1024) ---');
    await client.setViewport(768, 1024, false);
    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await wait(2000);
    await client.screenshot('tablet-01-hero-768.png');
    await client.evaluate('window.scrollTo({ top: document.querySelector("#skills").offsetTop + 30, behavior: "instant" })');
    await wait(1000);
    await client.screenshot('tablet-02-skills-768.png');

    // 5. MOBILE VIEWPORT AUDIT (390 x 844)
    console.log('\n--- 5. MOBILE VIEWPORT AUDIT (390x844) ---');
    await client.setViewport(390, 844, true, 2);
    await client.send('Page.navigate', { url: 'http://localhost:3000' });
    await wait(2000);

    const hasHorizontalOverflow = await client.evaluate(
      'document.documentElement.scrollWidth > window.innerWidth'
    );
    console.log(`Mobile (390px) horizontal overflow: ${hasHorizontalOverflow ? 'FAIL (overflow detected)' : 'PASS (no overflow)'}`);
    await client.screenshot('mobile-01-hero-390.png');

    await client.evaluate('window.scrollTo({ top: document.querySelector("#about").offsetTop, behavior: "instant" })');
    await wait(1000);
    await client.screenshot('mobile-02-about-390.png');

    await client.evaluate('window.scrollTo({ top: document.querySelector("#skills").offsetTop, behavior: "instant" })');
    await wait(1000);
    await client.screenshot('mobile-03-skills-390.png');

    await client.evaluate('window.scrollTo({ top: document.querySelector("#contact").offsetTop, behavior: "instant" })');
    await wait(1000);
    await client.screenshot('mobile-04-contact-390.png');

    // 6. SMALL MOBILE VIEWPORT (360 x 780)
    console.log('\n--- 6. SMALL MOBILE VIEWPORT (360x780) ---');
    await client.setViewport(360, 780, true, 2);
    await wait(500);
    const smallOverflow = await client.evaluate(
      'document.documentElement.scrollWidth > window.innerWidth'
    );
    console.log(`Small Mobile (360px) horizontal overflow: ${smallOverflow ? 'FAIL (overflow detected)' : 'PASS (no overflow)'}`);
    await client.screenshot('mobile-small-360.png');

    // 7. WEBGL OFF FALLBACK AUDIT
    console.log('\n--- 7. WEBGL OFF FALLBACK AUDIT ---');
    await client.setViewport(1440, 900, false);
    await client.send('Page.navigate', { url: 'http://localhost:3000/?webgl=off' });
    await wait(1500);
    const fallbackBanner = await client.evaluate(
      'document.querySelector(".fallback-banner")?.innerText || "not found"'
    );
    console.log('Fallback Banner Detected:', fallbackBanner);
    await client.screenshot('desktop-fallback-webgl-off.png');

    console.log('\nALL VERIFICATION AUDITS COMPLETED SUCCESSFULLY!');
    client.close();
  } finally {
    braveProcess.kill('SIGTERM');
  }
}

runAudit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
