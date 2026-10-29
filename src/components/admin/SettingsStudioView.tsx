'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Settings,
  Save,
  Send,
  RotateCcw,
  Eye,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  FileText,
  User,
  Mail,
  ToggleLeft,
  ToggleRight,
  Info,
  Layers,
  Lock,
  Server,
  Activity,
} from 'lucide-react';
import { BrandInfoEntity } from '@/cms/models/site';
import {
  saveSiteSettingsDraftAction,
  publishSiteSettingsAction,
  rollbackSiteSettingsAction,
} from '@/app/admin/settings/actions';
import { MediaField } from './MediaField';

export interface SettingsStudioViewProps {
  initialConfig: BrandInfoEntity;
  publishedConfig: BrandInfoEntity;
  hasDraft: boolean;
  dataSource: string;
  ownerUid: string;
  ownerEmail?: string;
}

type TabKey = 'general' | 'contact' | 'assets' | 'features' | 'operational' | 'privacy';

export function SettingsStudioView({
  initialConfig,
  publishedConfig,
  hasDraft: initialHasDraft,
  dataSource,
  ownerUid,
  ownerEmail,
}: SettingsStudioViewProps) {
  const [config, setConfig] = useState<BrandInfoEntity>(initialConfig);
  const [hasDraft, setHasDraft] = useState<boolean>(initialHasDraft);
  const [activeTab, setActiveTab] = useState<TabKey>('general');

  const [isPending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const updateField = (key: keyof BrandInfoEntity, value: unknown) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // --------------------------------------------------------------------------
  // ACTIONS: DRAFT, PUBLISH, ROLLBACK
  // --------------------------------------------------------------------------
  const handleSaveDraft = () => {
    setStatusMsg(null);
    setFieldErrors({});

    startTransition(async () => {
      const res = await saveSiteSettingsDraftAction(config, config.version);
      if (res.success && res.data) {
        setConfig(res.data);
        setHasDraft(true);
        setStatusMsg({
          type: 'success',
          text: 'Site settings saved to private draft. Visitors continue seeing published settings.',
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: res.error || 'Failed to save site settings draft.',
        });
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      }
    });
  };

  const handlePublish = () => {
    setStatusMsg(null);
    setFieldErrors({});

    const confirmed = window.confirm(
      'Publishing will apply these site settings live across the entire public portfolio. Proceed?'
    );
    if (!confirmed) return;

    startTransition(async () => {
      const res = await publishSiteSettingsAction(config, publishedConfig.version);
      if (res.success && res.data) {
        setConfig(res.data);
        setHasDraft(false);
        setStatusMsg({
          type: 'success',
          text: `Site settings published successfully! Version ${res.data.version || 'latest'} is now live.`,
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: res.error || 'Failed to publish site settings.',
        });
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      }
    });
  };

  const handleRollback = () => {
    setStatusMsg(null);
    setFieldErrors({});

    const confirmed = window.confirm(
      'Roll back to the previous published site settings? This will immediately overwrite the current live settings.'
    );
    if (!confirmed) return;

    startTransition(async () => {
      const res = await rollbackSiteSettingsAction(publishedConfig.version);
      if (res.success && res.data) {
        setConfig(res.data);
        setHasDraft(false);
        setStatusMsg({
          type: 'success',
          text: `Rolled back to previous revision successfully! Now serving version ${res.data.version}.`,
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: res.error || 'Failed to rollback site settings.',
        });
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ====================================================================
          TOP HUD & ACTION BAR
          ==================================================================== */}
      <div
        className="admin-card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          borderColor: hasDraft ? 'rgba(201, 164, 92, 0.4)' : 'rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: hasDraft ? 'rgba(201, 164, 92, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              border: `1px solid ${hasDraft ? 'rgba(201, 164, 92, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: hasDraft ? 'var(--color-gold, #C9A45C)' : '#10B981',
            }}
          >
            <Settings size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)', fontSize: '0.95rem' }}>
                Global Site Settings
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  fontWeight: 600,
                  backgroundColor: hasDraft ? 'rgba(201, 164, 92, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                  color: hasDraft ? 'var(--color-gold-light, #E4C88A)' : '#34D399',
                  border: `1px solid ${hasDraft ? 'rgba(201, 164, 92, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                }}
              >
                {hasDraft ? 'DRAFT REVISION IN PROGRESS' : 'LIVE PUBLISHED ACTIVE'}
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--color-text-dim, #9A9AA8)',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                v{config.version || 1}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)', marginTop: '0.15rem' }}>
              Database: <strong style={{ color: '#E4C88A' }}>{dataSource.toUpperCase()}</strong> • Last Updated:{' '}
              {new Date(config.updatedAt).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link
            href="/admin/sections/preview"
            target="_blank"
            className="admin-btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}
          >
            <Eye size={14} /> Private Preview
          </Link>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isPending}
            className="admin-btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Save size={14} /> Save Draft
          </button>

          <button
            type="button"
            onClick={handleRollback}
            disabled={isPending}
            className="admin-btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#EF4444' }}
            title="Rollback to previous published version"
          >
            <RotateCcw size={14} /> Rollback
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={isPending}
            className="admin-btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Send size={14} /> Publish to Live
          </button>
        </div>
      </div>

      {/* Status Notifications */}
      {statusMsg && (
        <div
          style={{
            padding: '0.85rem 1.15rem',
            borderRadius: '6px',
            backgroundColor: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: statusMsg.type === 'success' ? '#34D399' : '#FCA5A5',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.85rem',
          }}
        >
          {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* ====================================================================
          TAB NAVIGATION
          ==================================================================== */}
      <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className="admin-tab-btn"
          style={{
            padding: '0.65rem 1rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: activeTab === 'general' ? 'var(--color-gold, #C9A45C)' : 'var(--color-text-dim, #9A9AA8)',
            borderBottom: activeTab === 'general' ? '2px solid var(--color-gold, #C9A45C)' : '2px solid transparent',
            background: 'transparent',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <User size={15} /> General Information
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('contact')}
          className="admin-tab-btn"
          style={{
            padding: '0.65rem 1rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: activeTab === 'contact' ? 'var(--color-gold, #C9A45C)' : 'var(--color-text-dim, #9A9AA8)',
            borderBottom: activeTab === 'contact' ? '2px solid var(--color-gold, #C9A45C)' : '2px solid transparent',
            background: 'transparent',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <Mail size={15} /> Contact & Social
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assets')}
          className="admin-tab-btn"
          style={{
            padding: '0.65rem 1rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: activeTab === 'assets' ? 'var(--color-gold, #C9A45C)' : 'var(--color-text-dim, #9A9AA8)',
            borderBottom: activeTab === 'assets' ? '2px solid var(--color-gold, #C9A45C)' : '2px solid transparent',
            background: 'transparent',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <FileText size={15} /> Assets & Resume
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('features')}
          className="admin-tab-btn"
          style={{
            padding: '0.65rem 1rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: activeTab === 'features' ? 'var(--color-gold, #C9A45C)' : 'var(--color-text-dim, #9A9AA8)',
            borderBottom: activeTab === 'features' ? '2px solid var(--color-gold, #C9A45C)' : '2px solid transparent',
            background: 'transparent',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <Layers size={15} /> Supported Features
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('operational')}
          className="admin-tab-btn"
          style={{
            padding: '0.65rem 1rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: activeTab === 'operational' ? 'var(--color-gold, #C9A45C)' : 'var(--color-text-dim, #9A9AA8)',
            borderBottom: activeTab === 'operational' ? '2px solid var(--color-gold, #C9A45C)' : '2px solid transparent',
            background: 'transparent',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <Server size={15} /> Operational Status
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('privacy')}
          className="admin-tab-btn"
          style={{
            padding: '0.65rem 1rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: activeTab === 'privacy' ? 'var(--color-gold, #C9A45C)' : 'var(--color-text-dim, #9A9AA8)',
            borderBottom: activeTab === 'privacy' ? '2px solid var(--color-gold, #C9A45C)' : '2px solid transparent',
            background: 'transparent',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <ShieldCheck size={15} /> Privacy & Security
        </button>
      </div>

      {/* ====================================================================
          TAB 1: GENERAL SITE INFORMATION
          ==================================================================== */}
      {activeTab === 'general' && (
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)', marginBottom: '0.35rem' }}>
              General Site Information & Brand Identity
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
              Core developer persona, brand moniker, role designations, and professional availability statement.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label className="admin-form-label">Brand Name / Moniker</label>
              <input
                type="text"
                className="admin-form-input"
                value={config.name}
                onChange={(e) => updateField('name', e.target.value)}
              />
              {fieldErrors.name && <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{fieldErrors.name}</div>}
            </div>

            <div>
              <label className="admin-form-label">Developer Full Legal / Professional Name</label>
              <input
                type="text"
                className="admin-form-input"
                value={config.developerName}
                onChange={(e) => updateField('developerName', e.target.value)}
              />
              {fieldErrors.developerName && (
                <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{fieldErrors.developerName}</div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label className="admin-form-label">Professional Role Title</label>
              <input
                type="text"
                className="admin-form-input"
                value={config.role}
                onChange={(e) => updateField('role', e.target.value)}
              />
            </div>

            <div>
              <label className="admin-form-label">Core Specialization Tag</label>
              <input
                type="text"
                className="admin-form-input"
                value={config.specialization}
                onChange={(e) => updateField('specialization', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="admin-form-label">Availability / Engagement Status Statement</label>
            <input
              type="text"
              className="admin-form-input"
              value={config.status}
              onChange={(e) => updateField('status', e.target.value)}
            />
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim, #9A9AA8)', marginTop: '0.25rem' }}>
              Displayed on contact banners, admin overviews, and structured metadata.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label className="admin-form-label">Primary Canonical Domain</label>
              <input
                type="text"
                className="admin-form-input"
                value={config.domain}
                onChange={(e) => updateField('domain', e.target.value)}
              />
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim, #9A9AA8)', marginTop: '0.25rem' }}>
                Canonical public host name (e.g. philozz.com). Pinned to HTTPS origin.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="admin-form-label">Years of Exp.</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={config.experienceYears}
                  onChange={(e) => updateField('experienceYears', e.target.value)}
                />
              </div>
              <div>
                <label className="admin-form-label">Projects Built</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={config.projectsCount}
                  onChange={(e) => updateField('projectsCount', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Contextual Links Banner */}
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              marginTop: '0.5rem',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
              Looking for Search Engine Optimization or Homepage Scene Narratives?
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link
                href="/admin/seo"
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--color-gold-light, #E4C88A)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                SEO Studio <ExternalLink size={12} />
              </Link>
              <Link
                href="/admin/sections"
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--color-gold-light, #E4C88A)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                Sections Studio <ExternalLink size={12} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 2: CONTACT & SOCIAL REFERENCES
          ==================================================================== */}
      {activeTab === 'contact' && (
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)', marginBottom: '0.35rem' }}>
              Public Contact &amp; Social References
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
              Direct email channels, phone, geographic base, and public developer profiles.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label className="admin-form-label">Primary Direct Email</label>
              <input
                type="email"
                className="admin-form-input"
                value={config.email}
                onChange={(e) => updateField('email', e.target.value)}
              />
              {fieldErrors.email && (
                <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{fieldErrors.email}</div>
              )}
            </div>

            <div>
              <label className="admin-form-label">Public Inquiries / Brand Email</label>
              <input
                type="email"
                className="admin-form-input"
                value={config.brandEmail}
                onChange={(e) => updateField('brandEmail', e.target.value)}
              />
              {fieldErrors.brandEmail && (
                <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{fieldErrors.brandEmail}</div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label className="admin-form-label">Direct Phone / Telegram</label>
              <input
                type="text"
                className="admin-form-input"
                value={config.phone}
                onChange={(e) => updateField('phone', e.target.value)}
              />
            </div>

            <div>
              <label className="admin-form-label">Geographic Location</label>
              <input
                type="text"
                className="admin-form-input"
                value={config.location}
                onChange={(e) => updateField('location', e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label className="admin-form-label">GitHub Profile URL</label>
              <input
                type="text"
                className="admin-form-input"
                value={config.github}
                onChange={(e) => updateField('github', e.target.value)}
              />
              {fieldErrors.github && (
                <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{fieldErrors.github}</div>
              )}
            </div>

            <div>
              <label className="admin-form-label">LinkedIn Profile URL</label>
              <input
                type="text"
                className="admin-form-input"
                value={config.linkedin}
                onChange={(e) => updateField('linkedin', e.target.value)}
              />
              {fieldErrors.linkedin && (
                <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{fieldErrors.linkedin}</div>
              )}
            </div>
          </div>

          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '0.5rem',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
              Additional footer channels and mosaic contact cards are managed in Sections Studio.
            </div>
            <Link
              href="/admin/sections"
              style={{
                fontSize: '0.78rem',
                color: 'var(--color-gold-light, #E4C88A)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              Manage Footer Channels <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 3: ASSETS & RESUME REFERENCES
          ==================================================================== */}
      {activeTab === 'assets' && (
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)', marginBottom: '0.35rem' }}>
              Public Asset References &amp; Resume PDF
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
              Canonical paths for professional resume documents and core identity photo assets.
            </p>
          </div>

          <MediaField
            id="settings-cv-url"
            label="Resume / CV Document Path"
            value={config.cvUrl}
            onChange={(val) => updateField('cvUrl', val)}
            placeholder="/images/felopater-cv.pdf"
            description="Must be a valid relative asset path (e.g. /images/felopater-cv.pdf) or secure HTTPS document URL."
            folder="brand"
            mimePrefix="application/pdf"
          />
          {fieldErrors.cvUrl && (
            <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{fieldErrors.cvUrl}</div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label className="admin-form-label">Thinking Portrait Photo Reference (Read-Only)</label>
              <input
                type="text"
                className="admin-form-input"
                readOnly
                value="/images/felopater-portrait-thinking.jpg"
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim, #9A9AA8)', marginTop: '0.25rem' }}>
                Used in About mosaic thinking card, contact scene, and schema JSON-LD.
              </div>
            </div>

            <div>
              <label className="admin-form-label">Studio Workspace Reference (Read-Only)</label>
              <input
                type="text"
                className="admin-form-input"
                readOnly
                value="/images/studio-workspace-backdrop.jpg"
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim, #9A9AA8)', marginTop: '0.25rem' }}>
                Cinematic studio backdrop asset for public scenes.
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '6px',
              backgroundColor: 'rgba(201, 164, 92, 0.08)',
              border: '1px solid rgba(201, 164, 92, 0.2)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem',
            }}
          >
            <Info size={16} style={{ color: 'var(--color-gold, #C9A45C)', marginTop: '2px', flexShrink: 0 }} />
            <div style={{ fontSize: '0.8rem', color: 'var(--color-ivory, #F6F3EC)' }}>
              <strong>Media Library Status:</strong> Direct binary file uploads and cloud bucket storage integration will be activated in Phase 16E (Media Library Studio). Current references point to verified bundled public assets.
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 4: SUPPORTED FEATURES
          ==================================================================== */}
      {activeTab === 'features' && (
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)', marginBottom: '0.35rem' }}>
              Supported Site Features &amp; Runtime Toggles
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
              Configure supported optional behaviors that have fully implemented public representations.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Feature 1: Resume Download Button Visibility */}
            <div
              style={{
                padding: '1rem 1.25rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)', fontSize: '0.9rem' }}>
                  Public Resume Download Buttons
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-dim, #9A9AA8)', marginTop: '0.2rem' }}>
                  When enabled, displays the golden &ldquo;Resume&rdquo; download CTA button in top navigation, mobile drawer, and contact finale. When disabled, hides the CTA completely.
                </div>
              </div>
              <button
                type="button"
                onClick={() => updateField('cvAvailable', !config.cvAvailable)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: config.cvAvailable ? '#10B981' : '#6B7280',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                {config.cvAvailable ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                <span>{config.cvAvailable ? 'ENABLED' : 'DISABLED'}</span>
              </button>
            </div>

            {/* Feature 2: Demo / Staging Environment Indicator */}
            <div
              style={{
                padding: '1rem 1.25rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)', fontSize: '0.9rem' }}>
                  Demo / Staging Indicator Badge
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-dim, #9A9AA8)', marginTop: '0.2rem' }}>
                  Renders a discreet golden &ldquo;DEMO&rdquo; pill beside the public header brand name to clearly demarcate testing/staging environments.
                </div>
              </div>
              <button
                type="button"
                onClick={() => updateField('isDemoEnvironment', !config.isDemoEnvironment)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: config.isDemoEnvironment ? 'var(--color-gold, #C9A45C)' : '#6B7280',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                {config.isDemoEnvironment ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                <span>{config.isDemoEnvironment ? 'ENABLED' : 'DISABLED'}</span>
              </button>
            </div>

            {/* Feature 3: Interactive Orbit Galaxy (Contextual Link) */}
            <div
              style={{
                padding: '1rem 1.25rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)', fontSize: '0.9rem' }}>
                  3D Interactive Orbit &amp; Skills Galaxy
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-dim, #9A9AA8)', marginTop: '0.2rem' }}>
                  9-slot hardware-accelerated Black Hole Orbit perspective system and Focus Mode technology inventory.
                </div>
              </div>
              <Link
                href="/admin/sections"
                className="admin-btn-secondary"
                style={{ fontSize: '0.75rem', textDecoration: 'none' }}
              >
                Manage Orbit Slots <ExternalLink size={12} />
              </Link>
            </div>

            {/* Feature 4: Engineering Journal & Selected Projects (Contextual Links) */}
            <div
              style={{
                padding: '1rem 1.25rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)', fontSize: '0.9rem' }}>
                  Public Content Studios (Projects &amp; Journal)
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-dim, #9A9AA8)', marginTop: '0.2rem' }}>
                  Manage individual case studies, technical writeups, category taxonomies, and featured order.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link
                  href="/admin/projects"
                  className="admin-btn-secondary"
                  style={{ fontSize: '0.75rem', textDecoration: 'none' }}
                >
                  Projects Studio <ExternalLink size={12} />
                </Link>
                <Link
                  href="/admin/articles"
                  className="admin-btn-secondary"
                  style={{ fontSize: '0.75rem', textDecoration: 'none' }}
                >
                  Blog Studio <ExternalLink size={12} />
                </Link>
              </div>
            </div>

            {/* Safe Maintenance Mode Evaluation Notice */}
            <div
              style={{
                padding: '1rem 1.25rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
              }}
            >
              <ShieldCheck size={18} style={{ color: '#10B981', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 600, color: '#34D399', fontSize: '0.85rem' }}>
                  Safe Maintenance Mode Architecture (Standard Serving Guaranteed)
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--color-text-dim, #9A9AA8)', marginTop: '0.25rem', lineHeight: 1.5 }}>
                  In Next.js with Cache Components and Vercel Edge caching, an ad-hoc CMS toggle shutting down public pages risks permanently poisoning CDN caches with 503 errors and damaging Google search ranking. PHILOZZ enforces continuous standard serving; emergency maintenance is safely handled through DNS/WAF perimeter controls.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 5: OPERATIONAL STATUS (READ-ONLY)
          ==================================================================== */}
      {activeTab === 'operational' && (
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)', marginBottom: '0.35rem' }}>
              Operational Platform &amp; Deployment Overview
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
              Verified server runtime, database topology, and Vercel edge deployment status.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.25rem',
              fontSize: '0.85rem',
            }}
          >
            <div style={{ padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)' }}>Hosting Infrastructure</div>
              <div style={{ color: 'var(--color-ivory, #F6F3EC)', fontWeight: 600, marginTop: '0.2rem' }}>
                Vercel Server Functions
              </div>
              <div style={{ fontSize: '0.72rem', color: '#10B981', marginTop: '0.2rem' }}>
                Edge Network • Node.js 22 Runtime
              </div>
            </div>

            <div style={{ padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)' }}>Application Framework</div>
              <div style={{ color: 'var(--color-ivory, #F6F3EC)', fontWeight: 600, marginTop: '0.2rem' }}>
                Next.js 16.4.3 (Turbopack)
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-gold-light, #E4C88A)', marginTop: '0.2rem' }}>
                Cache Components • Partial Prerendering
              </div>
            </div>

            <div style={{ padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)' }}>Active CMS Database</div>
              <div style={{ color: 'var(--color-ivory, #F6F3EC)', fontWeight: 600, marginTop: '0.2rem' }}>
                {dataSource === 'firestore' ? 'Cloud Firestore (Production)' : 'Local In-Memory Repository'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim, #9A9AA8)', marginTop: '0.2rem' }}>
                Collection: <span style={{ fontFamily: 'monospace' }}>site_config/brand_info</span>
              </div>
            </div>

            <div style={{ padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)' }}>Canonical Production Origin</div>
              <div style={{ color: 'var(--color-ivory, #F6F3EC)', fontWeight: 600, marginTop: '0.2rem', fontFamily: 'monospace' }}>
                https://philozz.com
              </div>
              <div style={{ fontSize: '0.72rem', color: '#10B981', marginTop: '0.2rem' }}>
                Strictly enforced across sitemaps &amp; meta
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 6: PRIVACY & SECURITY BOUNDARY (READ-ONLY)
          ==================================================================== */}
      {activeTab === 'privacy' && (
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)', marginBottom: '0.35rem' }}>
              Privacy, Analytics &amp; Security Boundary Policy
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
              Truthful overview of third-party tracking, cookie policy, and cryptographic perimeter.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {/* Analytics Truthful Status */}
            <div style={{ padding: '1.1rem', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Activity size={16} style={{ color: 'var(--color-gold, #C9A45C)' }} />
                <strong style={{ color: 'var(--color-ivory, #F6F3EC)', fontSize: '0.88rem' }}>Web Analytics</strong>
                <span style={{ marginLeft: 'auto', fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.08)', color: 'var(--color-text-dim, #9A9AA8)' }}>
                  NOT CONFIGURED
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-dim, #9A9AA8)', lineHeight: 1.5 }}>
                Zero third-party tracking scripts, zero surveillance beacons, and zero telemetry SDKs are embedded in public pages. Respecting visitor privacy by design.
              </p>
            </div>

            {/* Cookie Policy */}
            <div style={{ padding: '1.1rem', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Lock size={16} style={{ color: '#10B981' }} />
                <strong style={{ color: 'var(--color-ivory, #F6F3EC)', fontSize: '0.88rem' }}>Cookie Usage</strong>
                <span style={{ marginLeft: 'auto', fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34D399' }}>
                  FUNCTIONAL ONLY
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-dim, #9A9AA8)', lineHeight: 1.5 }}>
                Public visitors receive zero tracking cookies. The only active cookie is the secure <code style={{ color: '#E4C88A' }}>__session</code> token issued exclusively to the verified administrator upon login.
              </p>
            </div>

            {/* Cryptographic Boundary */}
            <div style={{ padding: '1.1rem', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <ShieldCheck size={16} style={{ color: '#34D399' }} />
                <strong style={{ color: 'var(--color-ivory, #F6F3EC)', fontSize: '0.88rem' }}>Owner Perimeter</strong>
                <span style={{ marginLeft: 'auto', fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34D399' }}>
                  PROTECTED
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-dim, #9A9AA8)', lineHeight: 1.5 }}>
                Owner UID: <span style={{ fontFamily: 'monospace', color: '#E4C88A' }}>{ownerUid}</span>
                <br />
                Account: {ownerEmail || 'Single Owner'}
                <br />
                Claims: <code style={{ color: '#34D399' }}>admin === true</code> (Verified server-side)
              </p>
            </div>
          </div>

          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '6px',
              backgroundColor: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem',
            }}
          >
            <Lock size={16} style={{ color: '#EF4444', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.8rem', color: '#FCA5A5' }}>
              <strong>Critical Security Boundary:</strong> Security headers (CSP, HSTS, X-Frame-Options), CORS allowlists, Firebase service account keys, and authentication token lifetimes are strictly managed in trusted code and Vercel environment variables. They cannot be modified from the CMS.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
