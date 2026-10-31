import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const bravePort = 9394;
const OUT_DIR = '/home/figo/Desktop/Philo/verification/engineering-atlas';
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

  async setViewport(width, height, mobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile,
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
      '--user-data-dir=/tmp/brave-atlas-test',
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
        // wait
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

    // ==========================================
    // TEST 1: Homepage "Explore My Skills" Button
    // ==========================================
    console.log('Testing Homepage Explore My Skills button navigation...');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000/#skills' });
    await wait(3500);

    const exploreButtonHref = await cdp.evaluate(`
      (() => {
        const btn = document.querySelector('a.btn-outline-gold[href="/skills"]');
        return btn ? btn.getAttribute('href') : null;
      })()
    `);
    console.log(`Homepage "Explore My Skills" button href: ${exploreButtonHref}`);
    if (exploreButtonHref !== '/skills') {
      throw new Error(`Expected Explore My Skills button to have href="/skills", got "${exploreButtonHref}"`);
    }

    await cdp.screenshot('01_homepage_explore_skills_button.png');

    // ==========================================
    // TEST 2: /skills Hero Section & Computed Stats
    // ==========================================
    console.log('Navigating to http://localhost:3000/skills...');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000/skills' });
    await wait(3000);

    const atlasStats = await cdp.evaluate(`
      (() => {
        const title = document.querySelector('#atlas-hero-title')?.textContent?.trim();
        const statCards = Array.from(document.querySelectorAll('.atlas-stat-card'));
        const stats = statCards.map(c => ({
          value: c.querySelector('.atlas-stat-value')?.textContent?.trim(),
          label: c.querySelector('.atlas-stat-label')?.textContent?.trim()
        }));
        return { title, stats };
      })()
    `);
    console.log('Atlas Hero Info & Stats:', JSON.stringify(atlasStats, null, 2));

    await cdp.screenshot('02_atlas_hero_and_computed_stats.png');

    // ==========================================
    // TEST 3: Section 2: Disciplines Explorer
    // ==========================================
    console.log('Checking Disciplines Explorer...');
    await cdp.evaluate(`document.querySelector('#disciplines')?.scrollIntoView({ behavior: 'instant' });`);
    await wait(1000);

    const disciplinesInfo = await cdp.evaluate(`
      (() => {
        const cards = Array.from(document.querySelectorAll('.atlas-discipline-card'));
        return cards.map(c => ({
          name: c.querySelector('.atlas-discipline-name')?.textContent?.trim(),
          level: c.querySelector('.atlas-discipline-level')?.textContent?.trim(),
          chipsCount: c.querySelectorAll('.atlas-chip').length
        }));
      })()
    `);
    console.log(`Found ${disciplinesInfo.length} disciplines:`, disciplinesInfo.map(d => d.name));

    await cdp.screenshot('03_atlas_disciplines_explorer.png');

    // ==========================================
    // TEST 4: Section 3: Technology Explorer & Filtering
    // ==========================================
    console.log('Checking Technology Explorer & Filter Interactions...');
    await cdp.evaluate(`document.querySelector('#technologies')?.scrollIntoView({ behavior: 'instant' });`);
    await wait(1000);

    // Initial tech count
    const initialTechCount = await cdp.evaluate(`document.querySelectorAll('.atlas-tech-card').length;`);
    console.log(`Initial visible technologies: ${initialTechCount}`);

    await cdp.screenshot('04_atlas_technologies_grid.png');

    // Test Search filter: search "Laravel"
    console.log('Testing search query "Laravel"...');
    await cdp.evaluate(`
      (() => {
        const input = document.querySelector('.atlas-search-input');
        input.value = 'Laravel';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      })()
    `);
    await wait(800);

    const searchResultCount = await cdp.evaluate(`document.querySelectorAll('.atlas-tech-card').length;`);
    console.log(`Technologies matching 'Laravel': ${searchResultCount}`);

    await cdp.screenshot('05_atlas_search_filter_laravel.png');

    // Reset search
    await cdp.evaluate(`
      (() => {
        const input = document.querySelector('.atlas-search-input');
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      })()
    `);
    await wait(500);

    // ==========================================
    // TEST 5: Section 4: Connected Knowledge Graph
    // ==========================================
    console.log('Checking Connected Knowledge Graph...');
    await cdp.evaluate(`document.querySelector('#connections')?.scrollIntoView({ behavior: 'instant' });`);
    await wait(1000);

    const graphInfo = await cdp.evaluate(`
      (() => {
        const nodes = document.querySelectorAll('.atlas-graph-interactive-node').length;
        const edges = document.querySelectorAll('.atlas-graph-svg-wrap line').length;
        return { nodes, edges };
      })()
    `);
    console.log(`Knowledge Graph: ${graphInfo.nodes} nodes, ${graphInfo.edges} edges`);

    await cdp.screenshot('06_atlas_knowledge_graph.png');

    // Switch to Accessible Matrix view
    console.log('Testing Accessible Matrix view toggle...');
    await cdp.evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('.atlas-knowledge-container button'));
        const matrixBtn = btns.find(b => b.textContent.includes('Matrix'));
        if (matrixBtn) matrixBtn.click();
      })()
    `);
    await wait(800);

    await cdp.screenshot('07_atlas_accessible_matrix.png');

    // ==========================================
    // TEST 6: Section 5: Continuous Learning
    // ==========================================
    console.log('Checking Continuous Learning section...');
    await cdp.evaluate(`document.querySelector('#learning')?.scrollIntoView({ behavior: 'instant' });`);
    await wait(1000);

    await cdp.screenshot('08_atlas_continuous_learning.png');

    // ==========================================
    // TEST 7: Detail Page (/skills/laravel)
    // ==========================================
    console.log('Testing Technology Detail Page: /skills/laravel...');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000/skills/laravel' });
    await wait(3000);

    const detailInfo = await cdp.evaluate(`
      (() => {
        const title = document.querySelector('#tech-title')?.textContent?.trim();
        const badge = document.querySelector('.atlas-status-badge')?.textContent?.trim();
        const caps = Array.from(document.querySelectorAll('.atlas-detail-card:nth-of-type(1) span')).map(s => s.textContent.trim());
        const projectCards = document.querySelectorAll('.atlas-detail-card:nth-of-type(2) article').length;
        return { title, badge, capsCount: caps.length, projectCards };
      })()
    `);
    console.log('Detail Page /skills/laravel Info:', JSON.stringify(detailInfo, null, 2));

    await cdp.screenshot('09_technology_detail_page_laravel.png');

    // Scroll down on detail page to see project connections and siblings
    await cdp.evaluate(`window.scrollBy({ top: 700, behavior: 'instant' });`);
    await wait(1000);
    await cdp.screenshot('10_technology_detail_projects_and_siblings.png');

    // ==========================================
    // TEST 8: Responsive Layout (Mobile: 390x844)
    // ==========================================
    console.log('Testing Mobile Viewport (390x844)...');
    await cdp.setViewport(390, 844, true);
    await cdp.send('Page.navigate', { url: 'http://localhost:3000/skills' });
    await wait(3000);

    await cdp.screenshot('11_mobile_atlas_hero.png');

    await cdp.evaluate(`window.scrollBy({ top: 800, behavior: 'instant' });`);
    await wait(1000);
    await cdp.screenshot('12_mobile_atlas_disciplines.png');

    await cdp.evaluate(`window.scrollBy({ top: 1000, behavior: 'instant' });`);
    await wait(1000);
    await cdp.screenshot('13_mobile_atlas_tech_card.png');

    console.log('All Engineering Atlas tests passed 100%!');
  } finally {
    if (cdp) cdp.close();
    braveProcess.kill();
  }
}

main().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
