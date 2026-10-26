'use client';

import React, { useState, useTransition } from 'react';
import {
  Layers,
  Cpu,
  Database,
  Gauge,
  GitBranch,
  ShieldCheck,
  Plus,
  Trash2,
  Edit3,
  Archive,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  ExpertiseAreaEntity,
  CreateExpertiseAreaInput,
  UpdateExpertiseAreaInput,
} from '@/cms/models/technology';
import {
  saveExpertiseAreaAction,
  archiveExpertiseAreaAction,
  restoreExpertiseAreaAction,
  deleteExpertiseAreaAction,
  reorderExpertiseAreasAction,
} from '@/app/admin/sections/actions';

export interface ExpertiseStudioPanelProps {
  initialExpertiseAreas: ExpertiseAreaEntity[];
}

const ICON_OPTIONS = [
  { key: 'Layers', label: 'Layers (Systems Architecture)', Icon: Layers },
  { key: 'Cpu', label: 'Cpu (Core Engineering)', Icon: Cpu },
  { key: 'Database', label: 'Database (Data Systems)', Icon: Database },
  { key: 'Gauge', label: 'Gauge (Performance & Runtime)', Icon: Gauge },
  { key: 'GitBranch', label: 'GitBranch (DevOps & CI/CD)', Icon: GitBranch },
  { key: 'ShieldCheck', label: 'ShieldCheck (Security Hardening)', Icon: ShieldCheck },
];

function getExpertiseIcon(iconName?: string) {
  switch (iconName) {
    case 'Cpu':
      return Cpu;
    case 'Database':
      return Database;
    case 'Gauge':
      return Gauge;
    case 'GitBranch':
      return GitBranch;
    case 'ShieldCheck':
      return ShieldCheck;
    case 'Layers':
    default:
      return Layers;
  }
}

