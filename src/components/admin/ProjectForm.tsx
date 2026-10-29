'use client';

/**
 * PHILOZZ CMS — Project & Case Study Studio Editor Form
 * Phase 16D.1: Projects & Case Studies Full CRUD
 *
 * Comprehensive owner editor for ProjectEntity models with dynamic nested
 * architecture nodes, technical decisions, responsibilities, and lessons learned.
 */

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  CheckCircle,
  AlertCircle,
  Eye,
  Plus,
  Trash2,
  Cpu,
  Layers,
  Code2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import type {
  ProjectEntity,
  ArchitectureNode,
  TechnicalDecision,
  DemoVisualType,
  ContentStatus,
  CreateProjectInput,
  UpdateProjectInput,
} from '@/cms/models/project';
import {
  createProjectAction,
  updateProjectAction,
  unpublishProjectAction,
  softDeleteProjectAction,
  restoreProjectAction,
} from '@/app/admin/projects/actions';
import { generateSlug } from '@/cms/validation/validators';
import { MediaField } from './MediaField';

interface ProjectFormProps {
  mode: 'create' | 'edit';
  initialProject?: ProjectEntity;
}

const VISUAL_TYPES: { value: DemoVisualType; label: string }[] = [
  { value: 'task-flow', label: 'Task Flow & Pipeline Execution' },
  { value: 'license-matrix', label: 'License Matrix & Governance' },
  { value: 'security-topology', label: 'Security Topology & Perimeter Guard' },
  { value: 'skillup-horizon', label: 'SkillUp Horizon & Distributed State' },
  { value: 'smartpos-hardware', label: 'SmartPOS Hardware & Edge Bus' },
  { value: 'tanqia-pipeline', label: 'Tanqia Pipeline & Ingestion Queue' },
];

const ARCHIVE_CATEGORIES = [
  { value: 'backend', label: 'Backend & High-Throughput APIs' },
  { value: 'systems', label: 'Systems & Infrastructure' },
  { value: 'fullstack', label: 'Full-Stack Modern Platforms' },
  { value: 'ai-data', label: 'AI, Data & Stream Processing' },
];

