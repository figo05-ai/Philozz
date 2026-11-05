'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Menu, X, Download } from 'lucide-react';
import { BRAND_INFO } from '@/data/portfolioData';
import { BrandInfoEntity } from '@/cms/models/site';

export interface NavigationProps {
  brand?: BrandInfoEntity;
}

export function Navigation({ brand }: NavigationProps = {}) {
  const brandName = brand?.name || BRAND_INFO.name;
  const cvUrl = brand?.cvUrl || BRAND_INFO.cvUrl;
  const isCvAvailable = brand?.cvAvailable !== false;
  const isDemoEnvironment = Boolean(brand?.isDemoEnvironment);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);

  // Focus management: move focus into drawer on open, restore on close
  useEffect(() => {
    if (isMobileMenuOpen) {
      wasOpenRef.current = true;
      document.body.style.overflow = 'hidden';

      // Move focus into first focusable element inside drawer
      const timer = setTimeout(() => {
        const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(
          'a, button, [tabindex="0"]'
        );
        firstFocusable?.focus();
      }, 50);

      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = '';
      if (wasOpenRef.current) {
        toggleBtnRef.current?.focus();
        wasOpenRef.current = false;
      }
    }
  }, [isMobileMenuOpen]);

  // Close mobile menu on Escape key press and trap Tab navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isMobileMenuOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setIsMobileMenuOpen(false);
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusables = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Skills', href: '#skills' },
    { label: 'Projects', href: '#projects' },
    { label: 'Blog', href: '#blog' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <header className="nav-header" role="banner">
      <div className="container-editorial nav-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link href="/" className="nav-brand" aria-label={`${brandName} Home`}>
            <span>{brandName}</span>
            <span className="nav-brand-dot" aria-hidden="true" />
          </Link>
          {isDemoEnvironment && (
            <span
              style={{
                fontSize: '0.62rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(201, 164, 92, 0.12)',
                color: 'var(--color-gold-light, #E4C88A)',
                border: '1px solid rgba(201, 164, 92, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
              aria-label="Demo Environment Indicator"
            >
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#E4C88A' }} />
              Demo
            </span>
          )}
        </div>

        {/* Desktop Navigation Links */}
        <nav className="nav-links-desktop" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="nav-link-item">
              {link.label}
            </a>
          ))}

          {isCvAvailable && (
            <a
              href={cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-resume-btn"
              aria-label={`Download ${brand?.developerName || 'Felopater Nabil'} Resume`}
            >
              <span>Resume</span>
              <Download size={15} />
            </a>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          ref={toggleBtnRef}
          type="button"
          className="nav-mobile-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation-drawer"
          aria-label={isMobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div
          ref={drawerRef}
          id="mobile-navigation-drawer"
          className="mobile-menu-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
        >
          <nav className="mobile-menu-links">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="mobile-menu-item"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}

            {isCvAvailable && (
              <div style={{ marginTop: '2rem' }}>
                <a
                  href={cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gold"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span>Download Resume</span>
                  <Download size={16} />
                </a>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
