import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACTS_DIR = '/home/figo/.gemini/antigravity/brain/57edb8e6-b535-4569-8be3-9ca13f8823ac';
const OUT_DIR = '/home/figo/Desktop/Philo/verification/phase12-final-commit';

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

async function runVerification() {
  const port = 9392;
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

  async function capture(filename) {
    const res = await call('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(res.data, 'base64');
    const localPath = path.join(OUT_DIR, filename);
    fs.writeFileSync(localPath, buf);
    const artifactPath = path.join(ARTIFACTS_DIR, filename);
    fs.writeFileSync(artifactPath, buf);
    console.log(`Saved screenshot: ${filename}`);
    return localPath;
  }

  async function setViewport(width, height, isMobile = false) {
    await call('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: isMobile ? 2 : 1,
      mobile: isMobile,
    });
  }

  const results = {
    progressStages: {},
    reverseScroll: {},
    interactivity: {},
    mobile: {},
    earlierSectionsIntegrity: {},
  };

  try {
    await call('Page.enable');
    await call('DOM.enable');

    console.log('\n--- 1. Testing Desktop Transition Stages (1440x900) ---');
    await setViewport(1440, 900, false);
    await call('Page.navigate', { url: 'http://localhost:3000' });
    await new Promise((r) => setTimeout(r, 2200));

    // Function to scroll to an exact progress point of blog-to-contact
    async function scrollToProgress(p) {
      await call('Runtime.evaluate', {
        expression: `(() => {
          if (window.ScrollTrigger) window.ScrollTrigger.refresh();
          const st = window.ScrollTrigger ? window.ScrollTrigger.getById('blog-to-contact') : null;
          if (st) {
            const targetScroll = Math.round(st.start + ${p} * (st.end - st.start));
            window.scrollTo({ top: targetScroll, behavior: 'instant' });
            window.ScrollTrigger.update();
          }
        })()`,
      });
      await new Promise((r) => setTimeout(r, 600));

      const stageMetrics = await call('Runtime.evaluate', {
        expression: `(() => {
          const st = window.ScrollTrigger ? window.ScrollTrigger.getById('blog-to-contact') : null;
          const overlay = document.querySelector('.final-commit-overlay');
          const content = document.querySelector('.final-commit-content');
          const lineWrap = document.querySelector('.final-commit-line-wrap');
          const cursor = document.querySelector('.final-commit-cursor');
          const contactEyebrow = document.querySelector('.contact-header-tag');
          const contactHeading = document.querySelector('.contact-main-heading');
          const contactDesc = document.querySelector('.contact-desc');
          const contactCtas = document.querySelector('.contact-cta-group');
          const contactChannels = document.querySelector('.contact-channels-group');
          const contactPortrait = document.querySelector('.contact-portrait-group');
          const blogArticles = document.querySelectorAll('.journal-article-card');

          return {
            progress: st?.progress,
            overlayDisplay: overlay ? overlay.style.display : null,
            contentOpacity: content ? parseFloat(window.getComputedStyle(content).opacity) : null,
            lineWrapOpacity: lineWrap ? parseFloat(window.getComputedStyle(lineWrap).opacity) : null,
            contactEyebrowOpacity: contactEyebrow ? parseFloat(window.getComputedStyle(contactEyebrow).opacity) : null,
            contactHeadingOpacity: contactHeading ? parseFloat(window.getComputedStyle(contactHeading).opacity) : null,
            contactDescOpacity: contactDesc ? parseFloat(window.getComputedStyle(contactDesc).opacity) : null,
            contactCtasOpacity: contactCtas ? parseFloat(window.getComputedStyle(contactCtas).opacity) : null,
            contactChannelsOpacity: contactChannels ? parseFloat(window.getComputedStyle(contactChannels).opacity) : null,
            contactPortraitOpacity: contactPortrait ? parseFloat(window.getComputedStyle(contactPortrait).opacity) : null,
            firstArticleOpacity: blogArticles[0] ? parseFloat(window.getComputedStyle(blogArticles[0]).opacity) : null,
          };
        })()`,
        returnByValue: true,
      });

      return stageMetrics.result?.value;
    }

    // --- TEST AT p = 0.00 (Blog Resting) ---
    console.log('\nTesting p = 0.00 (Blog Resting)...');
    results.progressStages['p000'] = await scrollToProgress(0.00);
    console.log('Metrics at p=0.00:', results.progressStages['p000']);
    await capture('phase12-polish-01-p000-blog-resting.png');

    // --- TEST AT p = 0.25 (Stage 02: Golden Line Drawing) ---
    console.log('\nTesting p = 0.25 (Stage 02: Golden Line Drawing)...');
    results.progressStages['p025'] = await scrollToProgress(0.25);
    console.log('Metrics at p=0.25:', results.progressStages['p025']);
    await capture('phase12-polish-02-p025-last-line-draw.png');

    // --- TEST AT p = 0.50 (Stage 03: Editorial & Line Dissolve Before Contact) ---
    console.log('\nTesting p = 0.50 (Stage 03: Dissolve Before Contact)...');
    results.progressStages['p050'] = await scrollToProgress(0.50);
    console.log('Metrics at p=0.50:', results.progressStages['p050']);
    await capture('phase12-polish-03-p050-dissolve-before-contact.png');

    // --- TEST AT p = 0.65 (Stage 04: Contact Bright & Dominant) ---
    console.log('\nTesting p = 0.65 (Stage 04: Contact Bright & Dominant)...');
    results.progressStages['p065'] = await scrollToProgress(0.65);
    console.log('Metrics at p=0.65:', results.progressStages['p065']);
    await capture('phase12-polish-04-p065-contact-bright-emerged.png');

    // --- TEST AT p = 0.75 (Stage 04: Contact Full Illumination) ---
    console.log('\nTesting p = 0.75 (Stage 04: Contact Full Illumination)...');
    results.progressStages['p075'] = await scrollToProgress(0.75);
    console.log('Metrics at p=0.75:', results.progressStages['p075']);
    await capture('phase12-polish-05-p075-contact-full-illumination.png');

    // --- TEST AT p = 0.85 (Stage 05: Contact Settled & Interactive) ---
    console.log('\nTesting p = 0.85 (Stage 05: Contact Settled)...');
    results.progressStages['p085'] = await scrollToProgress(0.85);
    console.log('Metrics at p=0.85:', results.progressStages['p085']);
    await capture('phase12-polish-06-p085-contact-resting-settled.png');

    // --- TEST AT p = 1.00 (Stage 05: Contact Resting Final) ---
    console.log('\nTesting p = 1.00 (Stage 05: Contact Resting Final)...');
    results.progressStages['p100'] = await scrollToProgress(1.00);
    console.log('Metrics at p=1.00:', results.progressStages['p100']);
    await capture('phase12-polish-07-p100-contact-resting-final.png');

    // --- TEST REVERSE SCROLLING ---
    console.log('\nTesting Reverse Scroll back to p = 0.50...');
    results.reverseScroll['p050'] = await scrollToProgress(0.50);
    await capture('phase12-polish-08-reverse-p050.png');

    console.log('\nTesting Reverse Scroll back to p = 0.25...');
    results.reverseScroll['p025'] = await scrollToProgress(0.25);
    await capture('phase12-polish-09-reverse-p025.png');

    console.log('\nTesting Reverse Scroll back to p = 0.00 (Restored Journal)...');
    results.reverseScroll['p000'] = await scrollToProgress(0.00);
    console.log('Reverse Restored Blog Status:', results.reverseScroll['p000']);
    await capture('phase12-polish-10-reverse-p000-restored-blog.png');

    // --- TEST INTERACTIVITY AT CONTACT (p = 1.00) ---
    console.log('\nTesting Interactivity at Contact (p = 1.00)...');
    await scrollToProgress(1.00);

    const contactInteractivity = await call('Runtime.evaluate', {
      expression: `(() => {
        const sendMsgBtn = document.querySelector('.contact-cta-group a.btn-gold');
        const viewResumeBtn = document.querySelector('.contact-cta-group a.btn-outline-gold');
        const contactLinks = document.querySelectorAll('.contact-link-pill');
        const backToTopBtn = document.querySelector('.site-footer button');
        const overlay = document.querySelector('.final-commit-overlay');

        return {
          hasSendMsgBtn: !!sendMsgBtn,
          sendMsgHref: sendMsgBtn?.getAttribute('href'),
          hasViewResumeBtn: !!viewResumeBtn,
          viewResumeHref: viewResumeBtn?.getAttribute('href'),
          contactLinksCount: contactLinks.length,
          hasBackToTopBtn: !!backToTopBtn,
          overlayIsHidden: overlay?.style.display === 'none',
          headingColor: window.getComputedStyle(document.querySelector('.contact-main-heading')).color,
          headingOpacity: window.getComputedStyle(document.querySelector('.contact-main-heading')).opacity,
        };
      })()`,
      returnByValue: true,
    });
    results.interactivity = contactInteractivity.result?.value;
    console.log('Contact Interactivity Status:', results.interactivity);

    // --- TEST MOBILE VIEW (390x844) ---
    console.log('\n--- 2. Testing Mobile Responsive View (390x844) ---');
    await setViewport(390, 844, true);
    await new Promise((r) => setTimeout(r, 600));

    results.mobile['p025'] = await scrollToProgress(0.25);
    await capture('phase12-polish-11-mobile-p025.png');

    results.mobile['p050'] = await scrollToProgress(0.50);
    await capture('phase12-polish-12-mobile-p050.png');

    results.mobile['p065'] = await scrollToProgress(0.65);
    await capture('phase12-polish-13-mobile-p065.png');

    results.mobile['p075'] = await scrollToProgress(0.75);
    await capture('phase12-polish-14-mobile-p075.png');

    results.mobile['p100'] = await scrollToProgress(1.00);
    await capture('phase12-polish-15-mobile-p100.png');

    // --- TEST EARLIER SECTIONS INTEGRITY ---
    console.log('\n--- 3. Testing Earlier Sections Integrity ---');
    const earlierSections = await call('Runtime.evaluate', {
      expression: `(() => {
        return {
          homeExists: !!document.getElementById('home'),
          aboutExists: !!document.getElementById('about'),
          skillsExists: !!document.getElementById('skills'),
          projectsExists: !!document.getElementById('projects'),
          blogExists: !!document.getElementById('blog'),
          contactExists: !!document.getElementById('contact'),
          projectCardsCount: document.querySelectorAll('.gallery-project-card').length,
          featuredBlogExists: !!document.querySelector('.journal-featured-wrapper'),
          secondaryBlogCardsCount: document.querySelectorAll('.journal-article-card').length,
          viewAllBlogsBtnExists: !!document.querySelector('.journal-toggle-btn'),
        };
      })()`,
      returnByValue: true,
    });
    results.earlierSectionsIntegrity = earlierSections.result?.value;
    console.log('Earlier Sections Integrity:', results.earlierSectionsIntegrity);

    // Save summary json
    fs.writeFileSync(
      path.join(OUT_DIR, 'phase12-polish-verification-summary.json'),
      JSON.stringify(results, null, 2)
    );
    fs.writeFileSync(
      path.join(ARTIFACTS_DIR, 'phase12-polish-verification-summary.json'),
      JSON.stringify(results, null, 2)
    );

    console.log('\n====================================================');
    console.log('PHASE 12 POLISH VERIFICATION COMPLETE!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    ws.close();
    brave.kill('SIGTERM');
  }
}

runVerification();
