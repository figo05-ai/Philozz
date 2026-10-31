import { spawn } from 'node:child_process';

async function run() {
  const bravePort = 9401;
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
          if (d.error) resolve({ error: d.error });
          else resolve(d.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: mid, method, params }));
    });

  await send('Page.enable');
  await send('Runtime.enable');

  for (const [w, h] of [[1920, 1080], [1440, 900], [390, 844]]) {
    console.log(`\n=== Viewport ${w}x${h} ===`);
    await send('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: h,
      deviceScaleFactor: 1,
      mobile: w < 500,
    });
    await send('Page.navigate', { url: 'http://localhost:3000/?gateway=force' });
    await new Promise((r) => setTimeout(r, 1200));

    // Wait for timeline
    for (let i = 0; i < 20; i++) {
      const check = await send('Runtime.evaluate', {
        expression: '!!window.__GATEWAY_TIMELINE',
        returnByValue: true,
      });
      if (check.result?.value) break;
      await new Promise((r) => setTimeout(r, 100));
    }

    // Pause timeline
    await send('Runtime.evaluate', {
      expression: 'if (window.__GATEWAY_TIMELINE) window.__GATEWAY_TIMELINE.pause();',
    });

    for (const t of [2.0, 2.1, 2.2, 2.3, 2.4, 2.49, 2.5, 2.6, 2.8, 3.02]) {
      const data = await send('Runtime.evaluate', {
        expression: `(() => {
          const tl = window.__GATEWAY_TIMELINE;
          if (tl) {
            tl.seek(${t});
            const v = document.querySelector('video');
            if (v) v.currentTime = Math.min(${t}, 2.13);
          }
          const svgPath = document.querySelector('svg path:nth-of-type(2)');
          const fullLine = document.querySelector('div[style*="height: 2px"]');
          const stage = document.querySelector('div[style*="width: 1600px"]');
          
          let svgRect = svgPath ? svgPath.getBoundingClientRect() : null;
          let lineRect = fullLine ? fullLine.getBoundingClientRect() : null;

          const svgY = svgRect ? (svgRect.top + svgRect.height / 2) : null;
          const lineY = lineRect ? (lineRect.top + lineRect.height / 2) : null;

          return {
            t: ${t},
            svgY: svgY !== null ? svgY.toFixed(2) : 'none',
            svgOpacity: svgPath ? window.getComputedStyle(svgPath.closest('svg')).opacity : 'none',
            lineY: lineY !== null ? lineY.toFixed(2) : 'none',
            lineOpacity: lineRect ? window.getComputedStyle(fullLine).opacity : 'none',
            diff: (svgY !== null && lineY !== null) ? Math.abs(svgY - lineY).toFixed(2) : 'n/a',
            stageTransform: stage ? stage.style.transform : 'none'
          };
        })()`,
        returnByValue: true,
      });
      console.log(data.result?.value || data);
    }
  }

  ws.close();
  proc.kill();
}
run().catch(console.error);