export function ExpertiseStudioPanel({
  initialExpertiseAreas,
}: ExpertiseStudioPanelProps) {
  const [expertiseAreas, setExpertiseAreas] = useState<ExpertiseAreaEntity[]>(initialExpertiseAreas);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [editingArea, setEditingArea] = useState<Partial<ExpertiseAreaEntity> & { rawConcepts?: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Published disciplines counter
  let publishedCount = 0;

  const filteredAreas = expertiseAreas.filter((a) => {
    if (filter !== 'all' && a.status !== filter) return false;
    return true;
  });

  const handleOpenCreate = () => {
    setEditingArea({
      name: '',
      level: 'Production Architecture',
      description: '',
      coreConcepts: [],
      rawConcepts: '',
      icon: 'Layers',
      status: 'published',
    });
    setIsCreating(true);
    setFormErrors({});
  };

  const handleOpenEdit = (area: ExpertiseAreaEntity) => {
    setEditingArea({
      ...area,
      rawConcepts: (area.coreConcepts || []).join(', '),
    });
    setIsCreating(false);
    setFormErrors({});
  };

  const handleSave = () => {
    if (!editingArea) return;
    setStatusMsg(null);
    setFormErrors({});

    // Parse concepts from raw string if provided
    let concepts = editingArea.coreConcepts || [];
    if (editingArea.rawConcepts !== undefined) {
      concepts = editingArea.rawConcepts
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const payload = {
      ...editingArea,
      coreConcepts: concepts,
    };

    delete payload.rawConcepts;

    startTransition(async () => {
      const res = await saveExpertiseAreaAction(
        payload as CreateExpertiseAreaInput | UpdateExpertiseAreaInput
      );
      if (res.success && res.data) {
        if (isCreating) {
          setExpertiseAreas((prev) => [...prev, res.data!]);
          setStatusMsg({
            type: 'success',
            text: `Created discipline "${res.data.name}" successfully.`,
          });
        } else {
          setExpertiseAreas((prev) =>
            prev.map((a) => (a.id === res.data!.id ? res.data! : a))
          );
          setStatusMsg({
            type: 'success',
            text: `Updated discipline "${res.data.name}" successfully.`,
          });
        }
        setEditingArea(null);
      } else {
        setStatusMsg({
          type: 'error',
          text: res.error || 'Failed to save expertise area.',
        });
        if (res.fieldErrors) {
          setFormErrors(res.fieldErrors);
        }
      }
    });
  };

  const handleArchive = (area: ExpertiseAreaEntity) => {
    if (!confirm(`Are you sure you want to archive "${area.name}"?`)) return;

    setStatusMsg(null);
    startTransition(async () => {
      const res = await archiveExpertiseAreaAction(area.id);
      if (res.success) {
        setExpertiseAreas((prev) =>
          prev.map((a) => (a.id === area.id ? { ...a, status: 'archived' } : a))
        );
        setStatusMsg({
          type: 'success',
          text: `Archived discipline "${area.name}".`,
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: res.error || 'Failed to archive expertise area.',
        });
      }
    });
  };

  const handleRestore = (area: ExpertiseAreaEntity) => {
    setStatusMsg(null);
    startTransition(async () => {
      const res = await restoreExpertiseAreaAction(area.id);
      if (res.success) {
        setExpertiseAreas((prev) =>
          prev.map((a) => (a.id === area.id ? { ...a, status: 'draft' } : a))
        );
        setStatusMsg({
          type: 'success',
          text: `Restored discipline "${area.name}" to draft status.`,
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: res.error || 'Failed to restore expertise area.',
        });
      }
    });
  };

  const handleDelete = (area: ExpertiseAreaEntity) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete "${area.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setStatusMsg(null);
    startTransition(async () => {
      const res = await deleteExpertiseAreaAction(area.id);
      if (res.success) {
        setExpertiseAreas((prev) => prev.filter((a) => a.id !== area.id));
        setStatusMsg({
          type: 'success',
          text: `Deleted discipline "${area.name}".`,
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: res.error || 'Failed to delete expertise area.',
        });
      }
    });
  };

  const handleMove = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= expertiseAreas.length) return;

    const reordered = [...expertiseAreas];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(targetIdx, 0, moved);

    setExpertiseAreas(reordered);
    startTransition(async () => {
      await reorderExpertiseAreasAction(reordered.map((a) => a.id));
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Status Toast */}
      {statusMsg && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.85rem',
            backgroundColor:
              statusMsg.type === 'success'
                ? 'rgba(16, 185, 129, 0.12)'
                : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${
              statusMsg.type === 'success'
                ? 'rgba(16, 185, 129, 0.3)'
                : 'rgba(239, 68, 68, 0.3)'
            }`,
            color: statusMsg.type === 'success' ? '#10B981' : '#EF4444',
          }}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Main Studio Card */}
      <div className="admin-card">
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            borderBottom: '1px solid rgba(201, 164, 92, 0.15)',
            paddingBottom: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(201, 164, 92, 0.12)',
                border: '1px solid rgba(201, 164, 92, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-gold, #C9A45C)',
              }}
            >
              <Layers size={20} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'var(--color-ivory, #F6F3EC)',
                  margin: 0,
                }}
              >
                Discipline Matrix &amp; Expertise Areas ({expertiseAreas.length})
              </h3>
              <p
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--color-text-dim, #9A9AA8)',
                  margin: 0,
                }}
              >
                The first 6 published disciplines automatically populate Column 3 on the Homepage Architecture Scene.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="btn-gold"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.82rem',
              padding: '0.45rem 0.95rem',
              borderRadius: '4px',
            }}
          >
            <Plus size={14} />
            <span>Add Discipline</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1.25rem' }}>
          {(['all', 'published', 'draft', 'archived'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`admin-filter-pill ${filter === f ? 'active' : ''}`}
              style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Disciplines List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredAreas.length === 0 ? (
            <div
              style={{
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--color-text-dim, #9A9AA8)',
                fontSize: '0.85rem',
              }}
            >
              No expertise areas found.
            </div>
          ) : (
            filteredAreas.map((area, idx) => {
              const IconComp = getExpertiseIcon(area.icon);
              let activeDisciplineSlot: number | null = null;
              if (area.status === 'published') {
                publishedCount += 1;
                if (publishedCount <= 6) {
                  activeDisciplineSlot = publishedCount;
                }
              }

              return (
                <div
                  key={area.id}
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  {/* Left: Icon, Name, Level, Description */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', flex: 1, minWidth: '280px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(201, 164, 92, 0.1)',
                        border: '1px solid rgba(201, 164, 92, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-gold, #C9A45C)',
                        flexShrink: 0,
                      }}
                    >
                      <IconComp size={18} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
                          {area.name}
                        </span>

                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '4px',
                            fontWeight: 600,
                            backgroundColor:
                              area.status === 'published'
                                ? 'rgba(16, 185, 129, 0.12)'
                                : area.status === 'draft'
                                ? 'rgba(234, 179, 8, 0.12)'
                                : 'rgba(239, 68, 68, 0.12)',
                            color:
                              area.status === 'published'
                                ? '#10B981'
                                : area.status === 'draft'
                                ? '#EAB308'
                                : '#EF4444',
                          }}
                        >
                          {area.status}
                        </span>

                        {activeDisciplineSlot !== null && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              padding: '0.1rem 0.45rem',
                              borderRadius: '4px',
                              fontWeight: 600,
                              backgroundColor: 'rgba(201, 164, 92, 0.15)',
                              color: 'var(--color-gold, #C9A45C)',
                              border: '1px solid rgba(201, 164, 92, 0.3)',
                            }}
                          >
                            Discipline Slot {activeDisciplineSlot} / 6
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.78rem', color: 'var(--color-gold-light, #E4C88A)' }}>
                        Level: {area.level}
                      </div>

                      <p style={{ fontSize: '0.78rem', color: 'var(--color-text-dim, #9A9AA8)', margin: '0.2rem 0' }}>
                        {area.description}
                      </p>

                      {/* Concepts Tags */}
                      {area.coreConcepts && area.coreConcepts.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                          {area.coreConcepts.map((concept, cIdx) => (
                            <span
                              key={cIdx}
                              style={{
                                fontSize: '0.68rem',
                                padding: '0.1rem 0.45rem',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                color: 'var(--color-ivory, #F6F3EC)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                              }}
                            >
                              {concept}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0}
                      title="Move up"
                      style={{
                        padding: '0.3rem',
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: 'transparent',
                        color: idx === 0 ? 'rgba(255,255,255,0.2)' : 'var(--color-ivory, #F6F3EC)',
                        cursor: idx === 0 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <ChevronUp size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === expertiseAreas.length - 1}
                      title="Move down"
                      style={{
                        padding: '0.3rem',
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: 'transparent',
                        color: idx === expertiseAreas.length - 1 ? 'rgba(255,255,255,0.2)' : 'var(--color-ivory, #F6F3EC)',
                        cursor: idx === expertiseAreas.length - 1 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <ChevronDown size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(area)}
                      title="Edit discipline"
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '4px',
                        border: '1px solid rgba(201, 164, 92, 0.3)',
                        backgroundColor: 'rgba(201, 164, 92, 0.08)',
                        color: 'var(--color-gold, #C9A45C)',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        cursor: 'pointer',
                      }}
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>

                    {area.status === 'archived' ? (
                      <button
                        type="button"
                        onClick={() => handleRestore(area)}
                        title="Restore discipline"
                        style={{
                          padding: '0.35rem 0.65rem',
                          borderRadius: '4px',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          backgroundColor: 'rgba(16, 185, 129, 0.08)',
                          color: '#10B981',
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          cursor: 'pointer',
                        }}
                      >
                        <RefreshCw size={13} />
                        <span>Restore</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleArchive(area)}
                        title="Archive discipline"
                        style={{
                          padding: '0.35rem 0.65rem',
                          borderRadius: '4px',
                          border: '1px solid rgba(234, 179, 8, 0.3)',
                          backgroundColor: 'rgba(234, 179, 8, 0.08)',
                          color: '#EAB308',
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          cursor: 'pointer',
                        }}
                      >
                        <Archive size={13} />
                        <span>Archive</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(area)}
                      title="Delete discipline"
                      style={{
                        padding: '0.35rem 0.55rem',
                        borderRadius: '4px',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        backgroundColor: 'rgba(239, 68, 68, 0.08)',
                        color: '#EF4444',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ====================================================================
          MODAL: ADD / EDIT EXPERTISE AREA
          ==================================================================== */}
      {editingArea && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            className="admin-card"
            style={{
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1px solid rgba(201, 164, 92, 0.4)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(201, 164, 92, 0.2)',
                paddingBottom: '0.85rem',
                marginBottom: '1.25rem',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-ivory, #F6F3EC)' }}>
                {isCreating ? 'Create Discipline Area' : `Edit Discipline: ${editingArea.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingArea(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-dim, #9A9AA8)',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Name & Level */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="admin-label">Discipline Name *</label>
                  <input
                    type="text"
                    value={editingArea.name || ''}
                    onChange={(e) => setEditingArea({ ...editingArea, name: e.target.value })}
                    className="admin-input"
                    placeholder="e.g. Distributed Architecture"
                  />
                  {formErrors.name && (
                    <span style={{ fontSize: '0.72rem', color: '#EF4444' }}>{formErrors.name}</span>
                  )}
                </div>

                <div>
                  <label className="admin-label">Mastery Level / Subtitle *</label>
                  <input
                    type="text"
                    value={editingArea.level || ''}
                    onChange={(e) => setEditingArea({ ...editingArea, level: e.target.value })}
                    className="admin-input"
                    placeholder="e.g. Production Mastery"
                  />
                  {formErrors.level && (
                    <span style={{ fontSize: '0.72rem', color: '#EF4444' }}>{formErrors.level}</span>
                  )}
                </div>
              </div>

              {/* Status & Icon */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="admin-label">Status</label>
                  <select
                    value={editingArea.status || 'published'}
                    onChange={(e) =>
                      setEditingArea({
                        ...editingArea,
                        status: e.target.value as 'published' | 'draft' | 'archived',
                      })
                    }
                    className="admin-input"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="admin-label">Icon Representation</label>
                  <select
                    value={editingArea.icon || 'Layers'}
                    onChange={(e) => setEditingArea({ ...editingArea, icon: e.target.value })}
                    className="admin-input"
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="admin-label">Discipline Description *</label>
                <textarea
                  value={editingArea.description || ''}
                  onChange={(e) => setEditingArea({ ...editingArea, description: e.target.value })}
                  className="admin-input"
                  rows={3}
                  placeholder="Architectural scope, engineering principles, and production experience..."
                />
                {formErrors.description && (
                  <span style={{ fontSize: '0.72rem', color: '#EF4444' }}>{formErrors.description}</span>
                )}
              </div>

              {/* Core Concepts */}
              <div>
                <label className="admin-label">Core Concepts (comma-separated tags) *</label>
                <input
                  type="text"
                  value={editingArea.rawConcepts || ''}
                  onChange={(e) => setEditingArea({ ...editingArea, rawConcepts: e.target.value })}
                  className="admin-input"
                  placeholder="e.g. Clean Architecture, Event Sourcing, CQRS, Hexagonal"
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
                  Separated by commas. These render as tags on the public discipline cards.
                </span>
                {formErrors.coreConcepts && (
                  <span style={{ fontSize: '0.72rem', color: '#EF4444', display: 'block' }}>
                    {formErrors.coreConcepts}
                  </span>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                paddingTop: '1rem',
                marginTop: '1.5rem',
              }}
            >
              <button
                type="button"
                onClick={() => setEditingArea(null)}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'transparent',
                  color: 'var(--color-ivory, #F6F3EC)',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="btn-gold"
                style={{
                  padding: '0.45rem 1.25rem',
                  borderRadius: '4px',
                  fontSize: '0.82rem',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                }}
              >
                {isPending ? 'Saving...' : isCreating ? 'Create Discipline' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
