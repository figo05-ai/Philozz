'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  LaravelLogo,
  PhpLogo,
  MysqlLogo,
  JavascriptLogo,
  ReactLogo,
  NextjsLogo,
  RedisLogo,
  DockerLogo,
  LinuxLogo,
  getTechLogo,
} from './TechLogos';
import {
  FIXED_ORBIT_SLOT_GEOMETRY,
  TechnologyEntity,
  OrbitSlotsTuple,
} from '@/cms/models/technology';

export interface TechnologyItem {
  id: string;
  name: string;
  label: string;
  category: string;
  role: string;
  description: string;
  capability: string;
  logo: React.ComponentType<{ size?: number; className?: string }>;
  logoSize: number;
  x: number; // percentage left (0..100)
  y: number; // percentage top (0..100)
  svgX: number; // viewBox 0..1000
  svgY: number; // viewBox 0..560
  isRear: boolean;
  scale: number;
  floatDelay: string;
}

export const TECHNOLOGIES: TechnologyItem[] = [
  // Rear Row (higher Y, receding in perspective)
  {
    id: 'laravel',
    name: 'Laravel',
    label: 'Laravel',
    category: 'Backend Framework',
    role: 'Service-Oriented MVC, Eloquent ORM, Horizon Queues',
    description: 'REST APIs, background jobs, authentication, and maintainable application architecture.',
    capability: 'Eloquent ORM • Horizon Queues • Service Layers',
    logo: LaravelLogo,
    logoSize: 34,
    x: 18,
    y: 12,
    svgX: 180,
    svgY: 67,
    isRear: true,
    scale: 0.86,
    floatDelay: '0s',
  },
  {
    id: 'php',
    name: 'PHP 8.3',
    label: 'PHP',
    category: 'Backend Language',
    role: 'Strict typing, attributes, fibers, memory profiling',
    description: 'Server-side engineering and robust application development.',
    capability: 'Strict Typing • PHP 8.3 • Memory Profiling',
    logo: PhpLogo,
    logoSize: 38,
    x: 39,
    y: 6,
    svgX: 390,
    svgY: 34,
    isRear: true,
    scale: 0.84,
    floatDelay: '0.4s',
  },
  {
    id: 'mysql',
    name: 'MySQL 8.0',
    label: 'MySQL',
    category: 'Relational Database',
    role: 'Composite indexing, EXPLAIN plan tuning, ACID locks',
    description: 'Database design, transactions, indexes, and query optimization.',
    capability: 'ACID Transactions • Index Tuning • EXPLAIN Plans',
    logo: MysqlLogo,
    logoSize: 36,
    x: 61,
    y: 6,
    svgX: 610,
    svgY: 34,
    isRear: true,
    scale: 0.84,
    floatDelay: '0.8s',
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    label: 'JavaScript',
    category: 'Programming Language',
    role: 'ES2024, async/await, event loop, native DOM APIs',
    description: 'Interactive web functionality and application logic.',
    capability: 'ES2024 • Async/Await • Native DOM APIs',
    logo: JavascriptLogo,
    logoSize: 34,
    x: 82,
    y: 12,
    svgX: 820,
    svgY: 67,
    isRear: true,
    scale: 0.86,
    floatDelay: '1.2s',
  },

  // Front Row (lower Y, foreground)
  {
    id: 'react',
    name: 'React 19',
    label: 'React',
    category: 'Frontend Library',
    role: 'Concurrent mode, server components, accessible UX',
    description: 'Component-driven interfaces and interactive applications.',
    capability: 'Concurrent Mode • Server Components • Accessible UX',
    logo: ReactLogo,
    logoSize: 42,
    x: 10,
    y: 56,
    svgX: 100,
    svgY: 314,
    isRear: false,
    scale: 1.0,
    floatDelay: '1.6s',
  },
  {
    id: 'nextjs',
    name: 'Next.js 16',
    label: 'Next.js',
    category: 'React Framework',
    role: 'App Router, Turbopack, static site pre-rendering',
    description: 'Routing, server rendering, and modern React applications.',
    capability: 'App Router • Turbopack • Hybrid Static/SSR',
    logo: NextjsLogo,
    logoSize: 42,
    x: 29,
    y: 67,
    svgX: 290,
    svgY: 375,
    isRear: false,
    scale: 1.02,
    floatDelay: '2.0s',
  },
  {
    id: 'redis',
    name: 'Redis',
    label: 'Redis',
    category: 'Caching & Queues',
    role: 'Redis Streams, atomic rate limiting, sorted sets',
    description: 'Caching, queues, and efficient background processing.',
    capability: 'Redis Streams • Atomic Rate Limiting • In-Memory Cache',
    logo: RedisLogo,
    logoSize: 44,
    x: 50,
    y: 72,
    svgX: 500,
    svgY: 403,
    isRear: false,
    scale: 1.05,
    floatDelay: '0.2s',
  },
  {
    id: 'docker',
    name: 'Docker',
    label: 'Docker',
    category: 'Containerization',
    role: 'Multi-stage builds, rootless containers, compose',
    description: 'Consistent application environments and containerized workflows.',
    capability: 'Multi-Stage Builds • Compose Orchestration • Rootless Containers',
    logo: DockerLogo,
    logoSize: 42,
    x: 71,
    y: 67,
    svgX: 710,
    svgY: 375,
    isRear: false,
    scale: 1.02,
    floatDelay: '0.6s',
  },
  {
    id: 'linux',
    name: 'Linux',
    label: 'Linux',
    category: 'Operating System',
    role: 'Nginx, systemd supervisor daemons, security hardening',
    description: 'Development environments, server administration, and deployment workflows.',
    capability: 'Nginx Tuning • Systemd Services • Shell Automation',
    logo: LinuxLogo,
    logoSize: 42,
    x: 90,
    y: 56,
    svgX: 900,
    svgY: 314,
    isRear: false,
    scale: 1.0,
    floatDelay: '1.0s',
  },
];

