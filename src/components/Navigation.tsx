'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Download } from 'lucide-react';
import { BRAND_INFO } from '@/data/portfolioData';

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
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
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="nav-header" role="banner">
        <div className="container-editorial nav-container">
          <Link href="/" className="nav-brand" aria-label="PHILOZZ Home">
            <span>{BRAND_INFO.name}</span>
            <span className="nav-brand-dot" aria-hidden="true" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="nav-links-desktop" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="nav-link-item">
                {link.label}
              </a>
            ))}

            <a
              href={BRAND_INFO.cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-resume-btn"
              aria-label="Download Felopater Nabil Resume"
            >
              <span>Resume</span>
              <Download size={15} />
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="nav-mobile-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="mobile-menu-overlay" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
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

              <div style={{ marginTop: '2rem' }}>
                <a
                  href={BRAND_INFO.cvUrl}
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
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
