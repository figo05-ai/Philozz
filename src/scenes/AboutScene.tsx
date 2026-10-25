'use client';

import React from 'react';
import Image from 'next/image';
import { MapPin, Layers, Code2, ArrowRight, Compass, Terminal, CheckCircle2 } from 'lucide-react';
import { BRAND_INFO, PHOTO_ASSETS } from '@/data/portfolioData';

interface AboutSceneProps {
  isTransitionStage?: boolean;
}

export function AboutScene({ isTransitionStage = false }: AboutSceneProps = {}) {
  return (
    <section
      id={isTransitionStage ? undefined : 'about'}
      className="scene-section scene-about"
      aria-labelledby="about-title"
      data-transition-stage={isTransitionStage ? 'true' : undefined}
    >
      <div className="container-editorial">
        <div className="about-grid">
          {/* Left Column: Personal Narrative */}
          <div>
            <div className="section-tag about-anim-tag">
              <span>ABOUT ME</span>
            </div>

            <h2
              id="about-title"
              className="font-editorial-large about-anim-title"
              style={{
                marginBottom: '1.25rem',
              }}
            >
              The Engineer
              <br />
              Behind <span className="font-gold-gradient">{BRAND_INFO.name}.</span>
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
                I&apos;m Felopater Nabil, a backend-focused Full-Stack Software Engineer specializing in PHP and Laravel.
                I build APIs, database-driven applications, and reliable backend workflows that turn complex
                requirements into practical software.
              </p>

              <p
                style={{
                  fontSize: '0.98rem',
                  color: '#D6D6E2',
                  lineHeight: 1.68,
                  marginBottom: '1.85rem',
                }}
              >
                My work spans RESTful API design, database optimization, Redis caching, background jobs, and
                clean application architecture. I enjoy solving engineering problems, exploring better approaches,
                and building systems that are easier to maintain and evolve.
              </p>

              {/* Personal Details / Badges */}
              <div className="about-badges-row">
                <div className="about-badge">
                  <MapPin size={14} style={{ color: 'var(--color-gold-light)' }} />
                  <span>Alexandria, Egypt</span>
                </div>

                <div className="about-badge">
                  <Layers size={14} style={{ color: 'var(--color-gold-light)' }} />
                  <span>Backend Engineering</span>
                </div>

                <div className="about-badge">
                  <Code2 size={14} style={{ color: 'var(--color-gold-light)' }} />
                  <span>Always Building</span>
                </div>
              </div>

              {/* Functional CTA */}
              <a
                href="#skills"
                className="btn-outline-gold about-anim-btn"
                aria-label="Explore my skills and system architecture"
              >
                <span>More About Me</span>
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
                  src={PHOTO_ASSETS.portraitThinking}
                  alt="Felopater Nabil — The Mind Behind the Code"
                  fill
                  sizes="(max-width: 960px) 100vw, 360px"
                  style={{ objectFit: 'cover', objectPosition: 'center 15%' }}
                  priority={false}
                />
                <div className="comp-card-vignette" />
                <div className="comp-corner-mark" aria-hidden="true" />
                <div className="comp-portrait-overlay">
                  <span className="mosaic-badge">
                    <span className="comp-gold-dot" aria-hidden="true" /> THINKING
                  </span>
                  <div className="comp-card-title">The Mind Behind the Code</div>
                  <div className="comp-card-sub">
                    Problem-solving, architecture decisions, and analytical reasoning.
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
                    <Code2 size={11} style={{ marginRight: '4px' }} /> BUILDING
                  </span>
                  <div className="comp-window-dots" aria-hidden="true">
                    <span className="dot red" />
                    <span className="dot yellow" />
                    <span className="dot green" />
                  </div>
                </div>

                {/* Editorial Title & Supporting Text */}
                <div className="comp-card-meta">
                  <div className="comp-card-title">Turning Architecture into Reality</div>
                  <div className="comp-card-sub">
                    Designing APIs, backend workflows, and maintainable systems.
                  </div>
                </div>

                {/* Genuine Backend Code & API Pipeline Visual */}
                <div className="comp-ide-box" aria-hidden="true">
                  <div className="comp-ide-tab">
                    <Terminal size={11} style={{ color: 'var(--color-gold)' }} />
                    <span className="comp-ide-filename">OrderPipeline.php</span>
                    <span className="comp-ide-lang">PHP 8.3 / Laravel</span>
                  </div>
                  <div className="comp-ide-code">
                    <div className="code-line">
                      <span className="k">DB</span>::<span className="f">transaction</span>(<span className="k">fn</span> () =&gt;
                    </div>
                    <div className="code-line indent">
                      <span className="c">Horizon</span>::<span className="f">queue</span>(<span className="v">$job</span>)
                    </div>
                    <div className="code-line">
                      );
                    </div>
                  </div>
                  <div className="comp-ide-telemetry">
                    <span className="t-method">POST</span>
                    <span className="t-route">/api/v1/orders</span>
                    <span className="t-status">
                      <CheckCircle2 size={11} style={{ color: '#10B981' }} />
                      <span>200 OK • 18ms</span>
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
                    <Compass size={11} style={{ marginRight: '4px' }} /> THE JOURNEY
                  </span>
                  <span className="comp-status-pill">
                    <span className="comp-pulse-dot" /> Active Craft
                  </span>
                </div>

                {/* Editorial Title & Supporting Text */}
                <div className="comp-card-meta">
                  <div className="comp-card-title">Continuous Evolution</div>
                  <div className="comp-card-sub">
                    Learning, building, and refining my engineering craft.
                  </div>
                </div>

                {/* Verified Engineering Timeline from CV */}
                <div className="comp-journey-timeline" aria-label="Verified Engineering Timeline">
                  {/* Step 1: MIS Degree */}
                  <div className="timeline-row">
                    <div className="timeline-node-wrap">
                      <span className="timeline-dot" />
                      <span className="timeline-stem" />
                    </div>
                    <div className="timeline-detail">
                      <span className="timeline-heading">Sadat Academy</span>
                      <span className="timeline-info">MIS Degree • Architecture Foundation (GPA 3.58)</span>
                    </div>
                  </div>

                  {/* Step 2: NTI & ITI */}
                  <div className="timeline-row">
                    <div className="timeline-node-wrap">
                      <span className="timeline-dot" />
                      <span className="timeline-stem" />
                    </div>
                    <div className="timeline-detail">
                      <span className="timeline-heading">NTI &amp; ITI Programs</span>
                      <span className="timeline-info">Full-Stack PHP, Laravel &amp; Databases</span>
                    </div>
                  </div>

                  {/* Step 3: SkillUp (Present) */}
                  <div className="timeline-row is-active">
                    <div className="timeline-node-wrap">
                      <span className="timeline-dot is-live" />
                    </div>
                    <div className="timeline-detail">
                      <span className="timeline-heading">SkillUp (2024 — Present)</span>
                      <span className="timeline-info">High-concurrency APIs, Redis &amp; Queues</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
