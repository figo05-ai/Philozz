import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACTS_DIR = '/home/figo/.gemini/antigravity/brain/57edb8e6-b535-4569-8be3-9ca13f8823ac';
const OUT_DIR = '/home/figo/Desktop/Philo/verification/phase11-blog';
const FRAMES_DIR = path.join(OUT_DIR, 'flow_frames');

fs.mkdirSync(FRAMES_DIR, { recursive: true });

async function recordFlow() {
  const port = 9396;
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

    console.log('Navigating to homepage #blog...');
    await call('Page.navigate', { url: 'http://localhost:3000/#blog' });
    await new Promise((r) => setTimeout(r, 2000));

    // Scroll to #blog
    await call('Runtime.evaluate', {
      expression: `(() => {
        const b = document.getElementById('blog');
        if (b) b.scrollIntoView({ behavior: 'instant', block: 'start' });
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));

    // 1. Hold on homepage resting journal (12 frames)
    console.log('Recording Homepage Journal resting...');
    for (let i = 0; i < 12; i++) {
      await captureFrame();
      await new Promise((r) => setTimeout(r, 66));
    }

    // Scroll slightly down to highlight secondary cards & View All Blogs button
    console.log('Highlighting View All Blogs button...');
    await call('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('.journal-toggle-wrapper');
        if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })()`,
    });
    for (let i = 0; i < 15; i++) {
      await captureFrame();
      await new Promise((r) => setTimeout(r, 66));
    }

    // 2. Click "View All Blogs" button to navigate to /blog
    console.log('Clicking View All Blogs...');
    await call('Page.navigate', { url: 'http://localhost:3000/blog' });
    await new Promise((r) => setTimeout(r, 1800));

    // 3. Hold on /blog hero and controls (12 frames)
    console.log('Recording Archive Header...');
    for (let i = 0; i < 12; i++) {
      await captureFrame();
      await new Promise((r) => setTimeout(r, 66));
    }

    // 4. Click "Database Engineering" filter pill
    console.log('Filtering by Database Engineering...');
    await call('Runtime.evaluate', {
      expression: `(() => {
        const pills = Array.from(document.querySelectorAll('.archive-filter-pill'));
        const dbPill = pills.find(p => p.textContent.includes('Database Engineering'));
        if (dbPill) dbPill.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));

    for (let i = 0; i < 15; i++) {
      await captureFrame();
      await new Promise((r) => setTimeout(r, 66));
    }

    // 5. Reset filter
    console.log('Resetting category filter...');
    await call('Runtime.evaluate', {
      expression: `(() => {
        const resetBtn = document.querySelector('.archive-meta-bar button');
        if (resetBtn) resetBtn.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));

    for (let i = 0; i < 8; i++) {
      await captureFrame();
      await new Promise((r) => setTimeout(r, 66));
    }

    // 6. Navigate to Page 2
    console.log('Navigating to Page 2...');
    await call('Runtime.evaluate', {
      expression: `(() => {
        const p2 = Array.from(document.querySelectorAll('.archive-page-num')).find(b => b.textContent.trim() === '2');
        if (p2) p2.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 800));

    for (let i = 0; i < 15; i++) {
      await captureFrame();
      await new Promise((r) => setTimeout(r, 66));
    }

    // 7. Click "Back to Portfolio"
    console.log('Navigating Back to Portfolio...');
    await call('Runtime.evaluate', {
      expression: `(() => {
        const back = document.querySelector('.archive-back-link');
        if (back) back.click();
      })()`,
    });
    await new Promise((r) => setTimeout(r, 1800));

    // Scroll to #blog to confirm exact return
    await call('Runtime.evaluate', {
      expression: `(() => {
        const b = document.getElementById('blog');
        if (b) b.scrollIntoView({ behavior: 'instant', block: 'start' });
      })()`,
    });
    await new Promise((r) => setTimeout(r, 600));

    // Hold at portfolio return (12 frames)
    for (let i = 0; i < 12; i++) {
      await captureFrame();
      await new Promise((r) => setTimeout(r, 66));
    }

    console.log(`\nCaptured ${frameIdx} frames. Encoding video...`);

    const mp4Out = path.join(OUT_DIR, 'phase11-blog-flow.mp4');
    const gifOut = path.join(OUT_DIR, 'phase11-blog-flow.gif');

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
    fs.copyFileSync(mp4Out, path.join(ARTIFACTS_DIR, 'phase11-blog-flow.mp4'));
    fs.copyFileSync(gifOut, path.join(ARTIFACTS_DIR, 'phase11-blog-flow.gif'));
    console.log('Copied videos to Artifacts directory.');

  } catch (err) {
    console.error('Recording error:', err);
  } finally {
    ws.close();
    brave.kill('SIGTERM');
  }
}

recordFlow();
