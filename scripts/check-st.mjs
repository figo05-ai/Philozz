import { spawn } from 'node:child_process';

const brave = spawn('/usr/bin/brave-browser', [
  '--headless=new',
  '--remote-debugging-port=9223',
  '--no-sandbox',
  '--disable-gpu',
]);

await new Promise(r => setTimeout(r, 1000));
const list = await fetch('http://127.0.0.1:9223/json').then(r => r.json());
const ws = new WebSocket(list[0].webSocketDebuggerUrl);

await new Promise(r => ws.onopen = r);
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

await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await call('Page.navigate', { url: 'http://localhost:3000' });
await new Promise(r => setTimeout(r, 2000));

const scrollTriggers = await call('Runtime.evaluate', {
  expression: `(() => {
    // Check all existing ScrollTrigger instances
    if (window.ScrollTrigger) {
      return window.ScrollTrigger.getAll().map(st => ({
        id: st.vars.id || 'unnamed',
        start: st.start,
        end: st.end,
        trigger: st.trigger ? st.trigger.className || st.trigger.tagName : 'none'
      }));
    }
    return [];
  })()`,
  returnByValue: true
});

console.log('Existing ScrollTriggers:', scrollTriggers.result.value);

ws.close();
brave.kill();
