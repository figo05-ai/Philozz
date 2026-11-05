import { spawn } from 'node:child_process';

async function run() {
  const port = 9383;
  const brave = spawn('/usr/bin/brave-browser', [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--no-sandbox',
    '--disable-gpu',
  ]);

  await new Promise((r) => setTimeout(r, 1500));
  const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
  const ws = new WebSocket(list[0].webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));

  let id = 1;
  const pending = new Map();

  ws.addEventListener('message', (e) => {
    const data = JSON.parse(e.data);
    if (data.id && pending.has(data.id)) {
      const resolve = pending.get(data.id);
      pending.delete(data.id);
      resolve(data.result);
    }
  });

  function call(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  try {
    await call('Page.enable');
    await call('DOM.enable');
    await call('Runtime.enable');

    await call('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      hasTouch: true,
    });

    await call('Page.navigate', { url: 'http://localhost:3000' });
    await new Promise((r) => setTimeout(r, 2500));

    // Inspect all ScrollTriggers on mobile
    const stList = await call('Runtime.evaluate', {
      expression: `(() => {
        if (!window.ScrollTrigger) return 'No ST';
        const triggers = window.ScrollTrigger.getAll();
        return triggers.map(st => ({
          id: st.vars.id,
          trigger: st.trigger ? (st.trigger.id || st.trigger.className) : 'no trigger',
          pin: st.pin ? (st.pin.id || st.pin.className) : false,
          pinSpacing: st.vars.pinSpacing,
          start: st.start,
          end: st.end,
          totalDistance: st.end - st.start,
        }));
      })()`,
      returnByValue: true,
    });
    console.log('ScrollTriggers on Mobile:', JSON.stringify(stList.result.value, null, 2));

  } finally {
    ws.close();
    brave.kill();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
