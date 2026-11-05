'use client';

/**
 * PHILOZZ CMS — Projects Studio Interactive Management View
 * Phase 16D.1: Projects & Case Studies Full CRUD
 *
 * Provides real-time filtering, inline publishing/unpublishing,
 * soft deletion, restoration, archive reordering, and the atomic
 * 3-card homepage featured slots manager.
 */

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Plus,
  Star,
  ExternalLink,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  AlertCircle,
  FolderKanban,
  Sparkles,
} from 'lucide-react';
import type { ProjectEntity } from '@/cms/models/project';
import { StatusIndicator } from './StatusIndicator';
import {
  publishProjectAction,
  unpublishProjectAction,
  softDeleteProjectAction,
  restoreProjectAction,
  reorderProjectsAction,
  updateFeaturedSlotsAction,
} from '@/app/admin/projects/actions';

interface ProjectsStudioViewProps {
  initialProjects: ProjectEntity[];
  dataSource: 'local' | 'firestore';
}

type TabKey = 'all' | 'published' | 'draft' | 'trash';

export function ProjectsStudioView({
  initialProjects,
  dataSource,
}: ProjectsStudioViewProps) {
  const [projects, setProjects] = useState<ProjectEntity[]>(initialProjects);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Homepage 3-Slot Featured State
  const [showFeaturedManager, setShowFeaturedManager] = useState(false);
  const currentFeatured = [...projects]
    .filter((p) => p.featured && !p.isDeleted)
    .sort((a, b) => (a.featuredOrder || 1) - (b.featuredOrder || 1));

  const [slot1, setSlot1] = useState(currentFeatured[0]?.id || projects[0]?.id || '');
  const [slot2, setSlot2] = useState(currentFeatured[1]?.id || projects[1]?.id || '');
  const [slot3, setSlot3] = useState(currentFeatured[2]?.id || projects[2]?.id || '');

  // Tab filtering counts
  const publishedProjects = projects.filter((p) => p.status === 'published' && !p.isDeleted);
  const draftProjects = projects.filter((p) => p.status !== 'published' && !p.isDeleted);
  const trashProjects = projects.filter((p) => p.isDeleted);

  const displayedProjects = projects.filter((p) => {
    if (activeTab === 'trash') return p.isDeleted;
    if (p.isDeleted) return false;
    if (activeTab === 'published') return p.status === 'published';
    if (activeTab === 'draft') return p.status !== 'published';
    return true; // 'all'
  });

  // Action: Toggle Publish / Unpublish
  const handleTogglePublish = (p: ProjectEntity) => {
    setFeedback(null);
    startTransition(async () => {
      const isPublished = p.status === 'published';
      const res = isPublished
        ? await unpublishProjectAction(p.id)
        : await publishProjectAction(p.id);

      if (res.success && res.data) {
        setProjects((prev) =>
          prev.map((item) => (item.id === p.id ? { ...item, ...res.data } : item))
        );
        setFeedback({
          type: 'success',
          message: isPublished
            ? `Unpublished "${p.title}" (moved to draft).`
            : `Published "${p.title}" live!`,
        });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Operation failed.' });
      }
    });
  };

  // Action: Move to Trash (Soft Delete)
  const handleSoftDelete = (p: ProjectEntity) => {
    if (!confirm(`Are you sure you want to move "${p.title}" to Trash? It will be removed from public queries but can be restored at any time.`)) {
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      const res = await softDeleteProjectAction(p.id);
      if (res.success) {
        setProjects((prev) =>
          prev.map((item) =>
            item.id === p.id
              ? { ...item, isDeleted: true, deletedAt: new Date().toISOString() }
              : item
          )
        );
        setFeedback({
          type: 'success',
          message: `Moved "${p.title}" to Trash.`,
        });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to move to Trash.' });
      }
    });
  };

  // Action: Restore from Trash
  const handleRestore = (p: ProjectEntity) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await restoreProjectAction(p.id);
      if (res.success) {
        setProjects((prev) =>
          prev.map((item) =>
            item.id === p.id
              ? { ...item, isDeleted: false, deletedAt: undefined }
              : item
          )
        );
        setFeedback({
          type: 'success',
          message: `Restored "${p.title}" from Trash.`,
        });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to restore project.' });
      }
    });
  };

  // Action: Move Up / Down
  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= displayedProjects.length) return;

    const newOrder = [...displayedProjects];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    const orderedIds = newOrder.map((p) => p.id);

    setFeedback(null);
    startTransition(async () => {
      const res = await reorderProjectsAction(orderedIds);
      if (res.success) {
        setProjects((prev) => {
          const map = new Map(newOrder.map((p, idx) => [p.id, idx + 1]));
          return prev
            .map((item) => (map.has(item.id) ? { ...item, displayOrder: map.get(item.id)! } : item))
            .sort((a, b) => a.displayOrder - b.displayOrder);
        });
        setFeedback({ type: 'success', message: 'Project order saved.' });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to reorder projects.' });
      }
    });
  };

  // Action: Save Featured Slots
  const handleSaveFeaturedSlots = () => {
    if (slot1 === slot2 || slot1 === slot3 || slot2 === slot3) {
      setFeedback({
        type: 'error',
        message: 'Each of the 3 featured slots must contain a different published project.',
      });
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      const res = await updateFeaturedSlotsAction([slot1, slot2, slot3]);
      if (res.success) {
        setProjects((prev) =>
          prev.map((item) => {
            if (item.id === slot1) return { ...item, featured: true, featuredOrder: 1 };
            if (item.id === slot2) return { ...item, featured: true, featuredOrder: 2 };
            if (item.id === slot3) return { ...item, featured: true, featuredOrder: 3 };
            return { ...item, featured: false, featuredOrder: undefined };
          })
        );
        setShowFeaturedManager(false);
        setFeedback({
          type: 'success',
          message: 'Homepage 3-slot featured projects updated atomically!',
        });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to update featured slots.' });
      }
    });
  };

  return (
    <div>
      {/* Environment & Feedback Banners */}
      {dataSource === 'local' && (
        <div className="admin-notice-banner" style={{ borderColor: 'rgba(201, 164, 92, 0.4)' }}>
          <FolderKanban size={18} style={{ color: 'var(--color-gold)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: 'var(--color-ivory)' }}>Development Runtime: Local Repository Mode</strong>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
              In-memory mutations will update this session. For permanent Cloud Firestore persistence across server restarts,
              set <code style={{ color: 'var(--color-gold)' }}>CMS_DATA_SOURCE=&quot;firestore&quot;</code> in your environment.
            </p>
          </div>
        </div>
      )}

      {feedback && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            marginBottom: '1.25rem',
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

      {/* Header Actions & Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => setShowFeaturedManager(!showFeaturedManager)}
            aria-expanded={showFeaturedManager}
          >
            <Star size={16} />
            <span>Manage Homepage 3 Slots</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/admin/projects/new" className="admin-btn admin-btn-primary">
            <Plus size={16} />
            <span>Create New Project</span>
          </Link>
        </div>
      </div>

      {/* Collapsible 3-Card Homepage Featured Slot Manager */}
      {showFeaturedManager && (
        <div className="admin-card" style={{ border: '1px solid var(--color-gold)' }}>
          <div className="admin-card-header">
            <div>
              <h2 className="admin-card-title">
                <Sparkles size={18} style={{ color: 'var(--color-gold)' }} />
                <span>Homepage Featured Slots (Approved 3-Card Invariant)</span>
              </h2>
              <p className="admin-card-subtitle">
                The cinematic Skills-to-Projects transition connects precisely 3 cards on the homepage.
                All 3 slots must be assigned to unique published projects.
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.25rem',
              marginBottom: '1.25rem',
            }}
          >
            {/* Slot 1 */}
            <div className="admin-form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="featured-slot-1" className="admin-form-label">
                Slot #1 (Dominant Featured)
              </label>
              <select
                id="featured-slot-1"
                className="admin-form-select"
                value={slot1}
                onChange={(e) => setSlot1(e.target.value)}
              >
                {publishedProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Slot 2 */}
            <div className="admin-form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="featured-slot-2" className="admin-form-label">
                Slot #2 (Secondary Left)
              </label>
              <select
                id="featured-slot-2"
                className="admin-form-select"
                value={slot2}
                onChange={(e) => setSlot2(e.target.value)}
              >
                {publishedProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Slot 3 */}
            <div className="admin-form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="featured-slot-3" className="admin-form-label">
                Slot #3 (Secondary Right)
              </label>
              <select
                id="featured-slot-3"
                className="admin-form-select"
                value={slot3}
                onChange={(e) => setSlot3(e.target.value)}
              >
                {publishedProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="admin-btn admin-btn-ghost"
              onClick={() => setShowFeaturedManager(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={handleSaveFeaturedSlots}
              disabled={isPending}
            >
              {isPending ? 'Saving Slots...' : 'Apply Featured Slots'}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tab-bar" role="tablist" aria-label="Project Status Tabs">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'all'}
          className={`admin-tab-btn ${activeTab === 'all' ? 'admin-tab-btn-active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <span>All Active</span>
          <span style={{ opacity: 0.6 }}>({publishedProjects.length + draftProjects.length})</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'published'}
          className={`admin-tab-btn ${activeTab === 'published' ? 'admin-tab-btn-active' : ''}`}
          onClick={() => setActiveTab('published')}
        >
          <span>Published</span>
          <span style={{ color: '#34D399' }}>({publishedProjects.length})</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'draft'}
          className={`admin-tab-btn ${activeTab === 'draft' ? 'admin-tab-btn-active' : ''}`}
          onClick={() => setActiveTab('draft')}
        >
          <span>Drafts</span>
          <span style={{ opacity: 0.6 }}>({draftProjects.length})</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'trash'}
          className={`admin-tab-btn ${activeTab === 'trash' ? 'admin-tab-btn-active' : ''}`}
          onClick={() => setActiveTab('trash')}
        >
          <span>Trash</span>
          <span style={{ color: '#F87171' }}>({trashProjects.length})</span>
        </button>
      </div>

      {/* Projects Table */}
      <div className="admin-table-container">
        <table className="admin-table" aria-label="Projects Studio Inventory">
          <thead>
            <tr>
              <th scope="col" style={{ width: '70px' }}>Order</th>
              <th scope="col">Project Title & Role</th>
              <th scope="col">Slug</th>
              <th scope="col">Category</th>
              <th scope="col">Status</th>
              <th scope="col">Featured</th>
              <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedProjects.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-dim)' }}>
                  No projects found in this view.
                </td>
              </tr>
            ) : (
              displayedProjects.map((p, idx) => (
                <tr key={p.id}>
                  {/* Order & Reorder Controls */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '0.8rem',
                          color: 'var(--color-gold)',
                          fontWeight: 600,
                        }}
                      >
                        #{String(p.displayOrder).padStart(2, '0')}
                      </span>
                      {activeTab !== 'trash' && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <button
                            type="button"
                            onClick={() => handleMoveOrder(idx, 'up')}
                            disabled={idx === 0 || isPending}
                            title="Move Up"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-text-dim)',
                              cursor: idx === 0 ? 'not-allowed' : 'pointer',
                              padding: '1px',
                              opacity: idx === 0 ? 0.3 : 1,
                            }}
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveOrder(idx, 'down')}
                            disabled={idx === displayedProjects.length - 1 || isPending}
                            title="Move Down"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-text-dim)',
                              cursor: idx === displayedProjects.length - 1 ? 'not-allowed' : 'pointer',
                              padding: '1px',
                              opacity: idx === displayedProjects.length - 1 ? 0.3 : 1,
                            }}
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Title & Role */}
                  <td>
                    <div>
                      <div
                        style={{
                          fontSize: '0.92rem',
                          fontWeight: 600,
                          color: 'var(--color-ivory)',
                          marginBottom: '0.15rem',
                        }}
                      >
                        {p.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
                        {p.role} • {p.period}
                      </div>
                    </div>
                  </td>

                  {/* Slug */}
                  <td>
                    <span className="admin-slug-pill">/{p.slug}</span>
                  </td>

                  {/* Category */}
                  <td>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)' }}>
                      {p.categoryLabel || p.category}
                    </span>
                  </td>

                  {/* Status */}
                  <td>
                    {p.isDeleted ? (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: '#F87171',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                        }}
                      >
                        In Trash
                      </span>
                    ) : (
                      <StatusIndicator status={p.status} />
                    )}
                  </td>

                  {/* Featured */}
                  <td>
                    {p.featured && !p.isDeleted ? (
                      <StatusIndicator
                        status="featured"
                        label={`Featured #${p.featuredOrder || 1}`}
                        size="sm"
                      />
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        justifyContent: 'flex-end',
                      }}
                    >
                      {activeTab === 'trash' ? (
                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', minHeight: '32px' }}
                          onClick={() => handleRestore(p)}
                          disabled={isPending}
                          title="Restore project from Trash"
                        >
                          <RefreshCw size={13} />
                          <span>Restore</span>
                        </button>
                      ) : (
                        <>
                          {/* Private Preview */}
                          <Link
                            href={`/admin/projects/${p.id}/preview`}
                            className="admin-btn admin-btn-ghost"
                            style={{ padding: '0.35rem 0.55rem', minHeight: '32px' }}
                            title="Private Owner Preview"
                          >
                            <Eye size={14} />
                          </Link>

                          {/* Edit Form */}
                          <Link
                            href={`/admin/projects/${p.id}`}
                            className="admin-btn admin-btn-secondary"
                            style={{ padding: '0.35rem 0.55rem', minHeight: '32px' }}
                            title="Edit Project & Case Study"
                          >
                            <Edit size={14} />
                          </Link>

                          {/* Quick Toggle Publish */}
                          <button
                            type="button"
                            className="admin-btn admin-btn-ghost"
                            style={{
                              padding: '0.35rem 0.55rem',
                              minHeight: '32px',
                              color: p.status === 'published' ? '#34D399' : 'var(--color-text-dim)',
                            }}
                            onClick={() => handleTogglePublish(p)}
                            disabled={isPending}
                            title={p.status === 'published' ? 'Unpublish project' : 'Publish project live'}
                          >
                            <CheckCircle size={14} />
                          </button>

                          {/* Move to Trash */}
                          <button
                            type="button"
                            className="admin-btn admin-btn-danger"
                            style={{ padding: '0.35rem 0.55rem', minHeight: '32px' }}
                            onClick={() => handleSoftDelete(p)}
                            disabled={isPending}
                            title="Move project to Trash"
                          >
                            <Trash2 size={14} />
                          </button>

                          {/* Public Live View link if published */}
                          {p.status === 'published' && (
                            <Link
                              href={`/work/${p.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="admin-btn admin-btn-ghost"
                              style={{ padding: '0.35rem 0.55rem', minHeight: '32px' }}
                              title="Open public Case Study in new tab"
                            >
                              <ExternalLink size={14} />
                            </Link>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
