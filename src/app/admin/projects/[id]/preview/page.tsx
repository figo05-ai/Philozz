import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Cpu,
  Edit,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { requireAdminSession } from '@/lib/auth/requireAdminSession';
import { projectRepository } from '@/cms/repositories';
import { ProjectSchematicVisual } from '@/components/ProjectSchematicVisual';

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = await projectRepository.getById(id, { includeDeleted: true });

  return {
    title: project ? `Preview: ${project.title}` : 'Project Preview',
    description: 'Owner Private Preview — Engineering Case Study',
    robots: {
      index: false,
      follow: false,
      noarchive: true,
      nocache: true,
    },
  };
}

export default async function AdminProjectPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSession();
  const { id } = await params;

  const project = await projectRepository.getById(id, { includeDeleted: true });
  if (!project) {
    notFound();
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-obsidian, #0A0A0D)', color: 'var(--color-ivory, #F6F3EC)' }}>
      {/* Sticky Owner Preview Banner */}
      <header
        role="region"
        aria-label="Owner Preview Controls"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'rgba(22, 22, 29, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(201, 164, 92, 0.35)',
          padding: '0.75rem 1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'rgba(201, 164, 92, 0.15)',
                color: 'var(--color-gold, #C9A45C)',
                border: '1px solid rgba(201, 164, 92, 0.35)',
                borderRadius: '6px',
                padding: '0.25rem 0.55rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                fontFamily: 'var(--font-mono, monospace)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <ShieldAlert size={13} />
              <span>Owner Preview</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  backgroundColor:
                    project.isDeleted
                      ? 'rgba(239, 68, 68, 0.15)'
                      : project.status === 'published'
                      ? 'rgba(52, 211, 153, 0.15)'
                      : 'rgba(201, 164, 92, 0.15)',
                  color:
                    project.isDeleted
                      ? '#F87171'
                      : project.status === 'published'
                      ? '#34D399'
                      : 'var(--color-gold-light, #E4C88A)',
                  border: `1px solid ${
                    project.isDeleted
                      ? 'rgba(239, 68, 68, 0.3)'
                      : project.status === 'published'
                      ? 'rgba(52, 211, 153, 0.3)'
                      : 'rgba(201, 164, 92, 0.3)'
                  }`,
                }}
              >
                {project.isDeleted ? 'In Trash' : project.status.toUpperCase()}
              </span>

              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
                Slug: <code style={{ color: 'var(--color-ivory)' }}>/work/{project.slug}</code>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Link
              href="/admin/projects"
              className="admin-btn admin-btn-ghost"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', minHeight: '32px' }}
            >
              <ArrowLeft size={14} />
              <span>Projects Studio</span>
            </Link>

            <Link
              href={`/admin/projects/${project.id}`}
              className="admin-btn admin-btn-secondary"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', minHeight: '32px' }}
            >
              <Edit size={14} />
              <span>Edit Case Study</span>
            </Link>

            {project.status === 'published' && !project.isDeleted && (
              <Link
                href={`/work/${project.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-btn admin-btn-primary"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', minHeight: '32px' }}
              >
                <span>Live View</span>
                <ExternalLink size={14} />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Case Study Container Matching Public Page Fidelity */}
      <main style={{ maxWidth: '1080px', margin: '0 auto', padding: '3.5rem 1.5rem 6rem' }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '2.5rem' }}>
          <Link
            href="/admin/projects"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.9rem',
              color: 'var(--color-gold-light, #E4C88A)',
              textDecoration: 'none',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            <ArrowLeft size={16} />
            <span>RETURN TO PROJECTS STUDIO</span>
          </Link>
        </div>

        {/* Case Study Header */}
        <header style={{ marginBottom: '4rem' }}>
          <div
            style={{
              display: 'inline-block',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-mono, monospace)',
              color: 'var(--color-gold-light, #E4C88A)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '1rem',
              padding: '4px 12px',
              borderRadius: '4px',
              backgroundColor: 'rgba(201, 164, 92, 0.1)',
              border: '1px solid rgba(201, 164, 92, 0.25)',
            }}
          >
            {project.categoryLabel || project.category}
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-serif, serif)',
              fontSize: 'clamp(2.4rem, 5vw, 3.6rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: '1.25rem',
              color: 'var(--color-ivory, #F6F3EC)',
            }}
          >
            {project.title}
          </h1>

          <p
            style={{
              fontSize: 'clamp(1.15rem, 2vw, 1.35rem)',
              lineHeight: 1.6,
              color: 'var(--color-text-dim, #9A9AA8)',
              maxWidth: '68ch',
              marginBottom: '2.5rem',
            }}
          >
            {project.tagline}
          </p>

          {/* Action CTAs */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
            {project.hasLiveDemo && project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <span>Live System Demo</span>
                <ArrowUpRight size={16} />
              </a>
            )}

            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: 'var(--color-ivory, #F6F3EC)',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                }}
              >
                <span>Inspect Repository</span>
                <ArrowUpRight size={16} />
              </a>
            )}
          </div>

          {/* Metadata Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.5rem',
              padding: '2rem',
              backgroundColor: 'var(--color-charcoal, #121218)',
              borderRadius: '12px',
              border: '1px solid var(--color-border-dark, rgba(201, 164, 92, 0.15))',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  color: 'var(--color-gold-light, #E4C88A)',
                  letterSpacing: '0.08em',
                  fontWeight: 600,
                }}
              >
                ENGINEERING ROLE
              </div>
              <div style={{ fontWeight: 700, marginTop: '8px', fontSize: '1.05rem', color: 'var(--color-ivory, #F6F3EC)' }}>
                {project.role}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  color: 'var(--color-gold-light, #E4C88A)',
                  letterSpacing: '0.08em',
                  fontWeight: 600,
                }}
              >
                CLIENT / CONTEXT
              </div>
              <div style={{ fontWeight: 700, marginTop: '8px', fontSize: '1.05rem', color: 'var(--color-ivory, #F6F3EC)' }}>
                {project.clientOrContext}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  color: 'var(--color-gold-light, #E4C88A)',
                  letterSpacing: '0.08em',
                  fontWeight: 600,
                }}
              >
                TIMELINE & STATUS
              </div>
              <div style={{ fontWeight: 700, marginTop: '8px', fontSize: '1.05rem', color: 'var(--color-ivory, #F6F3EC)' }}>
                {project.period}
              </div>
            </div>
          </div>
        </header>

        {/* Live Interactive / Demo Schematic Visual */}
        <section style={{ marginBottom: '5rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.88rem',
              fontFamily: 'var(--font-mono, monospace)',
              color: 'var(--color-gold-light, #E4C88A)',
              letterSpacing: '0.08em',
              marginBottom: '1.15rem',
              fontWeight: 600,
            }}
          >
            <Cpu size={16} />
            <span>INTERACTIVE SYSTEM RUNTIME VISUALIZATION</span>
          </div>
          <ProjectSchematicVisual type={project.demoVisualType} />
        </section>

        {/* Engineering Challenge & Summary */}
        <section style={{ marginBottom: '5rem' }}>
          <h2
            style={{
              fontFamily: 'var(--font-serif, serif)',
              fontSize: '2.1rem',
              fontWeight: 800,
              marginBottom: '1.25rem',
              color: 'var(--color-ivory, #F6F3EC)',
            }}
          >
            The Engineering Challenge
          </h2>
          <p
            style={{
              fontSize: '1.15rem',
              lineHeight: 1.75,
              color: 'var(--color-ivory, #F6F3EC)',
              marginBottom: '1.5rem',
              maxWidth: '72ch',
            }}
          >
            {project.challenge}
          </p>
          <p
            style={{
              fontSize: '1.05rem',
              lineHeight: 1.72,
              color: 'var(--color-ivory, #F6F3EC)',
              maxWidth: '72ch',
            }}
          >
            {project.summary}
          </p>
        </section>

        {/* Core Architectural Responsibilities */}
        {project.responsibilities?.length > 0 && (
          <section style={{ marginBottom: '5rem' }}>
            <h2
              style={{
                fontFamily: 'var(--font-serif, serif)',
                fontSize: '2.1rem',
                fontWeight: 800,
                marginBottom: '1.5rem',
                color: 'var(--color-ivory, #F6F3EC)',
              }}
            >
              Core Architectural Responsibilities
            </h2>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', padding: 0 }}>
              {project.responsibilities.map((resp, idx) => (
                <li
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    background: 'var(--color-charcoal, #121218)',
                    padding: '1.35rem 1.6rem',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border-dark, rgba(201, 164, 92, 0.15))',
                  }}
                >
                  <CheckCircle2 size={22} color="var(--color-gold-light, #E4C88A)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--color-ivory, #F6F3EC)' }}>{resp}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* System Architecture Topology */}
        <section style={{ marginBottom: '5rem' }}>
          <h2
            style={{
              fontFamily: 'var(--font-serif, serif)',
              fontSize: '2.1rem',
              fontWeight: 800,
              marginBottom: '1rem',
              color: 'var(--color-ivory, #F6F3EC)',
            }}
          >
            System Architecture
          </h2>
          <p
            style={{
              fontSize: '1.05rem',
              lineHeight: 1.7,
              color: 'var(--color-ivory, #F6F3EC)',
              marginBottom: '2rem',
              maxWidth: '72ch',
            }}
          >
            {project.architectureSummary}
          </p>

          {project.architectureNodes?.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {project.architectureNodes.map((node) => (
                <div
                  key={node.name}
                  style={{
                    background: 'var(--color-charcoal, #121218)',
                    padding: '1.75rem',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border-dark, rgba(201, 164, 92, 0.15))',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontFamily: 'var(--font-mono, monospace)',
                      color: 'var(--color-gold-light, #E4C88A)',
                      letterSpacing: '0.06em',
                      marginBottom: '8px',
                      fontWeight: 600,
                    }}
                  >
                    {node.tech}
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-ivory, #F6F3EC)' }}>
                    {node.name}
                  </h3>
                  <p style={{ fontSize: '1rem', lineHeight: 1.68, color: 'var(--color-ivory, #F6F3EC)' }}>
                    {node.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Technical Decisions & Trade-Offs */}
        {project.technicalDecisions?.length > 0 && (
          <section style={{ marginBottom: '5rem' }}>
            <h2
              style={{
                fontFamily: 'var(--font-serif, serif)',
                fontSize: '2.1rem',
                fontWeight: 800,
                marginBottom: '1.5rem',
                color: 'var(--color-ivory, #F6F3EC)',
              }}
            >
              Key Technical Decisions & Trade-Offs
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {project.technicalDecisions.map((decision) => (
                <div
                  key={decision.title}
                  style={{
                    background: 'var(--color-charcoal, #121218)',
                    border: '1px solid var(--color-border-dark, rgba(201, 164, 92, 0.15))',
                    borderLeft: '4px solid var(--color-gold-light, #E4C88A)',
                    borderRadius: '10px',
                    padding: '1.6rem 1.85rem',
                  }}
                >
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-ivory, #F6F3EC)' }}>
                    {decision.title}
                  </h3>
                  <p style={{ fontSize: '1.025rem', lineHeight: 1.7, color: 'var(--color-ivory, #F6F3EC)' }}>
                    {decision.rationale}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Technology Stack */}
        {project.technologies?.length > 0 && (
          <section style={{ marginBottom: '5rem' }}>
            <h2
              style={{
                fontFamily: 'var(--font-serif, serif)',
                fontSize: '2.1rem',
                fontWeight: 800,
                marginBottom: '1.25rem',
                color: 'var(--color-ivory, #F6F3EC)',
              }}
            >
              Technologies Deployed
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {project.technologies.map((tech) => (
                <span
                  key={tech}
                  style={{
                    background: 'rgba(201, 164, 92, 0.08)',
                    color: 'var(--color-gold-light, #E4C88A)',
                    border: '1px solid rgba(201, 164, 92, 0.28)',
                    padding: '10px 18px',
                    borderRadius: '6px',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Lessons Learned */}
        {project.lessonsLearned?.length > 0 && (
          <section style={{ marginBottom: '5.5rem' }}>
            <h2
              style={{
                fontFamily: 'var(--font-serif, serif)',
                fontSize: '2.1rem',
                fontWeight: 800,
                marginBottom: '1.5rem',
                color: 'var(--color-ivory, #F6F3EC)',
              }}
            >
              Lessons Learned & Retrospective
            </h2>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', padding: 0 }}>
              {project.lessonsLearned.map((lesson, idx) => (
                <li
                  key={idx}
                  style={{
                    padding: '1.4rem 1.75rem',
                    borderRadius: '10px',
                    background: 'var(--color-charcoal, #121218)',
                    border: '1px solid var(--color-border-dark, rgba(201, 164, 92, 0.15))',
                    fontSize: '1.025rem',
                    lineHeight: 1.7,
                    color: 'var(--color-ivory, #F6F3EC)',
                  }}
                >
                  <strong style={{ color: 'var(--color-gold-light, #E4C88A)' }}>Observation #{idx + 1}:</strong>{' '}
                  <span>{lesson}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
