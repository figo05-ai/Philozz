import { spawn } from 'node:child_process';

const brave = spawn('/usr/bin/brave-browser', [
  '--headless=new',
  '--remote-debugging-port=9288',
  '--no-sandbox',
  '--disable-gpu',
]);

await new Promise((r) => setTimeout(r, 1200));
const list = await fetch('http://127.0.0.1:9288/json').then((r) => r.json());
const ws = new WebSocket(list[0].webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));

let id = 1;
function call(method, params = {}) {
  return new Promise((resolve) => {
    const msgId = id++;
    const handler = (e) => {
      const data = JSON.parse(e.data);
      if (data.id === msgId) {
        ws.removeEventListener('message', handler);
        resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
}

await call('Emulation.setDeviceMetricsOverride', {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await call('Page.navigate', { url: 'http://localhost:3000' });
await new Promise((r) => setTimeout(r, 2000));

const rects = await call('Runtime.evaluate', {
  expression: `(() => {
    const getR = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        top: Math.round(r.top + window.scrollY),
        bottom: Math.round(r.bottom + window.scrollY),
        height: Math.round(r.height),
      };
    };

    const st = window.ScrollTrigger ? window.ScrollTrigger.getById('skills-to-projects') : null;

    return {
      scrollTrigger: st ? { start: st.start, end: st.end, distance: st.end - st.start } : null,
      skills: getR('#skills'),
      orbitStage: getR('.tech-orbit-stage'),
      orbitBadge: getR('.orbit-center-badge'),
      projects: getR('#projects'),
      projectsHeader: getR('.projects-header-wrapper'),
      galleryWrapper: getR('.projects-gallery-wrapper'),
      firstCard: getR('.gallery-project-card'),
      totalDocHeight: document.documentElement.scrollHeight,
    };
  })()`,
  returnByValue: true,
});

console.log('DOM Positions (absolute Y):', JSON.stringify(rects.result.value, null, 2));
ws.close();
brave.kill();
