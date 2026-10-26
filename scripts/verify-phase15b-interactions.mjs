import { spawn } from 'node:child_process';
import path from 'node:path';

const PORT = 3005;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function main() {
  console.log(`[Phase 15B Interactive Verification] Starting headless browser...`);
  const brave = spawn('/usr/bin/brave-browser', [
    '--headless=new',
    '--remote-debugging-port=9466',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
  ]);

  let closed = false;
  const cleanup = () => {
    if (!closed) {
      closed = true;
      brave.kill();
    }
  };
  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);

  await new Promise((r) => setTimeout(r, 1500));

  const list = await fetch('http://127.0.0.1:9466/json').then((r) => r.json());
  const ws = new WebSocket(list[0].webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));

  let msgId = 1;
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
      const id = msgId++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await call('Page.enable');
  await call('Runtime.enable');
  await call('DOM.enable');

  console.log('\n--- 1. Testing Skip Link & Main Content Landmark ---');
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await call('Page.navigate', { url: `${BASE_URL}/` });
  await new Promise((r) => setTimeout(r, 1800));

  const skipTest = await call('Runtime.evaluate', {
    expression: `(() => {
      const skip = document.querySelector('.skip-link');
      const main = document.getElementById('main-content');
      if (!skip || !main) return { success: false, reason: 'Elements missing' };
      
      skip.focus();
      const isFocused = document.activeElement === skip;
      const targetHref = skip.getAttribute('href');
      return {
        success: isFocused && targetHref === '#main-content',
        isFocused,
        targetHref,
        mainTag: main.tagName,
        mainId: main.id
      };
    })()`,
    returnByValue: true,
  });
  console.log('Skip link test result:', skipTest?.result?.value);

  console.log('\n--- 2. Testing Mobile Navigation Drawer Focus Trap & Escape ---');
  await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await call('Page.navigate', { url: `${BASE_URL}/` });
  await new Promise((r) => setTimeout(r, 1800));

  const drawerTest = await call('Runtime.evaluate', {
    expression: `(() => {
      const toggle = document.querySelector('.nav-mobile-toggle');
      if (!toggle) return { error: 'Toggle button missing' };

      // 1. Click toggle to open
      toggle.click();
      return { opened: true };
    })()`,
    returnByValue: true,
  });
  console.log('Mobile toggle clicked:', drawerTest?.result?.value);
  await new Promise((r) => setTimeout(r, 300));

  const trapTest = await call('Runtime.evaluate', {
    expression: `(() => {
      const drawer = document.getElementById('mobile-navigation-drawer');
      const toggle = document.querySelector('.nav-mobile-toggle');
      if (!drawer) return { error: 'Drawer element not rendered' };

      const focusables = Array.from(drawer.querySelectorAll('a[href], button:not([disabled])'));
      const activeEl = document.activeElement;
      
      // Simulate Escape key press
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
      window.dispatchEvent(escapeEvent);

      return {
        drawerRendered: Boolean(drawer),
        focusablesCount: focusables.length,
        drawerRole: drawer.getAttribute('role'),
        drawerModal: drawer.getAttribute('aria-modal'),
      };
    })()`,
    returnByValue: true,
  });
  console.log('Drawer ARIA & Focus Trap specs:', trapTest?.result?.value);

  await new Promise((r) => setTimeout(r, 300));
  const afterEscapeTest = await call('Runtime.evaluate', {
    expression: `(() => {
      const drawer = document.getElementById('mobile-navigation-drawer');
      const toggle = document.querySelector('.nav-mobile-toggle');
      return {
        drawerClosed: drawer === null,
        toggleFocused: document.activeElement === toggle
      };
    })()`,
    returnByValue: true,
  });
  console.log('After Escape key:', afterEscapeTest?.result?.value);

  console.log('\n--- 3. Testing Skills Orbit / Technology Focus Mode ---');
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await call('Page.navigate', { url: `${BASE_URL}/#skills` });
  await new Promise((r) => setTimeout(r, 1800));

  const orbitTest = await call('Runtime.evaluate', {
    expression: `(() => {
      const pedestals = Array.from(document.querySelectorAll('.tech-pedestal-node'));
      const consoleEl = document.querySelector('.tech-focus-console');
      if (pedestals.length === 0) return { error: 'Pedestals missing' };

      const p0 = pedestals[0]; // Laravel
      p0.focus();

      // Simulate ArrowRight key press to navigate to PHP
      const arrowRight = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
      p0.dispatchEvent(arrowRight);

      const p1 = document.getElementById('pedestal-php');
      const isP1Focused = document.activeElement === p1;

      // Simulate Enter key on PHP
      const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      p1.dispatchEvent(enter);

      const consoleText = consoleEl ? consoleEl.textContent.trim() : '';
      const isPressed = p1.getAttribute('aria-pressed');

      // Simulate Escape key to dismiss
      const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
      p1.dispatchEvent(escape);

      const isPressedAfterEscape = p1.getAttribute('aria-pressed');

      return {
        pedestalsCount: pedestals.length,
        arrowNavigationWorked: isP1Focused,
        enterToggledSelected: isPressed === 'true',
        escapeDismissedFocus: isPressedAfterEscape === 'false',
        consoleLiveRegion: consoleEl?.getAttribute('aria-live'),
        consoleAtomic: consoleEl?.getAttribute('aria-atomic'),
        consoleAnnouncementSample: consoleText.slice(0, 80)
      };
    })()`,
    returnByValue: true,
  });
  console.log('Skills Orbit keyboard & announcement test:', orbitTest?.result?.value);

  console.log('\n--- 4. Testing Reflow at 320px & 360px Viewports (WCAG 1.4.10) ---');
  for (const w of [360, 320]) {
    await call('Emulation.setDeviceMetricsOverride', { width: w, height: 740, deviceScaleFactor: 2, mobile: true });
    await call('Page.navigate', { url: `${BASE_URL}/` });
    await new Promise((r) => setTimeout(r, 1500));

    const reflowResult = await call('Runtime.evaluate', {
      expression: `(() => {
        const docWidth = document.documentElement.offsetWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        const bodyScrollWidth = document.body.scrollWidth;
        const hasHorizontalScroll = scrollWidth > docWidth + 1 || bodyScrollWidth > docWidth + 1;
        return {
          viewportWidth: window.innerWidth,
          scrollWidth,
          bodyScrollWidth,
          hasHorizontalScroll,
        };
      })()`,
      returnByValue: true,
    });
    console.log(`Reflow at ${w}px:`, reflowResult?.result?.value);
  }

  console.log('\n--- 5. Testing Prefers-Reduced-Motion Emulation ---');
  await call('Emulation.setEmulatedMedia', {
    media: 'screen',
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  await call('Page.navigate', { url: `${BASE_URL}/` });
  await new Promise((r) => setTimeout(r, 1800));

  const reducedMotionTest = await call('Runtime.evaluate', {
    expression: `(() => {
      const heroTitle = document.getElementById('hero-title');
      const aboutSection = document.getElementById('about');
      const skillsSection = document.getElementById('skills');
      const projectsSection = document.getElementById('projects');

      const isVisible = (el) => Boolean(el && el.offsetParent !== null);

      return {
        heroTitleVisible: isVisible(heroTitle),
        aboutSectionPresent: Boolean(aboutSection),
        skillsSectionPresent: Boolean(skillsSection),
        projectsSectionPresent: Boolean(projectsSection),
        heroTitleText: heroTitle?.textContent.trim(),
      };
    })()`,
    returnByValue: true,
  });
  console.log('Reduced motion check:', reducedMotionTest?.result?.value);

  cleanup();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
