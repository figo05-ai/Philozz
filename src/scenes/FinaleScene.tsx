'use client';

import React from 'react';
import Image from 'next/image';
import { Mail, ArrowUp, Download, MapPin, Globe } from 'lucide-react';
import { BRAND_INFO, PHOTO_ASSETS } from '@/data/portfolioData';
import { BlogToContactTransition } from '@/components/BlogToContactTransition';

function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function LinkedinIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export function FinaleScene() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="contact" className="content-layer-scroll scene-section scene-finale" role="contentinfo">
      {/* Cinematic Transition Bridge: Blog -> Contact ("THE FINAL COMMIT") */}
      <BlogToContactTransition />

      <div className="container-editorial">
        <div className="finale-grid">
          {/* Left Column: Direct Inquiries & Real Contact Data */}
          <div>
            <div className="section-tag contact-header-tag">
              <span>LET&apos;S BUILD SOMETHING GREAT</span>
            </div>

            <h2 className="font-editorial-large contact-main-heading" style={{ marginBottom: '1.5rem', color: 'var(--color-ivory)' }}>
              Get In <span className="font-gold-gradient">Touch</span>
            </h2>

            <p
              className="contact-desc"
              style={{
                fontSize: 'clamp(1.05rem, 1.8vw, 1.25rem)',
                color: 'var(--color-ivory)',
                lineHeight: 1.68,
                maxWidth: '560px',
                marginBottom: '2.5rem',
              }}
            >
              Have a project in mind, an architectural challenge to solve, or looking to scale your backend infrastructure?
              I&apos;m always open to discussing new high-impact opportunities.
            </p>

            {/* Main Action Buttons */}
            <div className="contact-cta-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center' }}>
              <a
                href={`mailto:${BRAND_INFO.email}`}
                className="btn-gold"
                aria-label={`Send direct email to ${BRAND_INFO.email}`}
              >
                <Mail size={18} />
                <span>Send a Message</span>
              </a>

              <a
                href={BRAND_INFO.cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline-gold"
                aria-label="View and Download Resume PDF"
              >
                <Download size={16} style={{ color: 'var(--color-gold-light)' }} />
                <span>View Resume</span>
              </a>
            </div>

            {/* Direct Channels */}
            <div className="contact-links-list contact-channels-group">
              <a href={`mailto:${BRAND_INFO.email}`} className="contact-link-pill">
                <Mail size={16} style={{ color: 'var(--color-gold-light)' }} />
                <span>{BRAND_INFO.email}</span>
              </a>

              <a
                href={BRAND_INFO.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link-pill"
              >
                <LinkedinIcon size={16} />
                <span>linkedin.com/in/felopter-alexandir</span>
              </a>

              <a
                href={BRAND_INFO.github}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link-pill"
              >
                <GithubIcon size={16} />
                <span>github.com/figo05-ai</span>
              </a>

              <div className="contact-link-pill" style={{ cursor: 'default' }}>
                <Globe size={16} style={{ color: 'var(--color-gold-light)' }} />
                <span>{BRAND_INFO.domain}</span>
              </div>

              <div className="contact-link-pill" style={{ cursor: 'default' }}>
                <MapPin size={16} style={{ color: 'var(--color-gold-light)' }} />
                <span>{BRAND_INFO.location}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Confident Personal Portrait & Signature */}
          <div className="contact-portrait-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <div className="finale-portrait-box">
              <Image
                src={PHOTO_ASSETS.portraitThinking}
                alt="Felopater Nabil — Same Person. Still Building."
                width={840}
                height={1050}
                sizes="(max-width: 960px) 320px, 420px"
                loading="lazy"
                quality={85}
              />

              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, transparent 65%, rgba(10, 10, 13, 0.9) 100%)',
                  pointerEvents: 'none',
                }}
              />
            </div>

            {/* Gold Script Signature Accent stacked like North Star */}
            <div
              className="finale-script-badge"
              style={{
                position: 'absolute',
                top: '50px',
                right: 'clamp(-35px, -3vw, -10px)',
                textAlign: 'left',
                pointerEvents: 'none',
                zIndex: 10,
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-script)',
                  fontSize: 'clamp(1.5rem, 2.2vw, 2.1rem)',
                  color: '#E4C88A',
                  transform: 'rotate(-4deg)',
                  lineHeight: 1.15,
                  textShadow: '0 4px 18px rgba(0,0,0,0.95)',
                }}
              >
                Same
                <br />
                Person.
                <br />
                Still
                <br />
                Building.
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  color: 'var(--color-gold-light)',
                  marginTop: '0.75rem',
                  textTransform: 'uppercase',
                }}
              >
                {BRAND_INFO.name}
              </div>
            </div>
          </div>
        </div>

        {/* Site Footer Bar */}
        <div className="site-footer">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-ivory)', letterSpacing: '0.08em' }}>
              {BRAND_INFO.name}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem', color: '#D6D6E2' }}>
              Full-Stack Engineer. Backend at Heart.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={scrollToTop}
              className="btn-outline-gold"
              style={{ padding: '8px 18px', fontSize: '0.84rem', fontWeight: 600 }}
              aria-label="Scroll back to top of page"
            >
              <ArrowUp size={16} style={{ color: 'var(--color-gold-light)' }} />
              <span>Back to Top</span>
            </button>
          </div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem', color: '#D6D6E2' }}>
            &copy; 2026 {BRAND_INFO.name}. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
