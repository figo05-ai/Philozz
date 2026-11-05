import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  FolderKanban,
  FileText,
  Cpu,
  BookOpen,
  ShieldCheck,
  Info,
  History,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { requireAdminSession } from '@/lib/auth/requireAdminSession';
import {
  projectRepository,
  articleRepository,
  siteContentRepository,
  auditLogRepository,
} from '@/cms/repositories';
import { AdminShell } from '@/components/admin/AdminShell';
import { StatCard } from '@/components/admin/StatCard';
import { StatusIndicator } from '@/components/admin/StatusIndicator';
import { EmptyState } from '@/components/admin/EmptyState';

export const instant = false;

export const metadata: Metadata = {
  title: 'Dashboard Overview',
  description: 'PHILOZZ Owner Administration Console & Real Content Overview',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function AdminDashboardPage() {
  // Enforce server boundary owner authentication
  const user = await requireAdminSession();

  // Load real content from CMS repositories in parallel
  const [projects, articles, categories, technologies, recentLogs] = await Promise.all([
    projectRepository.getAll(),
    articleRepository.getAll(),
    articleRepository.getCategories(),
    siteContentRepository.getTechnologies(),
    auditLogRepository.getRecent(5),
  ]);

  const publishedProjects = projects.filter((p) => p.status === 'published').length;
  const featuredProjects = projects.filter((p) => p.featured).length;
  const publishedArticles = articles.filter((a) => a.status === 'published').length;
  const featuredArticles = articles.filter((a) => a.featured).length;

  return (
    <AdminShell
      user={user}
      title="Dashboard Overview"
      subtitle="Executive management console & real-time content inventory"
    >
      {/* Verified Owner Hero Card */}
      <div
        className="admin-card"
        style={{
          marginBottom: '1.75rem',
          background: 'linear-gradient(135deg, rgba(22, 22, 29, 0.95) 0%, rgba(10, 10, 13, 0.95) 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={26} />
            </div>

            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  color: 'var(--color-gold, #C9A45C)',
                  textTransform: 'uppercase',
                  marginBottom: '0.15rem',
                }}
              >
                Owner Workspace Verified
              </div>
              <h2
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 600,
                  color: 'var(--color-ivory, #F6F3EC)',
                  marginBottom: '0.2rem',
                }}
              >
                Welcome back, {user.email || 'Owner'}
              </h2>
              <p
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--color-text-dim, #9A9AA8)',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                Firebase UID: {user.uid} • Claim: admin: true
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.85rem',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#34D399',
              fontSize: '0.78rem',
              fontWeight: 500,
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
              }}
            />
            <span>Active Server Session (5-day cookie)</span>
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="admin-notice-banner">
        <Info size={18} style={{ color: 'var(--color-gold, #C9A45C)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--color-ivory, #F6F3EC)', fontWeight: 600 }}>
            Phase 16C Read-Only Architecture Foundation:
          </strong>{' '}
          All statistics and inventory lists are rendered directly from the authoritative Phase 16A CMS repositories.
          Content creation, markdown editing, and live database updates will activate in Phase 17 alongside Firestore persistence.
        </div>
      </div>

      {/* Real Statistics Grid */}
      <div className="admin-stat-grid">
        <StatCard
          title="Total Projects"
          value={projects.length}
          subtitle={`${publishedProjects} published • ${featuredProjects} featured`}
          icon={FolderKanban}
          badge={{ text: '100% Published', variant: 'emerald' }}
          href="/admin/projects"
        />

        <StatCard
          title="Articles & Notes"
          value={articles.length}
          subtitle={`${publishedArticles} published • ${featuredArticles} featured`}
          icon={FileText}
          badge={{ text: '100% Published', variant: 'emerald' }}
          href="/admin/articles"
        />

        <StatCard
          title="Orbit Technologies"
          value={technologies.length}
          subtitle="3D Galaxy & Elliptical Orbits"
          icon={Cpu}
          badge={{ text: 'Preserved Verbatim', variant: 'gold' }}
          href="/admin/sections"
        />

        <StatCard
          title="Knowledge Domains"
          value={categories.length}
          subtitle="Taxonomy & Architecture Topics"
          icon={BookOpen}
          badge={{ text: 'Active Categories', variant: 'slate' }}
          href="/admin/articles"
        />
      </div>

      {/* Snapshots Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        {/* Featured Projects Snapshot */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid rgba(201, 164, 92, 0.15)',
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--color-ivory, #F6F3EC)',
                  marginBottom: '0.15rem',
                }}
              >
                Featured Case Studies
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
                Top showcase projects on the public homepage
              </span>
            </div>

            <Link
              href="/admin/projects"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.78rem',
                color: 'var(--color-gold, #C9A45C)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              <span>View all ({projects.length})</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
            {projects.slice(0, 4).map((project) => (
              <div
                key={project.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(10, 10, 13, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  gap: '0.75rem',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      color: 'var(--color-ivory, #F6F3EC)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {project.title}
                  </div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--color-text-dim, #9A9AA8)',
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                  >
                    /{project.slug}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <StatusIndicator status={project.status} size="sm" />
                  <Link
                    href={`/work/${project.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View live case study"
                    style={{
                      color: 'var(--color-text-dim, #9A9AA8)',
                      padding: '0.2rem',
                    }}
                  >
                    <ExternalLink size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Articles Snapshot */}
        <div className="admin-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid rgba(201, 164, 92, 0.15)',
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--color-ivory, #F6F3EC)',
                  marginBottom: '0.15rem',
                }}
              >
                Latest Journal Notes
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
                Published engineering notes & architecture essays
              </span>
            </div>

            <Link
              href="/admin/articles"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.78rem',
                color: 'var(--color-gold, #C9A45C)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              <span>View all ({articles.length})</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
            {articles.slice(0, 4).map((article) => (
              <div
                key={article.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(10, 10, 13, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  gap: '0.75rem',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      color: 'var(--color-ivory, #F6F3EC)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {article.title}
                  </div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--color-text-dim, #9A9AA8)',
                    }}
                  >
                    {article.category} • {article.readTime}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <StatusIndicator status={article.status} size="sm" />
                  <Link
                    href={`/notes/${article.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View live article"
                    style={{
                      color: 'var(--color-text-dim, #9A9AA8)',
                      padding: '0.2rem',
                    }}
                  >
                    <ExternalLink size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Honest Audit Log / Activity Section */}
      <div className="admin-card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}
        >
          <div>
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--color-ivory, #F6F3EC)',
                marginBottom: '0.15rem',
              }}
            >
              CMS Activity Log
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim, #9A9AA8)' }}>
              Real-time audit records of content creations, edits, and publications
            </span>
          </div>

          <span
            style={{
              fontSize: '0.72rem',
              padding: '0.2rem 0.55rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: 'var(--color-text-dim, #9A9AA8)',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            IAuditLogRepository
          </span>
        </div>

        {recentLogs.length === 0 ? (
          <EmptyState
            icon={History}
            title="No Administrative Mutations Recorded"
            description="All current portfolio content is sourced from the established Phase 16A repository seed layer. Live administrative audit logs will record when content mutations unlock in Phase 17."
            footnote="Status: Active repository listening • 0 modification events"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  padding: '0.75rem',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(10, 10, 13, 0.4)',
                  fontSize: '0.82rem',
                  color: 'var(--color-ivory, #F6F3EC)',
                }}
              >
                {log.action} on {log.entityType} ({log.entityId}) by {log.actorEmail} at {log.timestamp}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
