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

const info = await call('Runtime.evaluate', {
  expression: `(() => {
    const hero = document.querySelector('.scene-hero-cinematic')?.getBoundingClientRect();
    const skills = document.querySelector('#skills')?.getBoundingClientRect();
    const buildingCard = document.querySelector('.comp-card-building')?.getBoundingClientRect();
    const ideBox = document.querySelector('.comp-ide-box')?.getBoundingClientRect();
    const pedestals = document.querySelectorAll('.tech-pedestal-node');
    return {
      windowHeight: window.innerHeight,
      windowWidth: window.innerWidth,
      scrollHeight: document.documentElement.scrollHeight,
      hero: hero ? { top: hero.top, height: hero.height, bottom: hero.bottom } : null,
      skills: skills ? { top: skills.top, height: skills.height, bottom: skills.bottom } : null,
      buildingCard: buildingCard ? { top: buildingCard.top, left: buildingCard.left, width: buildingCard.width, height: buildingCard.height } : null,
      ideBox: ideBox ? { top: ideBox.top, left: ideBox.left, width: ideBox.width, height: ideBox.height } : null,
      pedestalsCount: pedestals.length,
    };
  })()`,
  returnByValue: true
});

console.log('DOM Info:', JSON.stringify(info.result.value, null, 2));

// Test scroll to 900 (end of Hero transition, About settled)
await call('Runtime.evaluate', { expression: 'window.scrollTo(0, 900)' });
await new Promise(r => setTimeout(r, 600));

const at900 = await call('Runtime.evaluate', {
  expression: `(() => {
    const hero = document.querySelector('.scene-hero-cinematic')?.getBoundingClientRect();
    const skills = document.querySelector('#skills')?.getBoundingClientRect();
    const buildingCard = document.querySelector('.comp-card-building')?.getBoundingClientRect();
    return {
      scrollY: window.scrollY,
      hero: hero ? { top: hero.top, height: hero.height, bottom: hero.bottom } : null,
      skills: skills ? { top: skills.top, height: skills.height, bottom: skills.bottom } : null,
      buildingCard: buildingCard ? { top: buildingCard.top, left: buildingCard.left, width: buildingCard.width, height: buildingCard.height } : null,
    };
  })()`,
  returnByValue: true
});
console.log('At scroll 900:', JSON.stringify(at900.result.value, null, 2));

ws.close();
brave.kill();
