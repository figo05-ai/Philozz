'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Save,
  Send,
  RotateCcw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  User,
  Compass,
  Mail,
  ExternalLink,
  Orbit,
  Layers,
} from 'lucide-react';
import { HomepageConfigEntity, BrandInfoEntity, MosaicCardEntity } from '@/cms/models/site';
import {
  TechnologyEntity,
  OrbitSlotsTuple,
  ExpertiseAreaEntity,
} from '@/cms/models/technology';
import {
  saveSectionsDraftAction,
  publishSectionsAction,
  rollbackSectionsAction,
  updateBrandInfoAction,
} from '@/app/admin/sections/actions';
import { SkillsStudioPanel } from '@/components/admin/SkillsStudioPanel';
import { ExpertiseStudioPanel } from '@/components/admin/ExpertiseStudioPanel';
import { MediaField } from './MediaField';

export interface SectionsStudioViewProps {
  initialConfig: HomepageConfigEntity;
  publishedConfig: HomepageConfigEntity;
  brandInfo: BrandInfoEntity;
  hasDraft: boolean;
  dataSource: string;
  initialTechnologies?: TechnologyEntity[];
  initialOrbitSlotsDraft?: OrbitSlotsTuple | null;
  initialOrbitSlotsPublished?: OrbitSlotsTuple;
  initialExpertiseAreas?: ExpertiseAreaEntity[];
}

type TabKey = 'hero' | 'about' | 'skills' | 'expertise' | 'contact' | 'brand';

