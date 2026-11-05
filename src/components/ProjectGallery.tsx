'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';

export interface ProjectGalleryProps {
  images: string[];
  projectTitle: string;
  coverImage?: string;
}

export function ProjectGallery({ images, projectTitle, coverImage }: ProjectGalleryProps) {
  // Combine cover image and gallery images if cover exists and isn't already included
  const displayImages = React.useMemo(() => {
    const list = [...(images || [])].filter(Boolean);
    if (coverImage && !list.includes(coverImage)) {
      list.unshift(coverImage);
    }
    return list;
  }, [images, coverImage]);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    setActiveIndex(index);
  };

  const closeLightbox = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const nextImage = useCallback(() => {
    if (activeIndex === null) return;
    setActiveIndex((prev) => (prev! + 1) % displayImages.length);
  }, [activeIndex, displayImages.length]);

  const prevImage = useCallback(() => {
    if (activeIndex === null) return;
    setActiveIndex((prev) => (prev! - 1 + displayImages.length) % displayImages.length);
  }, [activeIndex, displayImages.length]);

  // Keyboard navigation
  useEffect(() => {
    if (activeIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextImage();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [activeIndex, closeLightbox, nextImage, prevImage]);

  if (displayImages.length === 0) {
    return null;
  }

  return (
    <section className="project-gallery-section" aria-labelledby="project-gallery-title">
      <div className="section-tag" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
        <Layers size={16} style={{ color: 'var(--color-gold-light)' }} />
        <span>SYSTEM INTERFACES & RUNTIME SCREENS</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h2
            id="project-gallery-title"
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.1rem',
              fontWeight: 800,
              color: 'var(--color-ivory)',
              marginBottom: '0.5rem',
            }}
          >
            Project Showcase Gallery
          </h2>
          <p style={{ color: 'var(--color-text-dim)', fontSize: '0.98rem' }}>
            Production dashboard snapshots, architecture schematics, and UI flows. Click any screen to view in full resolution.
          </p>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.82rem',
            color: 'var(--color-gold-light)',
            padding: '0.35rem 0.8rem',
            borderRadius: '9999px',
            background: 'rgba(201, 164, 92, 0.1)',
            border: '1px solid rgba(201, 164, 92, 0.25)',
          }}
        >
          {displayImages.length} {displayImages.length === 1 ? 'SCREENSHOT' : 'SCREENSHOTS'}
        </span>
      </div>

      {/* Responsive Gallery Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: displayImages.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {displayImages.map((src, idx) => (
          <div
            key={src + idx}
            onClick={() => openLightbox(idx)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openLightbox(idx);
              }
            }}
            aria-label={`View screenshot ${idx + 1} of ${projectTitle}`}
            className="gallery-thumb-card"
            style={{
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#0D0E13',
              border: '1px solid var(--color-border-dark)',
              cursor: 'pointer',
              transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              aspectRatio: '16 / 10',
            }}
          >
            <img
              src={src}
              alt={`${projectTitle} screenshot ${idx + 1}`}
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              className="gallery-thumb-img"
            />

            {/* Hover Gradient Overlay */}
            <div
              className="gallery-thumb-overlay"
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, rgba(10,10,13,0.1) 0%, rgba(10,10,13,0.85) 100%)',
                opacity: 0.85,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1rem',
                transition: 'opacity 0.3s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: 'var(--color-gold-light)',
                    background: 'rgba(10, 10, 13, 0.8)',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '4px',
                    border: '1px solid rgba(201, 164, 92, 0.3)',
                  }}
                >
                  SCREENSHOT 0{idx + 1}
                </span>

                <span
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(201, 164, 92, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-gold-light)',
                    border: '1px solid rgba(201, 164, 92, 0.4)',
                  }}
                >
                  <Maximize2 size={15} />
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-ivory)', fontSize: '0.88rem', fontWeight: 600 }}>
                <Sparkles size={14} style={{ color: 'var(--color-gold)' }} />
                <span>Click to expand high-res</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal Dialog */}
      {activeIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${projectTitle} Screenshot Preview`}
          onClick={closeLightbox}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000000,
            backgroundColor: 'rgba(5, 5, 8, 0.94)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1.5rem',
          }}
        >
          {/* Top Bar Controls */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: '1.25rem',
              left: '1.5rem',
              right: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  color: 'var(--color-gold-light)',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                }}
              >
                {`${projectTitle} // Screenshot ${activeIndex + 1} of ${displayImages.length}`}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <a
                href={displayImages[activeIndex]}
                target="_blank"
                rel="noopener noreferrer"
                title="Open original in new tab"
                style={{
                  padding: '0.5rem 0.85rem',
                  background: 'rgba(22, 24, 30, 0.8)',
                  border: '1px solid rgba(201, 164, 92, 0.3)',
                  borderRadius: '6px',
                  color: 'var(--color-gold-light)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)',
                  textDecoration: 'none',
                }}
              >
                <span>Original</span>
                <ExternalLink size={14} />
              </a>

              <button
                type="button"
                onClick={closeLightbox}
                aria-label="Close Lightbox"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(22, 24, 30, 0.85)',
                  border: '1px solid rgba(201, 164, 92, 0.35)',
                  color: 'var(--color-ivory)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Main Large Image Container */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '92vw',
              maxHeight: '82vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={displayImages[activeIndex]}
              alt={`${projectTitle} Fullscreen Screenshot ${activeIndex + 1}`}
              style={{
                maxWidth: '100%',
                maxHeight: '82vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 25px 80px rgba(0, 0, 0, 0.9), 0 0 40px rgba(201, 164, 92, 0.2)',
                border: '1px solid rgba(201, 164, 92, 0.35)',
              }}
            />

            {/* Left Nav Button */}
            {displayImages.length > 1 && (
              <button
                type="button"
                onClick={prevImage}
                aria-label="Previous screenshot"
                style={{
                  position: 'absolute',
                  left: '-3.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: 'rgba(17, 17, 22, 0.85)',
                  border: '1px solid rgba(201, 164, 92, 0.4)',
                  color: 'var(--color-gold-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* Right Nav Button */}
            {displayImages.length > 1 && (
              <button
                type="button"
                onClick={nextImage}
                aria-label="Next screenshot"
                style={{
                  position: 'absolute',
                  right: '-3.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: 'rgba(17, 17, 22, 0.85)',
                  border: '1px solid rgba(201, 164, 92, 0.4)',
                  color: 'var(--color-gold-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Bottom Caption Pill */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              bottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '0.45rem 1.1rem',
              borderRadius: '9999px',
              background: 'rgba(17, 17, 22, 0.85)',
              border: '1px solid rgba(201, 164, 92, 0.25)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              color: 'var(--color-ivory)',
            }}
          >
            <span style={{ color: 'var(--color-gold-light)' }}>Keyboard shortcuts:</span>
            <span>ESC: Close</span>
            <span>← / →: Navigate</span>
          </div>
        </div>
      )}
    </section>
  );
}
