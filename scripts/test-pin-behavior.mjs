import { spawn } from 'node:child_process';

const brave = spawn('/usr/bin/brave-browser', [
  '--headless=new',
  '--remote-debugging-port=9290',
  '--no-sandbox',
  '--disable-gpu',
]);

await new Promise(r => setTimeout(r, 1200));
const list = await fetch('http://127.0.0.1:9290/json').then(r => r.json());
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
    const skills = document.getElementById('skills');
    const projects = document.getElementById('projects');
    const badge = document.querySelector('.orbit-center-badge');
    
    // Check if ScrollTrigger is active
    const triggers = window.ScrollTrigger.getAll();
    return triggers.map(t => ({
      id: t.vars.id,
      start: t.start,
      end: t.end,
      pin: !!t.pin
    }));
  })()`,
  returnByValue: true
});

console.log('Active ScrollTriggers:', JSON.stringify(res.result.value, null, 2));

brave.kill();
process.exit(0);
