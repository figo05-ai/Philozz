import { spawn } from 'node:child_process';

const brave = spawn('/usr/bin/brave-browser', [
  '--headless=new',
  '--remote-debugging-port=9299',
  '--no-sandbox',
  '--disable-gpu',
]);

await new Promise(r => setTimeout(r, 1200));
const list = await fetch('http://127.0.0.1:9299/json').then(r => r.json());
const ws = new WebSocket(list[0].webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);

let id = 1;
function call(method, params = {}) {
  return new Promise(resolve => {
    const msgId = id++;
    const handler = e => {
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

await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await call('Page.navigate', { url: 'http://localhost:3000' });
await new Promise(r => setTimeout(r, 2000));

// Scroll to projects
await call('Runtime.evaluate', {
  expression: `window.scrollTo({ top: 3100, behavior: 'instant' });`
});
await new Promise(r => setTimeout(r, 200));

const res = await call('Runtime.evaluate', {
  expression: `(() => {
    const cards = Array.from(document.querySelectorAll('.gallery-project-card')).slice(0, 3);
    const layer = document.querySelector('.skills-to-projects-transition-layer');
    if (layer) {
      layer.style.display = 'block';
      layer.style.opacity = '1';
    }
    const frames = Array.from(document.querySelectorAll('.transition-wireframe-frame'));
    frames.forEach(f => {
      f.style.transform = 'none';
      f.style.opacity = '1';
    });
    return {
      cards: cards.map(c => {
        const r = c.getBoundingClientRect();
        return { width: Math.round(r.width), height: Math.round(r.height), left: Math.round(r.left), top: Math.round(r.top) };
      }),
      frames: frames.map(f => {
        const r = f.getBoundingClientRect();
        return { width: Math.round(r.width), height: Math.round(r.height), left: Math.round(r.left), top: Math.round(r.top) };
      })
    };
  })()`,
  returnByValue: true
});

console.log(JSON.stringify(res.result.value, null, 2));

brave.kill();
process.exit(0);
