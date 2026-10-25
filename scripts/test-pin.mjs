import { spawn } from 'node:child_process';

const brave = spawn('/usr/bin/brave-browser', [
  '--headless=new',
  '--remote-debugging-port=9291',
  '--no-sandbox',
  '--disable-gpu',
]);

await new Promise(r => setTimeout(r, 1200));
const list = await fetch('http://127.0.0.1:9291/json').then(r => r.json());
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

// Test adding a pin on #skills via ScrollTrigger
const res = await call('Runtime.evaluate', {
  expression: `(() => {
    try {
      const skills = document.getElementById('skills');
      const st = window.ScrollTrigger.create({
        trigger: skills,
        start: 'top top',
        end: '+=500',
        pin: true,
        id: 'test-pin'
      });
      return { success: true, start: st.start, end: st.end, pinSpacer: !!document.querySelector('.pin-spacer') };
    } catch (e) {
      return { success: false, error: e.message };
    }
  })()`,
  returnByValue: true
});

console.log('Pin test result:', JSON.stringify(res.result.value));

// Scroll to 2000 and check where badge is
await call('Runtime.evaluate', { expression: "document.documentElement.scrollTop = 2000; window.scrollTo({ top: 2000, behavior: 'instant' });" });
await new Promise(r => setTimeout(r, 150));

const badgePos = await call('Runtime.evaluate', {
  expression: `(() => {
    const badge = document.querySelector('.orbit-center-badge');
    const r = badge.getBoundingClientRect();
    return { top: Math.round(r.top), bottom: Math.round(r.bottom) };
  })()`,
  returnByValue: true
});
console.log('Badge position at scrollY=2000 with pin:', JSON.stringify(badgePos.result.value));

// Check Projects position at scrollY=2000
const projPos = await call('Runtime.evaluate', {
  expression: `(() => {
    const projects = document.getElementById('projects');
    const r = projects.getBoundingClientRect();
    return { top: Math.round(r.top), bottom: Math.round(r.bottom) };
  })()`,
  returnByValue: true
});
console.log('Projects position at scrollY=2000 with pin:', JSON.stringify(projPos.result.value));

// Scroll past pin to scrollY=2600
await call('Runtime.evaluate', { expression: "document.documentElement.scrollTop = 2600; window.scrollTo({ top: 2600, behavior: 'instant' });" });
await new Promise(r => setTimeout(r, 150));
const projPos2600 = await call('Runtime.evaluate', {
  expression: `(() => {
    const projects = document.getElementById('projects');
    const r = projects.getBoundingClientRect();
    return { top: Math.round(r.top), bottom: Math.round(r.bottom) };
  })()`,
  returnByValue: true
});
console.log('Projects position at scrollY=2600 (unpinned):', JSON.stringify(projPos2600.result.value));

// Reverse scroll to 900
await call('Runtime.evaluate', { expression: "document.documentElement.scrollTop = 900; window.scrollTo({ top: 900, behavior: 'instant' });" });
await new Promise(r => setTimeout(r, 150));
const aboutPos = await call('Runtime.evaluate', {
  expression: `(() => {
    const skills = document.getElementById('skills');
    const r = skills.getBoundingClientRect();
    return { top: Math.round(r.top), bottom: Math.round(r.bottom) };
  })()`,
  returnByValue: true
});
console.log('Skills position at scrollY=900 (reverse):', JSON.stringify(aboutPos.result.value));


brave.kill();
process.exit(0);
