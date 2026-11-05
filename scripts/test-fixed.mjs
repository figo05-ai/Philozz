import { spawn } from 'node:child_process';

const brave = spawn('/usr/bin/brave-browser', [
  '--headless=new',
  '--remote-debugging-port=9297',
  '--no-sandbox',
  '--disable-gpu',
]);

await new Promise(r => setTimeout(r, 1200));
const list = await fetch('http://127.0.0.1:9297/json').then(r => r.json());
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

const res = await call('Runtime.evaluate', {
  expression: `(() => {
    const el = document.querySelector('.skills-to-projects-transition-layer');
    el.style.position = 'fixed';
    el.style.top = '0';
    el.style.left = '0';
    el.style.width = '100vw';
    el.style.height = '100vh';
    el.style.display = 'block';
    const r = el.getBoundingClientRect();
    return { top: r.top, left: r.left, width: r.width, height: r.height };
  })()`,
  returnByValue: true
});

console.log('Fixed layer rect:', JSON.stringify(res.result.value));
brave.kill();
process.exit(0);
