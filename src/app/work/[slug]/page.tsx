import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, CheckCircle2, Layers, Cpu, Sparkles } from 'lucide-react';
import type { Metadata } from 'next';
import { PROJECTS, BRAND_INFO } from '@/data/portfolioData';
import { ProjectSchematicVisual } from '@/components/ProjectSchematicVisual';
import { getProjectBySlug, getCaseStudyJsonLd, getBreadcrumbJsonLd, SITE_CONFIG } from '@/lib/seoData';

export const instant = false;

export function generateStaticParams() {
  return PROJECTS.map((p) => ({
    slug: p.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project || project.status !== 'published') {
    return {
      title: 'Case Study Not Found',
      robots: { index: false, follow: false },
    };
  }

  const title = project.seoTitle || `${project.title}: ${project.tagline}`;
  const description = project.seoDescription || project.summary;
  const canonicalUrl = `/work/${project.slug}`;
  const ogImage = project.ogImageUrl || '/images/philozz-cinematic-hero.png';

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'article',
      locale: SITE_CONFIG.locale,
      url: `${SITE_CONFIG.url}${canonicalUrl}`,
      siteName: SITE_CONFIG.name,
      title: `${project.title} — Case Study // ${SITE_CONFIG.name}`,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${project.title} — Engineering Case Study`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${project.title} — Case Study // ${SITE_CONFIG.name}`,
      description,
      images: [ogImage],
    },
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const caseStudyJsonLd = getCaseStudyJsonLd(project);
  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Projects', url: '/projects' },
    { name: project.title, url: `/work/${project.slug}` },
  ]);

  // Related projects
  const relatedProjects = PROJECTS.filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-obsidian)', color: 'var(--color-ivory)' }}>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(caseStudyJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* Top Header Navigation */}
      <header
        style={{
          borderBottom: '1px solid var(--color-border-dark)',
          padding: '1.25rem 0',
          position: 'sticky',
          top: 0,
          background: 'rgba(10, 10, 13, 0.92)',
          backdropFilter: 'blur(14px)',
          zIndex: 50,
        }}
      >
        <div className="container-editorial" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link
            href="/#projects"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              color: 'var(--color-gold-light)',
              fontSize: '0.92rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              transition: 'all 0.2s ease',
            }}
          >
            <ArrowLeft size={16} />
            <span>BACK TO PROJECTS</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--color-ivory)' }}>
              {BRAND_INFO.name}
            </span>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-gold)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#D6D6E2', letterSpacing: '0.06em' }}>
              CASE STUDY
            </span>
          </div>
        </div>
      </header>

      <main id="main-content" className="container-editorial" style={{ padding: 'clamp(2.5rem, 5vw, 5rem) 1.5rem', maxWidth: '1180px' }}>
        {/* Project Hero */}
        <section style={{ marginBottom: '4rem' }}>
          <div className="section-tag" style={{ marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            <Layers size={16} style={{ color: 'var(--color-gold-light)' }} />
            <span>ARCHITECTURE CASE STUDY // {project.category.toUpperCase()}</span>
          </div>

          <h1
            className="font-editorial-large"
            style={{
              fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)',
              lineHeight: 1.05,
              marginBottom: '1rem',
              color: 'var(--color-ivory)',
            }}
          >
            {project.title}
          </h1>

          <p
            style={{
              fontSize: 'clamp(1.2rem, 2.2vw, 1.6rem)',
              color: 'var(--color-gold-light)',
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              marginBottom: '2.5rem',
              maxWidth: '75ch',
              lineHeight: 1.4,
            }}
          >
            {project.tagline}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.5rem',
              padding: '1.85rem',
              borderRadius: '12px',
              background: 'var(--color-charcoal)',
              border: '1px solid var(--color-border-dark)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
              marginBottom: '3rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--color-gold-light)', letterSpacing: '0.08em', fontWeight: 600 }}>
                MY ROLE
              </div>
              <div style={{ fontWeight: 700, marginTop: '8px', fontSize: '1.08rem', color: 'var(--color-ivory)', lineHeight: 1.4 }}>
                {project.role}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--color-gold-light)', letterSpacing: '0.08em', fontWeight: 600 }}>
                CLIENT / CONTEXT
              </div>
              <div style={{ fontWeight: 700, marginTop: '8px', fontSize: '1.08rem', color: 'var(--color-ivory)', lineHeight: 1.4 }}>
                {project.clientOrContext}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--color-gold-light)', letterSpacing: '0.08em', fontWeight: 600 }}>
                TIMELINE & STATUS
              </div>
              <div style={{ fontWeight: 700, marginTop: '8px', fontSize: '1.08rem', color: 'var(--color-ivory)', lineHeight: 1.4 }}>
                {project.period}
              </div>
            </div>
          </div>
        </section>

        {/* Live Interactive / Demo Schematic Visual */}
        <section style={{ marginBottom: '5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontFamily: 'var(--font-mono)', color: 'var(--color-gold-light)', letterSpacing: '0.08em', marginBottom: '1.15rem', fontWeight: 600 }}>
            <Cpu size={16} />
            <span>INTERACTIVE SYSTEM RUNTIME VISUALIZATION</span>
          </div>
          <ProjectSchematicVisual type={project.demoVisualType} />
        </section>

        {/* Overview & Engineering Challenge */}
        <section style={{ marginBottom: '5rem' }}>
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.1rem',
              fontWeight: 800,
              marginBottom: '1.25rem',
              color: 'var(--color-ivory)',
            }}
          >
            The Engineering Challenge
          </h2>
          <p
            style={{
              fontSize: '1.15rem',
              lineHeight: 1.75,
              color: 'var(--color-ivory)',
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
              color: 'var(--color-ivory)',
              maxWidth: '72ch',
            }}
          >
            {project.summary}
          </p>
        </section>

        {/* Responsibilities */}
        <section style={{ marginBottom: '5rem' }}>
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.1rem',
              fontWeight: 800,
              marginBottom: '1.5rem',
              color: 'var(--color-ivory)',
            }}
          >
            Core Architectural Responsibilities
          </h2>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {project.responsibilities.map((resp, idx) => (
              <li
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  background: 'var(--color-charcoal)',
                  padding: '1.35rem 1.6rem',
                  borderRadius: '10px',
                  border: '1px solid var(--color-border-dark)',
                }}
              >
                <CheckCircle2 size={22} color="var(--color-gold-light)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--color-ivory)' }}>{resp}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* System Architecture Topology */}
        <section style={{ marginBottom: '5rem' }}>
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.1rem',
              fontWeight: 800,
              marginBottom: '1rem',
              color: 'var(--color-ivory)',
            }}
          >
            System Architecture
          </h2>
          <p
            style={{
              fontSize: '1.05rem',
              lineHeight: 1.7,
              color: 'var(--color-ivory)',
              marginBottom: '2rem',
              maxWidth: '72ch',
            }}
          >
            {project.architectureSummary}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {project.architectureNodes.map((node) => (
              <div
                key={node.name}
                style={{
                  background: 'var(--color-charcoal)',
                  padding: '1.75rem',
                  borderRadius: '10px',
                  border: '1px solid var(--color-border-dark)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                <div style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--color-gold-light)', letterSpacing: '0.06em', marginBottom: '8px', fontWeight: 600 }}>
                  {node.tech}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-ivory)' }}>
                  {node.name}
                </h3>
                <p style={{ fontSize: '1rem', lineHeight: 1.68, color: 'var(--color-ivory)' }}>
                  {node.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Technical Decisions */}
        <section style={{ marginBottom: '5rem' }}>
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.1rem',
              fontWeight: 800,
              marginBottom: '1.5rem',
              color: 'var(--color-ivory)',
            }}
          >
            Key Technical Decisions & Trade-Offs
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {project.technicalDecisions.map((decision) => (
              <div
                key={decision.title}
                style={{
                  background: 'var(--color-charcoal)',
                  border: '1px solid var(--color-border-dark)',
                  borderLeft: '4px solid var(--color-gold-light)',
                  borderRadius: '10px',
                  padding: '1.6rem 1.85rem',
                }}
              >
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-ivory)' }}>
                  {decision.title}
                </h3>
                <p style={{ fontSize: '1.025rem', lineHeight: 1.7, color: 'var(--color-ivory)' }}>
                  {decision.rationale}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Technology Stack */}
        <section style={{ marginBottom: '5rem' }}>
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.1rem',
              fontWeight: 800,
              marginBottom: '1.25rem',
              color: 'var(--color-ivory)',
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
                  color: 'var(--color-gold-light)',
                  border: '1px solid rgba(201, 164, 92, 0.28)',
                  padding: '10px 18px',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-mono)',
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

        {/* Lessons Learned */}
        <section style={{ marginBottom: '5.5rem' }}>
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.1rem',
              fontWeight: 800,
              marginBottom: '1.5rem',
              color: 'var(--color-ivory)',
            }}
          >
            Lessons Learned & Retrospective
          </h2>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {project.lessonsLearned.map((lesson, idx) => (
              <li
                key={idx}
                style={{
                  padding: '1.4rem 1.75rem',
                  borderRadius: '10px',
                  background: 'var(--color-charcoal)',
                  border: '1px solid var(--color-border-dark)',
                  fontSize: '1.025rem',
                  lineHeight: 1.7,
                  color: 'var(--color-ivory)',
                }}
              >
                <strong style={{ color: 'var(--color-gold-light)' }}>Observation #{idx + 1}:</strong>{' '}
                <span>{lesson}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Related Projects Navigation */}
        <section style={{ borderTop: '1px solid var(--color-border-dark)', paddingTop: '4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
            <Sparkles size={16} style={{ color: 'var(--color-gold-light)' }} />
            <h2 style={{ fontSize: '0.88rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-gold-light)', fontWeight: 600 }}>
              CONTINUE EXPLORING ARCHITECTURE CASE STUDIES
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3.5rem' }}>
            {relatedProjects.map((rel) => (
              <Link
                key={rel.slug}
                href={`/work/${rel.slug}`}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  background: 'var(--color-charcoal)',
                  border: '1px solid var(--color-border-dark)',
                  borderRadius: '10px',
                  padding: '1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                className="mosaic-card"
              >
                <div>
                  <div style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: 'var(--color-gold-light)', marginBottom: '8px', fontWeight: 600 }}>
                    {rel.category.toUpperCase()}
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-serif)', fontWeight: 700, marginBottom: '8px', color: 'var(--color-ivory)' }}>
                    {rel.title}
                  </h3>
                  <p style={{ fontSize: '0.95rem', color: 'var(--color-ivory)', lineHeight: 1.6 }}>
                    {rel.tagline}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 600, marginTop: '1.5rem', color: 'var(--color-gold-light)' }}>
                  <span>Read Case Study</span>
                  <ArrowUpRight size={15} />
                </div>
              </Link>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link href="/#projects" className="btn-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <ArrowLeft size={16} />
              <span>Back to Projects Overview</span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
