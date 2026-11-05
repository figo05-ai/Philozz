import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACTS_DIR = '/home/figo/.gemini/antigravity/brain/57edb8e6-b535-4569-8be3-9ca13f8823ac';
const OUT_DIR = '/home/figo/Desktop/Philo/verification/phase09-archive';
const FRAMES_DIR = path.join(OUT_DIR, 'flow_frames');

fs.mkdirSync(FRAMES_DIR, { recursive: true });

async function recordFlow() {
  const port = 9398;
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

  let frameIdx = 0;
  async function captureFrame() {
    const res = await call('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(res.data, 'base64');
    const filename = `frame_${String(frameIdx++).padStart(4, '0')}.png`;
    fs.writeFileSync(path.join(FRAMES_DIR, filename), buf);
  }

  try {
    await call('Page.enable');
    await call('DOM.enable');
    await call('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log('Navigating to homepage #projects...');
    await call('Page.navigate', { url: 'http://localhost:3000/#projects' });
    await new Promise((r) => setTimeout(r, 2000));

    // Scroll to #projects
    await call('Runtime.evaluate', {
      expression: `(() => {
        const p = document.getElementById('projects');
        if (p) p.scrollIntoView({ behavior: 'instant', block: 'start' });
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));

    // 1. Hold on homepage resting projects (15 frames = 1s at 15fps)
    console.log('Recording Homepage resting...');
    for (let i = 0; i < 15; i++) {
      await captureFrame();
      await new Promise((r) => setTimeout(r, 66));
    }

    // 2. Click "View All Verified Projects" button
    console.log('Clicking View All Verified Projects...');
    await call('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('.projects-toggle-btn');
        if (btn) btn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1200));

    // 3. Record Project Archive page (30 frames = 2s)
    console.log('Recording Archive resting...');
    for (let i = 0; i < 30; i++) {
      await captureFrame();
      await new Promise((r) => setTimeout(r, 66));
    }

    // 4. Click "Backend Systems" category filter
    console.log('Clicking Backend Systems filter...');
    await call('Runtime.evaluate', {
      expression: `(() => {
        const pill = Array.from(document.querySelectorAll('.archive-filter-pill')).find(p => p.innerText.includes('Backend Systems'));
        if (pill) pill.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));
    for (let i = 0; i < 20; i++) {
      await captureFrame();
      await new Promise((r) => setTimeout(r, 66));
    }

    // 5. Click "All Projects"
    console.log('Clicking All Projects...');
    await call('Runtime.evaluate', {
      expression: `(() => {
        const pill = Array.from(document.querySelectorAll('.archive-filter-pill')).find(p => p.innerText.includes('All Projects'));
        if (pill) pill.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));
    for (let i = 0; i < 15; i++) {
      await captureFrame();
      await new Promise((r) => setTimeout(r, 66));
    }

    // 6. Click "BACK TO PORTFOLIO"
    console.log('Clicking Back to Portfolio...');
    await call('Runtime.evaluate', {
      expression: `(() => {
        const back = document.querySelector('.archive-back-link');
        if (back) back.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1800));

    // 7. On homepage, scroll down into the Projects -> Blog transition
    console.log('Scrolling through Projects -> Blog transition...');
    const stInfo = await call('Runtime.evaluate', {
      expression: `(() => {
        const st = window.ScrollTrigger.getById('projects-to-blog');
        if (!st) return null;
        return { start: st.start, end: st.end };
      })()`,
      returnByValue: true,
    });

    if (stInfo.result.value) {
      const { start, end } = stInfo.result.value;
      const scrollSteps = 30;
      for (let s = 0; s <= scrollSteps; s++) {
        const target = start + (s / scrollSteps) * (end - start);
        await call('Runtime.evaluate', {
          expression: `window.scrollTo({ top: ${target}, behavior: 'instant' }); window.ScrollTrigger.getById('projects-to-blog')?.update();`,
        });
        await new Promise((r) => setTimeout(r, 50));
        await captureFrame();
      }
    }

    // Hold at blog end (15 frames)
    for (let i = 0; i < 15; i++) {
      await captureFrame();
      await new Promise((r) => setTimeout(r, 66));
    }

    console.log(`\nCaptured ${frameIdx} frames. Encoding video...`);

    // Encode MP4 and GIF using ffmpeg
    const mp4Out = path.join(OUT_DIR, 'phase09-archive-flow.mp4');
    const gifOut = path.join(OUT_DIR, 'phase09-archive-flow.gif');

    await new Promise((resolve, reject) => {
      const ff = spawn('ffmpeg', [
        '-y',
        '-framerate', '15',
        '-i', path.join(FRAMES_DIR, 'frame_%04d.png'),
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-crf', '22',
        mp4Out,
      ]);
      ff.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg mp4 failed: ${code}`))));
    });

    console.log(`MP4 encoded: ${mp4Out}`);

    await new Promise((resolve, reject) => {
      const ff = spawn('ffmpeg', [
        '-y',
        '-framerate', '12',
        '-i', path.join(FRAMES_DIR, 'frame_%04d.png'),
        '-vf', 'fps=12,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
        gifOut,
      ]);
      ff.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg gif failed: ${code}`))));
    });

    console.log(`GIF encoded: ${gifOut}`);

    // Copy to artifacts dir
    fs.copyFileSync(mp4Out, path.join(ARTIFACTS_DIR, 'phase09-archive-flow.mp4'));
    fs.copyFileSync(gifOut, path.join(ARTIFACTS_DIR, 'phase09-archive-flow.gif'));
    console.log('Copied videos to Artifacts directory.');

  } catch (err) {
    console.error('Recording error:', err);
  } finally {
    ws.close();
    brave.kill('SIGTERM');
  }
}

recordFlow();
