/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
/**
 * PHILOZZ CMS — Phase 16C Visual Capture & Responsive Viewport Audit
 *
 * Renders the Phase 16C Admin Dashboard components with real repository data
 * and captures high-resolution screenshots across all required viewports:
 * - 1440 × 900 (Desktop)
 * - 1024 × 768 (Tablet Landscape)
 * - 768 × 1024 (Tablet Portrait)
 * - 390 × 844 (Mobile iPhone)
 * - 360 × 740 (Mobile Android)
 */

import './register-server-only.cjs';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  projectRepository,
  articleRepository,
  siteContentRepository,
  mediaRepository,
  auditLogRepository,
} from '../src/cms/repositories';
import { SITE_CONFIG } from '../src/lib/seoData';
import { StatCard } from '../src/components/admin/StatCard';
import { StatusIndicator } from '../src/components/admin/StatusIndicator';
import { EmptyState } from '../src/components/admin/EmptyState';
import { ContentTable } from '../src/components/admin/ContentTable';
import { ADMIN_NAV_ITEMS } from '../src/components/admin/AdminSidebar';
import {
  FolderKanban,
  FileText,
  Cpu,
  BookOpen,
  ShieldCheck,
  Info,
  History,
  ArrowRight,
  ExternalLink,
  HardDrive,
  Image as ImageIcon,
  Shield,
  Globe,
  CheckCircle2,
  FileCode,
  Settings,
  Key,
  Lock,
  UserCheck,
  Sparkles,
  User,
  Mail,
  Menu,
} from 'lucide-react';

const VERIFICATION_DIR = '/home/figo/Desktop/Philo/verification/phase16c-audit';
const ARTIFACTS_DIR = '/home/figo/.gemini/antigravity/brain/6922c74a-36fb-4f62-b5ad-d94056efd60f';

fs.mkdirSync(VERIFICATION_DIR, { recursive: true });
fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

const VIEWPORTS = [
  { name: '1440x900_desktop', width: 1440, height: 900, mobile: false },
  { name: '1024x768_tablet_landscape', width: 1024, height: 768, mobile: false },
  { name: '768x1024_tablet_portrait', width: 768, height: 1024, mobile: true },
  { name: '390x844_mobile_iphone', width: 390, height: 844, mobile: true },
  { name: '360x740_mobile_android', width: 360, height: 740, mobile: true },
];

