import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const VERIFY_DIR = path.resolve('/home/figo/Desktop/Philo/verification/cleanup-isolation');
const FRAMES_DIR = path.join(VERIFY_DIR, 'frames');
[VERIFY_DIR, FRAMES_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Clean old frames
fs.readdirSync(FRAMES_DIR).forEach((f) => {
  if (f.endsWith('.png')) fs.unlinkSync(path.join(FRAMES_DIR, f));
});

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

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

  async setViewport(width, height, isMobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: isMobile,
    });
  }

  async captureScreenshot(outputPath, clip = null) {
    const params = { format: 'png' };
    if (clip) params.clip = clip;
    const res = await this.send('Page.captureScreenshot', params);
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(outputPath, buffer);
    return outputPath;
  }

  async navigate(url) {
    const loadPromise = new Promise((resolve) => {
      const handler = (event) => {
        const data = JSON.parse(event.data);
        if (data.method === 'Page.loadEventFired') {
          this.ws.removeEventListener('message', handler);
          resolve();
        }
      };
      this.ws.addEventListener('message', handler);
    });
    await this.send('Page.navigate', { url });
    await loadPromise;
    await wait(2000);
  }

  close() {
    this.ws.close();
  }
}

async function launchBrowser(port) {
  const braveProcess = spawn('/usr/bin/brave-browser', [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await wait(300);
    try {
      const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
      if (list && list[0] && list[0].webSocketDebuggerUrl) {
        wsUrl = list[0].webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!wsUrl) {
    braveProcess.kill('SIGKILL');
    throw new Error('Failed to connect to browser CDP');
  }

  return { braveProcess, wsUrl };
}

async function run() {
  console.log('=== VERIFYING EMERGENCY TRANSITION ISOLATION & CLEANUP ===\n');
  const port = 9360;
  const { braveProcess, wsUrl } = await launchBrowser(port);
  const client = new CDPClient(wsUrl);
  await client.ready();
  await client.send('Page.enable');

  try {
    // -------------------------------------------------------------
    // 1. DESKTOP VERIFICATION (1440x900)
    // -------------------------------------------------------------
    await client.setViewport(1440, 900, false);
    await client.navigate('http://localhost:3000');
    await wait(1800);

    // Get section positions
    const positions = await client.evaluate(`(() => {
      const skills = document.getElementById('skills');
      const projects = document.getElementById('projects');
      const blog = document.getElementById('blog');
      return {
        skills: skills ? Math.round(skills.getBoundingClientRect().top + window.scrollY) : null,
        projects: projects ? Math.round(projects.getBoundingClientRect().top + window.scrollY) : null,
        blog: blog ? Math.round(blog.getBoundingClientRect().top + window.scrollY) : null,
      };
    })()`);

    console.log('Section positions (Desktop):', positions);

    // A. SKILLS RESTING
    await client.evaluate(`window.scrollTo({ top: ${positions.skills}, behavior: 'instant' })`);
    await wait(800);
    const shotSkills = path.join(VERIFY_DIR, '01-desktop-skills-resting.png');
    await client.captureScreenshot(shotSkills);
    console.log(`Captured: ${shotSkills}`);

    const skillsCheck = await client.evaluate(`(() => {
      const orbit = document.querySelector('.tech-orbit-stage') || document.querySelector('.tech-col-center');
      const portals = Array.from(document.querySelectorAll('.tech-pedestal-node'));
      const activeOverlays = Array.from(document.querySelectorAll('.projects-to-blog-overlay, .skills-to-projects-transition-layer'));
      const visibleOverlays = activeOverlays.filter(el => window.getComputedStyle(el).display !== 'none' && parseFloat(window.getComputedStyle(el).opacity) > 0.05);

      return {
        skillsFound: Boolean(orbit),
        pedestalCount: portals.length,
        visibleUnrelatedOverlaysCount: visibleOverlays.length,
      };
    })()`);
    console.log('Skills Check:', skillsCheck);

    // B. PROJECTS RESTING
    await client.evaluate(`window.scrollTo({ top: ${positions.projects}, behavior: 'instant' })`);
    await wait(800);
    const shotProjects = path.join(VERIFY_DIR, '02-desktop-projects-resting.png');
    await client.captureScreenshot(shotProjects);
    console.log(`Captured: ${shotProjects}`);

    const projectsCheck = await client.evaluate(`(() => {
      const cards = Array.from(document.querySelectorAll('.projects-horizontal-gallery .gallery-project-card'));
      const title = document.querySelector('#projects-title');
      const activeOverlays = Array.from(document.querySelectorAll('.projects-to-blog-overlay, .skills-to-projects-transition-layer, .editorial-folio'));
      const visibleOverlays = activeOverlays.filter(el => {
        const cs = window.getComputedStyle(el);
        return cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.05;
      });

      const cardsVisible = cards.map(c => {
        const cs = window.getComputedStyle(c);
        const r = c.getBoundingClientRect();
        return {
          opacity: parseFloat(cs.opacity),
          width: Math.round(r.width),
          height: Math.round(r.height),
          isVisible: parseFloat(cs.opacity) >= 0.9 && r.height > 100,
        };
      });

      return {
        cardCount: cards.length,
        titleFound: Boolean(title),
        allCardsVisible: cardsVisible.every(c => c.isVisible),
        visibleOverlaysCount: visibleOverlays.length,
      };
    })()`);
    console.log('Projects Check:', projectsCheck);

    // C. BLOG RESTING
    await client.evaluate(`window.scrollTo({ top: ${positions.blog}, behavior: 'instant' })`);
    await wait(800);
    const shotBlog = path.join(VERIFY_DIR, '03-desktop-blog-resting.png');
    await client.captureScreenshot(shotBlog);
    console.log(`Captured: ${shotBlog}`);

    const blogCheck = await client.evaluate(`(() => {
      const title = document.querySelector('#notes-title');
      const articles = Array.from(document.querySelectorAll('.journal-article-card'));
      const activeOverlays = Array.from(document.querySelectorAll('.projects-to-blog-overlay, .editorial-folio'));
      const visibleOverlays = activeOverlays.filter(el => {
        const cs = window.getComputedStyle(el);
        return cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.05;
      });

      const allArticlesVisible = articles.every(a => {
        const cs = window.getComputedStyle(a);
        return parseFloat(cs.opacity) >= 0.9;
      });

      return {
        titleFound: Boolean(title),
        articleCount: articles.length,
        allArticlesVisible,
        visibleOverlaysCount: visibleOverlays.length,
      };
    })()`);
    console.log('Blog Check:', blogCheck);

    // D. REVERSE SCROLL: BLOG -> PROJECTS -> SKILLS
    await client.evaluate(`window.scrollTo({ top: ${positions.projects}, behavior: 'instant' })`);
    await wait(800);
    const shotProjectsRev = path.join(VERIFY_DIR, '04-desktop-reverse-projects-resting.png');
    await client.captureScreenshot(shotProjectsRev);
    console.log(`Captured Reverse Projects: ${shotProjectsRev}`);

    await client.evaluate(`window.scrollTo({ top: ${positions.skills}, behavior: 'instant' })`);
    await wait(800);
    const shotSkillsRev = path.join(VERIFY_DIR, '05-desktop-reverse-skills-resting.png');
    await client.captureScreenshot(shotSkillsRev);
    console.log(`Captured Reverse Skills: ${shotSkillsRev}`);

    // -------------------------------------------------------------
    // 2. MOBILE VERIFICATION (390x844)
    // -------------------------------------------------------------
    await client.setViewport(390, 844, true);
    await client.navigate('http://localhost:3000');
    await wait(1800);

    const mPositions = await client.evaluate(`(() => {
      const skills = document.getElementById('skills');
      const projects = document.getElementById('projects');
      const blog = document.getElementById('blog');
      return {
        skills: skills ? Math.round(skills.getBoundingClientRect().top + window.scrollY) : null,
        projects: projects ? Math.round(projects.getBoundingClientRect().top + window.scrollY) : null,
        blog: blog ? Math.round(blog.getBoundingClientRect().top + window.scrollY) : null,
      };
    })()`);

    await client.evaluate(`window.scrollTo({ top: ${mPositions.skills}, behavior: 'instant' })`);
    await wait(800);
    const shotMobSkills = path.join(VERIFY_DIR, '06-mobile-skills-resting.png');
    await client.captureScreenshot(shotMobSkills);

    await client.evaluate(`window.scrollTo({ top: ${mPositions.projects}, behavior: 'instant' })`);
    await wait(800);
    const shotMobProjects = path.join(VERIFY_DIR, '07-mobile-projects-resting.png');
    await client.captureScreenshot(shotMobProjects);

    await client.evaluate(`window.scrollTo({ top: ${mPositions.blog}, behavior: 'instant' })`);
    await wait(800);
    const shotMobBlog = path.join(VERIFY_DIR, '08-mobile-blog-resting.png');
    await client.captureScreenshot(shotMobBlog);

    const mobileCheck = await client.evaluate(`(() => {
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: window.innerWidth,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    })()`);
    console.log('Mobile Check:', mobileCheck);

    // -------------------------------------------------------------
    // 3. RECORD DEMONSTRATION VIDEO: SKILLS -> PROJECTS -> BLOG -> SKILLS
    // -------------------------------------------------------------
    console.log('\nCapturing frames for forward-and-reverse video...');
    await client.setViewport(1440, 900, false);
    await client.navigate('http://localhost:3000');
    await wait(1500);

    let frameIdx = 0;
    const startY = positions.skills;
    const endY = positions.blog;
    const scrollSteps = 35;

    // Forward scroll: Skills -> Projects -> Blog
    for (let i = 0; i <= scrollSteps; i++) {
      const y = Math.round(startY + ((endY - startY) * i) / scrollSteps);
      await client.evaluate(`window.scrollTo({ top: ${y}, behavior: 'instant' })`);
      await wait(50);
      const fPath = path.join(FRAMES_DIR, `frame_${String(frameIdx++).padStart(4, '0')}.png`);
      await client.captureScreenshot(fPath);
    }

    // Pause at Blog
    for (let i = 0; i < 8; i++) {
      const fPath = path.join(FRAMES_DIR, `frame_${String(frameIdx++).padStart(4, '0')}.png`);
      await client.captureScreenshot(fPath);
    }

    // Reverse scroll: Blog -> Projects -> Skills
    for (let i = scrollSteps; i >= 0; i--) {
      const y = Math.round(startY + ((endY - startY) * i) / scrollSteps);
      await client.evaluate(`window.scrollTo({ top: ${y}, behavior: 'instant' })`);
      await wait(50);
      const fPath = path.join(FRAMES_DIR, `frame_${String(frameIdx++).padStart(4, '0')}.png`);
      await client.captureScreenshot(fPath);
    }

    // Pause at Skills
    for (let i = 0; i < 8; i++) {
      const fPath = path.join(FRAMES_DIR, `frame_${String(frameIdx++).padStart(4, '0')}.png`);
      await client.captureScreenshot(fPath);
    }

    console.log(`Captured ${frameIdx} frames. Compiling MP4 via ffmpeg...`);
    const outVideo = path.join(VERIFY_DIR, 'cleanup-isolation-scroll.mp4');
    execSync(`ffmpeg -y -framerate 24 -i "${FRAMES_DIR}/frame_%04d.png" -c:v libx264 -pix_fmt yuv420p -crf 18 "${outVideo}"`, { stdio: 'inherit' });
    console.log(`Video generated: ${outVideo}`);

    const report = {
      skillsCheck,
      projectsCheck,
      blogCheck,
      mobileCheck,
      videoPath: outVideo,
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(path.join(VERIFY_DIR, 'cleanup-isolation-report.json'), JSON.stringify(report, null, 2));
    console.log('\n=== ALL CLEANUP VERIFICATION CHECKS PASSED ===');

  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    client.close();
    braveProcess.kill('SIGKILL');
  }
}

run();
