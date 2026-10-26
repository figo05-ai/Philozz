'use client';

import React from 'react';
import Image from 'next/image';
import { MapPin, Layers, Code2, ArrowRight, Compass, Terminal, CheckCircle2 } from 'lucide-react';
import { BRAND_INFO, PHOTO_ASSETS } from '@/data/portfolioData';
import { AboutSectionConfig, BrandInfoEntity } from '@/cms/models/site';

interface AboutSceneProps {
  isTransitionStage?: boolean;
  config?: AboutSectionConfig;
  brand?: BrandInfoEntity;
}

export function AboutScene({ isTransitionStage = false, config, brand }: AboutSceneProps = {}) {
  const sectionTag = config?.sectionTag || 'ABOUT ME';
  const titlePrefix = config?.titlePrefix || 'The Engineer';
  const brandName = brand?.name || BRAND_INFO.name;
  const paragraph1 =
    config?.narrativeParagraph1 ||
    "I'm Felopater Nabil, a backend-focused Full-Stack Software Engineer specializing in PHP and Laravel. I build APIs, database-driven applications, and reliable backend workflows that turn complex requirements into practical software.";
  const paragraph2 =
    config?.narrativeParagraph2 ||
    'My work spans RESTful API design, database optimization, Redis caching, background jobs, and clean application architecture. I enjoy solving engineering problems, exploring better approaches, and building systems that are easier to maintain and evolve.';
  const badges =
    config?.badges && config.badges.length > 0
      ? config.badges
      : [
          { icon: 'MapPin' as const, label: 'Alexandria, Egypt' },
          { icon: 'Layers' as const, label: 'Backend Engineering' },
          { icon: 'Code2' as const, label: 'Always Building' },
        ];
  const ctaLabel = config?.ctaLabel || 'More About Me';
  const ctaHref = config?.ctaHref || '#skills';

  const thinkingCard = config?.mosaicCards?.find((c) => c.id === 'thinking');
  const buildingCard = config?.mosaicCards?.find((c) => c.id === 'building');
  const journeyCard = config?.mosaicCards?.find((c) => c.id === 'journey');

  return (
    <section
      id={isTransitionStage ? undefined : 'about'}
      className="scene-section scene-about"
      aria-labelledby={isTransitionStage ? undefined : 'about-title'}
      data-transition-stage={isTransitionStage ? 'true' : undefined}
      aria-hidden={isTransitionStage ? 'true' : undefined}
      inert={isTransitionStage ? true : undefined}
    >
      <div className="container-editorial">
        <div className="about-grid">
          {/* Left Column: Personal Narrative */}
          <div>
            <div className="section-tag about-anim-tag">
              <span>{sectionTag}</span>
            </div>

            <h2
              id="about-title"
              className="font-editorial-large about-anim-title"
              style={{
                marginBottom: '1.25rem',
              }}
            >
              {titlePrefix}
              <br />
              Behind <span className="font-gold-gradient">{brandName}.</span>
            </h2>

            <div className="about-anim-text">
              <p
                style={{
                  fontSize: 'clamp(1.05rem, 1.4vw, 1.18rem)',
                  color: 'var(--color-ivory)',
                  lineHeight: 1.7,
                  marginBottom: '1.25rem',
                }}
              >
                {paragraph1}
              </p>

              <p
                style={{
                  fontSize: '0.98rem',
                  color: '#D6D6E2',
                  lineHeight: 1.68,
                  marginBottom: '1.85rem',
                }}
              >
                {paragraph2}
              </p>

              {/* Personal Details / Badges */}
              <div className="about-badges-row">
                {badges.map((b, idx) => (
                  <div key={idx} className="about-badge">
                    {b.icon === 'MapPin' && <MapPin size={14} style={{ color: 'var(--color-gold-light)' }} />}
                    {b.icon === 'Layers' && <Layers size={14} style={{ color: 'var(--color-gold-light)' }} />}
                    {b.icon === 'Code2' && <Code2 size={14} style={{ color: 'var(--color-gold-light)' }} />}
                    <span>{b.label}</span>
                  </div>
                ))}
              </div>

              {/* Functional CTA */}
              <a
                href={ctaHref}
                className="btn-outline-gold about-anim-btn"
                aria-label={`${ctaLabel} — Skills and system architecture`}
                tabIndex={isTransitionStage ? -1 : undefined}
              >
                <span>{ctaLabel}</span>
                <ArrowRight size={16} />
              </a>
            </div>
          </div>

          {/* Right Column: Semantic Visual Storytelling Composition */}
          <div className="mosaic-grid about-anim-mosaic" aria-label="Editorial Visuals of Felopater Nabil">
            {/* 1. THINKING — The Mind Behind the Code (Authentic Portrait) */}
            <div className="mosaic-card comp-card-portrait">
              <div className="comp-card-inner">
                <Image
                  src={thinkingCard?.imageUrl || PHOTO_ASSETS.portraitThinking}
                  alt={thinkingCard?.imageAlt || `${brand?.developerName || 'Felopater Nabil'} — The Mind Behind the Code`}
                  fill
                  sizes="(max-width: 960px) 100vw, 360px"
                  style={{ objectFit: 'cover', objectPosition: 'center 15%' }}
                  loading="lazy"
                  quality={85}
                  priority={false}
                />
                <div className="comp-card-vignette" />
                <div className="comp-corner-mark" aria-hidden="true" />
                <div className="comp-portrait-overlay">
                  <span className="mosaic-badge">
                    <span className="comp-gold-dot" aria-hidden="true" /> {thinkingCard?.badge || 'THINKING'}
                  </span>
                  <div className="comp-card-title">{thinkingCard?.title || 'The Mind Behind the Code'}</div>
                  <div className="comp-card-sub">
                    {thinkingCard?.subtitle || 'Problem-solving, architecture decisions, and analytical reasoning.'}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. BUILDING — Turning Architecture into Reality (Real Software Engineering) */}
            <div className="mosaic-card comp-card-building">
              <div className="comp-card-inner comp-building-canvas">
                {/* Header */}
                <div className="comp-card-topbar">
                  <span className="mosaic-badge">
                    <Code2 size={11} style={{ marginRight: '4px' }} /> {buildingCard?.badge || 'BUILDING'}
                  </span>
                  <div className="comp-window-dots" aria-hidden="true">
                    <span className="dot red" />
                    <span className="dot yellow" />
                    <span className="dot green" />
                  </div>
                </div>

                {/* Editorial Title & Supporting Text */}
                <div className="comp-card-meta">
                  <div className="comp-card-title">{buildingCard?.title || 'Turning Architecture into Reality'}</div>
                  <div className="comp-card-sub">
                    {buildingCard?.subtitle || 'Designing APIs, backend workflows, and maintainable systems.'}
                  </div>
                </div>

                {/* Genuine Backend Code & API Pipeline Visual */}
                <div className="comp-ide-box" aria-hidden="true">
                  <div className="comp-ide-tab">
                    <Terminal size={11} style={{ color: 'var(--color-gold)' }} />
                    <span className="comp-ide-filename">{buildingCard?.ideFilename || 'OrderPipeline.php'}</span>
                    <span className="comp-ide-lang">{buildingCard?.ideLang || 'PHP 8.3 / Laravel'}</span>
                  </div>
                  <div className="comp-ide-code">
                    {(buildingCard?.ideSnippet || 'DB::transaction(fn () => {\n  Horizon::queue($job);\n});')
                      .split('\n')
                      .map((line, idx) => (
                        <div key={idx} className={`code-line ${line.startsWith('  ') ? 'indent' : ''}`}>
                          {line}
                        </div>
                      ))}
                  </div>
                  <div className="comp-ide-telemetry">
                    <span className="t-method">POST</span>
                    <span className="t-route">{buildingCard?.telemetryRoute || '/api/v1/orders'}</span>
                    <span className="t-status">
                      <CheckCircle2 size={11} style={{ color: '#10B981' }} />
                      <span>{buildingCard?.telemetryStatus || '200 OK • 18ms'}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. THE JOURNEY — Continuous Evolution (Verified CV Timeline) */}
            <div className="mosaic-card comp-card-journey">
              <div className="comp-card-inner comp-journey-inner">
                {/* Header */}
                <div className="comp-card-topbar">
                  <span className="mosaic-badge">
                    <Compass size={11} style={{ marginRight: '4px' }} /> {journeyCard?.badge || 'THE JOURNEY'}
                  </span>
                  <span className="comp-status-pill">
                    <span className="comp-pulse-dot" /> Active Craft
                  </span>
                </div>

                {/* Editorial Title & Supporting Text */}
                <div className="comp-card-meta">
                  <div className="comp-card-title">{journeyCard?.title || 'Continuous Evolution'}</div>
                  <div className="comp-card-sub">
                    {journeyCard?.subtitle || 'Learning, building, and refining my engineering craft.'}
                  </div>
                </div>

                {/* Verified Engineering Timeline from CV */}
                <div className="comp-journey-timeline" aria-label="Verified Engineering Timeline">
                  {(journeyCard?.timelineItems && journeyCard.timelineItems.length > 0
                    ? journeyCard.timelineItems
                    : [
                        {
                          heading: 'Sadat Academy',
                          info: 'MIS Degree • Architecture Foundation (GPA 3.58)',
                          isActive: false,
                        },
                        {
                          heading: 'NTI & ITI Programs',
                          info: 'Full-Stack PHP, Laravel & Databases',
                          isActive: false,
                        },
                        {
                          heading: 'SkillUp (2024 — Present)',
                          info: 'High-concurrency APIs, Redis & Queues',
                          isActive: true,
                        },
                      ]
                  ).map((item, idx, arr) => (
                    <div key={idx} className={`timeline-row ${item.isActive ? 'is-active' : ''}`}>
                      <div className="timeline-node-wrap">
                        <span className={`timeline-dot ${item.isActive ? 'is-live' : ''}`} />
                        {idx < arr.length - 1 && <span className="timeline-stem" />}
                      </div>
                      <div className="timeline-detail">
                        <span className="timeline-heading">{item.heading}</span>
                        <span className="timeline-info">{item.info}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