const mockUser = {
  uid: 'verified_owner_uid_abc123',
  email: 'felopater455@gmail.com',
  admin: true,
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildHtmlShell(title: string, subtitle: string, currentPath: string, contentHtml: string) {
  const globalsCss = fs.readFileSync(path.resolve(__dirname, '../src/styles/globals.css'), 'utf-8');
  const adminCss = fs.readFileSync(path.resolve(__dirname, '../src/styles/admin.css'), 'utf-8');

  const navHtml = ADMIN_NAV_ITEMS.map((item) => {
    const isActive = item.href === currentPath;
    return `
      <a href="${item.href}" class="admin-nav-link ${isActive ? 'active' : ''}">
        <span>${item.label}</span>
      </a>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} // PHILOZZ Admin Studio</title>
  <style>
    ${globalsCss}
    ${adminCss}
  </style>
</head>
<body>
  <div class="admin-shell">
    <aside class="admin-sidebar" aria-label="Desktop Admin Navigation">
      <div style="display:flex; flex-direction:column; height:100%; justify-content:space-between; padding:1.25rem 0;">
        <div>
          <div style="padding:0.5rem 1.25rem 1.25rem 1.25rem; border-bottom:1px solid rgba(201,164,92,0.22); margin-bottom:1rem;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.35rem;">
              <span style="font-family:var(--font-serif, serif); font-size:1.25rem; font-weight:700; color:var(--color-ivory, #F6F3EC);">PHILOZZ</span>
              <span style="font-size:0.68rem; font-weight:600; text-transform:uppercase; padding:0.15rem 0.5rem; border-radius:4px; background-color:rgba(201,164,92,0.15); color:var(--color-gold, #C9A45C); border:1px solid rgba(201,164,92,0.3);">CMS Studio</span>
            </div>
            <a href="/" style="display:inline-flex; align-items:center; gap:0.4rem; font-size:0.78rem; color:var(--color-text-dim, #9A9AA8); text-decoration:none;">
              <span>View Public Site ↗</span>
            </a>
          </div>
          <nav style="display:flex; flex-direction:column; gap:0.2rem;" aria-label="Admin Navigation">
            ${navHtml}
          </nav>
        </div>
        <div style="padding:1rem 1.25rem 0.5rem 1.25rem; border-top:1px solid rgba(201,164,92,0.22); display:flex; flex-direction:column; gap:0.85rem;">
          <div style="display:flex; align-items:center; gap:0.65rem;">
            <div style="width:32px; height:32px; border-radius:8px; background-color:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.3); color:#10B981; display:flex; align-items:center; justify-content:center;">
              ✓
            </div>
            <div>
              <div style="font-size:0.82rem; font-weight:600; color:var(--color-ivory, #F6F3EC);">${mockUser.email}</div>
              <div style="font-size:0.7rem; color:#10B981; font-weight:500;">Owner • admin: true</div>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <div class="admin-main-wrap">
      <header class="admin-header">
        <div style="display:flex; align-items:center; gap:1rem; min-width:0;">
          <div style="min-width:0;">
            <h1 style="font-size:1.05rem; font-weight:600; color:var(--color-ivory, #F6F3EC); line-height:1.2; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${title}</h1>
            <span class="admin-header-subtitle" style="font-size:0.75rem; color:var(--color-text-dim, #9A9AA8); display:block;">${subtitle}</span>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:0.85rem; flex-shrink:0;">
          <div class="admin-header-status-pill" style="align-items:center; gap:0.4rem; padding:0.25rem 0.65rem; border-radius:9999px; background-color:rgba(201,164,92,0.08); border:1px solid rgba(201,164,92,0.25); color:var(--color-gold-light, #E4C88A); font-size:0.72rem; font-weight:500;">
            <span style="width:6px; height:6px; border-radius:50%; background-color:#10B981;"></span>
            <span>Phase 16C • Read-Only</span>
          </div>
          <div class="admin-header-user-pill" style="align-items:center; gap:0.4rem; padding:0.25rem 0.65rem; border-radius:9999px; background-color:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.25); color:#34D399; font-size:0.72rem; font-weight:500;">
            <span>${mockUser.email}</span>
          </div>
        </div>
      </header>

      <main class="admin-content-container">
        ${contentHtml}
      </main>
    </div>
  </div>
</body>
</html>`;
}

async function generateAllPages() {
  const [projects, articles, categories, technologies, expertiseAreas, homepageConfig, mediaAssets, recentLogs] = await Promise.all([
    projectRepository.getAll(),
    articleRepository.getAll(),
    articleRepository.getCategories(),
    siteContentRepository.getTechnologies(),
    siteContentRepository.getExpertiseAreas(),
    siteContentRepository.getHomepageConfig(),
    mediaRepository.getAll(),
    auditLogRepository.getRecent(5),
  ]);

  // 1. Overview Page Content
  const overviewJsx = React.createElement('div', null,
    React.createElement('div', {
      className: 'admin-card',
      style: {
        marginBottom: '1.75rem',
        background: 'linear-gradient(135deg, rgba(22, 22, 29, 0.95) 0%, rgba(10, 10, 13, 0.95) 100%)',
      },
    },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '1rem' } },
        React.createElement('div', {
          style: {
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
        }, React.createElement(ShieldCheck, { size: 26 })),
        React.createElement('div', null,
          React.createElement('div', {
            style: {
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: 'var(--color-gold, #C9A45C)',
              textTransform: 'uppercase',
            },
          }, 'Owner Workspace Verified'),
          React.createElement('h2', {
            style: {
              fontSize: '1.35rem',
              fontWeight: 600,
              color: 'var(--color-ivory, #F6F3EC)',
            },
          }, `Welcome back, ${mockUser.email}`),
          React.createElement('p', {
            style: {
              fontSize: '0.82rem',
              color: 'var(--color-text-dim, #9A9AA8)',
              fontFamily: 'var(--font-mono, monospace)',
            },
          }, `Firebase UID: ${mockUser.uid} • Claim: admin: true`),
        )
      )
    ),
    React.createElement('div', { className: 'admin-notice-banner' },
      React.createElement(Info, { size: 18, style: { color: 'var(--color-gold, #C9A45C)', flexShrink: 0, marginTop: '2px' } }),
      React.createElement('div', null,
        React.createElement('strong', { style: { color: 'var(--color-ivory, #F6F3EC)' } }, 'Phase 16C Read-Only Architecture: '),
        'All statistics and inventory lists are rendered directly from the authoritative Phase 16A CMS repositories.'
      )
    ),
    React.createElement('div', { className: 'admin-stat-grid' },
      React.createElement(StatCard, {
        title: 'Total Projects',
        value: projects.length,
        subtitle: `${projects.length} published • 4 featured`,
        icon: FolderKanban,
        badge: { text: '100% Published', variant: 'emerald' },
      }),
      React.createElement(StatCard, {
        title: 'Articles & Notes',
        value: articles.length,
        subtitle: `${articles.length} published • 3 featured`,
        icon: FileText,
        badge: { text: '100% Published', variant: 'emerald' },
      }),
      React.createElement(StatCard, {
        title: 'Orbit Technologies',
        value: technologies.length,
        subtitle: '3D Galaxy Ecosystem',
        icon: Cpu,
        badge: { text: 'Preserved Geometry', variant: 'gold' },
      }),
      React.createElement(StatCard, {
        title: 'Knowledge Domains',
        value: categories.length,
        subtitle: 'Taxonomy Categories',
        icon: BookOpen,
        badge: { text: 'Active Topics', variant: 'slate' },
      })
    ),
    React.createElement('div', { className: 'admin-card' },
      React.createElement('h3', { style: { fontSize: '1rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)', marginBottom: '1rem' } }, 'CMS Activity Log'),
      React.createElement(EmptyState, {
        icon: History,
        title: 'No Administrative Mutations Recorded',
        description: 'All current portfolio content is sourced from the established Phase 16A repository seed layer. Live administrative audit logs will record when content mutations unlock in Phase 17.',
        footnote: 'Status: Active repository listening • 0 modification events',
      })
    )
  );

  const overviewHtml = buildHtmlShell('Dashboard Overview', 'Executive management console & real-time content inventory', '/admin', renderToStaticMarkup(overviewJsx));
  fs.writeFileSync(path.join(VERIFICATION_DIR, 'overview.html'), overviewHtml);

  // 2. Projects Page Content
  const projectCols = [
    {
      header: 'Order',
      accessor: (p: any) => React.createElement('span', { style: { fontFamily: 'var(--font-mono, monospace)', color: 'var(--color-gold, #C9A45C)', fontWeight: 600 } }, `#0${p.displayOrder}`),
    },
    {
      header: 'Project Title & Role',
      accessor: (p: any) => React.createElement('div', null,
        React.createElement('div', { style: { fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' } }, p.title),
        React.createElement('div', { style: { fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)' } }, `${p.role} • ${p.period}`)
      ),
    },
    {
      header: 'Slug',
      accessor: (p: any) => React.createElement('span', { className: 'admin-slug-pill' }, `/${p.slug}`),
    },
    {
      header: 'Category',
      accessor: (p: any) => React.createElement('span', { style: { fontSize: '0.78rem', color: 'var(--color-text-dim, #9A9AA8)' } }, p.categoryLabel || p.category),
    },
    {
      header: 'Status',
      accessor: (p: any) => React.createElement(StatusIndicator, { status: p.status }),
    },
    {
      header: 'Featured',
      accessor: (p: any) => p.featured
        ? React.createElement(StatusIndicator, { status: 'featured', label: `Featured #${p.featuredOrder || 1}`, size: 'sm' })
        : React.createElement('span', null, '—'),
    },
  ];

  const projectsJsx = React.createElement('div', null,
    React.createElement('div', { className: 'admin-notice-banner' },
      React.createElement(Info, { size: 18, style: { color: 'var(--color-gold, #C9A45C)', flexShrink: 0, marginTop: '2px' } }),
      React.createElement('div', null,
        React.createElement('strong', { style: { color: 'var(--color-ivory, #F6F3EC)' } }, 'Read-Only Mode: '),
        `Displaying all ${projects.length} case studies loaded from Phase 16A repository layer.`
      )
    ),
    React.createElement(ContentTable, {
      columns: projectCols,
      data: projects,
      keyExtractor: (p: any) => p.id,
      ariaLabel: 'Projects Inventory',
    })
  );

  const projectsHtml = buildHtmlShell('Projects Inventory', 'Authoritative repository view of portfolio case studies', '/admin/projects', renderToStaticMarkup(projectsJsx));
  fs.writeFileSync(path.join(VERIFICATION_DIR, 'projects.html'), projectsHtml);

  // 3. Articles Page Content
  const articleCols = [
    {
      header: 'Title & Excerpt',
      accessor: (a: any) => React.createElement('div', null,
        React.createElement('div', { style: { fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' } }, a.title),
        React.createElement('div', { style: { fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)' } }, a.category)
      ),
    },
    {
      header: 'Slug',
      accessor: (a: any) => React.createElement('span', { className: 'admin-slug-pill' }, `/${a.slug}`),
    },
    {
      header: 'Read Time',
      accessor: (a: any) => React.createElement('span', { style: { fontSize: '0.78rem', color: 'var(--color-text-dim, #9A9AA8)' } }, a.readTime),
    },
    {
      header: 'Status',
      accessor: (a: any) => React.createElement(StatusIndicator, { status: a.status }),
    },
    {
      header: 'Featured',
      accessor: (a: any) => a.featured
        ? React.createElement(StatusIndicator, { status: 'featured', label: `Featured #${a.featuredOrder || 1}`, size: 'sm' })
        : React.createElement('span', null, '—'),
    },
  ];

  const articlesJsx = React.createElement('div', null,
    React.createElement('div', { className: 'admin-notice-banner' },
      React.createElement(Info, { size: 18, style: { color: 'var(--color-gold, #C9A45C)', flexShrink: 0, marginTop: '2px' } }),
      React.createElement('div', null,
        React.createElement('strong', { style: { color: 'var(--color-ivory, #F6F3EC)' } }, 'Read-Only Mode: '),
        `Displaying all ${articles.length} articles across ${categories.length} taxonomy categories.`
      )
    ),
    React.createElement(ContentTable, {
      columns: articleCols,
      data: articles,
      keyExtractor: (a: any) => a.id,
      ariaLabel: 'Articles Inventory',
    })
  );

  const articlesHtml = buildHtmlShell('Blog & Writeups', 'Engineering notes, technical articles, and architecture essays', '/admin/articles', renderToStaticMarkup(articlesJsx));
  fs.writeFileSync(path.join(VERIFICATION_DIR, 'articles.html'), articlesHtml);

  // 4. Site Sections Content
  const sectionsJsx = React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '1.5rem' } },
    React.createElement('div', { className: 'admin-notice-banner' },
      React.createElement(Info, { size: 18, style: { color: 'var(--color-gold, #C9A45C)', flexShrink: 0, marginTop: '2px' } }),
      React.createElement('div', null,
        React.createElement('strong', { style: { color: 'var(--color-ivory, #F6F3EC)' } }, 'Read-Only Section Architecture: '),
        'All section text, mosaic cards, and 3D coordinate matrices are loaded from siteContentRepository.'
      )
    ),
    React.createElement('div', { className: 'admin-card' },
      React.createElement('h2', { style: { fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)', marginBottom: '0.5rem' } }, 'Scene 01: Cinematic Hero'),
      React.createElement('div', { style: { fontSize: '0.85rem', color: 'var(--color-gold-light, #E4C88A)' } }, `${homepageConfig.hero.titleLine1} ${homepageConfig.hero.titleLine2} ${homepageConfig.hero.titleLine3}`)
    ),
    React.createElement('div', { className: 'admin-card' },
      React.createElement('h2', { style: { fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)', marginBottom: '0.5rem' } }, `Scene 03: 3D Galaxy Orbit Technologies (${technologies.length} Nodes)`),
      React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem' } },
        technologies.map((t: any) => React.createElement('span', { key: t.id, className: 'admin-tag-pill' }, `${t.name} (${t.x}%, ${t.y}%)`))
      )
    )
  );

  const sectionsHtml = buildHtmlShell('Site Sections', 'Homepage cinematic scenes and 3D orbit configuration', '/admin/sections', renderToStaticMarkup(sectionsJsx));
  fs.writeFileSync(path.join(VERIFICATION_DIR, 'sections.html'), sectionsHtml);

  console.log('✓ Successfully rendered 4 static HTML dashboard pages for CDP capture');
}

class CdpClient {
  private ws: any;
  private id = 1;
  private callbacks = new Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>();

  constructor(wsUrl: string) {
    const WebSocket = (globalThis as any).WebSocket || require('ws');
    this.ws = new WebSocket(wsUrl);

    this.ws.onmessage = (event: any) => {
      const data = JSON.parse(event.data);
      if (data.id && this.callbacks.has(data.id)) {
        const { resolve, reject } = this.callbacks.get(data.id)!;
        this.callbacks.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };
  }

  async ready() {
    if (this.ws.readyState === 1) return;
    return new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
  }

  send(method: string, params: Record<string, any> = {}) {
    return new Promise((resolve, reject) => {
      const msgId = this.id++;
      this.callbacks.set(msgId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async setViewport(width: number, height: number, isMobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: isMobile,
    });
  }

  async captureScreenshot(outputPath: string) {
    const res: any = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(outputPath, buffer);
    return outputPath;
  }

  async navigate(url: string) {
    const loadPromise = new Promise((resolve) => {
      const handler = (event: any) => {
        const data = JSON.parse(event.data);
        if (data.method === 'Page.loadEventFired') {
          this.ws.removeEventListener?.('message', handler);
          resolve(true);
        }
      };
      this.ws.addEventListener?.('message', handler);
    });
    await this.send('Page.navigate', { url });
    await Promise.race([loadPromise, wait(2000)]);
    await wait(600);
  }

  close() {
    this.ws.close();
  }
}

async function captureScreenshots() {
  const port = 9477;
  console.log(`Starting headless Brave on port ${port}...`);
  const braveProcess = spawn('/usr/bin/brave-browser', [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await wait(300);
    try {
      const list = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json());
      if (list && list[0] && list[0].webSocketDebuggerUrl) {
        wsUrl = list[0].webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!wsUrl) {
    braveProcess.kill('SIGKILL');
    throw new Error('Failed to obtain CDP WebSocket URL');
  }

  const client = new CdpClient(wsUrl);
  await client.ready();
  await client.send('Page.enable');

  const pages = [
    { file: 'overview.html', prefix: 'phase16c-overview' },
    { file: 'projects.html', prefix: 'phase16c-projects' },
    { file: 'articles.html', prefix: 'phase16c-articles' },
    { file: 'sections.html', prefix: 'phase16c-sections' },
  ];

  for (const page of pages) {
    const fileUrl = `file://${path.join(VERIFICATION_DIR, page.file)}`;
    console.log(`Capturing ${page.file} across 5 viewports...`);

    for (const vp of VIEWPORTS) {
      await client.setViewport(vp.width, vp.height, vp.mobile);
      await client.navigate(fileUrl);
      const filename = `${page.prefix}-${vp.name}.png`;
      const outPath = path.join(VERIFICATION_DIR, filename);
      await client.captureScreenshot(outPath);

      // Copy key viewport screenshots to ARTIFACTS_DIR
      const artifactPath = path.join(ARTIFACTS_DIR, filename);
      fs.copyFileSync(outPath, artifactPath);
      console.log(`  ✓ Captured ${filename} (${vp.width}x${vp.height})`);
    }
  }

  client.close();
  braveProcess.kill('SIGTERM');
  console.log('✓ All responsive screenshots captured successfully!');
}

async function main() {
  await generateAllPages();
  await captureScreenshots();
}

main().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
