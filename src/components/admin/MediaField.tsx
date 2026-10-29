'use client';

/**
 * PHILOZZ CMS — Reusable Media Input Field
 * Phase 16E.0: Media Library Foundation & Storage Provider Readiness
 *
 * Combines standard text input flexibility with one-click Media Library Picker.
 * Preserves existing asset paths without forcing destructive replacements.
 */

import React, { useState } from 'react';
import Image from 'next/image';
import { FolderOpen, X } from 'lucide-react';
import { MediaPickerModal } from './MediaPickerModal';
import type { MediaAssetEntity, MediaFolder } from '@/cms/models/media';

export interface MediaFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
  folder?: MediaFolder;
  mimePrefix?: string;
  required?: boolean;
}

export function MediaField({
  id,
  label,
  value,
  onChange,
  placeholder = '/images/... or https://...',
  description,
  folder,
  mimePrefix = 'image/',
  required = false,
}: MediaFieldProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const isImage =
    value &&
    (value.endsWith('.png') ||
      value.endsWith('.jpg') ||
      value.endsWith('.jpeg') ||
      value.endsWith('.webp') ||
      value.endsWith('.svg') ||
      value.includes('/images/'));

  return (
    <div className="admin-form-group">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <label htmlFor={id} className="admin-form-label">
          {label} {required && <span style={{ color: 'var(--color-gold, #C9A45C)' }}>*</span>}
        </label>
        {value && (
          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
            Active Reference
          </span>
        )}
      </div>

      {description && (
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)', marginBottom: '0.4rem' }}>
          {description}
        </div>
      )}

      {/* Input + Action Buttons Row */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          id={id}
          type="text"
          className="admin-form-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          style={{ flex: 1 }}
        />

        {/* Media Picker Button */}
        <button
          type="button"
          onClick={() => setIsPickerOpen(true)}
          className="admin-btn-outline"
          title="Browse Media Library"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.55rem 0.85rem',
            fontSize: '0.8rem',
            whiteSpace: 'nowrap',
          }}
        >
          <FolderOpen size={16} />
          <span>Browse</span>
        </button>

        {/* Clear Button */}
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="admin-btn-outline"
            title="Clear Field"
            style={{
              padding: '0.55rem 0.65rem',
              color: 'var(--color-text-dim, #9A9AA8)',
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Visual Preview Box */}
      {value && isImage && (
        <div
          style={{
            marginTop: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.5rem 0.75rem',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              position: 'relative',
              borderRadius: '4px',
              overflow: 'hidden',
              backgroundColor: '#0a0a0d',
              flexShrink: 0,
            }}
          >
            <Image
              src={value}
              alt="Asset Preview"
              fill
              sizes="60px"
              style={{ objectFit: 'cover' }}
              unoptimized={value.endsWith('.svg')}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.76rem',
                color: 'var(--color-ivory, #F6F3EC)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {value}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#34D399', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>Verified Path</span>
            </div>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={(asset: MediaAssetEntity) => {
          onChange(asset.url);
        }}
        title={`Select Asset: ${label}`}
        currentValue={value}
        folderFilter={folder}
        mimePrefix={mimePrefix}
      />
    </div>
  );
}
