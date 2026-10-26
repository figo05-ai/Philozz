'use client';

import React from 'react';
import Image from 'next/image';
import { Mail, ArrowUp, Download, MapPin, Globe } from 'lucide-react';
import { BRAND_INFO, PHOTO_ASSETS } from '@/data/portfolioData';
import { BlogToContactTransition } from '@/components/BlogToContactTransition';
import { ContactSectionConfig, BrandInfoEntity } from '@/cms/models/site';

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

export interface FinaleSceneProps {
  config?: ContactSectionConfig;
  brand?: BrandInfoEntity;
}

export function FinaleScene({ config, brand }: FinaleSceneProps = {}) {
  const sectionTag = config?.sectionTag || "LET'S BUILD SOMETHING GREAT";
  const headline = config?.headline || 'Get In Touch';
  const subheadline =
    config?.subheadline ||
    "Have a project in mind, an architectural challenge to solve, or looking to scale your backend infrastructure? I'm always open to discussing new high-impact opportunities.";
  const email = config?.email || brand?.email || BRAND_INFO.email;
  const location = config?.location || brand?.location || BRAND_INFO.location;
  const domain = brand?.domain || BRAND_INFO.domain;
  const github = brand?.github || BRAND_INFO.github;
  const linkedin = brand?.linkedin || BRAND_INFO.linkedin;
  const cvUrl = config?.secondaryCtaHref || brand?.cvUrl || BRAND_INFO.cvUrl;
  const primaryCtaLabel = config?.primaryCtaLabel || 'Send a Message';
  const secondaryCtaLabel = config?.secondaryCtaLabel || 'View Resume';
  const portraitImageUrl = config?.portraitImageUrl || PHOTO_ASSETS.portraitThinking;
  const scriptBadgeText = config?.scriptBadgeText || 'Same\nPerson.\nStill\nBuilding.';
  const footerTagline = config?.footerTagline || 'Full-Stack Engineer. Backend at Heart.';
  const brandName = brand?.name || BRAND_INFO.name;
  const copyrightNotice =
    config?.copyrightNotice || `© 2026 ${brandName}. All rights reserved.`;

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
              <span>{sectionTag}</span>
            </div>

            <h2 className="font-editorial-large contact-main-heading" style={{ marginBottom: '1.5rem', color: 'var(--color-ivory)' }}>
              {headline.includes(' ') ? (
                <>
                  {headline.substring(0, headline.lastIndexOf(' '))} <span className="font-gold-gradient">{headline.substring(headline.lastIndexOf(' ') + 1)}</span>
                </>
              ) : (
                <span className="font-gold-gradient">{headline}</span>
              )}
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
              {subheadline}
            </p>

            {/* Main Action Buttons */}
            <div className="contact-cta-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center' }}>
              <a
                href={`mailto:${email}`}
                className="btn-gold"
                aria-label={`Send direct email to ${email}`}
              >
                <Mail size={18} />
                <span>{primaryCtaLabel}</span>
              </a>

              <a
                href={cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline-gold"
                aria-label="View and Download Resume PDF"
              >
                <Download size={16} style={{ color: 'var(--color-gold-light)' }} />
                <span>{secondaryCtaLabel}</span>
              </a>
            </div>

            {/* Direct Channels */}
            <div className="contact-links-list contact-channels-group">
              <a href={`mailto:${email}`} className="contact-link-pill">
                <Mail size={16} style={{ color: 'var(--color-gold-light)' }} />
                <span>{email}</span>
              </a>

              <a
                href={linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link-pill"
              >
                <LinkedinIcon size={16} />
                <span>{linkedin.replace(/^https?:\/\/(www\.)?/, '')}</span>
              </a>

              <a
                href={github}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link-pill"
              >
                <GithubIcon size={16} />
                <span>{github.replace(/^https?:\/\/(www\.)?/, '')}</span>
              </a>

              <div className="contact-link-pill" style={{ cursor: 'default' }}>
                <Globe size={16} style={{ color: 'var(--color-gold-light)' }} />
                <span>{domain}</span>
              </div>

              <div className="contact-link-pill" style={{ cursor: 'default' }}>
                <MapPin size={16} style={{ color: 'var(--color-gold-light)' }} />
                <span>{location}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Confident Personal Portrait & Signature */}
          <div className="contact-portrait-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <div className="finale-portrait-box">
              <Image
                src={portraitImageUrl}
                alt={`${brandName} — Same Person. Still Building.`}
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
                {scriptBadgeText.split('\n').map((line, idx, arr) => (
                  <React.Fragment key={idx}>
                    {line}
                    {idx < arr.length - 1 && <br />}
                  </React.Fragment>
                ))}
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
                {brandName}
              </div>
            </div>
          </div>
        </div>

        {/* Site Footer Bar */}
        <div className="site-footer">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-ivory)', letterSpacing: '0.08em' }}>
              {brandName}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem', color: '#D6D6E2' }}>
              {footerTagline}
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
            {copyrightNotice}
          </div>
        </div>
      </div>
    </footer>
  );
}
