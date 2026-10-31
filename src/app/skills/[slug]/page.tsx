import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Cpu,
  BookOpen,
  FolderGit2,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { siteContentRepository, projectRepository, articleRepository } from '@/cms/repositories';
import { TechnologyEntity, ExpertiseAreaEntity } from '@/cms/models/technology';
import { ProjectEntity } from '@/cms/models/project';
import { ArticleEntity } from '@/cms/models/article';
import { NoteItem } from '@/types';
import { TechLogo } from '@/components/TechLogos';
import { ARCHITECTURAL_EDGES } from '@/cms/models/knowledgeGraph';
import { SITE_CONFIG, getBreadcrumbJsonLd } from '@/lib/seoData';
import { NOTES } from '@/data/portfolioData';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const technologies = await siteContentRepository.getTechnologies();
  return technologies.map((t) => ({ slug: t.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const technologies = await siteContentRepository.getTechnologies();
  const tech = technologies.find((t) => t.id === slug);

  if (!tech || tech.status !== 'published') {
    return {
      title: 'Technology Not Found // PHILOZZ',
    };
  }

  const title = `${tech.name} // Engineering Profile & Capabilities — PHILOZZ`;
  const description = `${tech.description} Practical engineering capabilities, architectural topologies, and verified production systems by Felopater Nabil.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/skills/${tech.id}`,
    },
    openGraph: {
      type: 'article',
      url: `${SITE_CONFIG.url}/skills/${tech.id}`,
      title,
      description,
      siteName: SITE_CONFIG.name,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function TechnologyDetailPage({ params }: Props) {
  const { slug } = await params;

  const [technologies, disciplines, publishedProjects, brand] = await Promise.all([
    siteContentRepository.getTechnologies(),
    siteContentRepository.getExpertiseAreas(),
    projectRepository.getAll({ status: 'published' }),
    siteContentRepository.getBrandInfo(),
  ]);

  const tech = technologies.find((t: TechnologyEntity) => t.id === slug);

  // Return 404 if not found or not published
  if (!tech || tech.status !== 'published') {
    notFound();
  }

  // Find associated discipline
  const discipline = disciplines.find((d: ExpertiseAreaEntity) => d.id === tech.disciplineId);

  // Find connected projects: by explicit relatedProjectSlugs OR matching technology name
  const relatedProjects = publishedProjects.filter((p: ProjectEntity) => {
    if (tech.relatedProjectSlugs?.includes(p.slug)) return true;
    if (
      p.technologies?.some(
        (t: string) =>
          t.toLowerCase().includes(tech.name.toLowerCase()) ||
          t.toLowerCase().includes(tech.label.toLowerCase()) ||
          tech.name.toLowerCase().includes(t.toLowerCase())
      )
    ) {
      return true;
    }
    return false;
  });

  // Find architectural siblings via ARCHITECTURAL_EDGES
  const siblingEdges = ARCHITECTURAL_EDGES.filter(
    (e) => e.source === tech.id || e.target === tech.id
  );

  const siblingIds = new Set<string>();
  siblingEdges.forEach((e) => {
    if (e.source !== tech.id) siblingIds.add(e.source);
    if (e.target !== tech.id) siblingIds.add(e.target);
  });
  tech.relatedTechIds?.forEach((id: string) => siblingIds.add(id));

  const siblingTechs = technologies.filter((t: TechnologyEntity) => siblingIds.has(t.id) && t.id !== tech.id);

  // Find adjacent technologies for previous / next navigation
  const currentIndex = technologies.findIndex((t: TechnologyEntity) => t.id === tech.id);
  const prevTech = currentIndex > 0 ? technologies[currentIndex - 1] : null;
  const nextTech = currentIndex < technologies.length - 1 ? technologies[currentIndex + 1] : null;

  // Connected engineering notes / articles
  let articles: (ArticleEntity | NoteItem)[] = [];
  try {
    const publishedArticles = await articleRepository.getAll({ status: 'published' });
    articles = publishedArticles;
  } catch {
    articles = NOTES;
  }

  const relatedNotes = (articles.length > 0 ? articles : NOTES).filter((n: ArticleEntity | NoteItem) => {
    if (tech.associatedArticleSlugs?.includes(n.slug)) return true;
    if (
      n.tags?.some(
        (tag: string) =>
          tag.toLowerCase().includes(tech.name.toLowerCase()) ||
          tech.name.toLowerCase().includes(tag.toLowerCase())
      )
    ) {
      return true;
    }
    return false;
  });

  const status = tech.learningStatus || 'actively_using';
  const statusLabel =
    status === 'actively_using'
      ? 'Actively Used in Production'
      : status === 'learning'
      ? 'Learning & Deepening'
      : status === 'exploring'
      ? 'Exploring Emerging Patterns'
      : 'Previously Used';

  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: 'Home', url: SITE_CONFIG.url },
    { name: 'Engineering Atlas', url: `${SITE_CONFIG.url}/skills` },
    { name: tech.name, url: `${SITE_CONFIG.url}/skills/${tech.id}` },
  ]);

  return (
    <div className="atlas-page-wrap">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Top Header Navigation */}
      <header className="archive-top-header" role="banner">
        <div className="container-editorial archive-top-nav-inner">
          <Link
            href="/skills"
            className="archive-back-link"
            aria-label="Back to Engineering Atlas"
          >
            <ArrowLeft size={16} />
            <span>BACK TO ENGINEERING ATLAS</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/" className="archive-brand-tag">
              {brand?.name || 'PHILOZZ'} {'//'} {brand?.developerName || 'Felopater Nabil'}
            </Link>
          </div>
        </div>
      </header>

      {/* HERO & IDENTITY */}
      <section className="atlas-detail-hero" aria-labelledby="tech-title">
        <div className="container-editorial">
          {/* Breadcrumb */}
          <nav className="atlas-breadcrumb" aria-label="Breadcrumb navigation">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/skills">Engineering Atlas</Link>
            <span>/</span>
            <span style={{ color: 'var(--color-ivory)' }}>{tech.name}</span>
          </nav>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem', flexWrap: 'wrap' }}>
            {/* Tech Verified Logo */}
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '12px',
                background: 'var(--color-charcoal-card)',
                border: '1px solid rgba(201, 164, 92, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px',
                flexShrink: 0,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}
            >
              <TechLogo logoKey={tech.logoKey} size={56} />
            </div>

            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                <span className={`atlas-status-badge ${status}`}>
                  <span className="atlas-status-dot" />
                  {statusLabel}
                </span>

                {discipline && (
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--color-gold)',
                    }}
                  >
                    Discipline: {discipline.name}
                  </span>
                )}
              </div>

              <h1 id="tech-title" className="atlas-hero-title" style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', marginBottom: '0.5rem' }}>
                {tech.name}
              </h1>

              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.95rem',
                  color: 'var(--color-gold-light)',
                  marginBottom: '1rem',
                  letterSpacing: '0.04em',
                }}
              >
                {tech.category} {'//'} {tech.role}
              </div>

              <p style={{ fontSize: '1.1rem', color: 'var(--color-ivory-muted)', lineHeight: 1.6, maxWidth: '720px' }}>
                {tech.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DETAIL CONTENT STREAM */}
      <main id="main-content" style={{ flex: '1 0 auto' }}>
        <div className="container-editorial">
          <div className="atlas-detail-grid">
            {/* Primary Column */}
            <div>
              {/* SECTION: PRACTICAL EXPERTISE */}
              <section className="atlas-detail-card" aria-labelledby="expertise-title">
                <h2 id="expertise-title" className="atlas-detail-card-title">
                  <Cpu size={20} style={{ color: 'var(--color-gold)' }} />
                  <span>Practical Engineering Capabilities</span>
                </h2>

                <p style={{ fontSize: '1.025rem', color: 'var(--color-ivory)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                  {tech.practicalExpertise ||
                    `${tech.name} is employed within production architectures to build reliable, high-performance systems with strict typing, transactional integrity, and scalable resource utilization.`}
                </p>

                {/* Documented Capabilities List */}
                {tech.capabilitiesList && tech.capabilitiesList.length > 0 && (
                  <div>
                    <h3
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8125rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: 'var(--color-text-dim)',
                        marginBottom: '0.85rem',
                      }}
                    >
                      Documented Capabilities & Sub-Capabilities
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {tech.capabilitiesList.map((cap, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            background: 'rgba(255, 255, 255, 0.03)',
                            padding: '0.75rem 1rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                          }}
                        >
                          <CheckCircle2 size={16} style={{ color: 'var(--color-gold)' }} />
                          <span style={{ fontSize: '0.925rem', color: 'var(--color-ivory)' }}>{cap}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* SECTION: REAL PROJECT CONNECTIONS */}
              <section className="atlas-detail-card" aria-labelledby="projects-title">
                <h2 id="projects-title" className="atlas-detail-card-title">
                  <FolderGit2 size={20} style={{ color: 'var(--color-gold)' }} />
                  <span>Verified Production Projects ({relatedProjects.length})</span>
                </h2>

                <p style={{ fontSize: '0.925rem', color: 'var(--color-ivory-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                  Direct production systems where {tech.name} was architected and implemented by Philopater.
                </p>

                {relatedProjects.length === 0 ? (
                  <p style={{ color: 'var(--color-text-dim)', fontStyle: 'italic' }}>
                    Used across foundational infrastructure and client service repositories.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {relatedProjects.map((p) => (
                      <article
                        key={p.slug}
                        style={{
                          background: 'var(--color-obsidian)',
                          border: '1px solid rgba(201, 164, 92, 0.22)',
                          borderRadius: '8px',
                          padding: '1.5rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '1rem',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--color-gold)', textTransform: 'uppercase' }}>
                              {p.category}
                            </span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--color-text-dim)' }}>
                              {p.period}
                            </span>
                          </div>

                          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--color-ivory)', marginBottom: '0.5rem' }}>
                            {p.title}
                          </h3>

                          <p style={{ fontSize: '0.9rem', color: 'var(--color-ivory-muted)', lineHeight: 1.55, marginBottom: '1rem' }}>
                            {p.summary}
                          </p>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {p.technologies?.map((pt, idx) => (
                              <span key={idx} className="atlas-tech-cap-tag">
                                {pt}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div style={{ paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <Link href={`/work/${p.slug}`} className="atlas-tech-cta-btn">
                            <span>Read Full Case Study</span>
                            <ArrowRight size={14} />
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              {/* SECTION: CONTINUOUS LEARNING & EXPLORATION */}
              <section className="atlas-detail-card" aria-labelledby="learning-notes-title">
                <h2 id="learning-notes-title" className="atlas-detail-card-title">
                  <BookOpen size={20} style={{ color: 'var(--color-gold)' }} />
                  <span>Continuous Learning & Exploration</span>
                </h2>

                <div style={{ marginBottom: '1.5rem' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      color: 'var(--color-gold)',
                      letterSpacing: '0.08em',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Current Study Focus & Roadmap
                  </div>
                  <p style={{ fontSize: '0.95rem', color: 'var(--color-ivory)', lineHeight: 1.6 }}>
                    {tech.learningNotes ||
                      `Tracking upcoming release notes, performance profiling benchmarks, and community RFC proposals for ${tech.name}.`}
                  </p>
                </div>

                {/* Connected Articles */}
                {relatedNotes.length > 0 && (
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        color: 'var(--color-text-dim)',
                        letterSpacing: '0.08em',
                        marginBottom: '0.75rem',
                      }}
                    >
                      Associated Technical Journal Notes
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {relatedNotes.map((note) => (
                        <Link
                          key={note.slug}
                          href={`/notes/${note.slug}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.85rem 1rem',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(201,164,92,0.18)',
                            borderRadius: '6px',
                            textDecoration: 'none',
                          }}
                        >
                          <div>
                            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', color: 'var(--color-ivory)', marginBottom: '0.2rem' }}>
                              {note.title}
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-gold)' }}>
                              {note.category} {'//'} {note.readTime}
                            </div>
                          </div>
                          <ArrowRight size={14} style={{ color: 'var(--color-gold-light)' }} />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* Sidebar Column */}
            <div>
              {/* Core Concepts Tag Cloud */}
              <div className="atlas-detail-card" style={{ padding: '1.75rem' }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.25rem',
                    color: 'var(--color-ivory)',
                    marginBottom: '1rem',
                  }}
                >
                  Core Engineering Concepts
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  {(tech.coreConcepts || ['Architecture', 'Best Practices', 'Testing', 'Optimization']).map((c, i) => (
                    <span
                      key={i}
                      className="atlas-chip"
                      style={{
                        background: 'rgba(201, 164, 92, 0.08)',
                        borderColor: 'rgba(201, 164, 92, 0.25)',
                        color: 'var(--color-ivory)',
                      }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Architectural Siblings / Related Techs */}
              <div className="atlas-detail-card" style={{ padding: '1.75rem' }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.25rem',
                    color: 'var(--color-ivory)',
                    marginBottom: '0.5rem',
                  }}
                >
                  Architectural Siblings
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-dim)', marginBottom: '1.25rem' }}>
                  Technologies directly integrated with {tech.name} in Philopater&apos;s stack:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {siblingTechs.map((sib) => {
                    return (
                      <Link
                        key={sib.id}
                        href={`/skills/${sib.id}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.65rem 0.85rem',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          transition: 'var(--transition-smooth)',
                        }}
                      >
                        <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <TechLogo logoKey={sib.logoKey} size={22} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-ivory)' }}>
                            {sib.name}
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--color-gold)' }}>
                            {sib.category}
                          </div>
                        </div>
                        <ChevronRight size={14} style={{ color: 'var(--color-text-dim)' }} />
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Quick Navigation Between Technologies */}
              <div className="atlas-detail-card" style={{ padding: '1.75rem' }}>
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.15rem',
                    color: 'var(--color-ivory)',
                    marginBottom: '1rem',
                  }}
                >
                  Browse Stack
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {prevTech && (
                    <Link href={`/skills/${prevTech.id}`} className="atlas-tech-cta-btn" style={{ fontSize: '0.8125rem' }}>
                      <ArrowLeft size={13} />
                      <span>Previous: {prevTech.name}</span>
                    </Link>
                  )}
                  {nextTech && (
                    <Link href={`/skills/${nextTech.id}`} className="atlas-tech-cta-btn" style={{ fontSize: '0.8125rem' }}>
                      <span>Next: {nextTech.name}</span>
                      <ArrowRight size={13} />
                    </Link>
                  )}
                  <Link href="/skills" className="atlas-tech-cta-btn" style={{ color: 'var(--color-text-dim)', marginTop: '0.5rem' }}>
                    <span>Explore All ({technologies.length}) Technologies →</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Return Bar */}
      <footer
        style={{
          borderTop: '1px solid rgba(201, 164, 92, 0.15)',
          padding: '2.5rem 0',
          background: 'var(--color-obsidian-soft)',
        }}
      >
        <div
          className="container-editorial"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--color-text-dim)' }}>
            PHILOZZ // {tech.name} — Technical Profile
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Link href="/skills" className="atlas-tech-cta-btn">
              <span>Return to Engineering Atlas</span>
              <ArrowLeft size={14} />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