/**
 * Resolves 9 active TechnologyItem instances from repository entities and orbit slots.
 * Maps technology content directly onto fixed system-controlled OrbitSlotGeometry,
 * guaranteeing 100% preservation of elliptical orbital coordinates, scales, and depths.
 */
export function resolveOrbitItems(
  technologies?: TechnologyEntity[],
  orbitSlots?: OrbitSlotsTuple
): TechnologyItem[] {
  if (!technologies || technologies.length === 0 || !orbitSlots || orbitSlots.length !== 9) {
    return TECHNOLOGIES;
  }

  const techMap = new Map(technologies.map((t) => [t.id, t]));
  const resolved: TechnologyItem[] = [];

  for (let i = 0; i < 9; i++) {
    const slotId = orbitSlots[i];
    const tech = techMap.get(slotId);
    const geom = FIXED_ORBIT_SLOT_GEOMETRY[i];

    if (!tech) {
      resolved.push(TECHNOLOGIES[i]);
      continue;
    }

    resolved.push({
      id: tech.id,
      name: tech.name,
      label: tech.label,
      category: tech.category,
      role: tech.role,
      description: tech.description,
      capability: tech.capability,
      logo: getTechLogo(tech.logoKey),
      logoSize: geom.logoSize,
      x: geom.x,
      y: geom.y,
      svgX: geom.svgX,
      svgY: geom.svgY,
      isRear: geom.isRear,
      scale: geom.scale,
      floatDelay: geom.floatDelay,
    });
  }

  return resolved;
}

export interface TechOrbitEcosystemProps {
  items?: TechnologyItem[];
}

