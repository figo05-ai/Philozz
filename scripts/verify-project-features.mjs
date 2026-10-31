import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const bravePort = 9390;
const OUT_DIR = '/home/figo/Desktop/Philo/verification/project-features';
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
      '--remote-debugging-port=' + bravePort,
      '--window-size=1920,1080',
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
      } catch {}
    }

    if (!wsUrl) throw new Error('Failed to connect to Brave DevTools within 10s');
    const client = new CDPClient(wsUrl);
    await client.ready();
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.setViewport(1920, 1080);

    // =========================================================================
    // TEST 1: Projects Archive Page (/projects)
    // =========================================================================
    console.log('\n=== TEST 1: Verifying /projects Cards (Cover Images & Live Buttons) ===');
    await client.send('Page.navigate', { url: 'http://localhost:3000/projects' });
    await wait(600);

    const archiveCardCheck = await client.evaluate(`(() => {
      const cards = document.querySelectorAll('.gallery-project-card');
      const covers = document.querySelectorAll('.gallery-card-cover-img');
      const liveBtns = document.querySelectorAll('.gallery-live-btn');
      return {
        cardCount: cards.length,
        coverCount: covers.length,
        liveBtnCount: liveBtns.length,
        firstLiveHref: liveBtns.length > 0 ? liveBtns[0].getAttribute('href') : null,
        firstCoverSrc: covers.length > 0 ? covers[0].getAttribute('src') : null,
      };
    })()`);
    console.log('/projects Card Check:', archiveCardCheck);
    await client.screenshot('01_projects_archive_cards_with_covers.png');

    if (archiveCardCheck.coverCount === 0) {
      throw new Error('No project card covers found on /projects');
    }
    if (archiveCardCheck.liveBtnCount === 0) {
      throw new Error('No live project buttons found on /projects');
    }

    // =========================================================================
    // TEST 2: Case Study Details Page (/work/skillup-platform)
    // =========================================================================
    console.log('\n=== TEST 2: Verifying /work/skillup-platform (Live Link & Gallery) ===');
    await client.send('Page.navigate', { url: 'http://localhost:3000/work/skillup-platform' });
    await wait(600);

    const caseStudyCheck = await client.evaluate(`(() => {
      const headerLive = document.querySelector('.gallery-live-link');
      const heroLive = document.querySelector('a.btn-gold[href*="http"]');
      const gallery = document.querySelector('.project-gallery-section');
      const thumbs = document.querySelectorAll('.gallery-thumb-card');
      return {
        hasHeaderLive: !!headerLive,
        headerLiveHref: headerLive ? headerLive.getAttribute('href') : null,
        hasHeroLive: !!heroLive,
        heroLiveHref: heroLive ? heroLive.getAttribute('href') : null,
        heroLiveText: heroLive ? heroLive.innerText.trim() : null,
        hasGallery: !!gallery,
        thumbCount: thumbs.length,
      };
    })()`);
    console.log('Case Study Check:', caseStudyCheck);
    await client.screenshot('02_case_study_hero_and_live_cta.png');

    if (!caseStudyCheck.hasHeroLive) {
      throw new Error('Missing VIEW LIVE PRODUCTION PROJECT button in hero');
    }
    if (!caseStudyCheck.hasGallery || caseStudyCheck.thumbCount === 0) {
      throw new Error('Project Gallery not rendered or empty');
    }

    // Scroll to gallery
    await client.evaluate(`(() => {
      const gallery = document.querySelector('.project-gallery-section');
      if (gallery) gallery.scrollIntoView({ behavior: 'instant', block: 'center' });
      return true;
    })()`);
    await wait(300);
    await client.screenshot('03_case_study_gallery_grid.png');

    // =========================================================================
    // TEST 3: Interactive Lightbox Dialog
    // =========================================================================
    console.log('\n=== TEST 3: Testing Interactive Lightbox Modal ===');
    // Click on the first thumbnail
    await client.evaluate(`(() => {
      const firstThumb = document.querySelector('.gallery-thumb-card');
      if (firstThumb) firstThumb.click();
      return !!firstThumb;
    })()`);
    await wait(300);

    const lightboxOpenCheck = await client.evaluate(`(() => {
      const dialog = document.querySelector('div[role="dialog"][aria-label*="Screenshot Preview"]');
      const img = dialog ? dialog.querySelector('img') : null;
      const overflow = document.body.style.overflow;
      return {
        isOpen: !!dialog,
        imgSrc: img ? img.getAttribute('src') : null,
        bodyOverflow: overflow,
      };
    })()`);
    console.log('Lightbox Open Check:', lightboxOpenCheck);
    await client.screenshot('04_lightbox_modal_open.png');

    if (!lightboxOpenCheck.isOpen) {
      throw new Error('Lightbox did not open upon clicking thumbnail');
    }

    // Navigate to next image using ArrowRight
    console.log('Testing ArrowRight navigation...');
    await client.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
    await client.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
    await wait(300);

    const nextImgCheck = await client.evaluate(`(() => {
      const dialog = document.querySelector('div[role="dialog"][aria-label*="Screenshot Preview"]');
      const img = dialog ? dialog.querySelector('img') : null;
      return {
        isOpen: !!dialog,
        newImgSrc: img ? img.getAttribute('src') : null,
      };
    })()`);
    console.log('After ArrowRight Check:', nextImgCheck);
    await client.screenshot('05_lightbox_navigated_next.png');

    // Close lightbox using Escape
    console.log('Testing Escape key dismissal...');
    await client.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await client.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await wait(300);

    const closedCheck = await client.evaluate(`(() => {
      const dialog = document.querySelector('div[role="dialog"][aria-label*="Screenshot Preview"]');
      const overflow = document.body.style.overflow;
      return {
        isOpen: !!dialog,
        bodyOverflow: overflow,
      };
    })()`);
    console.log('After Escape Check (should be closed, overflow empty):', closedCheck);

    if (closedCheck.isOpen) {
      throw new Error('Lightbox remained open after Escape key');
    }

    client.close();
    console.log('\n🎉 ALL PROJECT FEATURE TESTS PASSED 100%!');
  } finally {
    braveProcess.kill();
  }
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
