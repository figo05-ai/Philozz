import { spawn } from 'node:child_process';

const brave = spawn('/usr/bin/brave-browser', [
  '--headless=new',
  '--remote-debugging-port=9294',
  '--no-sandbox',
  '--disable-gpu',
]);

await new Promise(r => setTimeout(r, 1200));
const list = await fetch('http://127.0.0.1:9294/json').then(r => r.json());
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

// Let's test the scroll trajectory and check for overlap
const overlapCheck = await call('Runtime.evaluate', {
  expression: `(() => {
    const st = window.ScrollTrigger.getById('skills-to-projects');
    if (!st) return { error: 'ST not found' };
    return { start: st.start, end: st.end };
  })()`,
  returnByValue: true
});
console.log('ST:', overlapCheck.result.value);

brave.kill();
process.exit(0);
