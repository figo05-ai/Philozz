'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Layers,
  Cpu,
  Database,
  Gauge,
  GitBranch,
  ShieldCheck,
  Code,
  Terminal,
  Grid,
  List,
  Sparkles,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import { TechnologyEntity, ExpertiseAreaEntity } from '@/cms/models/technology';
import { ProjectItem, NoteItem } from '@/types';
import { getTechLogo } from '@/components/TechLogos';
import { ConnectedKnowledgeGraph } from '@/components/ConnectedKnowledgeGraph';

export const ATLAS_DISCIPLINE_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  Layers,
  Cpu,
  Database,
  Gauge,
  GitBranch,
  ShieldCheck,
  Code,
  Terminal,
  backend: Cpu,
  'system-design': Layers,
  database: Database,
  'background-processing': Gauge,
  devops: GitBranch,
  fullstack: Code,
};

export interface EngineeringAtlasViewProps {
  technologies: TechnologyEntity[];
  disciplines: ExpertiseAreaEntity[];
  projects: ProjectItem[];
  notes: NoteItem[];
  brandName?: string;
  developerName?: string;
}

export function EngineeringAtlasView({
  technologies,
  disciplines,
  projects,
  notes,
  brandName = 'PHILOZZ',
  developerName = 'Felopater Nabil',
}: EngineeringAtlasViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial query params from URL
  const initialDiscipline = searchParams.get('discipline') || 'all';
  const initialStatus = searchParams.get('status') || 'all';
  const initialQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>(initialDiscipline);
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus);
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');

  // Compute live statistics strictly from real data
  const stats = useMemo(() => {
    const techCount = technologies.length;
    const disciplineCount = disciplines.length;

    // Documented capabilities (deduplicated)
    const capabilitiesSet = new Set<string>();
    technologies.forEach((t) => {
      t.capabilitiesList?.forEach((c) => capabilitiesSet.add(c.trim().toLowerCase()));
      if (t.capability) {
        t.capability.split('•').forEach((c) => capabilitiesSet.add(c.trim().toLowerCase()));
      }
    });
    disciplines.forEach((d) => {
      d.associatedCapabilities?.forEach((c) => capabilitiesSet.add(c.trim().toLowerCase()));
      d.coreConcepts?.forEach((c) => capabilitiesSet.add(c.trim().toLowerCase()));
    });

    // Projects connected to skills
    const connectedProjectsSet = new Set<string>();
    technologies.forEach((t) => {
      t.relatedProjectSlugs?.forEach((p) => connectedProjectsSet.add(p));
    });
    disciplines.forEach((d) => {
      d.relatedProjectSlugs?.forEach((p) => connectedProjectsSet.add(p));
    });
    // Fallback: match by project technologies
    projects.forEach((p) => {
      if (p.technologies && p.technologies.length > 0) {
        connectedProjectsSet.add(p.slug);
      }
    });

    return {
      techCount,
      disciplineCount,
      capabilityCount: capabilitiesSet.size,
      connectedProjectsCount: connectedProjectsSet.size,
    };
  }, [technologies, disciplines, projects]);

  // Sync state to URL for shareable search
  const updateUrl = (q: string, discipline: string, status: string) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (discipline !== 'all') params.set('discipline', discipline);
    if (status !== 'all') params.set('status', status);

    const queryStr = params.toString();
    const newUrl = queryStr ? `/skills?${queryStr}` : '/skills';
    router.replace(newUrl, { scroll: false });
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    updateUrl(val, selectedDiscipline, selectedStatus);
  };

  const handleDisciplineFilter = (discId: string) => {
    setSelectedDiscipline(discId);
    updateUrl(searchQuery, discId, selectedStatus);
  };

  const handleStatusFilter = (statusVal: string) => {
    setSelectedStatus(statusVal);
    updateUrl(searchQuery, selectedDiscipline, statusVal);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDiscipline('all');
    setSelectedStatus('all');
    updateUrl('', 'all', 'all');
  };

  // Filtered technologies
  const filteredTechnologies = useMemo(() => {
    return technologies.filter((tech) => {
      // Search query filter (name, description, capabilities, concepts)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = tech.name.toLowerCase().includes(q) || tech.label.toLowerCase().includes(q);
        const matchesDesc = tech.description.toLowerCase().includes(q);
        const matchesRole = tech.role.toLowerCase().includes(q);
        const matchesCategory = tech.category.toLowerCase().includes(q);
        const matchesCaps = tech.capabilitiesList?.some((c) => c.toLowerCase().includes(q));
        const matchesConcepts = tech.coreConcepts?.some((c) => c.toLowerCase().includes(q));

        if (!matchesName && !matchesDesc && !matchesRole && !matchesCategory && !matchesCaps && !matchesConcepts) {
          return false;
        }
      }

      // Discipline filter
      if (selectedDiscipline !== 'all') {
        if (tech.disciplineId !== selectedDiscipline) {
          return false;
        }
      }

      // Status filter
      if (selectedStatus !== 'all') {
        const status = tech.learningStatus || 'actively_using';
        if (status !== selectedStatus) {
          return false;
        }
      }

      return true;
    });
  }, [technologies, searchQuery, selectedDiscipline, selectedStatus]);

  // Quick lookup helper for projects
  const projectMap = useMemo(() => {
    return new Map(projects.map((p) => [p.slug, p]));
  }, [projects]);

  return (
    <div className="atlas-page-wrap">
      {/* Sticky Top Header Navigation */}
      <header className="archive-top-header" role="banner">
        <div className="container-editorial archive-top-nav-inner">
          <Link
            href="/#skills"
            className="archive-back-link"
            aria-label="Back to Portfolio — Return to homepage skills galaxy"
          >
            <ArrowLeft size={16} />
            <span>BACK TO PORTFOLIO</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/" className="archive-brand-tag">
              {brandName} {'//'} {developerName}
            </Link>
          </div>
        </div>
      </header>

      {/* Sticky Quick-Jump Anchor Bar */}
      <nav className="atlas-jump-nav" aria-label="Atlas Sections Jump Bar">
        <div className="container-editorial">
          <div className="atlas-jump-links">
            <a href="#hero" className="atlas-jump-link">
              Overview
            </a>
            <a href="#disciplines" className="atlas-jump-link">
              Disciplines ({disciplines.length})
            </a>
            <a href="#technologies" className="atlas-jump-link">
              Technology Explorer ({technologies.length})
            </a>
            <a href="#connections" className="atlas-jump-link">
              Stack Connections
            </a>
            <a href="#learning" className="atlas-jump-link">
              Continuous Learning
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main id="main-content" style={{ flex: '1 0 auto' }}>
        {/* SECTION 1: HERO — BEYOND THE STACK */}
        <section id="hero" className="atlas-hero-section" aria-labelledby="atlas-hero-title">
          <div className="container-editorial">
            <div className="atlas-hero-eyebrow">
              <Terminal size={14} style={{ color: 'var(--color-gold)' }} />
              <span>PHILOZZ // ENGINEERING ATLAS</span>
            </div>

            <h1 id="atlas-hero-title" className="atlas-hero-title">
              Beyond the Stack.
              <br />
              <span className="font-gold-gradient">Inside the Engineering.</span>
            </h1>

            <p className="atlas-hero-subtitle">
              A living map of the technologies I use, the systems I build, and the knowledge I continue to explore.
            </p>

            {/* Computed Real Statistics Grid */}
            <div className="atlas-stats-grid" aria-label="Engineering Atlas Metrics">
              <div className="atlas-stat-card">
                <span className="atlas-stat-value">{stats.techCount}</span>
                <span className="atlas-stat-label">Core Technologies</span>
              </div>
              <div className="atlas-stat-card">
                <span className="atlas-stat-value">{stats.disciplineCount}</span>
                <span className="atlas-stat-label">Engineering Disciplines</span>
              </div>
              <div className="atlas-stat-card">
                <span className="atlas-stat-value">{stats.capabilityCount}+</span>
                <span className="atlas-stat-label">Documented Capabilities</span>
              </div>
              <div className="atlas-stat-card">
                <span className="atlas-stat-value">{stats.connectedProjectsCount}</span>
                <span className="atlas-stat-label">Connected Projects</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: ENGINEERING DISCIPLINES EXPLORER */}
        <section id="disciplines" className="atlas-section" aria-labelledby="disciplines-title">
          <div className="container-editorial">
            <div className="atlas-section-tag">
              <Layers size={14} />
              <span>CORE ARCHITECTURAL FOUNDATION</span>
            </div>

            <h2 id="disciplines-title" className="atlas-section-title">
              Engineering Disciplines.
            </h2>

            <p className="atlas-section-desc">
              Structured domains of engineering practice, from backend service design and database query optimization to asynchronous queue pipelines and containerized infrastructure.
            </p>

            <div className="atlas-disciplines-grid">
              {disciplines.map((disc) => {
                const IconComponent =
                  ATLAS_DISCIPLINE_ICONS[disc.id] ||
                  ATLAS_DISCIPLINE_ICONS[disc.icon || 'Layers'] ||
                  Layers;

                // Find associated technologies for this discipline
                const discTechs = technologies.filter(
                  (t) => t.disciplineId === disc.id || disc.associatedTechIds?.includes(t.id)
                );

                return (
                  <article key={disc.id} className="atlas-discipline-card">
                    <div>
                      <div className="atlas-discipline-top">
                        <div className="atlas-discipline-icon">
                          <IconComponent size={22} />
                        </div>
                        <span className="atlas-discipline-level">{disc.level || 'Core Discipline'}</span>
                      </div>

                      <h3 className="atlas-discipline-name">{disc.name}</h3>
                      <p className="atlas-discipline-desc">{disc.description}</p>

                      {/* Associated Technologies */}
                      {discTechs.length > 0 && (
                        <div className="atlas-discipline-meta-group">
                          <div className="atlas-discipline-meta-title">Associated Technologies</div>
                          <div className="atlas-chips-wrap">
                            {discTechs.map((t) => (
                              <Link
                                key={t.id}
                                href={`/skills/${t.id}`}
                                className="atlas-chip"
                                title={`View ${t.name} deep-dive`}
                              >
                                {t.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Documented Capabilities */}
                      {disc.associatedCapabilities && disc.associatedCapabilities.length > 0 && (
                        <div className="atlas-discipline-meta-group">
                          <div className="atlas-discipline-meta-title">Key Capabilities</div>
                          <div className="atlas-chips-wrap">
                            {disc.associatedCapabilities.map((cap, i) => (
                              <span key={i} className="atlas-chip">
                                {cap}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Core Concepts */}
                      {disc.coreConcepts && disc.coreConcepts.length > 0 && (
                        <div className="atlas-discipline-meta-group">
                          <div className="atlas-discipline-meta-title">Core Engineering Concepts</div>
                          <div className="atlas-chips-wrap">
                            {disc.coreConcepts.map((concept, i) => (
                              <span key={i} className="atlas-chip" style={{ color: 'var(--color-ivory)' }}>
                                {concept}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Associated Projects Links */}
                    {disc.relatedProjectSlugs && disc.relatedProjectSlugs.length > 0 && (
                      <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <div className="atlas-discipline-meta-title">Demonstrated In Projects</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          {disc.relatedProjectSlugs.map((slug) => {
                            const p = projectMap.get(slug);
                            return (
                              <Link
                                key={slug}
                                href={`/work/${slug}`}
                                className="atlas-tech-cta-btn"
                                style={{ fontSize: '0.8125rem' }}
                              >
                                <span>{p ? p.title : slug}</span>
                                <ExternalLink size={12} />
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 3: TECHNOLOGY EXPLORER */}
        <section id="technologies" className="atlas-section" aria-labelledby="tech-explorer-title">
          <div className="container-editorial">
            <div className="atlas-section-tag">
              <Cpu size={14} />
              <span>INDEXED TECHNICAL INVENTORY</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <h2 id="tech-explorer-title" className="atlas-section-title" style={{ marginBottom: 0 }}>
                  Technology Explorer.
                </h2>
                <p style={{ fontSize: '1rem', color: 'var(--color-ivory-muted)', marginTop: '0.5rem' }}>
                  Filterable directory of languages, frameworks, datastores, and systems tooling.
                </p>
              </div>

              {/* View Layout Toggle */}
              <div style={{ display: 'inline-flex', gap: '0.35rem', background: 'var(--color-charcoal-card)', padding: '4px', borderRadius: '6px', border: '1px solid rgba(201, 164, 92, 0.2)' }}>
                <button
                  type="button"
                  onClick={() => setViewLayout('grid')}
                  className={`atlas-filter-btn ${viewLayout === 'grid' ? 'active' : ''}`}
                  aria-label="Grid view layout"
                  style={{ padding: '0.35rem 0.65rem' }}
                >
                  <Grid size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewLayout('list')}
                  className={`atlas-filter-btn ${viewLayout === 'list' ? 'active' : ''}`}
                  aria-label="List view layout"
                  style={{ padding: '0.35rem 0.65rem' }}
                >
                  <List size={15} />
                </button>
              </div>
            </div>

            {/* Interactive Search & Filter Controls */}
            <div className="atlas-controls-bar">
              {/* Search Row */}
              <div className="atlas-search-row">
                <div className="atlas-search-input-wrap">
                  <Search size={18} className="atlas-search-icon" />
                  <input
                    type="search"
                    placeholder="Search by technology, capability (e.g. 'REST API', 'Indexing', 'Queue'), or concept..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="atlas-search-input"
                    aria-label="Search technologies and capabilities"
                  />
                </div>
                {(searchQuery || selectedDiscipline !== 'all' || selectedStatus !== 'all') && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="atlas-filter-btn"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              {/* Discipline Filter Pills */}
              <div className="atlas-filters-group">
                <div className="atlas-filter-label">Filter By Engineering Discipline:</div>
                <div className="atlas-filter-pills-row" role="tablist" aria-label="Discipline Filters">
                  <button
                    type="button"
                    onClick={() => handleDisciplineFilter('all')}
                    className={`atlas-filter-btn ${selectedDiscipline === 'all' ? 'active' : ''}`}
                  >
                    All Disciplines ({technologies.length})
                  </button>
                  {disciplines.map((d) => {
                    const count = technologies.filter((t) => t.disciplineId === d.id).length;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleDisciplineFilter(d.id)}
                        className={`atlas-filter-btn ${selectedDiscipline === d.id ? 'active' : ''}`}
                      >
                        {d.name} {count > 0 ? `(${count})` : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Filter Pills */}
              <div className="atlas-filters-group">
                <div className="atlas-filter-label">Filter By Usage Relationship:</div>
                <div className="atlas-filter-pills-row" role="tablist" aria-label="Status Filters">
                  <button
                    type="button"
                    onClick={() => handleStatusFilter('all')}
                    className={`atlas-filter-btn ${selectedStatus === 'all' ? 'active' : ''}`}
                  >
                    All Statuses
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusFilter('actively_using')}
                    className={`atlas-filter-btn ${selectedStatus === 'actively_using' ? 'active' : ''}`}
                  >
                    Actively Using
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusFilter('learning')}
                    className={`atlas-filter-btn ${selectedStatus === 'learning' ? 'active' : ''}`}
                  >
                    Learning & Deepening
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusFilter('exploring')}
                    className={`atlas-filter-btn ${selectedStatus === 'exploring' ? 'active' : ''}`}
                  >
                    Exploring
                  </button>
                </div>
              </div>
            </div>

            {/* Results Count Indicator */}
            <div style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--color-ivory-muted)' }}>
              Showing <strong>{filteredTechnologies.length}</strong> of {technologies.length} technologies
              {searchQuery && (
                <span>
                  {' '}
                  matching &ldquo;<em>{searchQuery}</em>&rdquo;
                </span>
              )}
            </div>

            {/* Empty State */}
            {filteredTechnologies.length === 0 ? (
              <div
                style={{
                  background: 'var(--color-charcoal-card)',
                  border: '1px solid rgba(201, 164, 92, 0.2)',
                  borderRadius: '8px',
                  padding: '4rem 2rem',
                  textAlign: 'center',
                }}
              >
                <Terminal size={36} style={{ color: 'var(--color-gold)', margin: '0 auto 1rem' }} />
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--color-ivory)', marginBottom: '0.5rem' }}>
                  No matching technologies found
                </h3>
                <p style={{ color: 'var(--color-ivory-muted)', maxWidth: '440px', margin: '0 auto 1.5rem' }}>
                  No technical inventory item matches your current search criteria. Try clearing search filters.
                </p>
                <button type="button" onClick={resetFilters} className="btn-outline-gold">
                  <span>Reset All Filters</span>
                </button>
              </div>
            ) : (
              /* Technology Cards (Grid or List Layout) */
              <div className={viewLayout === 'grid' ? 'atlas-tech-grid' : 'atlas-tech-list'}>
                {filteredTechnologies.map((tech) => {
                  const LogoComp = getTechLogo(tech.logoKey);
                  const status = tech.learningStatus || 'actively_using';
                  const statusLabel =
                    status === 'actively_using'
                      ? 'Actively Used'
                      : status === 'learning'
                      ? 'Learning'
                      : status === 'exploring'
                      ? 'Exploring'
                      : 'Previously Used';

                  return (
                    <article key={tech.id} className="atlas-tech-card">
                      <div>
                        {/* Header: Logo, Name, Category & Status Badge */}
                        <div className="atlas-tech-card-header">
                          <div className="atlas-tech-logo-wrap">
                            <LogoComp size={36} />
                          </div>

                          <div className="atlas-tech-identity">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                              <h3 className="atlas-tech-name">{tech.name}</h3>
                              <span className={`atlas-status-badge ${status}`}>
                                <span className="atlas-status-dot" />
                                {statusLabel}
                              </span>
                            </div>
                            <div className="atlas-tech-category">{tech.category}</div>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="atlas-tech-desc">{tech.description}</p>

                        {/* Documented Capabilities */}
                        {tech.capabilitiesList && tech.capabilitiesList.length > 0 && (
                          <div>
                            <div className="atlas-tech-caps-title">Documented Capabilities</div>
                            <div className="atlas-tech-caps-list">
                              {tech.capabilitiesList.map((cap, i) => (
                                <span key={i} className="atlas-tech-cap-tag">
                                  {cap}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Footer: Project Connection & Detail Link */}
                      <div className="atlas-tech-card-footer">
                        <span className="atlas-tech-projects-indicator">
                          {tech.relatedProjectSlugs && tech.relatedProjectSlugs.length > 0 ? (
                            <span>
                              {tech.relatedProjectSlugs.length}{' '}
                              {tech.relatedProjectSlugs.length === 1 ? 'Project' : 'Projects'} Linked
                            </span>
                          ) : (
                            <span>Core Capability</span>
                          )}
                        </span>

                        <Link href={`/skills/${tech.id}`} className="atlas-tech-cta-btn">
                          <span>Deep Dive Profile</span>
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* SECTION 4: CONNECTED KNOWLEDGE — HOW MY STACK CONNECTS */}
        <section id="connections" className="atlas-section" aria-labelledby="connections-title">
          <div className="container-editorial">
            <div className="atlas-section-tag">
              <Sparkles size={14} />
              <span>ARCHITECTURAL TOPOLOGY & INTEGRATIONS</span>
            </div>

            <ConnectedKnowledgeGraph technologies={technologies} />
          </div>
        </section>

        {/* SECTION 5: CONTINUOUS LEARNING — ALWAYS LEARNING. ALWAYS BUILDING. */}
        <section id="learning" className="atlas-section" aria-labelledby="learning-title">
          <div className="container-editorial">
            <div className="atlas-section-tag">
              <BookOpen size={14} />
              <span>CONTINUOUS GROWTH JOURNEY</span>
            </div>

            <h2 id="learning-title" className="atlas-section-title">
              Always Learning. Always Building.
            </h2>

            <p className="atlas-section-desc">
              Engineering is an ongoing trajectory of deepening core competencies and exploring emerging paradigms without exaggeration or arbitrary percentages.
            </p>

            {/* Status Definition Legend */}
            <div className="atlas-learning-legend" aria-label="Learning Status Definitions">
              <div className="atlas-legend-card">
                <div className="atlas-legend-title" style={{ color: '#4ade80' }}>
                  <span className="atlas-status-dot" style={{ background: '#4ade80' }} />
                  Actively Using
                </div>
                <div className="atlas-legend-desc">
                  Shipped in verified production systems; actively employed in current daily architecture and client systems.
                </div>
              </div>

              <div className="atlas-legend-card">
                <div className="atlas-legend-title" style={{ color: 'var(--color-gold-light)' }}>
                  <span className="atlas-status-dot" style={{ background: 'var(--color-gold-light)' }} />
                  Learning & Deepening
                </div>
                <div className="atlas-legend-desc">
                  In-depth architectural review, official RFC tracking, benchmarking, and internal proof-of-concept testing.
                </div>
              </div>

              <div className="atlas-legend-card">
                <div className="atlas-legend-title" style={{ color: '#60a5fa' }}>
                  <span className="atlas-status-dot" style={{ background: '#60a5fa' }} />
                  Exploring
                </div>
                <div className="atlas-legend-desc">
                  Horizon scanning and prototyping emerging web standards and distributed systems concepts.
                </div>
              </div>

              <div className="atlas-legend-card">
                <div className="atlas-legend-title" style={{ color: '#94a3b8' }}>
                  <span className="atlas-status-dot" style={{ background: '#94a3b8' }} />
                  Previously Used
                </div>
                <div className="atlas-legend-desc">
                  Utilized in earlier production solutions or legacy codebases; maintained for backward compatibility.
                </div>
              </div>
            </div>

            {/* Active Exploration Focus Topics */}
            <div style={{ marginBottom: '3rem' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.5rem',
                  color: 'var(--color-ivory)',
                  marginBottom: '1.25rem',
                }}
              >
                Current Areas of Technical Study
              </h3>

              <div className="atlas-topics-grid">
                <div className="atlas-topic-card">
                  <div>
                    <span className="atlas-discipline-level" style={{ marginBottom: '0.75rem', display: 'inline-block' }}>
                      PHP & Runtime
                    </span>
                    <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--color-ivory)', marginBottom: '0.5rem' }}>
                      PHP 8.4 Property Hooks & Asymmetric Visibility
                    </h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-ivory-muted)', lineHeight: 1.55 }}>
                      Studying the impact of property hooks on domain entity encapsulation, eliminating boilerplate getters/setters while preserving strict immutability.
                    </p>
                  </div>
                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-gold)' }}>
                      Focus: Domain-Driven Design
                    </span>
                  </div>
                </div>

                <div className="atlas-topic-card">
                  <div>
                    <span className="atlas-discipline-level" style={{ marginBottom: '0.75rem', display: 'inline-block' }}>
                      Next.js & Frontend
                    </span>
                    <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--color-ivory)', marginBottom: '0.5rem' }}>
                      Partial Prerendering (PPR) & Cache Life
                    </h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-ivory-muted)', lineHeight: 1.55 }}>
                      Evaluating Next.js 16 incremental cache lifecycles and streaming suspense shells to combine instant static TTFB with dynamic personalized streams.
                    </p>
                  </div>
                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-gold)' }}>
                      Focus: Core Web Vitals & LCP
                    </span>
                  </div>
                </div>

                <div className="atlas-topic-card">
                  <div>
                    <span className="atlas-discipline-level" style={{ marginBottom: '0.75rem', display: 'inline-block' }}>
                      Distributed Systems
                    </span>
                    <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--color-ivory)', marginBottom: '0.5rem' }}>
                      Redis Streams Consumer Groups
                    </h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-ivory-muted)', lineHeight: 1.55 }}>
                      Architecting distributed event-sourcing pipelines with consumer groups, automatic pending message retries, and dead-letter queue escalation.
                    </p>
                  </div>
                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-gold)' }}>
                      Focus: Event-Driven Systems
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Connected Engineering Journal Notes */}
            {notes && notes.length > 0 && (
              <div>
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.5rem',
                    color: 'var(--color-ivory)',
                    marginBottom: '1.25rem',
                  }}
                >
                  Documented In Engineering Notes
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                  {notes.slice(0, 3).map((note) => (
                    <article
                      key={note.slug}
                      style={{
                        background: 'var(--color-charcoal-card)',
                        border: '1px solid rgba(201, 164, 92, 0.18)',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--color-gold)', textTransform: 'uppercase' }}>
                            {note.category}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--color-text-dim)' }}>
                            {note.readTime}
                          </span>
                        </div>
                        <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', color: 'var(--color-ivory)', marginBottom: '0.5rem' }}>
                          {note.title}
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-ivory-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
                          {note.abstract}
                        </p>
                      </div>

                      <Link href={`/notes/${note.slug}`} className="atlas-tech-cta-btn">
                        <span>Read Technical Note</span>
                        <ArrowRight size={13} />
                      </Link>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
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
            PHILOZZ // {developerName} — Engineering Atlas
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Link href="/projects" className="atlas-tech-cta-btn">
              <span>View Projects Archive</span>
              <ArrowRight size={14} />
            </Link>
            <Link href="/blog" className="atlas-tech-cta-btn">
              <span>Engineering Journal</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
