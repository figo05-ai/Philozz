import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = '/home/figo/Desktop/Philo/verification/phase13b1-scroll-demo';
const ARTIFACTS_DIR = '/home/figo/.gemini/antigravity/brain/6922c74a-36fb-4f62-b5ad-d94056efd60f';

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

async function run() {
  const port = 9386;
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

  try {
    await call('Page.enable');
    await call('Runtime.enable');

    console.log('--- Setting Viewport: iPhone 13 (390x844) ---');
    await call('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      hasTouch: true,
    });

    await call('Page.navigate', { url: 'http://localhost:3000' });
    await new Promise((r) => setTimeout(r, 2200));

    // Milestone positions to capture in sequence
    const milestones = [
      { name: 'demo-01-hero.png', y: 0, label: 'Hero Top' },
      { name: 'demo-02-about-intro.png', y: 1150, label: 'About Section' },
      { name: 'demo-03-about-ide.png', y: 1750, label: 'About Building IDE' },
      { name: 'demo-04-skills-orbit.png', y: 3100, label: 'Skills Technology Orbit' },
      { name: 'demo-05-skills-to-projects-emergence.png', y: 4150, label: 'Skills -> Projects Wireframe Emergence' },
      { name: 'demo-06-projects-heading-and-cards.png', y: 4600, label: 'Projects Heading and Cards' },
      { name: 'demo-07-projects-featured-card.png', y: 5300, label: 'Featured Project Card' },
      { name: 'demo-08-projects-to-blog-manuscript.png', y: 6400, label: 'Projects -> Blog Manuscript Folio' },
      { name: 'demo-09-blog-journal-header.png', y: 6850, label: 'Blog Journal Header & Author' },
      { name: 'demo-10-blog-featured-article.png', y: 7700, label: 'Blog Featured Article' },
      { name: 'demo-11-blog-to-contact-commit.png', y: 9700, label: 'Blog -> Contact Final Commit' },
      { name: 'demo-12-contact-resting.png', y: 10600, label: 'Contact Section Resting' },
      // Reverse check milestones
      { name: 'demo-13-reverse-blog-return.png', y: 8800, label: 'Reverse: Return to Blog' },
      { name: 'demo-14-reverse-manuscript-projects.png', y: 6500, label: 'Reverse: Manuscript to Projects' },
      { name: 'demo-15-reverse-projects-to-skills.png', y: 4200, label: 'Reverse: Projects to Skills' },
      { name: 'demo-16-reverse-top-hero.png', y: 0, label: 'Reverse: Restored to Hero' },
    ];

    for (const m of milestones) {
      await call('Runtime.evaluate', {
        expression: `document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, ${m.y})`,
      });
      await new Promise((r) => setTimeout(r, 200));
      await capture(m.name);
      console.log(`Verified ${m.label} at y=${m.y}`);
    }

  } finally {
    ws.close();
    brave.kill();
  }
}

run().catch((err) => {
  console.error('Demo error:', err);
  process.exit(1);
});
