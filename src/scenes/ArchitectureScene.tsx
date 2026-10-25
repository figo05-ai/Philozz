'use client';

import React from 'react';
import {
  Layers,
  Cpu,
  Database,
  ShieldCheck,
  GitBranch,
  Gauge,
  ArrowRight,
} from 'lucide-react';
import { TechOrbitEcosystem } from '@/components/TechOrbitEcosystem';
import { AboutToSkillsTransition } from '@/components/AboutToSkillsTransition';

export function ArchitectureScene() {
  const engineeringDisciplines = [
    { title: 'Clean Architecture', icon: Layers },
    { title: 'RESTful APIs', icon: Cpu },
    { title: 'Database Design', icon: Database },
    { title: 'System Optimization', icon: Gauge },
    { title: 'DevOps & Deployment', icon: GitBranch },
    { title: 'Problem Solving', icon: ShieldCheck },
  ];

  return (
    <section id="skills" className="scene-section scene-skills" aria-labelledby="skills-title">
      {/* Cinematic Transition Bridge: About -> Skills ("FROM CODE TO TECHNOLOGY") */}
      <AboutToSkillsTransition />

      <div className="container-editorial" style={{ maxWidth: '1440px' }}>
        {/* The 3-Part Layout Matching Approved Design Target (IMAGE C) */}
        <div className="tech-stack-triptych">
          {/* Column 1 (Left): Editorial Narrative & Action */}
          <div className="tech-col-left">
            <div className="section-tag">
              <span>MY TECH STACK</span>
            </div>

            <h2 id="skills-title" className="font-editorial-large" style={{ marginBottom: '1.25rem', lineHeight: 1.08 }}>
              Tools for
              <br />
              <span className="font-gold-gradient">Bigger Ideas.</span>
            </h2>

            <p
              style={{
                fontSize: '1.05rem',
                color: 'var(--color-ivory)',
                lineHeight: 1.68,
                marginBottom: '2.5rem',
                maxWidth: '340px',
              }}
            >
              A carefully curated stack to build scalable, secure and high-performance
              web applications.
            </p>

            <a href="#projects" className="btn-outline-gold" style={{ alignSelf: 'flex-start' }}>
              <span>Explore My Skills</span>
              <ArrowRight size={16} />
            </a>
          </div>

          {/* Column 2 (Center): 3D Technology Orbit Ecosystem */}
          <div className="tech-col-center">
            <TechOrbitEcosystem />
          </div>

          {/* Column 3 (Right): Compact Engineering Disciplines List */}
          <div className="tech-col-right" aria-label="Core Engineering Strengths">
            <div className="disciplines-compact-list">
              {engineeringDisciplines.map((item) => {
                const IconComp = item.icon;
                return (
                  <div key={item.title} className="discipline-compact-row">
                    <div className="discipline-compact-icon">
                      <IconComp size={18} />
                    </div>
                    <span className="discipline-compact-label">{item.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
