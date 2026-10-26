'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Orbit,
  Plus,
  Trash2,
  Edit3,
  Archive,
  RefreshCw,
  Save,
  Send,
  RotateCcw,
  Eye,
  AlertCircle,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Shield,
} from 'lucide-react';
import {
  TechnologyEntity,
  OrbitSlotsTuple,
  SUPPORTED_TECH_LOGOS,
  SupportedTechLogoKey,
  FIXED_ORBIT_SLOT_GEOMETRY,
  CreateTechnologyInput,
  UpdateTechnologyInput,
} from '@/cms/models/technology';
import { getTechLogo } from '@/components/TechLogos';
import {
  saveTechnologyAction,
  archiveTechnologyAction,
  restoreTechnologyAction,
  deleteTechnologyAction,
  reorderTechnologiesAction,
  saveOrbitSlotsDraftAction,
  publishOrbitSlotsAction,
  rollbackOrbitSlotsAction,
} from '@/app/admin/sections/actions';

export interface SkillsStudioPanelProps {
  initialTechnologies: TechnologyEntity[];
  initialOrbitSlotsDraft: OrbitSlotsTuple | null;
  initialOrbitSlotsPublished: OrbitSlotsTuple;
}

export function SkillsStudioPanel({
  initialTechnologies,
  initialOrbitSlotsDraft,
  initialOrbitSlotsPublished,
}: SkillsStudioPanelProps) {
  // State for Technologies catalog
  const [technologies, setTechnologies] = useState<TechnologyEntity[]>(initialTechnologies);
  const [techFilter, setTechFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Technology edit modal state
  const [editingTech, setEditingTech] = useState<Partial<TechnologyEntity> | null>(null);
  const [isCreatingTech, setIsCreatingTech] = useState(false);

  // State for Orbit slots
  const [orbitDraft, setOrbitDraft] = useState<OrbitSlotsTuple | null>(initialOrbitSlotsDraft);
  const [orbitPublished, setOrbitPublished] = useState<OrbitSlotsTuple>(initialOrbitSlotsPublished);
  const [currentSlots, setCurrentSlots] = useState<OrbitSlotsTuple>(
    initialOrbitSlotsDraft || initialOrbitSlotsPublished
  );

  const [isPending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [techFormErrors, setTechFormErrors] = useState<Record<string, string>>({});

  // Helper: map of tech ID to technology
  const techMap = new Map<string, TechnologyEntity>();
  for (const t of technologies) {
    techMap.set(t.id, t);
  }

  // Active slots set for guard checks
  const activeOrbitSlotSet = new Set<string>();
  for (const slotTechId of currentSlots) {
    if (slotTechId) activeOrbitSlotSet.add(slotTechId);
  }
  for (const slotTechId of orbitPublished) {
    if (slotTechId) activeOrbitSlotSet.add(slotTechId);
  }

  // Find slot index for a technology if assigned
  const getAssignedSlotIndex = (techId: string): number | null => {
    const idx = currentSlots.indexOf(techId);
    return idx >= 0 ? idx : null;
  };

  // Filtered technologies
  const filteredTechs = technologies.filter((t) => {
    if (techFilter !== 'all' && t.status !== techFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.role.toLowerCase().includes(q) ||
        (t.logoKey && t.logoKey.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Validation of current 9 slots
  const duplicateTechIds = new Set<string>();
  const seenTechIds = new Set<string>();
  for (const id of currentSlots) {
    if (seenTechIds.has(id)) {
      duplicateTechIds.add(id);
    }
    seenTechIds.add(id);
  }

  const missingSlotIndices: number[] = [];
  const invalidTechSlotIndices: number[] = [];
  for (let i = 0; i < 9; i++) {
    const techId = currentSlots[i];
    if (!techId) {
      missingSlotIndices.push(i);
    } else {
      const t = techMap.get(techId);
      if (!t || t.status !== 'published') {
        invalidTechSlotIndices.push(i);
      }
    }
  }

  const hasSlotConflicts =
    duplicateTechIds.size > 0 ||
    missingSlotIndices.length > 0 ||
    invalidTechSlotIndices.length > 0;

  // --------------------------------------------------------------------------
  // TECHNOLOGY CRUD HANDLERS
  // --------------------------------------------------------------------------

  const handleOpenCreateTech = () => {
    setEditingTech({
      name: '',
      label: '',
      category: 'Backend & Architecture',
      role: '',
      description: '',
      capability: '',
      logoKey: 'laravel',
      status: 'published',
      displayOrder: technologies.length,
    });
    setIsCreatingTech(true);
    setTechFormErrors({});
  };

  const handleOpenEditTech = (tech: TechnologyEntity) => {
    setEditingTech({ ...tech });
    setIsCreatingTech(false);
    setTechFormErrors({});
  };

  const handleSaveTech = () => {
    if (!editingTech) return;
    setStatusMsg(null);
    setTechFormErrors({});

    startTransition(async () => {
      const res = await saveTechnologyAction(
        editingTech as CreateTechnologyInput | UpdateTechnologyInput
      );
      if (res.success && res.data) {
        if (isCreatingTech) {
          setTechnologies((prev) => [...prev, res.data!]);
          setStatusMsg({
            type: 'success',
            text: `Created technology "${res.data.name}" successfully.`,
          });
        } else {
          setTechnologies((prev) =>
            prev.map((t) => (t.id === res.data!.id ? res.data! : t))
          );
          setStatusMsg({
            type: 'success',
            text: `Updated technology "${res.data.name}" successfully.`,
          });
        }
        setEditingTech(null);
      } else {
        setStatusMsg({
          type: 'error',
          text: res.error || 'Failed to save technology.',
        });
        if (res.fieldErrors) {
          setTechFormErrors(res.fieldErrors);
        }
      }
    });
  };

  const handleArchiveTech = (tech: TechnologyEntity) => {
    if (activeOrbitSlotSet.has(tech.id)) {
      setStatusMsg({
        type: 'error',
        text: `Cannot archive "${tech.name}" while it occupies an active Orbit slot. Reassign the orbit slot first.`,
      });
      return;
    }

    if (!confirm(`Are you sure you want to archive "${tech.name}"?`)) return;

    setStatusMsg(null);
    startTransition(async () => {
      const res = await archiveTechnologyAction(tech.id);
      if (res.success) {
        setTechnologies((prev) =>
          prev.map((t) => (t.id === tech.id ? { ...t, status: 'archived' } : t))
        );
        setStatusMsg({
          type: 'success',
          text: `Archived technology "${tech.name}".`,
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: res.error || 'Failed to archive technology.',
        });
      }
    });
  };

  const handleRestoreTech = (tech: TechnologyEntity) => {
    setStatusMsg(null);
    startTransition(async () => {
      const res = await restoreTechnologyAction(tech.id);
      if (res.success) {
        setTechnologies((prev) =>
          prev.map((t) => (t.id === tech.id ? { ...t, status: 'draft' } : t))
        );
        setStatusMsg({
          type: 'success',
          text: `Restored technology "${tech.name}" to draft status.`,
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: res.error || 'Failed to restore technology.',
        });
      }
    });
  };

  const handleDeleteTech = (tech: TechnologyEntity) => {
    if (activeOrbitSlotSet.has(tech.id)) {
      setStatusMsg({
        type: 'error',
        text: `Cannot delete "${tech.name}" while it occupies an active Orbit slot. Reassign the orbit slot first.`,
      });
      return;
    }

    if (
      !confirm(
        `Are you sure you want to permanently delete "${tech.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setStatusMsg(null);
    startTransition(async () => {
      const res = await deleteTechnologyAction(tech.id);
      if (res.success) {
        setTechnologies((prev) => prev.filter((t) => t.id !== tech.id));
        setStatusMsg({
          type: 'success',
          text: `Deleted technology "${tech.name}".`,
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: res.error || 'Failed to delete technology.',
        });
      }
    });
  };

  const handleMoveTech = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= technologies.length) return;

    const reordered = [...technologies];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(targetIdx, 0, moved);

    setTechnologies(reordered);
    startTransition(async () => {
      await reorderTechnologiesAction(reordered.map((t) => t.id));
    });
  };

  // --------------------------------------------------------------------------
  // ORBIT SLOTS ASSIGNMENT HANDLERS
  // --------------------------------------------------------------------------

  const handleAssignSlot = (slotIdx: number, newTechId: string) => {
    const updated = [...currentSlots] as OrbitSlotsTuple;
    updated[slotIdx] = newTechId;
    setCurrentSlots(updated);
  };

  const handleSaveOrbitDraft = () => {
    if (hasSlotConflicts) {
      setStatusMsg({
        type: 'error',
        text: 'Please resolve slot conflicts before saving draft.',
      });
      return;
    }

    setStatusMsg(null);
    startTransition(async () => {
      const res = await saveOrbitSlotsDraftAction(currentSlots);
      if (res.success && res.data) {
        setOrbitDraft(res.data);
        setStatusMsg({
          type: 'success',
          text: 'Saved Orbit draft successfully. Available in Private Preview.',
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: res.error || 'Failed to save orbit slots draft.',
        });
      }
    });
  };

  const handlePublishOrbitSlots = () => {
    if (hasSlotConflicts) {
      setStatusMsg({
        type: 'error',
        text: 'Please resolve slot conflicts before publishing.',
      });
      return;
    }

    if (
      !confirm(
        'Publish these 9 Orbit slot assignments to the live homepage Galaxy Orbit?'
      )
    ) {
      return;
    }

    setStatusMsg(null);
    startTransition(async () => {
      const res = await publishOrbitSlotsAction(currentSlots);
      if (res.success && res.data) {
        setOrbitPublished(res.data);
        setOrbitDraft(null);
        setStatusMsg({
          type: 'success',
          text: 'Published Orbit slot assignments to live website.',
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: res.error || 'Failed to publish orbit slots.',
        });
      }
    });
  };

  const handleRollbackOrbitSlots = () => {
    if (
      !confirm(
        'Rollback Orbit slots to the previous published configuration? This will immediately update the live homepage.'
      )
    ) {
      return;
    }

    setStatusMsg(null);
    startTransition(async () => {
      const res = await rollbackOrbitSlotsAction();
      if (res.success && res.data) {
        setOrbitPublished(res.data);
        setCurrentSlots(res.data);
        setOrbitDraft(null);
        setStatusMsg({
          type: 'success',
          text: 'Rolled back Orbit slots to previous configuration. Live website updated.',
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: res.error || 'Failed to rollback orbit slots.',
        });
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Toast / Status Alert */}
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

      {/* ====================================================================
          SECTION 1: 9-SLOT ORBIT GALAXY BOARD
          ==================================================================== */}
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
              <Orbit size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <h3
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: 'var(--color-ivory, #F6F3EC)',
                    margin: 0,
                  }}
                >
                  Galaxy Orbit Slot Board (Exact 9 Positions)
                </h3>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    fontWeight: 600,
                    backgroundColor: orbitDraft ? 'rgba(234, 179, 8, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: orbitDraft ? '#EAB308' : '#10B981',
                    border: `1px solid ${orbitDraft ? 'rgba(234, 179, 8, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                  }}
                >
                  {orbitDraft ? 'Draft Orbit Active' : 'Live Published'}
                </span>
              </div>
              <p
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--color-text-dim, #9A9AA8)',
                  margin: 0,
                }}
              >
                Assign any published technology with an official logo to each
                fixed orbital coordinate. Visual geometry is immutable.
              </p>
            </div>
          </div>

          {/* Action Buttons for Orbit Slots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link
              href="/admin/sections/preview"
              target="_blank"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '4px',
                border: '1px solid rgba(201, 164, 92, 0.3)',
                color: 'var(--color-gold, #C9A45C)',
                textDecoration: 'none',
                backgroundColor: 'rgba(201, 164, 92, 0.05)',
              }}
            >
              <Eye size={13} />
              <span>Private Preview</span>
            </Link>

            <button
              type="button"
              onClick={handleSaveOrbitDraft}
              disabled={isPending || hasSlotConflicts}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'var(--color-ivory, #F6F3EC)',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                cursor: isPending || hasSlotConflicts ? 'not-allowed' : 'pointer',
              }}
            >
              <Save size={13} />
              <span>Save Orbit Draft</span>
            </button>

            <button
              type="button"
              onClick={handlePublishOrbitSlots}
              disabled={isPending || hasSlotConflicts}
              className="btn-gold"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                padding: '0.45rem 0.95rem',
                borderRadius: '4px',
                cursor: isPending || hasSlotConflicts ? 'not-allowed' : 'pointer',
              }}
            >
              <Send size={13} />
              <span>Publish Orbit</span>
            </button>

            <button
              type="button"
              onClick={handleRollbackOrbitSlots}
              disabled={isPending}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.78rem',
                padding: '0.45rem 0.75rem',
                borderRadius: '4px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#EF4444',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                cursor: isPending ? 'not-allowed' : 'pointer',
              }}
            >
              <RotateCcw size={12} />
              <span>Rollback Orbit</span>
            </button>
          </div>
        </div>

        {/* Conflict Alert Banner */}
        {hasSlotConflicts && (
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '6px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#F87171',
              fontSize: '0.82rem',
              marginBottom: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <AlertCircle size={16} />
              <span>Slot Invariant Conflicts Detected:</span>
            </div>
            {duplicateTechIds.size > 0 && (
              <div style={{ paddingLeft: '1.5rem' }}>
                • Duplicate technology assigned: Each slot must contain a unique technology. Conflicting IDs:{' '}
                {Array.from(duplicateTechIds)
                  .map((id) => techMap.get(id)?.name || id)
                  .join(', ')}
              </div>
            )}
            {missingSlotIndices.length > 0 && (
              <div style={{ paddingLeft: '1.5rem' }}>
                • Missing slot assignments: Slots {missingSlotIndices.map((i) => `Slot ${i}`).join(', ')} must have a valid technology.
              </div>
            )}
            {invalidTechSlotIndices.length > 0 && (
              <div style={{ paddingLeft: '1.5rem' }}>
                • Non-published technology: Assigned technologies must be published. Checked slots:{' '}
                {invalidTechSlotIndices.map((i) => `Slot ${i}`).join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Orbit Slots Grid: Rear 4 Slots + Front 5 Slots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* REAR SLOTS (0 - 3) */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--color-text-dim, #9A9AA8)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '0.75rem',
              }}
            >
              <Shield size={13} style={{ color: 'var(--color-gold, #C9A45C)' }} />
              <span>Rear Orbit Plane (Depth Z-Index -1 • Scale 0.82 - 0.88)</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '0.85rem',
              }}
            >
              {[0, 1, 2, 3].map((slotIdx) => {
                const geo = FIXED_ORBIT_SLOT_GEOMETRY[slotIdx];
                const assignedId = currentSlots[slotIdx];
                const assignedTech = techMap.get(assignedId);
                const LogoComp = assignedTech?.logoKey ? getTechLogo(assignedTech.logoKey) : null;
                const isDuplicate = assignedId && duplicateTechIds.has(assignedId);

                return (
                  <div
                    key={slotIdx}
                    style={{
                      padding: '0.85rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: isDuplicate
                        ? '1px solid rgba(239, 68, 68, 0.5)'
                        : '1px solid rgba(201, 164, 92, 0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--color-gold, #C9A45C)',
                          letterSpacing: '0.05em',
                        }}
                      >
                        SLOT {slotIdx}
                      </span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          padding: '0.15rem 0.4rem',
                          borderRadius: '3px',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--color-text-dim, #9A9AA8)',
                          fontFamily: 'monospace',
                        }}
                      >
                        x: {geo.x} / y: {geo.y}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
                      Geometry Role: <strong style={{ color: 'var(--color-ivory, #F6F3EC)' }}>{geo.label}</strong>
                    </div>

                    {/* Assigned Tech Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          flexShrink: 0,
                          borderRadius: '6px',
                          backgroundColor: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {LogoComp ? <LogoComp size={18} /> : <AlertCircle size={14} color="#EF4444" />}
                      </div>

                      <select
                        value={assignedId}
                        onChange={(e) => handleAssignSlot(slotIdx, e.target.value)}
                        className="admin-input"
                        style={{
                          padding: '0.4rem 0.6rem',
                          fontSize: '0.82rem',
                          width: '100%',
                        }}
                      >
                        {technologies
                          .filter((t) => t.status === 'published')
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.category})
                            </option>
                          ))}
                      </select>
                    </div>

                    {assignedTech && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-dim, #9A9AA8)', lineHeight: 1.3 }}>
                        Role: {assignedTech.role}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* FRONT SLOTS (4 - 8) */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--color-gold, #C9A45C)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '0.75rem',
              }}
            >
              <Sparkles size={13} />
              <span>Front Orbit Plane (Foreground Z-Index +1 • Full Scale 1.00)</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '0.85rem',
              }}
            >
              {[4, 5, 6, 7, 8].map((slotIdx) => {
                const geo = FIXED_ORBIT_SLOT_GEOMETRY[slotIdx];
                const assignedId = currentSlots[slotIdx];
                const assignedTech = techMap.get(assignedId);
                const LogoComp = assignedTech?.logoKey ? getTechLogo(assignedTech.logoKey) : null;
                const isDuplicate = assignedId && duplicateTechIds.has(assignedId);

                return (
                  <div
                    key={slotIdx}
                    style={{
                      padding: '0.85rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(201, 164, 92, 0.03)',
                      border: isDuplicate
                        ? '1px solid rgba(239, 68, 68, 0.5)'
                        : '1px solid rgba(201, 164, 92, 0.35)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--color-gold-light, #E4C88A)',
                          letterSpacing: '0.05em',
                        }}
                      >
                        SLOT {slotIdx}
                      </span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          padding: '0.15rem 0.4rem',
                          borderRadius: '3px',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--color-text-dim, #9A9AA8)',
                          fontFamily: 'monospace',
                        }}
                      >
                        x: {geo.x} / y: {geo.y}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
                      Geometry Role: <strong style={{ color: 'var(--color-ivory, #F6F3EC)' }}>{geo.label}</strong>
                    </div>

                    {/* Assigned Tech Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          flexShrink: 0,
                          borderRadius: '6px',
                          backgroundColor: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {LogoComp ? <LogoComp size={18} /> : <AlertCircle size={14} color="#EF4444" />}
                      </div>

                      <select
                        value={assignedId}
                        onChange={(e) => handleAssignSlot(slotIdx, e.target.value)}
                        className="admin-input"
                        style={{
                          padding: '0.4rem 0.6rem',
                          fontSize: '0.82rem',
                          width: '100%',
                        }}
                      >
                        {technologies
                          .filter((t) => t.status === 'published')
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.category})
                            </option>
                          ))}
                      </select>
                    </div>

                    {assignedTech && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-dim, #9A9AA8)', lineHeight: 1.3 }}>
                        Role: {assignedTech.role}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          SECTION 2: ALL TECHNOLOGIES CATALOG & INVENTORY
          ==================================================================== */}
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
          <div>
            <h3
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--color-ivory, #F6F3EC)',
                margin: 0,
              }}
            >
              Technology Catalog ({technologies.length})
            </h3>
            <p
              style={{
                fontSize: '0.78rem',
                color: 'var(--color-text-dim, #9A9AA8)',
                margin: 0,
              }}
            >
              Manage technologies, official brand logos, and Focus Mode deep-dive content.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateTech}
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
            <span>Add Technology</span>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {(['all', 'published', 'draft', 'archived'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setTechFilter(filter)}
                className={`admin-filter-pill ${techFilter === filter ? 'active' : ''}`}
                style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}
              >
                {filter}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search technologies by name, category, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-input"
            style={{ maxWidth: '300px', fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
          />
        </div>

        {/* Technologies List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {filteredTechs.length === 0 ? (
            <div
              style={{
                padding: '2rem',
                textAlign: 'center',
                color: 'var(--color-text-dim, #9A9AA8)',
                fontSize: '0.85rem',
              }}
            >
              No technologies found matching criteria.
            </div>
          ) : (
            filteredTechs.map((tech, idx) => {
              const LogoComp = tech.logoKey ? getTechLogo(tech.logoKey) : null;
              const slotIdx = getAssignedSlotIndex(tech.id);
              const isOccupyingOrbit = slotIdx !== null;

              return (
                <div
                  key={tech.id}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.85rem',
                  }}
                >
                  {/* Left: Logo, Name, Role, Category */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {LogoComp ? <LogoComp size={20} /> : <AlertCircle size={16} color="#EF4444" />}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--color-ivory, #F6F3EC)' }}>
                          {tech.name}
                        </span>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '4px',
                            fontWeight: 600,
                            backgroundColor:
                              tech.status === 'published'
                                ? 'rgba(16, 185, 129, 0.12)'
                                : tech.status === 'draft'
                                ? 'rgba(234, 179, 8, 0.12)'
                                : 'rgba(239, 68, 68, 0.12)',
                            color:
                              tech.status === 'published'
                                ? '#10B981'
                                : tech.status === 'draft'
                                ? '#EAB308'
                                : '#EF4444',
                          }}
                        >
                          {tech.status}
                        </span>

                        {isOccupyingOrbit && (
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
                            Orbit Slot {slotIdx}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)', marginTop: '0.15rem' }}>
                        <span style={{ color: 'var(--color-gold-light, #E4C88A)' }}>{tech.category}</span> • {tech.role}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {/* Reorder Buttons */}
                    <button
                      type="button"
                      onClick={() => handleMoveTech(idx, 'up')}
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
                      onClick={() => handleMoveTech(idx, 'down')}
                      disabled={idx === filteredTechs.length - 1}
                      title="Move down"
                      style={{
                        padding: '0.3rem',
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: 'transparent',
                        color: idx === filteredTechs.length - 1 ? 'rgba(255,255,255,0.2)' : 'var(--color-ivory, #F6F3EC)',
                        cursor: idx === filteredTechs.length - 1 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <ChevronDown size={13} />
                    </button>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditTech(tech)}
                      title="Edit technology"
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

                    {/* Archive / Restore Button */}
                    {tech.status === 'archived' ? (
                      <button
                        type="button"
                        onClick={() => handleRestoreTech(tech)}
                        title="Restore technology"
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
                        onClick={() => handleArchiveTech(tech)}
                        disabled={isOccupyingOrbit}
                        title={
                          isOccupyingOrbit
                            ? 'Cannot archive technology while it occupies an active Orbit slot'
                            : 'Archive technology'
                        }
                        style={{
                          padding: '0.35rem 0.65rem',
                          borderRadius: '4px',
                          border: '1px solid rgba(234, 179, 8, 0.3)',
                          backgroundColor: 'rgba(234, 179, 8, 0.08)',
                          color: isOccupyingOrbit ? 'rgba(234, 179, 8, 0.4)' : '#EAB308',
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          cursor: isOccupyingOrbit ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <Archive size={13} />
                        <span>Archive</span>
                      </button>
                    )}

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteTech(tech)}
                      disabled={isOccupyingOrbit}
                      title={
                        isOccupyingOrbit
                          ? 'Cannot delete technology while it occupies an active Orbit slot'
                          : 'Delete technology'
                      }
                      style={{
                        padding: '0.35rem 0.55rem',
                        borderRadius: '4px',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        backgroundColor: 'rgba(239, 68, 68, 0.08)',
                        color: isOccupyingOrbit ? 'rgba(239, 68, 68, 0.4)' : '#EF4444',
                        cursor: isOccupyingOrbit ? 'not-allowed' : 'pointer',
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
          MODAL: ADD / EDIT TECHNOLOGY FORM
          ==================================================================== */}
      {editingTech && (
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
              maxWidth: '640px',
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
                {isCreatingTech ? 'Create New Technology' : `Edit Technology: ${editingTech.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingTech(null)}
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
              {/* Name & Label */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="admin-label">Technology Name *</label>
                  <input
                    type="text"
                    value={editingTech.name || ''}
                    onChange={(e) =>
                      setEditingTech({
                        ...editingTech,
                        name: e.target.value,
                        label: editingTech.label || e.target.value,
                      })
                    }
                    className="admin-input"
                    placeholder="e.g. Laravel"
                  />
                  {techFormErrors.name && (
                    <span style={{ fontSize: '0.72rem', color: '#EF4444' }}>{techFormErrors.name}</span>
                  )}
                </div>

                <div>
                  <label className="admin-label">Short Label</label>
                  <input
                    type="text"
                    value={editingTech.label || ''}
                    onChange={(e) => setEditingTech({ ...editingTech, label: e.target.value })}
                    className="admin-input"
                    placeholder="e.g. Laravel"
                  />
                  {techFormErrors.label && (
                    <span style={{ fontSize: '0.72rem', color: '#EF4444' }}>{techFormErrors.label}</span>
                  )}
                </div>
              </div>

              {/* Category & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="admin-label">Category *</label>
                  <input
                    type="text"
                    value={editingTech.category || ''}
                    onChange={(e) => setEditingTech({ ...editingTech, category: e.target.value })}
                    className="admin-input"
                    placeholder="e.g. Backend & Architecture"
                  />
                  {techFormErrors.category && (
                    <span style={{ fontSize: '0.72rem', color: '#EF4444' }}>{techFormErrors.category}</span>
                  )}
                </div>

                <div>
                  <label className="admin-label">Status</label>
                  <select
                    value={editingTech.status || 'published'}
                    onChange={(e) =>
                      setEditingTech({
                        ...editingTech,
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
              </div>

              {/* Role */}
              <div>
                <label className="admin-label">Role in Architecture *</label>
                <input
                  type="text"
                  value={editingTech.role || ''}
                  onChange={(e) => setEditingTech({ ...editingTech, role: e.target.value })}
                  className="admin-input"
                  placeholder="e.g. Core Application Framework"
                />
                {techFormErrors.role && (
                  <span style={{ fontSize: '0.72rem', color: '#EF4444' }}>{techFormErrors.role}</span>
                )}
              </div>

              {/* Logo Selection */}
              <div>
                <label className="admin-label">Official Tech Logo (Supported Registry)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {editingTech.logoKey ? (
                      React.createElement(getTechLogo(editingTech.logoKey), { size: 22 })
                    ) : (
                      <AlertCircle size={16} color="#EF4444" />
                    )}
                  </div>

                  <select
                    value={editingTech.logoKey || 'laravel'}
                    onChange={(e) =>
                      setEditingTech({
                        ...editingTech,
                        logoKey: e.target.value as SupportedTechLogoKey,
                      })
                    }
                    className="admin-input"
                    style={{ width: '100%' }}
                  >
                    {SUPPORTED_TECH_LOGOS.map((key) => (
                      <option key={key} value={key}>
                        {key.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                {techFormErrors.logoKey && (
                  <span style={{ fontSize: '0.72rem', color: '#EF4444' }}>{techFormErrors.logoKey}</span>
                )}
              </div>

              {/* Focus Mode Description */}
              <div>
                <label className="admin-label">Focus Mode Description (Architectural Summary) *</label>
                <textarea
                  value={editingTech.description || ''}
                  onChange={(e) => setEditingTech({ ...editingTech, description: e.target.value })}
                  className="admin-input"
                  rows={3}
                  placeholder="High-level narrative displayed when a user activates Focus Mode on this node..."
                />
                {techFormErrors.description && (
                  <span style={{ fontSize: '0.72rem', color: '#EF4444' }}>{techFormErrors.description}</span>
                )}
              </div>

              {/* Capability */}
              <div>
                <label className="admin-label">Capability Detail *</label>
                <textarea
                  value={editingTech.capability || ''}
                  onChange={(e) => setEditingTech({ ...editingTech, capability: e.target.value })}
                  className="admin-input"
                  rows={2}
                  placeholder="Key technical capabilities (e.g. Eloquent ORM, queued jobs, artisan CLI, REST APIs)"
                />
                {techFormErrors.capability && (
                  <span style={{ fontSize: '0.72rem', color: '#EF4444' }}>{techFormErrors.capability}</span>
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
                onClick={() => setEditingTech(null)}
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
                onClick={handleSaveTech}
                disabled={isPending}
                className="btn-gold"
                style={{
                  padding: '0.45rem 1.25rem',
                  borderRadius: '4px',
                  fontSize: '0.82rem',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                }}
              >
                {isPending ? 'Saving...' : isCreatingTech ? 'Create Technology' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