export function ProjectForm({ mode, initialProject }: ProjectFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Basic Details
  const [title, setTitle] = useState(initialProject?.title || '');
  const [slug, setSlug] = useState(initialProject?.slug || '');
  const [autoSlug, setAutoSlug] = useState(mode === 'create');
  const [tagline, setTagline] = useState(initialProject?.tagline || '');
  const [role, setRole] = useState(initialProject?.role || 'Lead Software Architect');
  const [period, setPeriod] = useState(initialProject?.period || '2024 — Present');
  const [clientOrContext, setClientOrContext] = useState(initialProject?.clientOrContext || 'Enterprise Production System');
  const [category, setCategory] = useState(initialProject?.category || 'backend');
  const [archiveCategory, setArchiveCategory] = useState(initialProject?.archiveCategory || 'backend');
  const [categoryLabel, setCategoryLabel] = useState(initialProject?.categoryLabel || 'Distributed Systems');
  const [status, setStatus] = useState<ContentStatus>(initialProject?.status || 'draft');

  // Links & Visualizer
  const [demoVisualType, setDemoVisualType] = useState<DemoVisualType>(initialProject?.demoVisualType || 'task-flow');
  const [hasLiveDemo, setHasLiveDemo] = useState(initialProject?.hasLiveDemo ?? false);
  const [demoUrl, setDemoUrl] = useState(initialProject?.demoUrl || '');
  const [githubUrl, setGithubUrl] = useState(initialProject?.githubUrl || '');

  // Narrative Text
  const [shortSummary, setShortSummary] = useState(initialProject?.shortSummary || '');
  const [summary, setSummary] = useState(initialProject?.summary || '');
  const [challenge, setChallenge] = useState(initialProject?.challenge || '');
  const [architectureSummary, setArchitectureSummary] = useState(initialProject?.architectureSummary || '');

  // Technologies (comma-separated inputs)
  const [techInput, setTechInput] = useState(initialProject?.technologies?.join(', ') || 'TypeScript, Node.js, PostgreSQL');
  const [primaryTechInput, setPrimaryTechInput] = useState(initialProject?.primaryTechs?.join(', ') || 'TypeScript, PostgreSQL');

  // Dynamic Nested Lists
  const [architectureNodes, setArchitectureNodes] = useState<ArchitectureNode[]>(
    initialProject?.architectureNodes?.length
      ? initialProject.architectureNodes
      : [
          {
            name: 'API Gateway & Rate Limiter',
            description: 'Envoy-based reverse proxy terminating TLS and enforcing token bucket rate limiting.',
            tech: 'Envoy / Go',
          },
        ]
  );

  const [technicalDecisions, setTechnicalDecisions] = useState<TechnicalDecision[]>(
    initialProject?.technicalDecisions?.length
      ? initialProject.technicalDecisions
      : [
          {
            title: 'Asynchronous Event Broker with Kafka',
            rationale: 'Decoupled high-write ingestion pipelines to guarantee sub-20ms response times.',
          },
        ]
  );

  const [responsibilities, setResponsibilities] = useState<string[]>(
    initialProject?.responsibilities?.length
      ? initialProject.responsibilities
      : [
          'Architected and delivered the distributed, high-throughput microservice backend.',
          'Formulated latency SLOs and implemented comprehensive Prometheus / OpenTelemetry telemetry.',
        ]
  );

  const [lessonsLearned, setLessonsLearned] = useState<string[]>(
    initialProject?.lessonsLearned?.length
      ? initialProject.lessonsLearned
      : [
          'Strict schema validation at service boundaries prevents cascading runtime deserialization failures.',
          'Database connection pooling tuning must happen under synthetic spike load testing before rollout.',
        ]
  );

  // Media & SEO
  const [thumbnailUrl, setThumbnailUrl] = useState(initialProject?.thumbnailUrl || '');
  const [ogImageUrl, setOgImageUrl] = useState(initialProject?.ogImageUrl || '');
  const [seoTitle, setSeoTitle] = useState(initialProject?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(initialProject?.seoDescription || '');

  // Feedback & Validation Errors
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isDeleted, setIsDeleted] = useState(Boolean(initialProject?.isDeleted));

  // Handler: Title change auto-updates slug if autoSlug is enabled
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (autoSlug && mode === 'create') {
      setSlug(generateSlug(val));
    }
  };

  // Dynamic Array Handlers: Architecture Nodes
  const addArchitectureNode = () => {
    setArchitectureNodes((prev) => [
      ...prev,
      { name: '', description: '', tech: '' },
    ]);
  };

  const updateArchitectureNode = (index: number, field: keyof ArchitectureNode, value: string) => {
    setArchitectureNodes((prev) =>
      prev.map((node, i) => (i === index ? { ...node, [field]: value } : node))
    );
  };

  const removeArchitectureNode = (index: number) => {
    if (architectureNodes.length <= 1) return;
    setArchitectureNodes((prev) => prev.filter((_, i) => i !== index));
  };

  // Dynamic Array Handlers: Technical Decisions
  const addTechnicalDecision = () => {
    setTechnicalDecisions((prev) => [
      ...prev,
      { title: '', rationale: '' },
    ]);
  };

  const updateTechnicalDecision = (index: number, field: keyof TechnicalDecision, value: string) => {
    setTechnicalDecisions((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const removeTechnicalDecision = (index: number) => {
    if (technicalDecisions.length <= 1) return;
    setTechnicalDecisions((prev) => prev.filter((_, i) => i !== index));
  };

  // Dynamic Array Handlers: Responsibilities
  const addResponsibility = () => {
    setResponsibilities((prev) => [...prev, '']);
  };

  const updateResponsibility = (index: number, value: string) => {
    setResponsibilities((prev) =>
      prev.map((item, i) => (i === index ? value : item))
    );
  };

  const removeResponsibility = (index: number) => {
    if (responsibilities.length <= 1) return;
    setResponsibilities((prev) => prev.filter((_, i) => i !== index));
  };

  // Dynamic Array Handlers: Lessons Learned
  const addLessonLearned = () => {
    setLessonsLearned((prev) => [...prev, '']);
  };

  const updateLessonLearned = (index: number, value: string) => {
    setLessonsLearned((prev) =>
      prev.map((item, i) => (i === index ? value : item))
    );
  };

  const removeLessonLearned = (index: number) => {
    if (lessonsLearned.length <= 1) return;
    setLessonsLearned((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = (targetStatus?: ContentStatus) => {
    setFeedback(null);
    setFieldErrors({});

    const chosenStatus = targetStatus || status;

    const parsedTechnologies = techInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const parsedPrimaryTechs = primaryTechInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const cleanNodes = architectureNodes.filter((n) => n.name.trim() || n.description.trim());
    const cleanDecisions = technicalDecisions.filter((d) => d.title.trim() || d.rationale.trim());
    const cleanResponsibilities = responsibilities.map((r) => r.trim()).filter(Boolean);
    const cleanLessons = lessonsLearned.map((l) => l.trim()).filter(Boolean);

    startTransition(async () => {
      if (mode === 'create') {
        const payload: CreateProjectInput = {
          title: title.trim(),
          slug: slug.trim(),
          tagline: tagline.trim(),
          role: role.trim(),
          period: period.trim(),
          clientOrContext: clientOrContext.trim(),
          category: category.trim(),
          archiveCategory: archiveCategory.trim(),
          categoryLabel: categoryLabel.trim(),
          status: chosenStatus,
          featured: false,
          displayOrder: 99,
          demoVisualType,
          hasLiveDemo,
          demoUrl: demoUrl.trim() || undefined,
          githubUrl: githubUrl.trim() || undefined,
          shortSummary: shortSummary.trim(),
          summary: summary.trim(),
          challenge: challenge.trim(),
          architectureSummary: architectureSummary.trim(),
          technologies: parsedTechnologies,
          primaryTechs: parsedPrimaryTechs,
          architectureNodes: cleanNodes,
          technicalDecisions: cleanDecisions,
          responsibilities: cleanResponsibilities,
          lessonsLearned: cleanLessons,
          thumbnailUrl: thumbnailUrl.trim() || undefined,
          ogImageUrl: ogImageUrl.trim() || undefined,
          seoTitle: seoTitle.trim() || undefined,
          seoDescription: seoDescription.trim() || undefined,
        };

        const res = await createProjectAction(payload);
        if (res.success && res.data) {
          setFeedback({
            type: 'success',
            message: `Successfully created project "${res.data.title}"! Redirecting to editor...`,
          });
          setTimeout(() => {
            router.push(`/admin/projects/${res.data!.id}`);
          }, 800);
        } else {
          setFeedback({
            type: 'error',
            message: res.error || 'Failed to create project.',
          });
          if (res.fieldErrors) {
            setFieldErrors(res.fieldErrors);
          }
        }
      } else if (mode === 'edit' && initialProject) {
        const patch: UpdateProjectInput = {
          title: title.trim(),
          tagline: tagline.trim(),
          role: role.trim(),
          period: period.trim(),
          clientOrContext: clientOrContext.trim(),
          category: category.trim(),
          archiveCategory: archiveCategory.trim(),
          categoryLabel: categoryLabel.trim(),
          status: chosenStatus,
          demoVisualType,
          hasLiveDemo,
          demoUrl: demoUrl.trim() || undefined,
          githubUrl: githubUrl.trim() || undefined,
          shortSummary: shortSummary.trim(),
          summary: summary.trim(),
          challenge: challenge.trim(),
          architectureSummary: architectureSummary.trim(),
          technologies: parsedTechnologies,
          primaryTechs: parsedPrimaryTechs,
          architectureNodes: cleanNodes,
          technicalDecisions: cleanDecisions,
          responsibilities: cleanResponsibilities,
          lessonsLearned: cleanLessons,
          thumbnailUrl: thumbnailUrl.trim() || undefined,
          ogImageUrl: ogImageUrl.trim() || undefined,
          seoTitle: seoTitle.trim() || undefined,
          seoDescription: seoDescription.trim() || undefined,
        };

        const res = await updateProjectAction(initialProject.id, patch);
        if (res.success && res.data) {
          setStatus(res.data.status);
          setFeedback({
            type: 'success',
            message: `Successfully saved changes for "${res.data.title}" at ${new Date().toLocaleTimeString()}!`,
          });
        } else {
          setFeedback({
            type: 'error',
            message: res.error || 'Failed to update project.',
          });
          if (res.fieldErrors) {
            setFieldErrors(res.fieldErrors);
          }
        }
      }
    });
  };

  // Quick Action: Unpublish
  const handleUnpublish = () => {
    if (!initialProject) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await unpublishProjectAction(initialProject.id);
      if (res.success && res.data) {
        setStatus('draft');
        setFeedback({ type: 'success', message: `Unpublished "${res.data.title}" (moved to draft).` });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to unpublish project.' });
      }
    });
  };

  // Quick Action: Soft Delete
  const handleSoftDelete = () => {
    if (!initialProject) return;
    if (!confirm(`Are you sure you want to move "${title}" to Trash?`)) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await softDeleteProjectAction(initialProject.id);
      if (res.success) {
        setIsDeleted(true);
        setFeedback({ type: 'success', message: `Moved "${title}" to Trash.` });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to move to Trash.' });
      }
    });
  };

  // Quick Action: Restore
  const handleRestore = () => {
    if (!initialProject) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await restoreProjectAction(initialProject.id);
      if (res.success) {
        setIsDeleted(false);
        setFeedback({ type: 'success', message: `Restored "${title}" from Trash.` });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to restore project.' });
      }
    });
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', paddingBottom: '4rem' }}>
      {/* Top Header & Sticky Navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(201, 164, 92, 0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Link
            href="/admin/projects"
            className="admin-btn admin-btn-ghost"
            style={{ padding: '0.45rem 0.75rem' }}
          >
            <ArrowLeft size={16} />
            <span>Projects Studio</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-ivory)', margin: 0 }}>
              {mode === 'create' ? 'Create New Project' : `Editing: ${title || 'Project'}`}
            </h1>
            {isDeleted && (
              <span
                style={{
                  fontSize: '0.72rem',
                  color: '#F87171',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                In Trash
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {mode === 'edit' && initialProject && (
            <>
              {/* Private Preview */}
              <Link
                href={`/admin/projects/${initialProject.id}/preview`}
                className="admin-btn admin-btn-secondary"
                title="View private owner-only preview"
              >
                <Eye size={15} />
                <span>Preview</span>
              </Link>

              {/* Public Live View if published */}
              {status === 'published' && !isDeleted && (
                <Link
                  href={`/work/${initialProject.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-btn admin-btn-ghost"
                  title="Open live public case study in new tab"
                >
                  <ExternalLink size={15} />
                  <span>Public View</span>
                </Link>
              )}

              {/* Trash / Restore */}
              {isDeleted ? (
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={handleRestore}
                  disabled={isPending}
                >
                  Restore from Trash
                </button>
              ) : (
                <button
                  type="button"
                  className="admin-btn admin-btn-danger"
                  onClick={handleSoftDelete}
                  disabled={isPending}
                >
                  <Trash2 size={15} />
                  <span>Move to Trash</span>
                </button>
              )}
            </>
          )}

          {/* Save / Publish Buttons */}
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => handleSubmit('draft')}
            disabled={isPending}
          >
            <Save size={15} />
            <span>Save as Draft</span>
          </button>

          {status === 'published' && mode === 'edit' ? (
            <button
              type="button"
              className="admin-btn admin-btn-ghost"
              onClick={handleUnpublish}
              disabled={isPending}
            >
              Unpublish
            </button>
          ) : (
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={() => handleSubmit('published')}
              disabled={isPending}
            >
              <CheckCircle size={15} />
              <span>{isPending ? 'Saving...' : 'Publish Live'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            backgroundColor:
              feedback.type === 'success'
                ? 'rgba(52, 211, 153, 0.12)'
                : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${
              feedback.type === 'success'
                ? 'rgba(52, 211, 153, 0.3)'
                : 'rgba(239, 68, 68, 0.3)'
            }`,
            color: feedback.type === 'success' ? '#34D399' : '#FCA5A5',
            fontSize: '0.88rem',
          }}
        >
          {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* SECTION 1: Basic Identity & Classification */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2 className="admin-card-title">
              <Layers size={18} style={{ color: 'var(--color-gold)' }} />
              <span>Identity & Classification</span>
            </h2>
            <p className="admin-card-subtitle">
              Fundamental identifiers, categories, and archive placement
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {/* Title */}
          <div className="admin-form-group">
            <label htmlFor="field-title" className="admin-form-label">
              Project Title <span className="required">*</span>
            </label>
            <input
              id="field-title"
              type="text"
              className="admin-form-input"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Distributed Task Orchestrator"
              required
            />
            {fieldErrors.title && <div className="admin-form-error">{fieldErrors.title}</div>}
          </div>

          {/* Slug */}
          <div className="admin-form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="field-slug" className="admin-form-label">
                URL Slug <span className="required">*</span>
              </label>
              {mode === 'create' && (
                <label style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <input
                    type="checkbox"
                    checked={autoSlug}
                    onChange={(e) => setAutoSlug(e.target.checked)}
                  />
                  <span>Auto-generate from Title</span>
                </label>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>/work/</span>
              <input
                id="field-slug"
                type="text"
                className="admin-form-input"
                value={slug}
                onChange={(e) => {
                  setAutoSlug(false);
                  setSlug(e.target.value);
                }}
                disabled={mode === 'edit'}
                placeholder="task-orchestrator"
                required
              />
            </div>
            {mode === 'edit' && (
              <p className="admin-form-help">
                URL slugs are immutable once published to preserve SEO integrity and backlinks.
              </p>
            )}
            {fieldErrors.slug && <div className="admin-form-error">{fieldErrors.slug}</div>}
          </div>
        </div>

        {/* Tagline */}
        <div className="admin-form-group">
          <label htmlFor="field-tagline" className="admin-form-label">
            Tagline <span className="required">*</span>
          </label>
          <input
            id="field-tagline"
            type="text"
            className="admin-form-input"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="e.g. High-concurrency event-driven pipeline orchestrating 10M+ daily jobs"
            required
          />
          {fieldErrors.tagline && <div className="admin-form-error">{fieldErrors.tagline}</div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          {/* Archive Category */}
          <div className="admin-form-group">
            <label htmlFor="field-archive-category" className="admin-form-label">
              Archive Category Filter <span className="required">*</span>
            </label>
            <select
              id="field-archive-category"
              className="admin-form-select"
              value={archiveCategory}
              onChange={(e) => setArchiveCategory(e.target.value)}
            >
              {ARCHIVE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category Label */}
          <div className="admin-form-group">
            <label htmlFor="field-category-label" className="admin-form-label">
              Category Pill Label <span className="required">*</span>
            </label>
            <input
              id="field-category-label"
              type="text"
              className="admin-form-input"
              value={categoryLabel}
              onChange={(e) => setCategoryLabel(e.target.value)}
              placeholder="e.g. Distributed Systems & Cloud"
              required
            />
          </div>

          {/* Internal Category */}
          <div className="admin-form-group">
            <label htmlFor="field-category" className="admin-form-label">
              Internal Category Slug <span className="required">*</span>
            </label>
            <input
              id="field-category"
              type="text"
              className="admin-form-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. systems"
              required
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: Role, Context & External Links */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2 className="admin-card-title">
              <Code2 size={18} style={{ color: 'var(--color-gold)' }} />
              <span>Context & External Links</span>
            </h2>
            <p className="admin-card-subtitle">
              Role authority, execution period, client context, and repository links
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {/* Role */}
          <div className="admin-form-group">
            <label htmlFor="field-role" className="admin-form-label">
              Your Engineering Role <span className="required">*</span>
            </label>
            <input
              id="field-role"
              type="text"
              className="admin-form-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Lead Backend Architect"
              required
            />
          </div>

          {/* Period */}
          <div className="admin-form-group">
            <label htmlFor="field-period" className="admin-form-label">
              Project Period / Timeline <span className="required">*</span>
            </label>
            <input
              id="field-period"
              type="text"
              className="admin-form-input"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="e.g. 2023 — 2024"
              required
            />
          </div>

          {/* Client / Context */}
          <div className="admin-form-group">
            <label htmlFor="field-client-context" className="admin-form-label">
              Client or System Context <span className="required">*</span>
            </label>
            <input
              id="field-client-context"
              type="text"
              className="admin-form-input"
              value={clientOrContext}
              onChange={(e) => setClientOrContext(e.target.value)}
              placeholder="e.g. Enterprise Fintech Platform"
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {/* Live Demo URL */}
          <div className="admin-form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="field-demo-url" className="admin-form-label">
                Live Production / Demo URL
              </label>
              <label style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <input
                  type="checkbox"
                  checked={hasLiveDemo}
                  onChange={(e) => setHasLiveDemo(e.target.checked)}
                />
                <span>Has Live Demo</span>
              </label>
            </div>
            <input
              id="field-demo-url"
              type="url"
              className="admin-form-input"
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
              placeholder="https://app.example.com"
            />
            {fieldErrors.demoUrl && <div className="admin-form-error">{fieldErrors.demoUrl}</div>}
          </div>

          {/* GitHub URL */}
          <div className="admin-form-group">
            <label htmlFor="field-github-url" className="admin-form-label">
              GitHub Repository URL
            </label>
            <input
              id="field-github-url"
              type="url"
              className="admin-form-input"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/philozz/repo"
            />
            {fieldErrors.githubUrl && <div className="admin-form-error">{fieldErrors.githubUrl}</div>}
          </div>
        </div>
      </div>

      {/* SECTION 3: Case Study Narrative */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2 className="admin-card-title">
              <Sparkles size={18} style={{ color: 'var(--color-gold)' }} />
              <span>Case Study Narrative</span>
            </h2>
            <p className="admin-card-subtitle">
              In-depth engineering story, core challenge, and architecture overview
            </p>
          </div>
        </div>

        {/* Short Summary */}
        <div className="admin-form-group">
          <label htmlFor="field-short-summary" className="admin-form-label">
            Short Summary (Archive Cards) <span className="required">*</span>
          </label>
          <textarea
            id="field-short-summary"
            className="admin-form-textarea"
            rows={2}
            value={shortSummary}
            onChange={(e) => setShortSummary(e.target.value)}
            placeholder="Concise 1-2 sentence overview shown on project archive cards..."
            required
          />
        </div>

        {/* Challenge */}
        <div className="admin-form-group">
          <label htmlFor="field-challenge" className="admin-form-label">
            The Engineering Challenge <span className="required">*</span>
          </label>
          <textarea
            id="field-challenge"
            className="admin-form-textarea"
            rows={4}
            value={challenge}
            onChange={(e) => setChallenge(e.target.value)}
            placeholder="Describe the architectural hurdles, concurrency bottlenecks, or latency constraints faced..."
            required
          />
          {fieldErrors.challenge && <div className="admin-form-error">{fieldErrors.challenge}</div>}
        </div>

        {/* Full Summary */}
        <div className="admin-form-group">
          <label htmlFor="field-summary" className="admin-form-label">
            Comprehensive Case Study Summary <span className="required">*</span>
          </label>
          <textarea
            id="field-summary"
            className="admin-form-textarea"
            rows={5}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Detailed narrative explaining how the solution was designed, implemented, and benchmarked..."
            required
          />
          {fieldErrors.summary && <div className="admin-form-error">{fieldErrors.summary}</div>}
        </div>

        {/* Architecture Summary */}
        <div className="admin-form-group">
          <label htmlFor="field-arch-summary" className="admin-form-label">
            System Architecture Summary <span className="required">*</span>
          </label>
          <textarea
            id="field-arch-summary"
            className="admin-form-textarea"
            rows={3}
            value={architectureSummary}
            onChange={(e) => setArchitectureSummary(e.target.value)}
            placeholder="High-level topology overview explaining message flows and data persistence layers..."
            required
          />
          {fieldErrors.architectureSummary && <div className="admin-form-error">{fieldErrors.architectureSummary}</div>}
        </div>
      </div>

      {/* SECTION 4: Architecture Visualizer & Dynamic Nodes */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2 className="admin-card-title">
              <Cpu size={18} style={{ color: 'var(--color-gold)' }} />
              <span>Architecture Nodes & Schematic Visualizer</span>
            </h2>
            <p className="admin-card-subtitle">
              Interactive runtime schematic visualizer and dynamic topology nodes
            </p>
          </div>
        </div>

        {/* Visualizer Type */}
        <div className="admin-form-group">
          <label htmlFor="field-visual-type" className="admin-form-label">
            Interactive Schematic Runtime Visualizer <span className="required">*</span>
          </label>
          <select
            id="field-visual-type"
            className="admin-form-select"
            value={demoVisualType}
            onChange={(e) => setDemoVisualType(e.target.value as DemoVisualType)}
          >
            {VISUAL_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <p className="admin-form-help">
            Selects the animated real-time canvas visualizer rendered in the case study header.
          </p>
        </div>

        {/* Repeatable Architecture Nodes */}
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-ivory)' }}>
              Architecture Topology Nodes ({architectureNodes.length})
            </span>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              onClick={addArchitectureNode}
            >
              <Plus size={14} />
              <span>Add Node</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {architectureNodes.map((node, idx) => (
              <div
                key={idx}
                style={{
                  padding: '1.25rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(10, 10, 13, 0.6)',
                  border: '1px solid rgba(201, 164, 92, 0.15)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--color-gold)' }}>
                    Node #{idx + 1}
                  </span>
                  {architectureNodes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArchitectureNode(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#F87171',
                        cursor: 'pointer',
                        padding: '0.2rem',
                      }}
                      title="Remove this architecture node"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label className="admin-form-label" style={{ fontSize: '0.75rem' }}>
                      Node Name
                    </label>
                    <input
                      type="text"
                      className="admin-form-input"
                      value={node.name}
                      onChange={(e) => updateArchitectureNode(idx, 'name', e.target.value)}
                      placeholder="e.g. Distributed Task Queue"
                    />
                  </div>
                  <div>
                    <label className="admin-form-label" style={{ fontSize: '0.75rem' }}>
                      Technology Stack
                    </label>
                    <input
                      type="text"
                      className="admin-form-input"
                      value={node.tech}
                      onChange={(e) => updateArchitectureNode(idx, 'tech', e.target.value)}
                      placeholder="e.g. Redis Streams / BullMQ"
                    />
                  </div>
                </div>

                <div>
                  <label className="admin-form-label" style={{ fontSize: '0.75rem' }}>
                    Node Function & Architecture Description
                  </label>
                  <textarea
                    className="admin-form-textarea"
                    rows={2}
                    value={node.description}
                    onChange={(e) => updateArchitectureNode(idx, 'description', e.target.value)}
                    placeholder="Describe how this node operates, handles concurrency, and interacts with peers..."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Repeatable Technical Decisions */}
        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-ivory)' }}>
              Technical Decisions & Tradeoffs ({technicalDecisions.length})
            </span>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              onClick={addTechnicalDecision}
            >
              <Plus size={14} />
              <span>Add Decision</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {technicalDecisions.map((dec, idx) => (
              <div
                key={idx}
                style={{
                  padding: '1.25rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(10, 10, 13, 0.6)',
                  border: '1px solid rgba(201, 164, 92, 0.15)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--color-gold)' }}>
                    Decision #{idx + 1}
                  </span>
                  {technicalDecisions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTechnicalDecision(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#F87171',
                        cursor: 'pointer',
                        padding: '0.2rem',
                      }}
                      title="Remove this technical decision"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <label className="admin-form-label" style={{ fontSize: '0.75rem' }}>
                    Decision Title
                  </label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={dec.title}
                    onChange={(e) => updateTechnicalDecision(idx, 'title', e.target.value)}
                    placeholder="e.g. Asynchronous Kafka vs Synchronous HTTP Webhooks"
                  />
                </div>

                <div>
                  <label className="admin-form-label" style={{ fontSize: '0.75rem' }}>
                    Architectural Rationale & Tradeoffs
                  </label>
                  <textarea
                    className="admin-form-textarea"
                    rows={2}
                    value={dec.rationale}
                    onChange={(e) => updateTechnicalDecision(idx, 'rationale', e.target.value)}
                    placeholder="Explain why this engineering tradeoff was selected over alternatives..."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 5: Technologies, Responsibilities & Lessons */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2 className="admin-card-title">
              <Code2 size={18} style={{ color: 'var(--color-gold)' }} />
              <span>Technologies, Responsibilities & Lessons</span>
            </h2>
            <p className="admin-card-subtitle">
              Tech stack pills, core delivery responsibilities, and post-mortem lessons
            </p>
          </div>
        </div>

        {/* Technologies input */}
        <div className="admin-form-group">
          <label htmlFor="field-technologies" className="admin-form-label">
            Technologies Used (Comma-separated) <span className="required">*</span>
          </label>
          <input
            id="field-technologies"
            type="text"
            className="admin-form-input"
            value={techInput}
            onChange={(e) => setTechInput(e.target.value)}
            placeholder="TypeScript, Next.js, PostgreSQL, Redis, Docker, GCP"
            required
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
            {techInput
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
              .map((t) => (
                <span key={t} className="admin-tag-pill">
                  {t}
                </span>
              ))}
          </div>
          {fieldErrors.technologies && <div className="admin-form-error">{fieldErrors.technologies}</div>}
        </div>

        {/* Primary Techs input */}
        <div className="admin-form-group">
          <label htmlFor="field-primary-techs" className="admin-form-label">
            Primary Tech Highlights (Top 3 for summary cards)
          </label>
          <input
            id="field-primary-techs"
            type="text"
            className="admin-form-input"
            value={primaryTechInput}
            onChange={(e) => setPrimaryTechInput(e.target.value)}
            placeholder="TypeScript, Node.js, PostgreSQL"
          />
        </div>

        {/* Dynamic Responsibilities */}
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-ivory)' }}>
              Core Responsibilities List ({responsibilities.length}) <span className="required">*</span>
            </span>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              onClick={addResponsibility}
            >
              <Plus size={14} />
              <span>Add Responsibility</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {responsibilities.map((resp, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <input
                  type="text"
                  className="admin-form-input"
                  value={resp}
                  onChange={(e) => updateResponsibility(idx, e.target.value)}
                  placeholder="e.g. Engineered database partitioning and indexing strategy..."
                />
                {responsibilities.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeResponsibility(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#F87171',
                      cursor: 'pointer',
                      padding: '0.4rem',
                    }}
                    title="Remove responsibility"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {fieldErrors.responsibilities && <div className="admin-form-error">{fieldErrors.responsibilities}</div>}
        </div>

        {/* Dynamic Lessons Learned */}
        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-ivory)' }}>
              Lessons Learned ({lessonsLearned.length})
            </span>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              onClick={addLessonLearned}
            >
              <Plus size={14} />
              <span>Add Lesson</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {lessonsLearned.map((lesson, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <input
                  type="text"
                  className="admin-form-input"
                  value={lesson}
                  onChange={(e) => updateLessonLearned(idx, e.target.value)}
                  placeholder="e.g. Canary deployments with automatic rollback prevented outages..."
                />
                {lessonsLearned.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLessonLearned(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#F87171',
                      cursor: 'pointer',
                      padding: '0.4rem',
                    }}
                    title="Remove lesson"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 6: Media & SEO Metadata */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2 className="admin-card-title">
              <Sparkles size={18} style={{ color: 'var(--color-gold)' }} />
              <span>Media & SEO Metadata</span>
            </h2>
            <p className="admin-card-subtitle">
              Cover imagery paths and search engine meta configuration
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {/* Thumbnail URL with Media Library Picker */}
          <MediaField
            id="field-thumbnail-url"
            label="Thumbnail Image Path / URL"
            value={thumbnailUrl}
            onChange={setThumbnailUrl}
            placeholder="/images/projects/orchestrator-thumb.png"
            folder="projects"
          />

          {/* OG Image URL with Media Library Picker */}
          <MediaField
            id="field-og-url"
            label="OpenGraph Card Image Path / URL"
            value={ogImageUrl}
            onChange={setOgImageUrl}
            placeholder="/images/projects/orchestrator-og.png"
            folder="projects"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {/* SEO Title */}
          <div className="admin-form-group">
            <label htmlFor="field-seo-title" className="admin-form-label">
              Custom SEO Meta Title (Optional)
            </label>
            <input
              id="field-seo-title"
              type="text"
              className="admin-form-input"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="Defaults to: Title — Case Study // PHILOZZ"
            />
          </div>

          {/* SEO Description */}
          <div className="admin-form-group">
            <label htmlFor="field-seo-desc" className="admin-form-label">
              Custom SEO Meta Description (Optional)
            </label>
            <input
              id="field-seo-desc"
              type="text"
              className="admin-form-input"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Defaults to project summary"
            />
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '0.85rem',
          padding: '1.25rem 1.5rem',
          borderRadius: '12px',
          backgroundColor: 'var(--color-charcoal-card)',
          border: '1px solid var(--color-gold-border)',
        }}
      >
        <Link href="/admin/projects" className="admin-btn admin-btn-ghost">
          Cancel & Back
        </Link>
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={() => handleSubmit('draft')}
          disabled={isPending}
        >
          <Save size={15} />
          <span>Save Draft</span>
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={() => handleSubmit('published')}
          disabled={isPending}
        >
          <CheckCircle size={15} />
          <span>{isPending ? 'Saving...' : mode === 'create' ? 'Create & Publish Live' : 'Save & Publish Live'}</span>
        </button>
      </div>
    </div>
  );
}
