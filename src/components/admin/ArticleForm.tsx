'use client';

/**
 * PHILOZZ CMS — Article & Technical Writeup Studio Editor Form
 * Phase 16D.2: Blog & Technical Writeups Full CRUD
 *
 * Comprehensive technical content editor for ArticleEntity models featuring
 * structured section management, code snippet blocks with language tagging,
 * automated read-time calculation, category assignment, and optimistic concurrency.
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
  Code2,
  Layers,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  Sparkles,
  FileCode,
} from 'lucide-react';
import type {
  ArticleEntity,
  ArticleSection,
  BlogCategoryEntity,
  CreateArticleInput,
  UpdateArticleInput,
} from '@/cms/models/article';
import { ContentStatus } from '@/cms/models/project';
import {
  createArticleAction,
  updateArticleAction,
  unpublishArticleAction,
  softDeleteArticleAction,
  restoreArticleAction,
} from '@/app/admin/articles/actions';
import { generateSlug, calculateReadTime } from '@/cms/validation/validators';

interface ArticleFormProps {
  mode: 'create' | 'edit';
  initialArticle?: ArticleEntity;
  categories: BlogCategoryEntity[];
}

const PROGRAMMING_LANGUAGES = [
  { value: 'typescript', label: 'TypeScript' },
  { value: 'php', label: 'PHP' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash / Shell' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'docker', label: 'Dockerfile' },
  { value: 'yaml', label: 'YAML' },
  { value: 'json', label: 'JSON' },
  { value: 'plaintext', label: 'Plain Text' },
];

export function ArticleForm({
  mode,
  initialArticle,
  categories,
}: ArticleFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Basic Information
  const [title, setTitle] = useState(initialArticle?.title || '');
  const [slug, setSlug] = useState(initialArticle?.slug || '');
  const [autoSlug, setAutoSlug] = useState(mode === 'create');
  const [abstract, setAbstract] = useState(initialArticle?.abstract || '');
  const [category, setCategory] = useState(
    initialArticle?.category || (categories[0]?.label || 'Backend')
  );
  const [archiveCategory, setArchiveCategory] = useState(
    initialArticle?.archiveCategory || (categories[0]?.id || 'backend')
  );
  const [tagsInput, setTagsInput] = useState(
    initialArticle?.tags?.join(', ') || 'Architecture, Backend, Performance'
  );
  const [status, setStatus] = useState<ContentStatus>(initialArticle?.status || 'draft');

  // Media & SEO
  const [coverImageUrl, setCoverImageUrl] = useState(initialArticle?.coverImageUrl || '');
  const [ogImageUrl, setOgImageUrl] = useState(initialArticle?.ogImageUrl || '');
  const [seoTitle, setSeoTitle] = useState(initialArticle?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(initialArticle?.seoDescription || '');

  // Dynamic Repeatable Sections
  const [sections, setSections] = useState<ArticleSection[]>(
    initialArticle?.sections?.length
      ? initialArticle.sections
      : [
          {
            heading: '1. Architectural Overview & Context',
            content:
              'In high-throughput distributed systems, understanding transaction boundaries is paramount to maintaining consistency without sacrificing latency.',
            codeSnippet: '// Example architecture contract\ninterface ServiceBridge {\n  dispatch(payload: Record<string, unknown>): Promise<void>;\n}',
            codeLang: 'typescript',
          },
        ]
  );

  // Calculated Read Time
  const currentReadTime = calculateReadTime(sections);

  // Form State & Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isDeleted, setIsDeleted] = useState(Boolean(initialArticle?.isDeleted));

  // Handler: Title change auto-updates slug if autoSlug enabled
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (autoSlug && mode === 'create') {
      setSlug(generateSlug(val));
    }
  };

  // Handler: Category select syncs label and archiveCategory
  const handleCategorySelect = (catId: string) => {
    const found = categories.find((c) => c.id === catId);
    if (found) {
      setCategory(found.label);
      setArchiveCategory(found.id);
    }
  };

  // Dynamic Section Handlers
  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        heading: `Section ${prev.length + 1}`,
        content: '',
        codeSnippet: '',
        codeLang: 'typescript',
      },
    ]);
  };

  const updateSection = (index: number, field: keyof ArticleSection, value: string) => {
    setSections((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, [field]: value } : s))
    );
  };

  const removeSection = (index: number) => {
    if (sections.length <= 1) return;
    setSections((prev) => prev.filter((_, idx) => idx !== index));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= sections.length) return;
    const reordered = [...sections];
    const temp = reordered[index];
    reordered[index] = reordered[target];
    reordered[target] = temp;
    setSections(reordered);
  };

  // Submit Handler
  const handleSubmit = (targetStatus?: ContentStatus) => {
    setFeedback(null);
    setFieldErrors({});

    const chosenStatus = targetStatus || status;

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const cleanSections = sections.filter((s) => s.heading.trim() || s.content.trim());

    startTransition(async () => {
      if (mode === 'create') {
        const payload: CreateArticleInput = {
          title: title.trim(),
          slug: slug.trim(),
          category: category.trim(),
          archiveCategory: archiveCategory.trim(),
          readTime: currentReadTime,
          date: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          tags: parsedTags,
          abstract: abstract.trim(),
          sections: cleanSections,
          status: chosenStatus,
          featured: false,
          displayOrder: 99,
          coverImageUrl: coverImageUrl.trim() || undefined,
          ogImageUrl: ogImageUrl.trim() || undefined,
          seoTitle: seoTitle.trim() || undefined,
          seoDescription: seoDescription.trim() || undefined,
        };

        const res = await createArticleAction(payload);
        if (res.success && res.data) {
          setFeedback({
            type: 'success',
            message: `Successfully created article "${res.data.title}"! Redirecting to editor...`,
          });
          setTimeout(() => {
            router.push(`/admin/articles/${res.data!.id}`);
          }, 800);
        } else {
          setFeedback({
            type: 'error',
            message: res.error || 'Failed to create article.',
          });
          if (res.fieldErrors) {
            setFieldErrors(res.fieldErrors);
          }
        }
      } else if (mode === 'edit' && initialArticle) {
        const patch: UpdateArticleInput = {
          title: title.trim(),
          category: category.trim(),
          archiveCategory: archiveCategory.trim(),
          readTime: currentReadTime,
          tags: parsedTags,
          abstract: abstract.trim(),
          sections: cleanSections,
          status: chosenStatus,
          coverImageUrl: coverImageUrl.trim() || undefined,
          ogImageUrl: ogImageUrl.trim() || undefined,
          seoTitle: seoTitle.trim() || undefined,
          seoDescription: seoDescription.trim() || undefined,
        };

        const res = await updateArticleAction(
          initialArticle.id,
          patch,
          initialArticle.updatedAt // Optimistic concurrency check
        );

        if (res.success && res.data) {
          setStatus(res.data.status);
          setFeedback({
            type: 'success',
            message: `Successfully saved changes for "${res.data.title}" at ${new Date().toLocaleTimeString()}!`,
          });
        } else {
          setFeedback({
            type: 'error',
            message: res.error || 'Failed to update article.',
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
    if (!initialArticle) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await unpublishArticleAction(initialArticle.id);
      if (res.success && res.data) {
        setStatus('draft');
        setFeedback({ type: 'success', message: `Unpublished "${res.data.title}" (moved to draft).` });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to unpublish article.' });
      }
    });
  };

  // Quick Action: Soft Delete
  const handleSoftDelete = () => {
    if (!initialArticle) return;
    if (!confirm(`Are you sure you want to move "${title}" to Trash?`)) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await softDeleteArticleAction(initialArticle.id);
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
    if (!initialArticle) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await restoreArticleAction(initialArticle.id);
      if (res.success) {
        setIsDeleted(false);
        setFeedback({ type: 'success', message: `Restored "${title}" from Trash.` });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to restore article.' });
      }
    });
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', paddingBottom: '4rem' }}>
      {/* Top Header & Navigation */}
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
            href="/admin/articles"
            className="admin-btn admin-btn-ghost"
            style={{ padding: '0.45rem 0.75rem' }}
          >
            <ArrowLeft size={16} />
            <span>Articles Studio</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-ivory)', margin: 0 }}>
              {mode === 'create' ? 'Write New Article' : `Editing: ${title || 'Article'}`}
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
          {mode === 'edit' && initialArticle && (
            <>
              {/* Private Preview */}
              <Link
                href={`/admin/articles/${initialArticle.id}/preview`}
                className="admin-btn admin-btn-secondary"
                title="View private owner-only preview"
              >
                <Eye size={15} />
                <span>Preview</span>
              </Link>

              {/* Public Live View if published */}
              {status === 'published' && !isDeleted && (
                <Link
                  href={`/notes/${initialArticle.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-btn admin-btn-ghost"
                  title="Open live public article in new tab"
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
            <span>Save Draft</span>
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

      {/* SECTION 1: Identity & Meta Details */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2 className="admin-card-title">
              <Layers size={18} style={{ color: 'var(--color-gold)' }} />
              <span>Article Identity & Categorization</span>
            </h2>
            <p className="admin-card-subtitle">
              Article title, URL slug, category assignment, and excerpt
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {/* Title */}
          <div className="admin-form-group">
            <label htmlFor="article-title" className="admin-form-label">
              Article Title <span className="required">*</span>
            </label>
            <input
              id="article-title"
              type="text"
              className="admin-form-input"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Building High-Throughput Event Streams in Go"
              required
            />
            {fieldErrors.title && <div className="admin-form-error">{fieldErrors.title}</div>}
          </div>

          {/* Slug */}
          <div className="admin-form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="article-slug" className="admin-form-label">
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
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>/notes/</span>
              <input
                id="article-slug"
                type="text"
                className="admin-form-input"
                value={slug}
                onChange={(e) => {
                  setAutoSlug(false);
                  setSlug(e.target.value);
                }}
                disabled={mode === 'edit'}
                placeholder="event-streams-go"
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

        {/* Abstract / Excerpt */}
        <div className="admin-form-group">
          <label htmlFor="article-abstract" className="admin-form-label">
            Abstract / Excerpt (10 - 500 characters) <span className="required">*</span>
          </label>
          <textarea
            id="article-abstract"
            className="admin-form-textarea"
            rows={3}
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
            placeholder="A technical synopsis explaining the core architectural challenge and engineering takeaways..."
            required
          />
          {fieldErrors.abstract && <div className="admin-form-error">{fieldErrors.abstract}</div>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {/* Category Dropdown */}
          <div className="admin-form-group">
            <label htmlFor="article-cat-select" className="admin-form-label">
              Taxonomy Category <span className="required">*</span>
            </label>
            <select
              id="article-cat-select"
              className="admin-form-select"
              value={archiveCategory}
              onChange={(e) => handleCategorySelect(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label} ({c.id})
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="admin-form-group">
            <label htmlFor="article-tags" className="admin-form-label">
              Tags (Comma-separated)
            </label>
            <input
              id="article-tags"
              type="text"
              className="admin-form-input"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Architecture, Go, Kafka, Concurrency"
            />
          </div>

          {/* Reading Time */}
          <div className="admin-form-group">
            <label htmlFor="article-read-time" className="admin-form-label">
              Calculated Reading Time
            </label>
            <input
              id="article-read-time"
              type="text"
              className="admin-form-input"
              value={currentReadTime}
              readOnly
              style={{ opacity: 0.8 }}
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: Technical Article Sections & Code Blocks */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2 className="admin-card-title">
              <Code2 size={18} style={{ color: 'var(--color-gold)' }} />
              <span>Structured Technical Sections ({sections.length})</span>
            </h2>
            <p className="admin-card-subtitle">
              Draft modular headings, narrative paragraphs, and syntax-tagged code snippets
            </p>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={addSection}
          >
            <Plus size={14} />
            <span>Add Section</span>
          </button>
        </div>

        {fieldErrors.sections && (
          <div className="admin-form-error" style={{ marginBottom: '1rem' }}>
            {fieldErrors.sections}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {sections.map((section, idx) => (
            <div
              key={idx}
              style={{
                padding: '1.35rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(10, 10, 13, 0.7)',
                border: '1px solid rgba(201, 164, 92, 0.2)',
              }}
            >
              {/* Section Header Controls */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                  paddingBottom: '0.65rem',
                  borderBottom: '1px solid rgba(201, 164, 92, 0.1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '0.85rem',
                      color: 'var(--color-gold)',
                      fontWeight: 600,
                    }}
                  >
                    Section #{idx + 1}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={() => moveSection(idx, 'up')}
                    disabled={idx === 0}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-dim)',
                      cursor: idx === 0 ? 'not-allowed' : 'pointer',
                      padding: '0.25rem',
                      opacity: idx === 0 ? 0.3 : 1,
                    }}
                    title="Move section up"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(idx, 'down')}
                    disabled={idx === sections.length - 1}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-dim)',
                      cursor: idx === sections.length - 1 ? 'not-allowed' : 'pointer',
                      padding: '0.25rem',
                      opacity: idx === sections.length - 1 ? 0.3 : 1,
                    }}
                    title="Move section down"
                  >
                    <ArrowDown size={14} />
                  </button>
                  {sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSection(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#F87171',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        marginLeft: '0.5rem',
                      }}
                      title="Remove section"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Section Heading */}
              <div className="admin-form-group">
                <label className="admin-form-label" style={{ fontSize: '0.78rem' }}>
                  Section Heading <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={section.heading}
                  onChange={(e) => updateSection(idx, 'heading', e.target.value)}
                  placeholder="e.g. 1. The Concurrency Dilemma in Microservices"
                  required
                />
              </div>

              {/* Section Content */}
              <div className="admin-form-group">
                <label className="admin-form-label" style={{ fontSize: '0.78rem' }}>
                  Section Paragraph Content <span className="required">*</span>
                </label>
                <textarea
                  className="admin-form-textarea"
                  rows={4}
                  value={section.content}
                  onChange={(e) => updateSection(idx, 'content', e.target.value)}
                  placeholder="Write clear, authoritative engineering explanations..."
                  required
                />
              </div>

              {/* Optional Code Snippet & Language Selector */}
              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px dashed rgba(201, 164, 92, 0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--color-gold-light)', fontWeight: 600 }}>
                    <FileCode size={14} />
                    <span>Technical Code Block (Optional)</span>
                  </div>
                  <select
                    className="admin-form-select"
                    value={section.codeLang || 'typescript'}
                    onChange={(e) => updateSection(idx, 'codeLang', e.target.value)}
                    style={{ width: '150px', fontSize: '0.75rem', height: '30px', padding: '0.1rem 1.6rem 0.1rem 0.5rem' }}
                  >
                    {PROGRAMMING_LANGUAGES.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>

                <textarea
                  className="admin-form-textarea"
                  rows={4}
                  value={section.codeSnippet || ''}
                  onChange={(e) => updateSection(idx, 'codeSnippet', e.target.value)}
                  placeholder="// Paste or write production code snippet here..."
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.82rem',
                    backgroundColor: 'rgba(5, 5, 8, 0.9)',
                    borderColor: 'rgba(201, 164, 92, 0.2)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: Media & SEO Configuration */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2 className="admin-card-title">
              <Sparkles size={18} style={{ color: 'var(--color-gold)' }} />
              <span>Media & Search Engine Optimization</span>
            </h2>
            <p className="admin-card-subtitle">
              Cover imagery paths and search engine meta configuration
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {/* Cover Image URL */}
          <div className="admin-form-group">
            <label htmlFor="article-cover" className="admin-form-label">
              Cover Image Reference Path / URL
            </label>
            <input
              id="article-cover"
              type="text"
              className="admin-form-input"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="/images/blog/cover-streams.jpg"
            />
          </div>

          {/* OG Image URL */}
          <div className="admin-form-group">
            <label htmlFor="article-og" className="admin-form-label">
              OpenGraph Card Image Path / URL
            </label>
            <input
              id="article-og"
              type="text"
              className="admin-form-input"
              value={ogImageUrl}
              onChange={(e) => setOgImageUrl(e.target.value)}
              placeholder="/images/blog/og-streams.png"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {/* SEO Title */}
          <div className="admin-form-group">
            <label htmlFor="article-seo-title" className="admin-form-label">
              Custom SEO Meta Title (Optional)
            </label>
            <input
              id="article-seo-title"
              type="text"
              className="admin-form-input"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="Defaults to: Title // PHILOZZ"
            />
          </div>

          {/* SEO Description */}
          <div className="admin-form-group">
            <label htmlFor="article-seo-desc" className="admin-form-label">
              Custom SEO Meta Description (Optional)
            </label>
            <input
              id="article-seo-desc"
              type="text"
              className="admin-form-input"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Defaults to article abstract"
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
        <Link href="/admin/articles" className="admin-btn admin-btn-ghost">
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
