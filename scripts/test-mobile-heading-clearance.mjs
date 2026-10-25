import { spawn } from 'node:child_process';

async function run() {
  const port = 9389;
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

    const targets = [
      { id: '#about', headingSel: '#about-title' },
      { id: '#skills', headingSel: '#skills-title' },
      { id: '#projects', headingSel: '.projects-editorial-heading' },
      { id: '#blog', headingSel: '.journal-editorial-heading' },
      { id: '#contact', headingSel: '.contact-main-heading' },
    ];

    const results = [];

    for (const t of targets) {
      await call('Runtime.evaluate', {
        expression: `(() => {
          const el = document.querySelector('${t.id}');
          if (el) el.scrollIntoView({ behavior: 'instant' });
        })()`,
      });
      await new Promise((r) => setTimeout(r, 400));

      const headingInfo = await call('Runtime.evaluate', {
        expression: `(() => {
          const nav = document.querySelector('.nav-header');
          const navHeight = nav ? nav.getBoundingClientRect().height : 72;
          const heading = document.querySelector('${t.headingSel}');
          const section = document.querySelector('${t.id}');
          const tag = section ? section.querySelector('.section-tag') : null;
          const hRect = heading ? heading.getBoundingClientRect() : null;
          const tRect = tag ? tag.getBoundingClientRect() : null;
          const sRect = section ? section.getBoundingClientRect() : null;

          return {
            target: '${t.id}',
            navHeight,
            sectionTop: sRect ? sRect.top : null,
            tagTop: tRect ? tRect.top : null,
            headingTop: hRect ? hRect.top : null,
            isHeadingClipped: hRect ? hRect.top < navHeight : null,
            isTagClipped: tRect ? tRect.top < navHeight : null,
          };
        })()`,
        returnByValue: true,
      });
      results.push(headingInfo.result.value);
    }

    console.log('Heading Clearance Test Results:\n', JSON.stringify(results, null, 2));

  } finally {
    ws.close();
    brave.kill();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