export function TechOrbitEcosystem({ items = TECHNOLOGIES }: TechOrbitEcosystemProps = {}) {
  const [hoveredItem, setHoveredItem] = useState<TechnologyItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<TechnologyItem | null>(null);

  // Active item prioritizes current hover, falling back to locked selection
  const activeItem = hoveredItem ?? selectedItem;

  const handleToggleSelect = useCallback((item: TechnologyItem) => {
    setSelectedItem((prev) => (prev?.id === item.id ? null : item));
  }, []);

  // Keyboard navigation handler for pedestals with Arrow Key traversal
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, item: TechnologyItem) => {
      const currentIndex = items.findIndex((t) => t.id === item.id);

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggleSelect(item);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedItem(null);
        setHoveredItem(null);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % items.length;
        const nextItem = items[nextIndex];
        const nextEl = document.getElementById(`pedestal-${nextItem.id}`);
        nextEl?.focus();
        setSelectedItem(nextItem);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + items.length) % items.length;
        const prevItem = items[prevIndex];
        const prevEl = document.getElementById(`pedestal-${prevItem.id}`);
        prevEl?.focus();
        setSelectedItem(prevItem);
      }
    },
    [items, handleToggleSelect]
  );

  // Keyboard navigation handler for mobile tablist chips
  const handleChipKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let targetIndex = -1;
      if (e.key === 'ArrowRight') {
        targetIndex = (index + 1) % items.length;
      } else if (e.key === 'ArrowLeft') {
        targetIndex = (index - 1 + items.length) % items.length;
      } else if (e.key === 'Home') {
        targetIndex = 0;
      } else if (e.key === 'End') {
        targetIndex = items.length - 1;
      }

      if (targetIndex !== -1) {
        e.preventDefault();
        const targetItem = items[targetIndex];
        setSelectedItem(targetItem);
        const targetBtn = document.getElementById(`tech-chip-${targetItem.id}`);
        targetBtn?.focus();
      }
    },
    [items]
  );

  // Clear hover on window blur or unmount
  useEffect(() => {
    const handleWindowClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest('.tech-orbit-stage') && !target?.closest('.mobile-tech-chips')) {
        setSelectedItem(null);
      }
    };
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  return (
    <div className="tech-ecosystem-container">
      {/* 3D Technology Orbit Stage */}
      <div
        className={`tech-orbit-stage ${activeItem ? 'has-active-focus' : ''}`}
        aria-label="PHILOZZ 3D Technology Orbit Ecosystem"
      >
        {/* 3D Glowing Golden Orbital Ellipse Rings & Connection Beam */}
        <svg
          className="tech-orbit-svg"
          viewBox="0 0 1000 560"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            {/* Golden Ring Gradients */}
            <linearGradient id="goldRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C9A45C" stopOpacity="0.8" />
              <stop offset="25%" stopColor="#F5E4B8" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#C9A45C" stopOpacity="0.6" />
              <stop offset="75%" stopColor="#9A7836" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#E4C88A" stopOpacity="0.7" />
            </linearGradient>

            <linearGradient id="focusBeamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF4D4" stopOpacity="0.95" />
              <stop offset="45%" stopColor="#C9A45C" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#9A7836" stopOpacity="0.55" />
            </linearGradient>

            <radialGradient id="orbitCenterGlow" cx="50%" cy="45%" r="45%">
              <stop offset="0%" stopColor="#C9A45C" stopOpacity="0.22" />
              <stop offset="40%" stopColor="#C9A45C" stopOpacity="0.08" />
              <stop offset="80%" stopColor="#0E0E14" stopOpacity="0" />
            </radialGradient>

            <filter id="goldGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="beamGlowFilter" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Ambient Center Warm Floor Glow */}
          <ellipse cx="500" cy="270" rx="420" ry="210" fill="url(#orbitCenterGlow)" />

          {/* Outer Golden Elliptical Ring (Thinner, ambient) */}
          <ellipse
            cx="500"
            cy="265"
            rx="445"
            ry="220"
            stroke="url(#goldRingGrad)"
            strokeWidth="1.2"
            strokeDasharray="8 6"
            opacity="0.45"
          />

          {/* Main Illuminated Golden Ellipse Ring */}
          <ellipse
            cx="500"
            cy="265"
            rx="420"
            ry="205"
            stroke="url(#goldRingGrad)"
            strokeWidth="2.5"
            filter="url(#goldGlowFilter)"
            opacity="0.95"
          />

          {/* Inner Golden Ellipse Ring */}
          <ellipse
            cx="500"
            cy="265"
            rx="380"
            ry="185"
            stroke="#C9A45C"
            strokeWidth="1.0"
            opacity="0.35"
          />

          {/* Concentric Golden Orbit Guides */}
          <ellipse
            cx="500"
            cy="265"
            rx="260"
            ry="125"
            stroke="#C9A45C"
            strokeWidth="0.8"
            strokeDasharray="4 4"
            opacity="0.25"
          />

          {/* Radial Perspective Axis Rays */}
          <line x1="500" y1="60" x2="500" y2="470" stroke="#C9A45C" strokeWidth="0.75" opacity="0.15" />
          <line x1="80" y1="265" x2="920" y2="265" stroke="#C9A45C" strokeWidth="0.75" opacity="0.15" />

          {/* Golden Focus Connection Beam to Central Hub */}
          {activeItem && (
            <g className="tech-focus-beam-group" key={activeItem.id}>
              {/* Soft Golden Ambient Halo Beam */}
              <path
                d={`M ${activeItem.svgX} ${activeItem.svgY} Q ${(activeItem.svgX + 500) / 2} ${
                  (activeItem.svgY + 270) / 2 + (activeItem.isRear ? 18 : -18)
                } 500 270`}
                fill="none"
                stroke="url(#focusBeamGrad)"
                strokeWidth="5.5"
                strokeLinecap="round"
                opacity="0.3"
                filter="url(#beamGlowFilter)"
              />

              {/* Sharp High-Precision Golden Core Connection Beam */}
              <path
                d={`M ${activeItem.svgX} ${activeItem.svgY} Q ${(activeItem.svgX + 500) / 2} ${
                  (activeItem.svgY + 270) / 2 + (activeItem.isRear ? 18 : -18)
                } 500 270`}
                fill="none"
                stroke="url(#focusBeamGrad)"
                strokeWidth="2.2"
                strokeLinecap="round"
                className="tech-focus-beam-active"
                filter="url(#beamGlowFilter)"
              />

              {/* Origin Node on Selected Platform Base */}
              <circle cx={activeItem.svgX} cy={activeItem.svgY} r="6.5" fill="#FFF8E7" opacity="0.95" />
              <circle cx={activeItem.svgX} cy={activeItem.svgY} r="14" fill="url(#orbitCenterGlow)" opacity="0.7" />

              {/* Destination Arrival Node at Hub */}
              <circle cx="500" cy="270" r="7.5" fill="#FFF8E7" opacity="0.9" />
              <circle cx="500" cy="270" r="16" fill="url(#orbitCenterGlow)" opacity="0.75" />
            </g>
          )}
        </svg>

        {/* Central PHILOZZ Ecosystem Hub Badge */}
        <div className={`orbit-center-badge ${activeItem ? 'hub-active' : ''}`}>
          <div className="orbit-center-brand">P H I L O Z Z</div>
          <div className="orbit-center-sub">
            {activeItem ? `— ${activeItem.label.toUpperCase()} —` : '— FULL-STACK —'}
          </div>
          <div className="orbit-center-eco">{activeItem ? 'ACTIVE PLATFORM' : 'ECOSYSTEM'}</div>
        </div>

        {/* 9 3D Raised Technology Pedestals */}
        {items.map((item) => {
          const Logo = item.logo;
          const isFocused = activeItem?.id === item.id;
          const isSelected = selectedItem?.id === item.id;

          return (
            <div
              key={item.id}
              id={`pedestal-${item.id}`}
              className={`tech-pedestal-node ${item.isRear ? 'node-rear' : 'node-front'} ${
                isFocused ? 'is-focused' : ''
              } ${isSelected ? 'is-selected' : ''}`}
              style={
                {
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  animationDelay: item.floatDelay,
                  '--node-scale': item.scale,
                  transform: `translate(-50%, -50%) scale(${item.scale})`,
                } as React.CSSProperties
              }
              onMouseEnter={() => setHoveredItem(item)}
              onMouseLeave={() => setHoveredItem(null)}
              onPointerEnter={() => setHoveredItem(item)}
              onPointerLeave={() => setHoveredItem(null)}
              onFocus={() => setHoveredItem(item)}
              onBlur={() => setHoveredItem(null)}
              onClick={() => handleToggleSelect(item)}
              onKeyDown={(e) => handleKeyDown(e, item)}
              tabIndex={0}
              role="button"
              aria-pressed={isSelected}
              aria-label={`${item.name} technology platform. ${item.category}. ${item.description}`}
            >
              {/* Floor Ambient Shadow & Warm Gold Orbit Reflection */}
              <div className="portal-floor-shadow" aria-hidden="true" />

              {/* 3D Black Hole Portal Chamber with Physical Z-Index Occlusion */}
              <div className="portal-chamber">
                {/* Layer 1 (z-index 1): Back Rim & Recessed Cavity Void (Behind Logo) */}
                <div className="portal-back-layer" aria-hidden="true">
                  <svg viewBox="0 0 88 34" className="portal-svg-canvas" fill="none">
                    <defs>
                      <linearGradient id={`backRimGrad-${item.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#5E4316" />
                        <stop offset="25%" stopColor="#A88236" />
                        <stop offset="50%" stopColor="#DFBF7A" />
                        <stop offset="75%" stopColor="#A88236" />
                        <stop offset="100%" stopColor="#5E4316" />
                      </linearGradient>

                      {/* Recessed Inner Funnel Surface Gradient */}
                      <linearGradient id={`cavityGrad-${item.id}`} x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stopColor="#281D0B" stopOpacity="0.9" />
                        <stop offset="35%" stopColor="#100C05" stopOpacity="0.98" />
                        <stop offset="100%" stopColor="#000000" stopOpacity="1" />
                      </linearGradient>

                      {/* Deep Obsidian Event Horizon Void */}
                      <radialGradient id={`voidGrad-${item.id}`} cx="50%" cy="50%" rx="50%" ry="50%">
                        <stop offset="0%" stopColor="#000000" />
                        <stop offset="75%" stopColor="#000000" />
                        <stop offset="100%" stopColor="#0A0806" />
                      </radialGradient>
                    </defs>

                    {/* Outer Recessed Cavity Surface */}
                    <ellipse cx="44" cy="17" rx="42" ry="14.5" fill={`url(#cavityGrad-${item.id})`} />

                    {/* Pitch-Black Obsidian Void */}
                    <ellipse cx="44" cy="17.5" rx="36" ry="10.5" fill={`url(#voidGrad-${item.id})`} />

                    {/* Subtle Recessed Inner Rim Horizon */}
                    <path
                      d="M 8 17 A 36 10.5 0 0 1 80 17"
                      stroke="#8E6E2E"
                      strokeWidth="0.8"
                      strokeOpacity="0.6"
                      className="portal-inner-rim-line"
                    />

                    {/* Metallic Gold Back Rim Arc (Top half of ellipse) */}
                    <path
                      d="M 2 17 A 42 14.5 0 0 1 86 17"
                      stroke={`url(#backRimGrad-${item.id})`}
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      className="portal-back-rim-line"
                    />

                    {/* Restrained Core Glow */}
                    <ellipse
                      cx="44"
                      cy="17.5"
                      rx="22"
                      ry="6"
                      fill="#C9A45C"
                      opacity="0.08"
                      className="portal-core-aura"
                    />
                  </svg>
                </div>

                {/* Layer 2 (z-index 2): Emerging Logo (Rises directly from the Void Center) */}
                <div className="portal-emerging-logo-wrap">
                  <div className="portal-logo-glow" aria-hidden="true" />
                  <div className="portal-logo-element">
                    <Logo size={item.logoSize} />
                  </div>
                </div>

                {/* Layer 3 (z-index 3): Foreground Rim (Overlaps Lower Emergence Area) */}
                <div className="portal-front-layer" aria-hidden="true">
                  <svg viewBox="0 0 88 34" className="portal-svg-canvas" fill="none">
                    <defs>
                      {/* Metallic Gold Front Rim Gradient with Specular Sheen */}
                      <linearGradient id={`frontRimGrad-${item.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#5E4316" />
                        <stop offset="18%" stopColor="#B38F44" />
                        <stop offset="50%" stopColor="#FFF2D1" />
                        <stop offset="82%" stopColor="#B38F44" />
                        <stop offset="100%" stopColor="#5E4316" />
                      </linearGradient>

                      {/* Highlight Glare on Front Lip */}
                      <linearGradient id={`lipHighlight-${item.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#C9A45C" stopOpacity="0" />
                        <stop offset="35%" stopColor="#FFF8E7" stopOpacity="0.95" />
                        <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
                        <stop offset="65%" stopColor="#FFF8E7" stopOpacity="0.95" />
                        <stop offset="100%" stopColor="#C9A45C" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Solid Metallic Gold Front Rim Collar (Physically occludes lower edge of emerging logo) */}
                    <path
                      d="M 2 17 A 42 14.5 0 0 0 86 17 L 80 17 A 36 10.5 0 0 1 8 17 Z"
                      fill={`url(#frontRimGrad-${item.id})`}
                      className="portal-front-collar"
                    />

                    {/* Outer Metallic Gold Front Rim Arc */}
                    <path
                      d="M 2 17 A 42 14.5 0 0 0 86 17"
                      stroke={`url(#frontRimGrad-${item.id})`}
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      className="portal-front-rim-line"
                    />

                    {/* Crisp Inner Front Specular Lip */}
                    <path
                      d="M 8 17 A 36 10.5 0 0 0 80 17"
                      stroke={`url(#lipHighlight-${item.id})`}
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      className="portal-front-lip-line"
                    />

                    {/* Specular Glare Arc */}
                    <path
                      d="M 24 29 A 21 4.5 0 0 0 64 29"
                      stroke="#FFFFFF"
                      strokeWidth="1.0"
                      strokeLinecap="round"
                      opacity="0.85"
                    />
                  </svg>
                </div>
              </div>

              {/* Technology Label Grounded Beneath the Portal */}
              <div className="portal-label">{item.label}</div>
            </div>
          );
        })}
      </div>

      {/* Synchronized Mobile Technology Chips Selector (Accessible 44px Tap Targets) */}
      <div className="mobile-tech-chips" role="tablist" aria-label="Technology platform selector">
        {items.map((item, idx) => {
          const isSelected = activeItem?.id === item.id;
          const ChipLogo = item.logo;
          return (
            <button
              key={item.id}
              id={`tech-chip-${item.id}`}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`tech-chip-btn ${isSelected ? 'is-selected' : ''}`}
              onClick={() => handleToggleSelect(item)}
              onKeyDown={(e) => handleChipKeyDown(e, idx)}
            >
              <span className="chip-icon-wrap" aria-hidden="true">
                <ChipLogo size={14} />
              </span>
              <span className="chip-label">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Unified Reusable Technology Focus Information Console */}
      <div
        className={`tech-focus-console ${activeItem ? 'is-active' : 'is-standby'}`}
        aria-live="polite"
        aria-atomic="true"
      >
        {activeItem ? (
          <div className="console-active-content">
            <div className="console-top-row">
              <div className="console-title-wrap">
                <span className="console-tech-name">{activeItem.name}</span>
                <span className="console-tech-sep">•</span>
                <span className="console-tech-category">{activeItem.category}</span>
              </div>
              <div className="console-capability-pill">
                <span className="console-pulse-dot" aria-hidden="true" />
                <span className="console-capability-text">{activeItem.capability}</span>
              </div>
            </div>
            <p className="console-description">{activeItem.description}</p>
          </div>
        ) : (
          <div className="console-standby-content">
            <span className="console-standby-badge">
              <span className="console-standby-dot" aria-hidden="true" />
              TECHNOLOGY FOCUS MODE
            </span>
            <span className="console-standby-text">
              Select or hover any platform to inspect architectural capabilities
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
