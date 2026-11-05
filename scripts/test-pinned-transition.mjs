import { spawn } from 'node:child_process';

const brave = spawn('/usr/bin/brave-browser', [
  '--headless=new',
  '--remote-debugging-port=9296',
  '--no-sandbox',
  '--disable-gpu',
]);

await new Promise(r => setTimeout(r, 1200));
const list = await fetch('http://127.0.0.1:9296/json').then(r => r.json());
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

// Test pinning #skills for 500px
const pinSetup = await call('Runtime.evaluate', {
  expression: `(() => {
    const skills = document.getElementById('skills');
    const projects = document.getElementById('projects');
    
    // Kill existing skills-to-projects trigger for this test
    const old = window.ScrollTrigger.getById('skills-to-projects');
    if (old) old.kill();
    
    // Create new pinned trigger on #skills
    const st = window.ScrollTrigger.create({
      id: 'pinned-skills',
      trigger: skills,
      start: 'top top',
      end: '+=500',
      pin: true,
      pinSpacing: true,
    });
    
    return {
      success: true,
      start: st.start,
      end: st.end,
      totalDocHeight: document.documentElement.scrollHeight
    };
  })()`,
  returnByValue: true
});

console.log('Pin setup:', JSON.stringify(pinSetup.result.value, null, 2));

// Test at scrollY = 1800 (start of pin), 2050 (mid-pin), 2300 (end of pin), 2700 (unpinned, projects arriving)
for (const scrollY of [1800, 2050, 2300, 2700, 3100]) {
  await call('Runtime.evaluate', {
    expression: `document.documentElement.scrollTop = ${scrollY}; window.scrollTo({ top: ${scrollY}, behavior: 'instant' });`
  });
  await new Promise(r => setTimeout(r, 100));
  
  const check = await call('Runtime.evaluate', {
    expression: `(() => {
      const getR = sel => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: Math.round(r.top), bottom: Math.round(r.bottom) };
      };
      return {
        scrollY: window.scrollY,
        skills: getR('#skills'),
        badge: getR('.orbit-center-badge'),
        projects: getR('#projects'),
        header: getR('.projects-header-wrapper'),
        gallery: getR('.projects-gallery-wrapper'),
      };
    })()`,
    returnByValue: true
  });
  console.log(`scrollY=${scrollY}:`, JSON.stringify(check.result.value));
}

brave.kill();
process.exit(0);