export function SectionsStudioView({
  initialConfig,
  brandInfo: initialBrand,
  hasDraft: initialHasDraft,
  dataSource,
  initialTechnologies = [],
  initialOrbitSlotsDraft = null,
  initialOrbitSlotsPublished = ['', '', '', '', '', '', '', '', ''] as unknown as OrbitSlotsTuple,
  initialExpertiseAreas = [],
}: SectionsStudioViewProps) {
  const [config, setConfig] = useState<HomepageConfigEntity>(initialConfig);
  const [brand, setBrand] = useState<BrandInfoEntity>(initialBrand);
  const [activeTab, setActiveTab] = useState<TabKey>('hero');
  const [hasDraft, setHasDraft] = useState<boolean>(initialHasDraft);

  const [isPending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ----------------------------------------------------
  // HERO FIELD MUTATORS
  // ----------------------------------------------------
  const updateHero = (key: keyof HomepageConfigEntity['hero'], val: unknown) => {
    setConfig((prev) => ({
      ...prev,
      hero: { ...prev.hero, [key]: val },
    }));
  };

  const addSignatureWord = () => {
    const current = config.hero.signatureWords || [];
    if (current.length >= 8) return;
    updateHero('signatureWords', [...current, 'NewWord']);
  };

  const updateSignatureWord = (idx: number, val: string) => {
    const updated = [...(config.hero.signatureWords || [])];
    updated[idx] = val;
    updateHero('signatureWords', updated);
  };

  const removeSignatureWord = (idx: number) => {
    const updated = [...(config.hero.signatureWords || [])];
    updated.splice(idx, 1);
    updateHero('signatureWords', updated);
  };

  const addSignatureCred = () => {
    const current = config.hero.signatureCredentials || [];
    if (current.length >= 6) return;
    updateHero('signatureCredentials', [...current, 'NEW CREDENTIAL']);
  };

  const updateSignatureCred = (idx: number, val: string) => {
    const updated = [...(config.hero.signatureCredentials || [])];
    updated[idx] = val;
    updateHero('signatureCredentials', updated);
  };

  const removeSignatureCred = (idx: number) => {
    const updated = [...(config.hero.signatureCredentials || [])];
    updated.splice(idx, 1);
    updateHero('signatureCredentials', updated);
  };

  // ----------------------------------------------------
  // ABOUT FIELD MUTATORS
  // ----------------------------------------------------
  const updateAbout = (key: keyof HomepageConfigEntity['about'], val: unknown) => {
    setConfig((prev) => ({
      ...prev,
      about: { ...prev.about, [key]: val },
    }));
  };

  const updateBadge = (idx: number, field: 'icon' | 'label', val: string) => {
    const badges = [...(config.about.badges || [])];
    badges[idx] = { ...badges[idx], [field]: val };
    updateAbout('badges', badges);
  };

  const addBadge = () => {
    const badges = [...(config.about.badges || [])];
    badges.push({ icon: 'Code2', label: 'New Badge' });
    updateAbout('badges', badges);
  };

  const removeBadge = (idx: number) => {
    const badges = [...(config.about.badges || [])];
    badges.splice(idx, 1);
    updateAbout('badges', badges);
  };

  const updateMosaicCard = (cardId: 'thinking' | 'building' | 'journey', patch: Partial<MosaicCardEntity>) => {
    const cards = [...(config.about.mosaicCards || [])];
    const idx = cards.findIndex((c) => c.id === cardId);
    if (idx !== -1) {
      cards[idx] = { ...cards[idx], ...patch };
      updateAbout('mosaicCards', cards);
    }
  };

  // Timeline Items for Journey Card
  const journeyCard = config.about.mosaicCards?.find((c) => c.id === 'journey');
  const timelineItems = journeyCard?.timelineItems || [];

  const updateTimelineItem = (idx: number, field: string, val: unknown) => {
    const items = [...timelineItems];
    items[idx] = { ...items[idx], [field]: val };
    updateMosaicCard('journey', { timelineItems: items });
  };

  const addTimelineItem = () => {
    const items = [...timelineItems, { heading: 'Milestone Title', info: 'Role & Technologies', isActive: false }];
    updateMosaicCard('journey', { timelineItems: items });
  };

  const removeTimelineItem = (idx: number) => {
    const items = [...timelineItems];
    items.splice(idx, 1);
    updateMosaicCard('journey', { timelineItems: items });
  };

  const moveTimelineItem = (idx: number, dir: 'up' | 'down') => {
    const items = [...timelineItems];
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const temp = items[idx];
    items[idx] = items[targetIdx];
    items[targetIdx] = temp;
    updateMosaicCard('journey', { timelineItems: items });
  };

  // ----------------------------------------------------
  // CONTACT FIELD MUTATORS
  // ----------------------------------------------------
  const updateContact = (key: keyof HomepageConfigEntity['contact'], val: unknown) => {
    setConfig((prev) => ({
      ...prev,
      contact: { ...prev.contact, [key]: val },
    }));
  };

  const updateSocialLink = (idx: number, field: 'platform' | 'url' | 'label', val: string) => {
    const links = [...(config.contact.socialLinks || [])];
    links[idx] = { ...links[idx], [field]: val };
    updateContact('socialLinks', links);
  };

  const addSocialLink = () => {
    const links = [...(config.contact.socialLinks || [])];
    links.push({ platform: 'New Platform', url: 'https://', label: 'username' });
    updateContact('socialLinks', links);
  };

  const removeSocialLink = (idx: number) => {
    const links = [...(config.contact.socialLinks || [])];
    links.splice(idx, 1);
    updateContact('socialLinks', links);
  };

  // ----------------------------------------------------
  // ACTIONS: SAVE DRAFT, PUBLISH, ROLLBACK
  // ----------------------------------------------------
  const handleSaveDraft = () => {
    setStatusMsg(null);
    setFieldErrors({});

    startTransition(async () => {
      const res = await saveSectionsDraftAction(config, config.version);
      if (res.success && res.data) {
        setConfig(res.data);
        setHasDraft(true);
        setStatusMsg({ type: 'success', text: `Draft saved successfully as v${res.data.version || 1}. Use "Preview Draft" to inspect changes privately.` });
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'Failed to save draft.' });
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      }
    });
  };

  const handlePublish = () => {
    if (!confirm('Are you sure you want to publish these changes directly to the public website?')) {
      return;
    }
    setStatusMsg(null);
    setFieldErrors({});

    startTransition(async () => {
      const res = await publishSectionsAction(config, config.version);
      if (res.success && res.data) {
        setConfig(res.data);
        setHasDraft(false);
        setStatusMsg({
          type: 'success',
          text: `Sections successfully published to live website (v${res.data.version || 1})! Cache has been revalidated.`,
        });
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'Failed to publish sections.' });
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
      }
    });
  };

  const handleRollback = () => {
    if (!confirm('Rollback to previous published configuration? Any unsaved edits will be discarded.')) {
      return;
    }
    setStatusMsg(null);
    setFieldErrors({});

    startTransition(async () => {
      const res = await rollbackSectionsAction();
      if (res.success && res.data) {
        setConfig(res.data);
        setHasDraft(false);
        setStatusMsg({
          type: 'success',
          text: `Successfully rolled back to previous published configuration (v${res.data.version || 1}). Live site updated.`,
        });
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'Failed to rollback configuration.' });
      }
    });
  };

  const handleSaveBrand = () => {
    setStatusMsg(null);
    startTransition(async () => {
      const res = await updateBrandInfoAction(brand);
      if (res.success && res.data) {
        setBrand(res.data);
        setStatusMsg({ type: 'success', text: 'Brand and contact identity updated successfully across all sections.' });
      } else {
        setStatusMsg({ type: 'error', text: res.error || 'Failed to update brand information.' });
      }
    });
  };

  const thinkingCard = config.about.mosaicCards?.find((c) => c.id === 'thinking');
  const buildingCard = config.about.mosaicCards?.find((c) => c.id === 'building');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Sticky Studio Action Bar */}
      <div
        className="admin-card"
        style={{
          position: 'sticky',
          top: '1rem',
          zIndex: 40,
          backdropFilter: 'blur(16px)',
          backgroundColor: 'rgba(18, 18, 24, 0.88)',
          border: '1px solid rgba(201, 164, 92, 0.25)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '1rem 1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Sparkles size={20} style={{ color: 'var(--color-gold, #C9A45C)' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-ivory, #F6F3EC)' }}>
                Site Sections Studio
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '4px',
                  fontWeight: 600,
                  backgroundColor: hasDraft ? 'rgba(234, 179, 8, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: hasDraft ? '#EAB308' : '#10B981',
                  border: `1px solid ${hasDraft ? 'rgba(234, 179, 8, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                }}
              >
                {hasDraft ? `Draft v${config.version || 1} (Unpublished)` : `Live Published v${config.version || 1}`}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
                Backend: <strong style={{ color: 'var(--color-gold-light, #E4C88A)' }}>{dataSource.toUpperCase()}</strong>
              </span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--color-text-dim, #9A9AA8)', marginTop: '2px' }}>
              Last saved: {new Date(config.updatedAt).toLocaleTimeString()}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleRollback}
            disabled={isPending}
            className="btn-outline-gold"
            style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem', color: '#D6D6E2', borderColor: 'rgba(214, 214, 226, 0.25)' }}
            title="Restore previous published configuration"
          >
            <RotateCcw size={14} />
            <span>Rollback</span>
          </button>

          <Link
            href="/admin/sections/preview"
            target="_blank"
            className="btn-outline-gold"
            style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
          >
            <Eye size={14} />
            <span>Preview Draft</span>
            <ExternalLink size={12} style={{ opacity: 0.6 }} />
          </Link>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isPending}
            className="btn-outline-gold"
            style={{ fontSize: '0.82rem', padding: '0.45rem 0.95rem' }}
          >
            <Save size={14} />
            <span>{isPending ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={isPending}
            className="btn-gold"
            style={{ fontSize: '0.82rem', padding: '0.45rem 1.1rem' }}
          >
            <Send size={14} />
            <span>{isPending ? 'Publishing...' : 'Publish Live'}</span>
          </button>
        </div>
      </div>

      {/* Status Banner */}
      {statusMsg && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.85rem',
            backgroundColor: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: statusMsg.type === 'success' ? '#10B981' : '#EF4444',
          }}
        >
          {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Tabs Header */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid rgba(201, 164, 92, 0.15)',
          paddingBottom: '0.5rem',
          overflowX: 'auto',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('hero')}
          className={`admin-filter-pill ${activeTab === 'hero' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <Sparkles size={14} />
          <span>Hero Scene</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('about')}
          className={`admin-filter-pill ${activeTab === 'about' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <User size={14} />
          <span>About Scene</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('skills')}
          className={`admin-filter-pill ${activeTab === 'skills' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <Orbit size={14} />
          <span>Skills Galaxy &amp; Orbit</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('expertise')}
          className={`admin-filter-pill ${activeTab === 'expertise' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <Layers size={14} />
          <span>Disciplines Matrix</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('contact')}
          className={`admin-filter-pill ${activeTab === 'contact' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <Mail size={14} />
          <span>Contact &amp; Finale</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('brand')}
          className={`admin-filter-pill ${activeTab === 'brand' ? 'active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <Compass size={14} />
          <span>Brand Identity</span>
        </button>
      </div>

      {/* ========================================================
          PANEL 1: HERO SCENE
          ======================================================== */}
      {activeTab === 'hero' && (
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)', marginBottom: '0.35rem' }}>
              Hero Cinematic Scene Configuration
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
              Configure headline lines, supporting editorial copy, CTA buttons, metrics, and photography references.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label className="admin-form-label">
                Eyebrow Badge <span style={{ color: 'var(--color-gold)' }}>*</span>
              </label>
              <input
                type="text"
                className="admin-form-input"
                value={config.hero.eyebrow}
                onChange={(e) => updateHero('eyebrow', e.target.value)}
                placeholder="FULL-STACK DEVELOPER"
              />
              {fieldErrors['hero.eyebrow'] && <div className="admin-form-error">{fieldErrors['hero.eyebrow']}</div>}
            </div>

            <MediaField
              id="hero-image-url"
              label="Hero Background Image URL"
              value={config.hero.heroImageUrl}
              onChange={(val) => updateHero('heroImageUrl', val)}
              placeholder="/images/philozz-cinematic-hero.png"
              folder="brand"
            />
          </div>

          {/* Three-Line Headline Stack */}
          <div>
            <label className="admin-form-label">
              Editorial Headline Typography Stack (3 Lines) <span style={{ color: 'var(--color-gold)' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-dim, #9A9AA8)' }}>Line 1 (White)</span>
                <input
                  type="text"
                  className="admin-form-input"
                  value={config.hero.titleLine1}
                  onChange={(e) => updateHero('titleLine1', e.target.value)}
                  placeholder="Full-Stack"
                />
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-dim, #9A9AA8)' }}>Line 2 (White)</span>
                <input
                  type="text"
                  className="admin-form-input"
                  value={config.hero.titleLine2}
                  onChange={(e) => updateHero('titleLine2', e.target.value)}
                  placeholder="Engineer."
                />
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-gold)' }}>Line 3 (Gold Accent)</span>
                <input
                  type="text"
                  className="admin-form-input"
                  value={config.hero.titleLine3}
                  onChange={(e) => updateHero('titleLine3', e.target.value)}
                  placeholder="Backend at Heart."
                />
              </div>
            </div>
          </div>

          {/* Supporting Copy */}
          <div>
            <label className="admin-form-label">
              Supporting Editorial Description <span style={{ color: 'var(--color-gold)' }}>*</span>
            </label>
            <textarea
              className="admin-form-textarea"
              rows={3}
              value={config.hero.description}
              onChange={(e) => updateHero('description', e.target.value)}
              placeholder="Building performant, scalable, and meaningful web applications..."
            />
            {fieldErrors['hero.description'] && <div className="admin-form-error">{fieldErrors['hero.description']}</div>}
          </div>

          {/* CTAs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label className="admin-form-label">Primary CTA (Gold Button)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="admin-form-input"
                  style={{ flex: 1 }}
                  value={config.hero.primaryCtaLabel}
                  onChange={(e) => updateHero('primaryCtaLabel', e.target.value)}
                  placeholder="View My Work"
                />
                <input
                  type="text"
                  className="admin-form-input"
                  style={{ flex: 1 }}
                  value={config.hero.primaryCtaHref}
                  onChange={(e) => updateHero('primaryCtaHref', e.target.value)}
                  placeholder="#projects"
                />
              </div>
            </div>

            <div>
              <label className="admin-form-label">Secondary CTA (Outline Button)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="admin-form-input"
                  style={{ flex: 1 }}
                  value={config.hero.secondaryCtaLabel}
                  onChange={(e) => updateHero('secondaryCtaLabel', e.target.value)}
                  placeholder="Let's Talk"
                />
                <input
                  type="text"
                  className="admin-form-input"
                  style={{ flex: 1 }}
                  value={config.hero.secondaryCtaHref}
                  onChange={(e) => updateHero('secondaryCtaHref', e.target.value)}
                  placeholder="#contact"
                />
              </div>
            </div>
          </div>

          {/* Verified Metrics Counter Row */}
          <div>
            <label className="admin-form-label">Verified Metrics Counter Row</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-dim, #9A9AA8)' }}>Years Experience</span>
                <input
                  type="text"
                  className="admin-form-input"
                  value={config.hero.experienceYears || brand.experienceYears || '3+'}
                  onChange={(e) => updateHero('experienceYears', e.target.value)}
                  placeholder="3+"
                />
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-dim, #9A9AA8)' }}>Projects Completed</span>
                <input
                  type="text"
                  className="admin-form-input"
                  value={config.hero.projectsCount || brand.projectsCount || '20+'}
                  onChange={(e) => updateHero('projectsCount', e.target.value)}
                  placeholder="20+"
                />
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-dim, #9A9AA8)' }}>Curiosity Symbol</span>
                <input
                  type="text"
                  className="admin-form-input"
                  value={config.hero.curiosity || brand.curiosity || '∞'}
                  onChange={(e) => updateHero('curiosity', e.target.value)}
                  placeholder="∞"
                />
              </div>
            </div>
          </div>

          {/* Repeatable Signature Words */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="admin-form-label" style={{ marginBottom: 0 }}>
                Desktop Script Words ({config.hero.signatureWords?.length || 0})
              </label>
              <button type="button" onClick={addSignatureWord} className="admin-btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}>
                <Plus size={12} /> Add Word
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {config.hero.signatureWords?.map((word, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                  <input
                    type="text"
                    value={word}
                    onChange={(e) => updateSignatureWord(idx, e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--color-gold-light)', width: '80px', fontSize: '0.85rem' }}
                  />
                  <button type="button" onClick={() => removeSignatureWord(idx)} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Repeatable Credentials */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="admin-form-label" style={{ marginBottom: 0 }}>
                Brand Credentials Line ({config.hero.signatureCredentials?.length || 0})
              </label>
              <button type="button" onClick={addSignatureCred} className="admin-btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}>
                <Plus size={12} /> Add Credential
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {config.hero.signatureCredentials?.map((cred, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                  <input
                    type="text"
                    value={cred}
                    onChange={(e) => updateSignatureCred(idx, e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--color-ivory)', width: '150px', fontSize: '0.82rem' }}
                  />
                  <button type="button" onClick={() => removeSignatureCred(idx)} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          PANEL 2: ABOUT SCENE
          ======================================================== */}
      {activeTab === 'about' && (
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)', marginBottom: '0.35rem' }}>
              About Scene &amp; 3-Part Mosaic Cards
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
              Configure biography narrative, badges, and content for the approved 3 visual slots: Thinking portrait, Building IDE pipeline, and Journey timeline.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label className="admin-form-label">Section Eyebrow Tag</label>
              <input
                type="text"
                className="admin-form-input"
                value={config.about.sectionTag}
                onChange={(e) => updateAbout('sectionTag', e.target.value)}
                placeholder="ABOUT ME"
              />
            </div>
            <div>
              <label className="admin-form-label">Heading Prefix</label>
              <input
                type="text"
                className="admin-form-input"
                value={config.about.titlePrefix}
                onChange={(e) => updateAbout('titlePrefix', e.target.value)}
                placeholder="The Engineer"
              />
            </div>
          </div>

          <div>
            <label className="admin-form-label">Biography Paragraph 1 (Lead)</label>
            <textarea
              className="admin-form-textarea"
              rows={3}
              value={config.about.narrativeParagraph1}
              onChange={(e) => updateAbout('narrativeParagraph1', e.target.value)}
            />
          </div>

          <div>
            <label className="admin-form-label">Biography Paragraph 2 (Details)</label>
            <textarea
              className="admin-form-textarea"
              rows={3}
              value={config.about.narrativeParagraph2}
              onChange={(e) => updateAbout('narrativeParagraph2', e.target.value)}
            />
          </div>

          {/* Repeatable Badges */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="admin-form-label" style={{ marginBottom: 0 }}>
                Personal Badges ({config.about.badges?.length || 0})
              </label>
              <button type="button" onClick={addBadge} className="admin-btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}>
                <Plus size={12} /> Add Badge
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
              {config.about.badges?.map((b, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '0.35rem 0.65rem', borderRadius: '4px' }}>
                  <select
                    value={b.icon}
                    onChange={(e) => updateBadge(idx, 'icon', e.target.value)}
                    className="admin-form-input"
                    style={{ width: '100px', padding: '0.2rem 0.4rem', fontSize: '0.78rem' }}
                  >
                    <option value="MapPin">MapPin</option>
                    <option value="Layers">Layers</option>
                    <option value="Code2">Code2</option>
                  </select>
                  <input
                    type="text"
                    value={b.label}
                    onChange={(e) => updateBadge(idx, 'label', e.target.value)}
                    className="admin-form-input"
                    style={{ width: '160px', padding: '0.2rem 0.4rem', fontSize: '0.78rem' }}
                  />
                  <button type="button" onClick={() => removeBadge(idx)} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label className="admin-form-label">CTA Button Label</label>
              <input
                type="text"
                className="admin-form-input"
                value={config.about.ctaLabel}
                onChange={(e) => updateAbout('ctaLabel', e.target.value)}
                placeholder="More About Me"
              />
            </div>
            <div>
              <label className="admin-form-label">CTA Destination Href</label>
              <input
                type="text"
                className="admin-form-input"
                value={config.about.ctaHref}
                onChange={(e) => updateAbout('ctaHref', e.target.value)}
                placeholder="#skills"
              />
            </div>
          </div>

          {/* Mosaic Card 1: Thinking */}
          <div style={{ padding: '1rem', border: '1px solid rgba(201, 164, 92, 0.15)', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-gold-light)', marginBottom: '0.75rem' }}>
              Slot 1: THINKING Card (Portrait Composition)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-dim)' }}>Title</span>
                <input
                  type="text"
                  className="admin-form-input"
                  value={thinkingCard?.title || ''}
                  onChange={(e) => updateMosaicCard('thinking', { title: e.target.value })}
                />
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-dim)' }}>Subtitle</span>
                <input
                  type="text"
                  className="admin-form-input"
                  value={thinkingCard?.subtitle || ''}
                  onChange={(e) => updateMosaicCard('thinking', { subtitle: e.target.value })}
                />
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-dim)' }}>Portrait Image URL</span>
                <input
                  type="text"
                  className="admin-form-input"
                  value={thinkingCard?.imageUrl || ''}
                  onChange={(e) => updateMosaicCard('thinking', { imageUrl: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Mosaic Card 2: Building */}
          <div style={{ padding: '1rem', border: '1px solid rgba(201, 164, 92, 0.15)', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-gold-light)', marginBottom: '0.75rem' }}>
              Slot 2: BUILDING Card (IDE &amp; API Pipeline)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-dim)' }}>Title</span>
                <input
                  type="text"
                  className="admin-form-input"
                  value={buildingCard?.title || ''}
                  onChange={(e) => updateMosaicCard('building', { title: e.target.value })}
                />
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-dim)' }}>IDE Filename</span>
                <input
                  type="text"
                  className="admin-form-input"
                  value={buildingCard?.ideFilename || ''}
                  onChange={(e) => updateMosaicCard('building', { ideFilename: e.target.value })}
                />
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-dim)' }}>IDE Language Label</span>
                <input
                  type="text"
                  className="admin-form-input"
                  value={buildingCard?.ideLang || ''}
                  onChange={(e) => updateMosaicCard('building', { ideLang: e.target.value })}
                />
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-dim)' }}>Telemetry Route</span>
                <input
                  type="text"
                  className="admin-form-input"
                  value={buildingCard?.telemetryRoute || ''}
                  onChange={(e) => updateMosaicCard('building', { telemetryRoute: e.target.value })}
                />
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-dim)' }}>Telemetry Status</span>
                <input
                  type="text"
                  className="admin-form-input"
                  value={buildingCard?.telemetryStatus || ''}
                  onChange={(e) => updateMosaicCard('building', { telemetryStatus: e.target.value })}
                />
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.74rem', color: 'var(--color-text-dim)' }}>IDE Code Snippet</span>
              <textarea
                className="admin-form-textarea"
                rows={3}
                style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.82rem' }}
                value={buildingCard?.ideSnippet || ''}
                onChange={(e) => updateMosaicCard('building', { ideSnippet: e.target.value })}
              />
            </div>
          </div>

          {/* Mosaic Card 3: Journey */}
          <div style={{ padding: '1rem', border: '1px solid rgba(201, 164, 92, 0.15)', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-gold-light)', margin: 0 }}>
                Slot 3: THE JOURNEY Card (Repeatable Timeline Entries)
              </h4>
              <button type="button" onClick={addTimelineItem} className="admin-btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}>
                <Plus size={12} /> Add Milestone
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {timelineItems.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <button
                      type="button"
                      onClick={() => moveTimelineItem(idx, 'up')}
                      disabled={idx === 0}
                      style={{ background: 'transparent', border: 'none', color: '#9A9AA8', cursor: 'pointer', padding: 0 }}
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveTimelineItem(idx, 'down')}
                      disabled={idx === timelineItems.length - 1}
                      style={{ background: 'transparent', border: 'none', color: '#9A9AA8', cursor: 'pointer', padding: 0 }}
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  <input
                    type="text"
                    className="admin-form-input"
                    style={{ flex: 1 }}
                    value={item.heading}
                    onChange={(e) => updateTimelineItem(idx, 'heading', e.target.value)}
                    placeholder="Milestone Heading"
                  />
                  <input
                    type="text"
                    className="admin-form-input"
                    style={{ flex: 2 }}
                    value={item.info}
                    onChange={(e) => updateTimelineItem(idx, 'info', e.target.value)}
                    placeholder="Description / Context"
                  />

                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#D6D6E2', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(item.isActive)}
                      onChange={(e) => updateTimelineItem(idx, 'isActive', e.target.checked)}
                    />
                    <span>Live</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => removeTimelineItem(idx)}
                    style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          PANEL 3: CONTACT & FINALE
          ======================================================== */}
      {activeTab === 'contact' && (
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)', marginBottom: '0.35rem' }}>
              Contact Scene &amp; Editorial Footer
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
              Configure contact heading, intro statement, primary action, direct channels, portrait signature badge, and footer bar.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label className="admin-form-label">Contact Section Tag</label>
              <input
                type="text"
                className="admin-form-input"
                value={config.contact.sectionTag || "LET'S BUILD SOMETHING GREAT"}
                onChange={(e) => updateContact('sectionTag', e.target.value)}
              />
            </div>
            <div>
              <label className="admin-form-label">Contact Headline</label>
              <input
                type="text"
                className="admin-form-input"
                value={config.contact.headline}
                onChange={(e) => updateContact('headline', e.target.value)}
                placeholder="Get In Touch"
              />
            </div>
          </div>

          <div>
            <label className="admin-form-label">Contact Intro / Subheadline</label>
            <textarea
              className="admin-form-textarea"
              rows={3}
              value={config.contact.subheadline}
              onChange={(e) => updateContact('subheadline', e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label className="admin-form-label">Primary Email Destination</label>
              <input
                type="email"
                className="admin-form-input"
                value={config.contact.email}
                onChange={(e) => updateContact('email', e.target.value)}
              />
            </div>
            <div>
              <label className="admin-form-label">Primary Button Label</label>
              <input
                type="text"
                className="admin-form-input"
                value={config.contact.primaryCtaLabel || 'Send a Message'}
                onChange={(e) => updateContact('primaryCtaLabel', e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label className="admin-form-label">Resume / CV Download URL</label>
              <input
                type="text"
                className="admin-form-input"
                value={config.contact.secondaryCtaHref || brand.cvUrl || '/images/felopater-cv.pdf'}
                onChange={(e) => updateContact('secondaryCtaHref', e.target.value)}
              />
            </div>
            <div>
              <label className="admin-form-label">Resume Button Label</label>
              <input
                type="text"
                className="admin-form-input"
                value={config.contact.secondaryCtaLabel || 'View Resume'}
                onChange={(e) => updateContact('secondaryCtaLabel', e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <MediaField
              id="contact-portrait-url"
              label="Finale Portrait Image URL"
              value={config.contact.portraitImageUrl || '/images/felopater-portrait-thinking.jpg'}
              onChange={(val) => updateContact('portraitImageUrl', val)}
              placeholder="/images/felopater-portrait-thinking.jpg"
              folder="photos"
            />
            <div>
              <label className="admin-form-label">Gold Script Signature Text (Newline Separated)</label>
              <textarea
                className="admin-form-textarea"
                rows={4}
                value={config.contact.scriptBadgeText || 'Same\nPerson.\nStill\nBuilding.'}
                onChange={(e) => updateContact('scriptBadgeText', e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label className="admin-form-label">Footer Tagline</label>
              <input
                type="text"
                className="admin-form-input"
                value={config.contact.footerTagline}
                onChange={(e) => updateContact('footerTagline', e.target.value)}
              />
            </div>
            <div>
              <label className="admin-form-label">Copyright Notice</label>
              <input
                type="text"
                className="admin-form-input"
                value={config.contact.copyrightNotice || `© 2026 ${brand.name}. All rights reserved.`}
                onChange={(e) => updateContact('copyrightNotice', e.target.value)}
              />
            </div>
          </div>

          {/* Social Links Manager */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="admin-form-label" style={{ marginBottom: 0 }}>
                Social Channels ({config.contact.socialLinks?.length || 0})
              </label>
              <button type="button" onClick={addSocialLink} className="admin-btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}>
                <Plus size={12} /> Add Channel
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {config.contact.socialLinks?.map((link, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '0.35rem 0.65rem', borderRadius: '4px' }}>
                  <input
                    type="text"
                    className="admin-form-input"
                    style={{ width: '130px' }}
                    value={link.platform}
                    onChange={(e) => updateSocialLink(idx, 'platform', e.target.value)}
                    placeholder="Platform"
                  />
                  <input
                    type="text"
                    className="admin-form-input"
                    style={{ flex: 1 }}
                    value={link.url}
                    onChange={(e) => updateSocialLink(idx, 'url', e.target.value)}
                    placeholder="https://..."
                  />
                  <input
                    type="text"
                    className="admin-form-input"
                    style={{ width: '160px' }}
                    value={link.label}
                    onChange={(e) => updateSocialLink(idx, 'label', e.target.value)}
                    placeholder="Label / Username"
                  />
                  <button type="button" onClick={() => removeSocialLink(idx)} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          PANEL 4: BRAND IDENTITY
          ======================================================== */}
      {activeTab === 'brand' && (
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)', marginBottom: '0.35rem' }}>
              Central Brand Identity &amp; Global Parameters
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
              Centralized brand info model shared across the entire portfolio (Header, About, Footer, Contact, Resume).
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label className="admin-form-label">Brand Name</label>
              <input
                type="text"
                className="admin-form-input"
                value={brand.name}
                onChange={(e) => setBrand({ ...brand, name: e.target.value })}
              />
            </div>
            <div>
              <label className="admin-form-label">Developer Full Name</label>
              <input
                type="text"
                className="admin-form-input"
                value={brand.developerName}
                onChange={(e) => setBrand({ ...brand, developerName: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label className="admin-form-label">Role Title</label>
              <input
                type="text"
                className="admin-form-input"
                value={brand.role}
                onChange={(e) => setBrand({ ...brand, role: e.target.value })}
              />
            </div>
            <div>
              <label className="admin-form-label">Specialization Tag</label>
              <input
                type="text"
                className="admin-form-input"
                value={brand.specialization}
                onChange={(e) => setBrand({ ...brand, specialization: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label className="admin-form-label">Primary Email</label>
              <input
                type="email"
                className="admin-form-input"
                value={brand.email}
                onChange={(e) => setBrand({ ...brand, email: e.target.value })}
              />
            </div>
            <div>
              <label className="admin-form-label">Location</label>
              <input
                type="text"
                className="admin-form-input"
                value={brand.location}
                onChange={(e) => setBrand({ ...brand, location: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label className="admin-form-label">GitHub Profile URL</label>
              <input
                type="text"
                className="admin-form-input"
                value={brand.github}
                onChange={(e) => setBrand({ ...brand, github: e.target.value })}
              />
            </div>
            <div>
              <label className="admin-form-label">LinkedIn Profile URL</label>
              <input
                type="text"
                className="admin-form-input"
                value={brand.linkedin}
                onChange={(e) => setBrand({ ...brand, linkedin: e.target.value })}
              />
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleSaveBrand}
              disabled={isPending}
              className="btn-gold"
              style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
            >
              <Save size={14} />
              <span>{isPending ? 'Saving Brand...' : 'Save Brand Identity'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          PANEL: SKILLS GALAXY & ORBIT SLOTS
          ======================================================== */}
      {activeTab === 'skills' && (
        <SkillsStudioPanel
          initialTechnologies={initialTechnologies}
          initialOrbitSlotsDraft={initialOrbitSlotsDraft}
          initialOrbitSlotsPublished={initialOrbitSlotsPublished}
        />
      )}

      {/* ========================================================
          PANEL: DISCIPLINES MATRIX (EXPERTISE AREAS)
          ======================================================== */}
      {activeTab === 'expertise' && (
        <ExpertiseStudioPanel
          initialExpertiseAreas={initialExpertiseAreas}
        />
      )}
    </div>
  );
}
