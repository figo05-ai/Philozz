import { spawn } from 'node:child_process';

const brave = spawn('/usr/bin/brave-browser', [
  '--headless=new',
  '--remote-debugging-port=9292',
  '--no-sandbox',
  '--disable-gpu',
]);

await new Promise(r => setTimeout(r, 1200));
const list = await fetch('http://127.0.0.1:9292/json').then(r => r.json());
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

// Test fixed overlay geometry
const testData = await call('Runtime.evaluate', {
  expression: `(() => {
    const badge = document.querySelector('.orbit-center-badge');
    const cards = Array.from(document.querySelectorAll('.projects-horizontal-gallery .gallery-project-card'));
    
    // Scroll to 1800 (Skills view)
    window.scrollTo({ top: 1800, behavior: 'instant' });
    const bRect = badge.getBoundingClientRect();
    const badgeCenter = {
      x: Math.round(bRect.left + bRect.width / 2),
      y: Math.round(bRect.top + bRect.height / 2)
    };
    
    // Scroll to 3000 (Projects view)
    window.scrollTo({ top: 3000, behavior: 'instant' });
    const cardRects = cards.map(c => {
      const r = c.getBoundingClientRect();
      return {
        left: Math.round(r.left),
        top: Math.round(r.top),
        width: Math.round(r.width),
        height: Math.round(r.height),
        centerX: Math.round(r.left + r.width / 2),
        centerY: Math.round(r.top + r.height / 2)
      };
    });
    
    return { badgeCenter, cardRects };
  })()`,
  returnByValue: true
});

console.log('Fixed overlay geometry test:', JSON.stringify(testData.result.value, null, 2));

brave.kill();
process.exit(0);
