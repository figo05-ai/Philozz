'use client';

/**
 * PHILOZZ CMS — Technical SEO Management Studio View
 * Phase 16D.4A: Complete SEO Management Studio
 *
 * Full-featured administrative studio for managing site-wide SEO defaults,
 * page-specific overrides, search indexing policy, and social sharing metadata.
 * Displays real current values and live simulated SERP/Social previews.
 */

import React, { useState, useTransition } from 'react';
import {
  Globe,
  Save,
  Send,
  RotateCcw,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileCode,
  ShieldCheck,
  ExternalLink,
  Plus,
  X,
  Search,
  Share2,
} from 'lucide-react';
import { SiteSeoConfigEntity, BrandInfoEntity } from '@/cms/models/site';
import {
  saveSeoConfigDraftAction,
  publishSeoConfigAction,
  rollbackSeoConfigAction,
} from '@/app/admin/seo/actions';
import { MediaField } from './MediaField';

const CANONICAL_ORIGIN = 'https://philozz.com';

function computeJsonLdPreview(brand: BrandInfoEntity, seo: SiteSeoConfigEntity) {
  const locality = brand.location ? brand.location.split(',')[0].trim() : 'Alexandria';
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${CANONICAL_ORIGIN}/#person`,
        name: brand.developerName,
        alternateName: brand.name,
        jobTitle: brand.role,
        description: seo.defaultDescription || brand.statement,
        url: CANONICAL_ORIGIN,
        image: `${CANONICAL_ORIGIN}/images/felopater-portrait-thinking.jpg`,
        sameAs: [brand.github, brand.linkedin],
        knowsAbout: [
          'Backend Engineering',
          'Laravel',
          'PHP',
          'MySQL Database Optimization',
          'Redis Queues & Horizon',
          'System Design',
          'Docker & Containerization',
          'RESTful API Architecture',
          'React & TypeScript',
          'Linux Systems',
        ],
        address: {
          '@type': 'PostalAddress',
          addressLocality: locality,
          addressCountry: 'EG',
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${CANONICAL_ORIGIN}/#website`,
        url: CANONICAL_ORIGIN,
        name: brand.name,
        description: seo.defaultDescription,
        publisher: {
          '@id': `${CANONICAL_ORIGIN}/#person`,
        },
        inLanguage: 'en-US',
      },
    ],
  };
}

export interface SeoStudioViewProps {
  initialConfig: SiteSeoConfigEntity;
  publishedConfig: SiteSeoConfigEntity;
  brandInfo: BrandInfoEntity;
  hasDraft: boolean;
  dataSource: string;
  totalProjects: number;
  totalArticles: number;
}

type TabKey = 'global' | 'pages' | 'crawlers' | 'structured' | 'preview';

