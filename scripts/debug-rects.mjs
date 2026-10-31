import { spawn } from 'node:child_process';
import fs from 'node:fs';

async function test() {
  const bravePort = 9395;
  const proc = spawn('/opt/brave.com/brave/brave', [
    '--headless=new',
    '--remote-debugging-port=' + bravePort,
    '--window-size=1920,1080',
    '--no-sandbox',
    'about:blank',
  ]);

  await new Promise((r) => setTimeout(r, 1000));
  const res = await fetch('http://127.0.0.1:' + bravePort + '/json');
  const list = await res.json();
  const wsUrl = list.find((t) => t.type === 'page').webSocketDebuggerUrl;

  const ws = new WebSocket(wsUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 1;
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const mid = id++;
      const handler = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === mid) {
          ws.removeEventListener('message', handler);
          resolve(d.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: mid, method, params }));
    });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Page.navigate', { url: 'http://localhost:3000/?gateway=force' });
  await new Promise((r) => setTimeout(r, 1500));

  for (const t of [2.1, 2.25, 2.49]) {
    await send('Runtime.evaluate', {
      expression: `(() => {
        const tl = window.__GATEWAY_TIMELINE;
        if (tl) {
          tl.seek(${t});
          const v = document.querySelector('video');
          if (v) v.currentTime = Math.min(${t}, 2.13);
        }
        return true;
      })()`,
      returnByValue: true,
    });
    await new Promise((r) => setTimeout(r, 150));
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(shot.data, 'base64');
    fs.writeFileSync(`/home/figo/Desktop/Philo/verification/debug_1920_${t}s.png`, buf);
    console.log(`Saved /home/figo/Desktop/Philo/verification/debug_1920_${t}s.png`);
  }

  ws.close();
  proc.kill();
}
test().catch(console.error);
