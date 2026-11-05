'use client';

/**
 * PHILOZZ CMS — Articles & Engineering Journal Studio Interactive View
 * Phase 16D.2: Blog & Technical Writeups Full CRUD
 *
 * Real-time tab filtering, search, category filtering, inline publishing,
 * soft deletion, restoration, archive reordering, Homepage 4-article
 * journal manager, and taxonomy category management.
 */

import React, { useState, useTransition, useMemo } from 'react';
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
  FileText,
  Sparkles,
  Search,
  FolderTree,
  X,
} from 'lucide-react';
import type { ArticleEntity, BlogCategoryEntity } from '@/cms/models/article';
import { StatusIndicator } from './StatusIndicator';
import {
  publishArticleAction,
  unpublishArticleAction,
  softDeleteArticleAction,
  restoreArticleAction,
  reorderArticlesAction,
  updateHomepageJournalSlotsAction,
  createCategoryAction,
  deleteCategoryAction,
} from '@/app/admin/articles/actions';

interface ArticlesStudioViewProps {
  initialArticles: ArticleEntity[];
  initialCategories: BlogCategoryEntity[];
  dataSource: 'local' | 'firestore';
}

type TabKey = 'all' | 'published' | 'draft' | 'trash';

export function ArticlesStudioView({
  initialArticles,
  initialCategories,
  dataSource,
}: ArticlesStudioViewProps) {
  const [articles, setArticles] = useState<ArticleEntity[]>(initialArticles);
  const [categories, setCategories] = useState<BlogCategoryEntity[]>(initialCategories);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Homepage 4-Slot Journal Manager State
  const [showFeaturedManager, setShowFeaturedManager] = useState(false);
  const currentFeatured = [...articles]
    .filter((a) => a.featured && !a.isDeleted)
    .sort((a, b) => (a.featuredOrder || 1) - (b.featuredOrder || 1));

  const publishedArticles = articles.filter((a) => a.status === 'published' && !a.isDeleted);
  const draftArticles = articles.filter((a) => a.status !== 'published' && !a.isDeleted);
  const trashArticles = articles.filter((a) => a.isDeleted);

  const [slot1, setSlot1] = useState(currentFeatured[0]?.id || publishedArticles[0]?.id || '');
  const [slot2, setSlot2] = useState(currentFeatured[1]?.id || publishedArticles[1]?.id || '');
  const [slot3, setSlot3] = useState(currentFeatured[2]?.id || publishedArticles[2]?.id || '');
  const [slot4, setSlot4] = useState(currentFeatured[3]?.id || publishedArticles[3]?.id || '');

  // Category Manager State
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCatId, setNewCatId] = useState('');
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Tab & Search Filtering
  const displayedArticles = useMemo(() => {
    return articles.filter((a) => {
      // Tab filter
      if (activeTab === 'trash') {
        if (!a.isDeleted) return false;
      } else {
        if (a.isDeleted) return false;
        if (activeTab === 'published' && a.status !== 'published') return false;
        if (activeTab === 'draft' && a.status === 'published') return false;
      }

      // Category filter
      if (selectedCategory !== 'all') {
        const matchCat =
          a.category.toLowerCase() === selectedCategory.toLowerCase() ||
          a.archiveCategory === selectedCategory;
        if (!matchCat) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          a.title.toLowerCase().includes(q) ||
          a.abstract.toLowerCase().includes(q) ||
          a.slug.toLowerCase().includes(q) ||
          (a.tags && a.tags.some((t) => t.toLowerCase().includes(q)));
        if (!match) return false;
      }

      return true;
    });
  }, [articles, activeTab, selectedCategory, searchQuery]);

  // Action: Toggle Publish / Unpublish
  const handleTogglePublish = (a: ArticleEntity) => {
    setFeedback(null);
    startTransition(async () => {
      const isPublished = a.status === 'published';
      const res = isPublished
        ? await unpublishArticleAction(a.id)
        : await publishArticleAction(a.id);

      if (res.success && res.data) {
        setArticles((prev) =>
          prev.map((item) => (item.id === a.id ? { ...item, ...res.data } : item))
        );
        setFeedback({
          type: 'success',
          message: isPublished
            ? `Unpublished "${a.title}" (moved to draft).`
            : `Published "${a.title}" live!`,
        });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Operation failed.' });
      }
    });
  };

  // Action: Move to Trash (Soft Delete)
  const handleSoftDelete = (a: ArticleEntity) => {
    if (
      !confirm(
        `Are you sure you want to move "${a.title}" to Trash? It will be removed from public queries but can be restored at any time.`
      )
    ) {
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      const res = await softDeleteArticleAction(a.id);
      if (res.success) {
        setArticles((prev) =>
          prev.map((item) =>
            item.id === a.id
              ? { ...item, isDeleted: true, deletedAt: new Date().toISOString() }
              : item
          )
        );
        setFeedback({
          type: 'success',
          message: `Moved "${a.title}" to Trash.`,
        });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to move to Trash.' });
      }
    });
  };

  // Action: Restore from Trash
  const handleRestore = (a: ArticleEntity) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await restoreArticleAction(a.id);
      if (res.success) {
        setArticles((prev) =>
          prev.map((item) =>
            item.id === a.id
              ? { ...item, isDeleted: false, deletedAt: undefined }
              : item
          )
        );
        setFeedback({
          type: 'success',
          message: `Restored "${a.title}" from Trash.`,
        });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to restore article.' });
      }
    });
  };

  // Action: Move Up / Down Reordering
  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= displayedArticles.length) return;

    const newOrder = [...displayedArticles];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    const orderedIds = newOrder.map((a) => a.id);

    setFeedback(null);
    startTransition(async () => {
      const res = await reorderArticlesAction(orderedIds);
      if (res.success) {
        setArticles((prev) => {
          const map = new Map(newOrder.map((a, idx) => [a.id, idx + 1]));
          return prev
            .map((item) => (map.has(item.id) ? { ...item, displayOrder: map.get(item.id)! } : item))
            .sort((a, b) => a.displayOrder - b.displayOrder);
        });
        setFeedback({ type: 'success', message: 'Article order saved.' });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to reorder articles.' });
      }
    });
  };

  // Action: Save Homepage Journal 4 Slots
  const handleSaveJournalSlots = () => {
    const slots: [string, string, string, string] = [slot1, slot2, slot3, slot4];
    const unique = new Set(slots);
    if (unique.size !== 4) {
      setFeedback({
        type: 'error',
        message: 'Each of the 4 journal slots must contain a different published article.',
      });
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      const res = await updateHomepageJournalSlotsAction(slots);
      if (res.success) {
        setArticles((prev) =>
          prev.map((item) => {
            if (item.id === slot1) return { ...item, featured: true, featuredOrder: 1 };
            if (item.id === slot2) return { ...item, featured: true, featuredOrder: 2 };
            if (item.id === slot3) return { ...item, featured: true, featuredOrder: 3 };
            if (item.id === slot4) return { ...item, featured: true, featuredOrder: 4 };
            return { ...item, featured: false, featuredOrder: undefined };
          })
        );
        setShowFeaturedManager(false);
        setFeedback({
          type: 'success',
          message: 'Homepage 4-slot Engineering Journal updated atomically!',
        });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to update journal slots.' });
      }
    });
  };

  // Action: Create Category
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatId.trim() || !newCatLabel.trim()) return;

    setFeedback(null);
    startTransition(async () => {
      const res = await createCategoryAction({
        id: newCatId.trim(),
        label: newCatLabel.trim(),
        displayOrder: categories.length + 1,
        description: newCatDesc.trim() || undefined,
      });

      if (res.success && res.data) {
        setCategories((prev) => [...prev, res.data!]);
        setNewCatId('');
        setNewCatLabel('');
        setNewCatDesc('');
        setFeedback({
          type: 'success',
          message: `Category "${res.data.label}" created successfully.`,
        });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to create category.' });
      }
    });
  };

  // Action: Delete Category
  const handleDeleteCategory = (cat: BlogCategoryEntity) => {
    if (!confirm(`Are you sure you want to delete category "${cat.label}"?`)) return;

    setFeedback(null);
    startTransition(async () => {
      const res = await deleteCategoryAction(cat.id);
      if (res.success) {
        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
        setFeedback({
          type: 'success',
          message: `Category "${cat.label}" deleted.`,
        });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to delete category.' });
      }
    });
  };

  return (
    <div>
      {/* Environment & Feedback Banners */}
      {dataSource === 'local' && (
        <div className="admin-notice-banner" style={{ borderColor: 'rgba(201, 164, 92, 0.4)' }}>
          <FileText size={18} style={{ color: 'var(--color-gold)', flexShrink: 0, marginTop: '2px' }} />
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => setShowFeaturedManager(!showFeaturedManager)}
            aria-expanded={showFeaturedManager}
          >
            <Star size={16} />
            <span>Manage Homepage Journal (4 Slots)</span>
          </button>

          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => setShowCategoryManager(!showCategoryManager)}
            aria-expanded={showCategoryManager}
          >
            <FolderTree size={16} />
            <span>Manage Categories ({categories.length})</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/admin/articles/new" className="admin-btn admin-btn-primary">
            <Plus size={16} />
            <span>Write New Article</span>
          </Link>
        </div>
      </div>

      {/* Collapsible Homepage Journal 4-Slot Manager */}
      {showFeaturedManager && (
        <div className="admin-card" style={{ border: '1px solid var(--color-gold)' }}>
          <div className="admin-card-header">
            <div>
              <h2 className="admin-card-title">
                <Sparkles size={18} style={{ color: 'var(--color-gold)' }} />
                <span>Homepage Engineering Journal (Approved 4-Article Invariant)</span>
              </h2>
              <p className="admin-card-subtitle">
                The approved homepage layout features precisely 1 Dominant Featured Article and 3 Supporting Cards.
                All 4 slots must be assigned to unique published articles.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowFeaturedManager(false)}
              style={{ background: 'none', border: 'none', color: 'var(--color-text-dim)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.25rem',
              marginBottom: '1.25rem',
            }}
          >
            {/* Slot 1: Primary */}
            <div className="admin-form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="slot-1" className="admin-form-label">
                Slot #1 (Dominant Featured)
              </label>
              <select
                id="slot-1"
                className="admin-form-select"
                value={slot1}
                onChange={(e) => setSlot1(e.target.value)}
              >
                {publishedArticles.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Slot 2: Supporting 1 */}
            <div className="admin-form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="slot-2" className="admin-form-label">
                Slot #2 (Supporting Left)
              </label>
              <select
                id="slot-2"
                className="admin-form-select"
                value={slot2}
                onChange={(e) => setSlot2(e.target.value)}
              >
                {publishedArticles.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Slot 3: Supporting 2 */}
            <div className="admin-form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="slot-3" className="admin-form-label">
                Slot #3 (Supporting Center)
              </label>
              <select
                id="slot-3"
                className="admin-form-select"
                value={slot3}
                onChange={(e) => setSlot3(e.target.value)}
              >
                {publishedArticles.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Slot 4: Supporting 3 */}
            <div className="admin-form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="slot-4" className="admin-form-label">
                Slot #4 (Supporting Right)
              </label>
              <select
                id="slot-4"
                className="admin-form-select"
                value={slot4}
                onChange={(e) => setSlot4(e.target.value)}
              >
                {publishedArticles.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
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
              onClick={handleSaveJournalSlots}
              disabled={isPending}
            >
              {isPending ? 'Saving Slots...' : 'Apply Journal Slots'}
            </button>
          </div>
        </div>
      )}

      {/* Collapsible Category Manager */}
      {showCategoryManager && (
        <div className="admin-card" style={{ border: '1px solid rgba(201, 164, 92, 0.4)' }}>
          <div className="admin-card-header">
            <div>
              <h2 className="admin-card-title">
                <FolderTree size={18} style={{ color: 'var(--color-gold)' }} />
                <span>Blog Taxonomy Categories ({categories.length})</span>
              </h2>
              <p className="admin-card-subtitle">
                Manage taxonomy categories with referential integrity protection.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCategoryManager(false)}
              style={{ background: 'none', border: 'none', color: 'var(--color-text-dim)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Add Category Form */}
          <form
            onSubmit={handleCreateCategory}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) auto',
              gap: '0.75rem',
              alignItems: 'flex-end',
              marginBottom: '1.25rem',
              paddingBottom: '1.25rem',
              borderBottom: '1px solid rgba(201, 164, 92, 0.15)',
            }}
          >
            <div>
              <label htmlFor="cat-id-input" className="admin-form-label" style={{ fontSize: '0.75rem' }}>
                Category Slug ID (e.g. distributed-systems)
              </label>
              <input
                id="cat-id-input"
                type="text"
                className="admin-form-input"
                value={newCatId}
                onChange={(e) => setNewCatId(e.target.value)}
                placeholder="slug-id"
                required
              />
            </div>
            <div>
              <label htmlFor="cat-label-input" className="admin-form-label" style={{ fontSize: '0.75rem' }}>
                Category Label (e.g. Distributed Systems)
              </label>
              <input
                id="cat-label-input"
                type="text"
                className="admin-form-input"
                value={newCatLabel}
                onChange={(e) => setNewCatLabel(e.target.value)}
                placeholder="Display Label"
                required
              />
            </div>
            <div>
              <label htmlFor="cat-desc-input" className="admin-form-label" style={{ fontSize: '0.75rem' }}>
                Description (Optional)
              </label>
              <input
                id="cat-desc-input"
                type="text"
                className="admin-form-input"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="Topic description"
              />
            </div>
            <div>
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={isPending || !newCatId.trim() || !newCatLabel.trim()}
              >
                <Plus size={14} />
                <span>Add Category</span>
              </button>
            </div>
          </form>

          {/* Category List */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
            {categories.map((cat) => {
              const count = articles.filter(
                (a) =>
                  !a.isDeleted &&
                  (a.category.toLowerCase() === cat.id.toLowerCase() ||
                    a.category.toLowerCase() === cat.label.toLowerCase() ||
                    a.archiveCategory === cat.id)
              ).length;

              return (
                <div
                  key={cat.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(10, 10, 13, 0.6)',
                    border: '1px solid rgba(201, 164, 92, 0.15)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-ivory)' }}>
                      {cat.label}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>
                      <code>{cat.id}</code> • {count} active article{count === 1 ? '' : 's'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat)}
                    disabled={isPending}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: count > 0 ? 'var(--color-text-muted)' : '#F87171',
                      cursor: count > 0 ? 'not-allowed' : 'pointer',
                      padding: '0.3rem',
                    }}
                    title={
                      count > 0
                        ? `Cannot delete: referenced by ${count} article(s)`
                        : 'Delete this category'
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs and Search / Filter Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid rgba(201, 164, 92, 0.2)',
          marginBottom: '1.25rem',
          paddingBottom: '0.5rem',
        }}
      >
        {/* Status Tabs */}
        <div className="admin-tab-bar" style={{ borderBottom: 'none', margin: 0, padding: 0 }} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            className={`admin-tab-btn ${activeTab === 'all' ? 'admin-tab-btn-active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <span>All Active</span>
            <span style={{ opacity: 0.6 }}>({publishedArticles.length + draftArticles.length})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'published'}
            className={`admin-tab-btn ${activeTab === 'published' ? 'admin-tab-btn-active' : ''}`}
            onClick={() => setActiveTab('published')}
          >
            <span>Published</span>
            <span style={{ color: '#34D399' }}>({publishedArticles.length})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'draft'}
            className={`admin-tab-btn ${activeTab === 'draft' ? 'admin-tab-btn-active' : ''}`}
            onClick={() => setActiveTab('draft')}
          >
            <span>Drafts</span>
            <span style={{ opacity: 0.6 }}>({draftArticles.length})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'trash'}
            className={`admin-tab-btn ${activeTab === 'trash' ? 'admin-tab-btn-active' : ''}`}
            onClick={() => setActiveTab('trash')}
          >
            <span>Trash</span>
            <span style={{ color: '#F87171' }}>({trashArticles.length})</span>
          </button>
        </div>

        {/* Search & Category Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ position: 'relative', width: '220px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-dim)',
              }}
            />
            <input
              type="text"
              className="admin-form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              style={{ paddingLeft: '2.2rem', paddingRight: '1.5rem', fontSize: '0.8rem', height: '34px' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-dim)',
                  cursor: 'pointer',
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          <select
            className="admin-form-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ width: '160px', fontSize: '0.8rem', height: '34px', padding: '0.2rem 1.8rem 0.2rem 0.6rem' }}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Articles Table */}
      <div className="admin-table-container">
        <table className="admin-table" aria-label="Blog & Engineering Journal Inventory">
          <thead>
            <tr>
              <th scope="col" style={{ width: '70px' }}>Order</th>
              <th scope="col">Title & Excerpt</th>
              <th scope="col">Slug</th>
              <th scope="col">Category</th>
              <th scope="col">Read Time</th>
              <th scope="col">Status</th>
              <th scope="col">Featured</th>
              <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedArticles.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-dim)' }}>
                  No articles found matching active filters.
                </td>
              </tr>
            ) : (
              displayedArticles.map((a, idx) => (
                <tr key={a.id}>
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
                        #{String(a.displayOrder).padStart(2, '0')}
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
                            disabled={idx === displayedArticles.length - 1 || isPending}
                            title="Move Down"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-text-dim)',
                              cursor: idx === displayedArticles.length - 1 ? 'not-allowed' : 'pointer',
                              padding: '1px',
                              opacity: idx === displayedArticles.length - 1 ? 0.3 : 1,
                            }}
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Title & Excerpt */}
                  <td>
                    <div style={{ maxWidth: '340px' }}>
                      <div
                        style={{
                          fontSize: '0.92rem',
                          fontWeight: 600,
                          color: 'var(--color-ivory)',
                          marginBottom: '0.2rem',
                          lineHeight: 1.3,
                        }}
                      >
                        {a.title}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-text-dim)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {a.abstract}
                      </div>
                    </div>
                  </td>

                  {/* Slug */}
                  <td>
                    <span className="admin-slug-pill">/{a.slug}</span>
                  </td>

                  {/* Category */}
                  <td>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-gold-light)', fontWeight: 500 }}>
                      {a.category}
                    </span>
                  </td>

                  {/* Read Time */}
                  <td>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)' }}>
                      {a.readTime}
                    </span>
                  </td>

                  {/* Status */}
                  <td>
                    {a.isDeleted ? (
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
                      <StatusIndicator status={a.status} />
                    )}
                  </td>

                  {/* Featured */}
                  <td>
                    {a.featured && !a.isDeleted ? (
                      <StatusIndicator
                        status="featured"
                        label={`Featured #${a.featuredOrder || 1}`}
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
                          onClick={() => handleRestore(a)}
                          disabled={isPending}
                          title="Restore article from Trash"
                        >
                          <RefreshCw size={13} />
                          <span>Restore</span>
                        </button>
                      ) : (
                        <>
                          {/* Private Preview */}
                          <Link
                            href={`/admin/articles/${a.id}/preview`}
                            className="admin-btn admin-btn-ghost"
                            style={{ padding: '0.35rem 0.55rem', minHeight: '32px' }}
                            title="Private Owner Preview"
                          >
                            <Eye size={14} />
                          </Link>

                          {/* Edit Form */}
                          <Link
                            href={`/admin/articles/${a.id}`}
                            className="admin-btn admin-btn-secondary"
                            style={{ padding: '0.35rem 0.55rem', minHeight: '32px' }}
                            title="Edit Technical Article"
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
                              color: a.status === 'published' ? '#34D399' : 'var(--color-text-dim)',
                            }}
                            onClick={() => handleTogglePublish(a)}
                            disabled={isPending}
                            title={a.status === 'published' ? 'Unpublish article' : 'Publish article live'}
                          >
                            <CheckCircle size={14} />
                          </button>

                          {/* Move to Trash */}
                          <button
                            type="button"
                            className="admin-btn admin-btn-danger"
                            style={{ padding: '0.35rem 0.55rem', minHeight: '32px' }}
                            onClick={() => handleSoftDelete(a)}
                            disabled={isPending}
                            title="Move article to Trash"
                          >
                            <Trash2 size={14} />
                          </button>

                          {/* Public Live View link if published */}
                          {a.status === 'published' && (
                            <Link
                              href={`/notes/${a.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="admin-btn admin-btn-ghost"
                              style={{ padding: '0.35rem 0.55rem', minHeight: '32px' }}
                              title="Open public article in new tab"
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