export function SeoStudioView({
  initialConfig,
  publishedConfig: initialPublished,
  brandInfo,
  hasDraft: initialHasDraft,
  dataSource,
  totalProjects,
  totalArticles,
}: SeoStudioViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('global');
  const [config, setConfig] = useState<SiteSeoConfigEntity>(initialConfig);
  const [publishedConfig, setPublishedConfig] = useState<SiteSeoConfigEntity>(initialPublished);
  const [hasDraft, setHasDraft] = useState<boolean>(initialHasDraft);
  const [newKeyword, setNewKeyword] = useState<string>('');
  const [previewRoute, setPreviewRoute] = useState<'home' | 'projects' | 'blog'>('home');

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'concurrency';
    message: string;
  } | null>(null);

  // Field updater
  const updateField = <K extends keyof SiteSeoConfigEntity>(key: K, value: SiteSeoConfigEntity[K]) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Page override updater
  const updatePageOverride = (
    page: 'homepage' | 'projectsArchive' | 'blogArchive',
    field: 'title' | 'description' | 'ogImageUrl',
    value: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      [page]: {
        ...(prev[page] || {}),
        [field]: value,
      },
    }));
  };

  // Keyword management
  const addKeyword = () => {
    const trimmed = newKeyword.trim();
    if (!trimmed) return;
    if (config.defaultKeywords.includes(trimmed)) return;
    setConfig((prev) => ({
      ...prev,
      defaultKeywords: [...prev.defaultKeywords, trimmed],
    }));
    setNewKeyword('');
  };

  const removeKeyword = (kwToRemove: string) => {
    setConfig((prev) => ({
      ...prev,
      defaultKeywords: prev.defaultKeywords.filter((kw) => kw !== kwToRemove),
    }));
  };

  // Save Draft Action
  const handleSaveDraft = () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await saveSeoConfigDraftAction(config, config.version);
      if (res.success && res.data) {
        setConfig(res.data);
        setHasDraft(true);
        setFeedback({
          type: 'success',
          message: `Saved SEO draft revision (v${res.data.version}). Live public metadata remains unchanged.`,
        });
      } else {
        const isConcurrency = res.error?.includes('CONCURRENCY_CONFLICT');
        setFeedback({
          type: isConcurrency ? 'concurrency' : 'error',
          message: res.error || 'Failed to save SEO draft.',
        });
      }
    });
  };

  // Publish Action
  const handlePublish = () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await publishSeoConfigAction(config, config.version);
      if (res.success && res.data) {
        setConfig(res.data);
        setPublishedConfig(res.data);
        setHasDraft(false);
        setFeedback({
          type: 'success',
          message: `Published SEO settings (v${res.data.version}) live to production! Metadata caches revalidated.`,
        });
      } else {
        const isConcurrency = res.error?.includes('CONCURRENCY_CONFLICT');
        setFeedback({
          type: isConcurrency ? 'concurrency' : 'error',
          message: res.error || 'Failed to publish SEO configuration.',
        });
      }
    });
  };

  // Rollback Action
  const handleRollback = () => {
    if (!confirm('Are you sure you want to restore the previous published SEO revision?')) {
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      const res = await rollbackSeoConfigAction();
      if (res.success && res.data) {
        setConfig(res.data);
        setPublishedConfig(res.data);
        setHasDraft(false);
        setFeedback({
          type: 'success',
          message: `Restored previous published SEO configuration (v${res.data.version}).`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Failed to rollback SEO configuration.',
        });
      }
    });
  };

  // Active preview data calculation
  const getActivePreviewData = () => {
    if (previewRoute === 'home') {
      return {
        title: config.homepage?.title || config.siteTitle,
        description: config.homepage?.description || config.defaultDescription,
        url: `${CANONICAL_ORIGIN}/`,
        displayUrl: 'philozz.com',
        ogImage: config.homepage?.ogImageUrl || config.defaultOgImage,
      };
    }
    if (previewRoute === 'projects') {
      const pTitle = config.projectsArchive?.title || 'Selected Engineering Projects';
      return {
        title: `${pTitle} // ${brandInfo.name || 'PHILOZZ'}`,
        description:
          config.projectsArchive?.description ||
          'Verified production software systems, backend architectures, high-concurrency queue platforms, and database designs.',
        url: `${CANONICAL_ORIGIN}/projects`,
        displayUrl: 'philozz.com › projects',
        ogImage: config.projectsArchive?.ogImageUrl || config.defaultOgImage,
      };
    }
    const bTitle = config.blogArchive?.title || 'Engineering Journal & Technical Notes';
    return {
      title: `${bTitle} // ${brandInfo.name || 'PHILOZZ'}`,
      description:
        config.blogArchive?.description ||
        'Engineering notes, architectural postmortems, database query optimizations, and backend best practices.',
      url: `${CANONICAL_ORIGIN}/blog`,
      displayUrl: 'philozz.com › blog',
      ogImage: config.blogArchive?.ogImageUrl || config.defaultOgImage,
    };
  };

  const preview = getActivePreviewData();
  const jsonLdPreview = computeJsonLdPreview(brandInfo, config);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top HUD Controls & Status */}
      <div
        className="admin-card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '1.25rem 1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              backgroundColor: 'rgba(201, 164, 92, 0.1)',
              border: '1px solid rgba(201, 164, 92, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-gold, #C9A45C)',
            }}
          >
            <Globe size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
                SEO & Crawler Studio
              </h2>
              {hasDraft ? (
                <span
                  style={{
                    backgroundColor: 'rgba(201, 164, 92, 0.15)',
                    border: '1px solid rgba(201, 164, 92, 0.4)',
                    color: 'var(--color-gold-light, #E4C88A)',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  DRAFT v{config.version} (Unpublished)
                </span>
              ) : (
                <span
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    color: '#34D399',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  LIVE PUBLISHED v{publishedConfig.version}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dim, #9A9AA8)', marginTop: '0.15rem' }}>
              Repository: <strong style={{ color: 'var(--color-ivory, #F6F3EC)' }}>{dataSource}</strong> | Canonical: <strong style={{ color: 'var(--color-gold-light, #E4C88A)', fontFamily: 'var(--font-mono)' }}>https://philozz.com</strong>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isPending}
            className="admin-btn admin-btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <Save size={15} />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={isPending}
            className="admin-btn admin-btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <Send size={15} />
            <span>Publish to Live Site</span>
          </button>

          <button
            type="button"
            onClick={handleRollback}
            disabled={isPending}
            className="admin-btn admin-btn-ghost"
            title="Restore previous published configuration"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <RotateCcw size={15} />
            <span>Rollback</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          style={{
            padding: '0.85rem 1.15rem',
            borderRadius: '6px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem',
            backgroundColor:
              feedback.type === 'success'
                ? 'rgba(16, 185, 129, 0.1)'
                : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${
              feedback.type === 'success' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'
            }`,
            color: feedback.type === 'success' ? '#34D399' : '#F87171',
          }}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          ) : (
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          )}
          <div style={{ flex: 1 }}>{feedback.message}</div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Studio Navigation Tabs */}
      <div className="admin-tab-bar">
        <button
          type="button"
          onClick={() => setActiveTab('global')}
          className={`admin-tab-btn ${activeTab === 'global' ? 'admin-tab-btn-active' : ''}`}
        >
          <Globe size={16} />
          <span>Global Defaults</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pages')}
          className={`admin-tab-btn ${activeTab === 'pages' ? 'admin-tab-btn-active' : ''}`}
        >
          <FileCode size={16} />
          <span>Page Overrides</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('crawlers')}
          className={`admin-tab-btn ${activeTab === 'crawlers' ? 'admin-tab-btn-active' : ''}`}
        >
          <ShieldCheck size={16} />
          <span>Crawlers & Robots</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('structured')}
          className={`admin-tab-btn ${activeTab === 'structured' ? 'admin-tab-btn-active' : ''}`}
        >
          <Share2 size={16} />
          <span>Structured Data</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`admin-tab-btn ${activeTab === 'preview' ? 'admin-tab-btn-active' : ''}`}
        >
          <Eye size={16} />
          <span>SERP & Social Preview</span>
        </button>
      </div>

      {/* TAB 1: GLOBAL DEFAULTS */}
      {activeTab === 'global' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="admin-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)', marginBottom: '1.25rem' }}>
              Root Title Pattern & Meta Fallbacks
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              <div className="admin-form-group">
                <label className="admin-form-label">
                  Site Title (Default Root)
                </label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={config.siteTitle}
                  onChange={(e) => updateField('siteTitle', e.target.value)}
                  placeholder="PHILOZZ // Full-Stack Software Engineer"
                  maxLength={120}
                />
                <div className="admin-form-help">
                  Appears on the homepage and root when un-overridden ({config.siteTitle.length}/120 chars).
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">
                  Title Template
                </label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={config.titleTemplate}
                  onChange={(e) => updateField('titleTemplate', e.target.value)}
                  placeholder="%s // PHILOZZ"
                  maxLength={60}
                />
                <div className="admin-form-help">
                  Must include the <code>%s</code> placeholder for sub-pages.
                </div>
              </div>
            </div>

            <div className="admin-form-group" style={{ marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="admin-form-label" style={{ marginBottom: 0 }}>
                  Global Default Meta Description
                </label>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color:
                      config.defaultDescription.length > 160
                        ? 'var(--color-gold, #C9A45C)'
                        : 'var(--color-text-dim, #9A9AA8)',
                  }}
                >
                  {config.defaultDescription.length}/320 (Recommended: 150-160)
                </span>
              </div>
              <textarea
                className="admin-form-textarea"
                rows={3}
                value={config.defaultDescription}
                onChange={(e) => updateField('defaultDescription', e.target.value)}
                maxLength={320}
              />
              <div className="admin-form-help">
                Default description served when a page does not define a dedicated meta description.
              </div>
            </div>
          </div>

          <div className="admin-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)', marginBottom: '1.25rem' }}>
              Social Sharing & Open Graph Defaults
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
              <MediaField
                id="seo-default-og"
                label="Default OG Image URL / Reference"
                value={config.defaultOgImage}
                onChange={(val) => updateField('defaultOgImage', val)}
                placeholder="/images/philozz-cinematic-hero.png"
                description="Relative asset path (e.g. /images/...) or secure https:// image."
                folder="brand"
              />

              <div className="admin-form-group">
                <label className="admin-form-label">
                  Twitter / X Card Format
                </label>
                <select
                  className="admin-form-select"
                  value={config.twitterCard}
                  onChange={(e) =>
                    updateField(
                      'twitterCard',
                      e.target.value as 'summary_large_image' | 'summary'
                    )
                  }
                >
                  <option value="summary_large_image">summary_large_image (Recommended)</option>
                  <option value="summary">summary</option>
                </select>
                <div className="admin-form-help">
                  Controls the card size rendered on Twitter/X timelines.
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">
                  Twitter / X Creator Handle
                </label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={config.twitterCreator}
                  onChange={(e) => updateField('twitterCreator', e.target.value)}
                  placeholder="@philozz"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">
                  Locale
                </label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={config.locale}
                  onChange={(e) => updateField('locale', e.target.value)}
                  placeholder="en_US"
                />
              </div>
            </div>
          </div>

          {/* Keywords Manager */}
          <div className="admin-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)', marginBottom: '0.75rem' }}>
              Default Keywords ({config.defaultKeywords.length})
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dim, #9A9AA8)', marginBottom: '1rem' }}>
              Meta keywords injected into root layout metadata.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="text"
                className="admin-form-input"
                style={{ maxWidth: '320px' }}
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addKeyword();
                  }
                }}
                placeholder="Add keyword (e.g., High-Concurrency Queues)"
              />
              <button
                type="button"
                onClick={addKeyword}
                className="admin-btn admin-btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Plus size={15} />
                <span>Add</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {config.defaultKeywords.map((kw) => (
                <span
                  key={kw}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(201, 164, 92, 0.1)',
                    border: '1px solid rgba(201, 164, 92, 0.25)',
                    color: 'var(--color-ivory, #F6F3EC)',
                    fontSize: '0.8rem',
                  }}
                >
                  {kw}
                  <button
                    type="button"
                    onClick={() => removeKeyword(kw)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-dim, #9A9AA8)',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PAGE OVERRIDES */}
      {activeTab === 'pages' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Homepage Override */}
          <div className="admin-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
                Homepage (<code>/</code>) SEO Override
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-gold-light, #E4C88A)', fontFamily: 'var(--font-mono)' }}>
                Canonical: https://philozz.com
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Homepage SEO Title</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={config.homepage?.title || ''}
                  onChange={(e) => updatePageOverride('homepage', 'title', e.target.value)}
                  placeholder={config.siteTitle}
                  maxLength={120}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Homepage OG Image Reference</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={config.homepage?.ogImageUrl || ''}
                  onChange={(e) => updatePageOverride('homepage', 'ogImageUrl', e.target.value)}
                  placeholder={config.defaultOgImage}
                />
              </div>
            </div>

            <div className="admin-form-group" style={{ marginTop: '1rem' }}>
              <label className="admin-form-label">Homepage Meta Description</label>
              <textarea
                className="admin-form-textarea"
                rows={2}
                value={config.homepage?.description || ''}
                onChange={(e) => updatePageOverride('homepage', 'description', e.target.value)}
                placeholder={config.defaultDescription}
                maxLength={320}
              />
            </div>
          </div>

          {/* Projects Archive Override */}
          <div className="admin-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
                Projects Archive (<code>/projects</code>) SEO
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-gold-light, #E4C88A)', fontFamily: 'var(--font-mono)' }}>
                Canonical: https://philozz.com/projects
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Archive Title</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={config.projectsArchive?.title || ''}
                  onChange={(e) => updatePageOverride('projectsArchive', 'title', e.target.value)}
                  placeholder="Selected Engineering Projects"
                  maxLength={120}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Archive OG Image</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={config.projectsArchive?.ogImageUrl || ''}
                  onChange={(e) => updatePageOverride('projectsArchive', 'ogImageUrl', e.target.value)}
                  placeholder={config.defaultOgImage}
                />
              </div>
            </div>

            <div className="admin-form-group" style={{ marginTop: '1rem' }}>
              <label className="admin-form-label">Archive Meta Description</label>
              <textarea
                className="admin-form-textarea"
                rows={2}
                value={config.projectsArchive?.description || ''}
                onChange={(e) => updatePageOverride('projectsArchive', 'description', e.target.value)}
                placeholder="A collection of verified production software systems, backend architectures, and database designs..."
                maxLength={320}
              />
            </div>
          </div>

          {/* Blog Archive Override */}
          <div className="admin-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
                Blog & Notes Archive (<code>/blog</code>) SEO
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-gold-light, #E4C88A)', fontFamily: 'var(--font-mono)' }}>
                Canonical: https://philozz.com/blog
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Journal Title</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={config.blogArchive?.title || ''}
                  onChange={(e) => updatePageOverride('blogArchive', 'title', e.target.value)}
                  placeholder="Engineering Journal & Technical Notes"
                  maxLength={120}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Journal OG Image</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={config.blogArchive?.ogImageUrl || ''}
                  onChange={(e) => updatePageOverride('blogArchive', 'ogImageUrl', e.target.value)}
                  placeholder={config.defaultOgImage}
                />
              </div>
            </div>

            <div className="admin-form-group" style={{ marginTop: '1rem' }}>
              <label className="admin-form-label">Journal Meta Description</label>
              <textarea
                className="admin-form-textarea"
                rows={2}
                value={config.blogArchive?.description || ''}
                onChange={(e) => updatePageOverride('blogArchive', 'description', e.target.value)}
                placeholder="Engineering notes, architectural postmortems, database query optimizations..."
                maxLength={320}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CRAWLERS & ROBOTS */}
      {activeTab === 'crawlers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="admin-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)', marginBottom: '1.25rem' }}>
              Search Engine Indexing Perimeter
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  padding: '0.75rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <input
                  type="checkbox"
                  checked={config.allowIndexing}
                  onChange={(e) => updateField('allowIndexing', e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-gold, #C9A45C)' }}
                />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)', fontSize: '0.85rem' }}>
                    Allow Public Search Engine Indexing
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
                    When enabled, Googlebot and other verified web crawlers index public portfolio pages.
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  padding: '0.75rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <input
                  type="checkbox"
                  checked={config.disallowAdminRoutes}
                  onChange={(e) => updateField('disallowAdminRoutes', e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-gold, #C9A45C)' }}
                />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)', fontSize: '0.85rem' }}>
                    Disallow <code>/admin/</code> in robots.txt
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
                    Instructs crawlers to never scrape owner administration routes.
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  padding: '0.75rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 0.08)',
                }}
              >
                <input
                  type="checkbox"
                  checked={config.disallowApiRoutes}
                  onChange={(e) => updateField('disallowApiRoutes', e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-gold, #C9A45C)' }}
                />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)', fontSize: '0.85rem' }}>
                    Disallow <code>/api/</code> in robots.txt
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
                    Prevents crawler traffic on backend endpoint routes.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Live Crawler Inspection Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            <div className="admin-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={18} style={{ color: '#10B981' }} />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
                    robots.txt Output
                  </h4>
                </div>
                <a
                  href="/robots.txt"
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--color-gold, #C9A45C)' }}
                >
                  <span>Live</span>
                  <ExternalLink size={12} />
                </a>
              </div>
              <pre
                style={{
                  backgroundColor: 'var(--color-obsidian, #0A0A0D)',
                  padding: '0.85rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  color: 'var(--color-gold-light, #E4C88A)',
                  lineHeight: 1.6,
                  overflowX: 'auto',
                }}
              >
{`User-Agent: *
${config.allowIndexing ? 'Allow: /' : 'Disallow: /'}
${config.allowIndexing && config.disallowApiRoutes ? 'Disallow: /api/\n' : ''}${config.allowIndexing && config.disallowAdminRoutes ? 'Disallow: /admin/\n' : ''}Host: https://philozz.com
Sitemap: https://philozz.com/sitemap.xml`}
              </pre>
            </div>

            <div className="admin-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileCode size={18} style={{ color: 'var(--color-gold, #C9A45C)' }} />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
                    Dynamic Sitemap Index
                  </h4>
                </div>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--color-gold, #C9A45C)' }}
                >
                  <span>Live</span>
                  <ExternalLink size={12} />
                </a>
              </div>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  fontSize: '0.82rem',
                  color: 'var(--color-text-dim, #9A9AA8)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <li>✓ <strong>3 Static Pages</strong> (<code>/</code>, <code>/projects</code>, <code>/blog</code>)</li>
                <li>✓ <strong>{totalProjects} Published Case Studies</strong> (<code>/work/[slug]</code>)</li>
                <li>✓ <strong>{totalArticles} Published Journal Notes</strong> (<code>/notes/[slug]</code>)</li>
                <li>✓ Total Canonical URLs: <strong style={{ color: 'var(--color-ivory, #F6F3EC)' }}>{3 + totalProjects + totalArticles}</strong></li>
                <li>✓ Strict zero-draft policy: Draft and trashed items excluded</li>
                <li>✓ Next.js internal assets (<code>/_next/</code>) remain fully accessible</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STRUCTURED DATA */}
      {activeTab === 'structured' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="admin-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
              <Share2 size={18} style={{ color: 'var(--color-gold, #C9A45C)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
                BrandInfo Entity Synchronization
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-dim, #9A9AA8)', marginBottom: '1.25rem' }}>
              JSON-LD structured data is synchronized with your established Brand Information.
              Social links, author credentials, and developer identity derive directly from verified CMS records.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
                fontSize: '0.82rem',
                padding: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div>
                <span style={{ color: 'var(--color-text-dim, #9A9AA8)' }}>Developer Name:</span>
                <div style={{ fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
                  {brandInfo.developerName}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-dim, #9A9AA8)' }}>Brand Alternate Name:</span>
                <div style={{ fontWeight: 600, color: 'var(--color-gold-light, #E4C88A)' }}>
                  {brandInfo.name}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-dim, #9A9AA8)' }}>Job Title:</span>
                <div style={{ fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
                  {brandInfo.role}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-dim, #9A9AA8)' }}>Location:</span>
                <div style={{ fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
                  {brandInfo.location}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-dim, #9A9AA8)' }}>GitHub:</span>
                <div style={{ fontWeight: 600, color: 'var(--color-gold-light, #E4C88A)' }}>
                  {brandInfo.github}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-dim, #9A9AA8)' }}>LinkedIn:</span>
                <div style={{ fontWeight: 600, color: 'var(--color-gold-light, #E4C88A)' }}>
                  {brandInfo.linkedin}
                </div>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)', marginBottom: '0.75rem' }}>
              Live Schema.org JSON-LD Output
            </h4>
            <pre
              style={{
                backgroundColor: 'var(--color-obsidian, #0A0A0D)',
                padding: '1rem',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono, monospace)',
                color: 'var(--color-gold-light, #E4C88A)',
                lineHeight: 1.5,
                maxHeight: '400px',
                overflowY: 'auto',
              }}
            >
              {JSON.stringify(jsonLdPreview, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 5: SERP & SOCIAL PREVIEW */}
      {activeTab === 'preview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Route Selector */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-dim, #9A9AA8)', marginRight: '0.5rem' }}>
              Preview Destination:
            </span>
            <button
              type="button"
              onClick={() => setPreviewRoute('home')}
              className={`admin-btn ${previewRoute === 'home' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '4px 12px' }}
            >
              Homepage (/)
            </button>
            <button
              type="button"
              onClick={() => setPreviewRoute('projects')}
              className={`admin-btn ${previewRoute === 'projects' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '4px 12px' }}
            >
              Projects (/projects)
            </button>
            <button
              type="button"
              onClick={() => setPreviewRoute('blog')}
              className={`admin-btn ${previewRoute === 'blog' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '4px 12px' }}
            >
              Journal (/blog)
            </button>
          </div>

          {/* Google SERP Snippet Preview */}
          <div className="admin-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Search size={18} style={{ color: '#4285F4' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
                Google Search Snippet Preview
              </h3>
            </div>

            <div
              style={{
                backgroundColor: '#202124',
                padding: '1.25rem',
                borderRadius: '8px',
                border: '1px solid #3c4043',
                maxWidth: '650px',
                fontFamily: 'arial, sans-serif',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: '#C9A45C',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#0A0A0D',
                  }}
                >
                  P
                </div>
                <div style={{ fontSize: '0.75rem', color: '#dadce0' }}>
                  {preview.displayUrl}
                </div>
              </div>

              <div
                style={{
                  fontSize: '1.2rem',
                  lineHeight: 1.3,
                  color: '#8ab4f8',
                  fontWeight: 400,
                  cursor: 'pointer',
                  marginBottom: '0.35rem',
                }}
              >
                {preview.title}
              </div>

              <div
                style={{
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  color: '#bdc1c6',
                }}
              >
                {preview.description}
              </div>
            </div>
          </div>

          {/* Social Sharing Cards Preview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {/* Twitter/X Card */}
            <div className="admin-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Share2 size={18} style={{ color: 'var(--color-gold, #C9A45C)' }} />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
                  Twitter / X Card ({config.twitterCard})
                </h4>
              </div>

              <div
                style={{
                  backgroundColor: '#000000',
                  borderRadius: '12px',
                  border: '1px solid #2f3336',
                  overflow: 'hidden',
                  maxWidth: '440px',
                }}
              >
                <div
                  style={{
                    height: '180px',
                    backgroundColor: '#16181c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#71767b',
                    fontSize: '0.8rem',
                    borderBottom: '1px solid #2f3336',
                  }}
                >
                  {preview.ogImage ? `Image: ${preview.ogImage}` : 'No Image Specified'}
                </div>
                <div style={{ padding: '0.75rem 1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#71767b', textTransform: 'lowercase' }}>
                    philozz.com
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e7e9ea', marginTop: '0.2rem' }}>
                    {preview.title}
                  </div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: '#71767b',
                      marginTop: '0.2rem',
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {preview.description}
                  </div>
                </div>
              </div>
            </div>

            {/* Open Graph Card */}
            <div className="admin-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Globe size={18} style={{ color: 'var(--color-gold-light, #E4C88A)' }} />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
                  Open Graph Sharing Card
                </h4>
              </div>

              <div
                style={{
                  backgroundColor: '#18191a',
                  borderRadius: '8px',
                  border: '1px solid #3a3b3c',
                  overflow: 'hidden',
                  maxWidth: '440px',
                }}
              >
                <div
                  style={{
                    height: '180px',
                    backgroundColor: '#242526',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#b0b3b8',
                    fontSize: '0.8rem',
                    borderBottom: '1px solid #3a3b3c',
                  }}
                >
                  {preview.ogImage ? `Image: ${preview.ogImage}` : 'Default OG Asset'}
                </div>
                <div style={{ padding: '0.75rem 1rem' }}>
                  <div style={{ fontSize: '0.72rem', color: '#b0b3b8', textTransform: 'uppercase' }}>
                    PHILOZZ.COM
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#e4e6eb', marginTop: '0.2rem' }}>
                    {preview.title}
                  </div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: '#b0b3b8',
                      marginTop: '0.2rem',
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {preview.description}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
