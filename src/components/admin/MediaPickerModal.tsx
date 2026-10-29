'use client';

/**
 * PHILOZZ CMS — Reusable Media Picker Modal
 * Phase 16E.0: Media Library Foundation & Storage Provider Readiness
 *
 * Allows selecting managed assets for Project thumbnails, Article covers,
 * Homepage sections (Hero, About, Contact), Brand CV downloads, and SEO OpenGraph images.
 */

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  X,
  Search,
  Check,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import type { MediaAssetEntity, MediaFolder } from '@/cms/models/media';

export interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (asset: MediaAssetEntity) => void;
  title?: string;
  currentValue?: string;
  folderFilter?: MediaFolder;
  mimePrefix?: string;
}

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  title = 'Select Media Asset',
  currentValue,
  folderFilter: initialFolderFilter,
  mimePrefix,
}: MediaPickerModalProps) {
  const [assets, setAssets] = useState<MediaAssetEntity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [activeFolder, setActiveFolder] = useState<string>(initialFolderFilter || 'all');
  const [selectedAsset, setSelectedAsset] = useState<MediaAssetEntity | null>(null);

  // Fetch available assets when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function fetchAssets() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/admin/media');
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.data) {
            setAssets(json.data);
            // Pre-select if currentValue matches
            if (currentValue) {
              const matched = (json.data as MediaAssetEntity[]).find(
                (a) => a.url === currentValue || a.filename === currentValue
              );
              if (matched) setSelectedAsset(matched);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load media assets for picker:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchAssets();

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentValue]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter assets
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      if (asset.isDeleted || asset.status === 'deleting') {
        return false;
      }
      if (activeFolder !== 'all' && asset.folder !== activeFolder) {
        return false;
      }
      if (mimePrefix && !asset.mimeType.startsWith(mimePrefix)) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = asset.originalName.toLowerCase().includes(q) || asset.filename.toLowerCase().includes(q);
        const matchesAlt = asset.altText.toLowerCase().includes(q);
        const matchesTags = asset.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesAlt && !matchesTags) return false;
      }
      return true;
    });
  }, [assets, activeFolder, mimePrefix, search]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="admin-card"
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--color-obsidian-soft, #111116)',
          border: '1px solid var(--color-gold-border, rgba(201, 164, 92, 0.28))',
          borderRadius: '12px',
          padding: 0,
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '1.15rem',
                fontWeight: 600,
                color: 'var(--color-ivory, #F6F3EC)',
              }}
            >
              {title}
            </h3>
            <p
              style={{
                margin: '0.2rem 0 0',
                fontSize: '0.8rem',
                color: 'var(--color-text-dim, #9A9AA8)',
              }}
            >
              Browse verified digital assets from the PHILOZZ Media Library
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close media picker"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-dim, #9A9AA8)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Folder Filter Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {['all', 'projects', 'articles', 'photos', 'brand', 'general'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFolder(f)}
                style={{
                  padding: '0.25rem 0.65rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: activeFolder === f ? 600 : 500,
                  cursor: 'pointer',
                  border:
                    activeFolder === f
                      ? '1px solid var(--color-gold, #C9A45C)'
                      : '1px solid rgba(255, 255, 255, 0.12)',
                  backgroundColor:
                    activeFolder === f ? 'rgba(201, 164, 92, 0.16)' : 'transparent',
                  color:
                    activeFolder === f
                      ? 'var(--color-gold-light, #E4C88A)'
                      : 'var(--color-text-dim, #9A9AA8)',
                  textTransform: 'capitalize',
                  transition: 'all 0.15s ease',
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 200px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '0.7rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-dim, #9A9AA8)',
              }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search filename, alt text, tag..."
              style={{
                width: '100%',
                padding: '0.4rem 0.7rem 0.4rem 2.2rem',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: 'var(--color-ivory, #F6F3EC)',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Modal Body: Asset Grid + Side Inspector */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: selectedAsset ? '1fr 280px' : '1fr',
            minHeight: '360px',
          }}
        >
          {/* Asset Grid */}
          <div
            style={{
              padding: '1.25rem',
              overflowY: 'auto',
            }}
          >
            {isLoading ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '240px',
                  color: 'var(--color-text-dim, #9A9AA8)',
                  fontSize: '0.88rem',
                }}
              >
                Loading media library assets...
              </div>
            ) : filteredAssets.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '3rem 1rem',
                  color: 'var(--color-text-dim, #9A9AA8)',
                }}
              >
                <ImageIcon size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                <div style={{ fontSize: '0.92rem', fontWeight: 500 }}>No assets found</div>
                <div style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>
                  Try adjusting your search terms or active folder filter.
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
                  gap: '0.85rem',
                }}
              >
                {filteredAssets.map((asset) => {
                  const isSelected = selectedAsset?.id === asset.id;
                  const isCurrent = currentValue === asset.url;
                  const isImage = asset.mimeType.startsWith('image/');

                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => setSelectedAsset(asset)}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        textAlign: 'left',
                        padding: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '8px',
                        border: isSelected
                          ? '2px solid var(--color-gold, #C9A45C)'
                          : isCurrent
                          ? '1px solid rgba(201, 164, 92, 0.4)'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease, border-color 0.15s ease',
                      }}
                    >
                      {/* Thumbnail Box */}
                      <div
                        style={{
                          height: '95px',
                          position: 'relative',
                          backgroundColor: '#0a0a0d',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        {isImage ? (
                          <Image
                            src={asset.url}
                            alt={asset.altText || asset.filename}
                            fill
                            sizes="150px"
                            style={{ objectFit: 'cover' }}
                            unoptimized={asset.mimeType === 'image/svg+xml'}
                          />
                        ) : (
                          <FileText size={32} style={{ color: 'var(--color-gold, #C9A45C)', opacity: 0.8 }} />
                        )}

                        {/* Selected Check Badge */}
                        {isSelected && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '6px',
                              right: '6px',
                              backgroundColor: 'var(--color-gold, #C9A45C)',
                              color: '#0A0A0D',
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.6)',
                            }}
                          >
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}

                        {/* Folder Pill */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '4px',
                            left: '4px',
                            fontSize: '0.65rem',
                            padding: '0.1rem 0.35rem',
                            borderRadius: '3px',
                            backgroundColor: 'rgba(0, 0, 0, 0.75)',
                            color: 'var(--color-gold-light, #E4C88A)',
                            textTransform: 'uppercase',
                            fontWeight: 600,
                          }}
                        >
                          {asset.folder}
                        </div>
                      </div>

                      {/* Name / Metadata */}
                      <div style={{ padding: '0.5rem 0.6rem' }}>
                        <div
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            color: 'var(--color-ivory, #F6F3EC)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={asset.originalName}
                        >
                          {asset.originalName}
                        </div>
                        <div
                          style={{
                            fontSize: '0.68rem',
                            color: 'var(--color-text-dim, #9A9AA8)',
                            marginTop: '2px',
                          }}
                        >
                          {(asset.sizeBytes / 1024).toFixed(0)} KB
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Asset Inspector Side Panel */}
          {selectedAsset && (
            <div
              style={{
                borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                overflowY: 'auto',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    color: 'var(--color-gold, #C9A45C)',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                  }}
                >
                  Selected Asset
                </span>
                <h4
                  style={{
                    margin: '0.2rem 0 0',
                    fontSize: '0.88rem',
                    color: 'var(--color-ivory, #F6F3EC)',
                    wordBreak: 'break-all',
                  }}
                >
                  {selectedAsset.originalName}
                </h4>
              </div>

              {/* Inspector Preview */}
              <div
                style={{
                  width: '100%',
                  height: '140px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  backgroundColor: '#0a0a0d',
                  position: 'relative',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selectedAsset.mimeType.startsWith('image/') ? (
                  <Image
                    src={selectedAsset.url}
                    alt={selectedAsset.altText || selectedAsset.filename}
                    fill
                    sizes="250px"
                    style={{ objectFit: 'contain' }}
                    unoptimized={selectedAsset.mimeType === 'image/svg+xml'}
                  />
                ) : (
                  <FileText size={48} style={{ color: 'var(--color-gold, #C9A45C)' }} />
                )}
              </div>

              {/* Specs */}
              <div style={{ fontSize: '0.74rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-dim, #9A9AA8)' }}>MIME:</span>
                  <span style={{ color: 'var(--color-ivory, #F6F3EC)' }}>{selectedAsset.mimeType}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-dim, #9A9AA8)' }}>Size:</span>
                  <span style={{ color: 'var(--color-ivory, #F6F3EC)' }}>
                    {(selectedAsset.sizeBytes / 1024).toFixed(1)} KB
                  </span>
                </div>
                {selectedAsset.dimensions && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-dim, #9A9AA8)' }}>Dimensions:</span>
                    <span style={{ color: 'var(--color-gold-light, #E4C88A)', fontFamily: 'monospace' }}>
                      {selectedAsset.dimensions.width} × {selectedAsset.dimensions.height}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-dim, #9A9AA8)' }}>Folder:</span>
                  <span style={{ color: 'var(--color-ivory, #F6F3EC)', textTransform: 'capitalize' }}>
                    {selectedAsset.folder}
                  </span>
                </div>
              </div>

              {/* Alt Text Preview */}
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--color-text-dim, #9A9AA8)', display: 'block' }}>
                  Alt Text:
                </label>
                <div
                  style={{
                    fontSize: '0.74rem',
                    color: 'var(--color-ivory, #F6F3EC)',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    padding: '0.4rem',
                    borderRadius: '4px',
                    marginTop: '0.2rem',
                  }}
                >
                  {selectedAsset.altText || 'No alt text recorded'}
                </div>
              </div>

              {/* Selection Button */}
              <button
                type="button"
                onClick={() => {
                  onSelect(selectedAsset);
                  onClose();
                }}
                className="admin-btn-primary"
                style={{
                  marginTop: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  fontSize: '0.82rem',
                  padding: '0.65rem 1rem',
                  width: '100%',
                }}
              >
                <Check size={16} />
                <span>Use This Asset</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <div style={{ fontSize: '0.76rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
            Total: {filteredAssets.length} asset{filteredAssets.length === 1 ? '' : 's'} available
          </div>
          <button
            type="button"
            onClick={onClose}
            className="admin-btn-outline"
            style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
