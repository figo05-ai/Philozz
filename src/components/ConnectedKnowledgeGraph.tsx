'use client';

import React, { useState, useId } from 'react';
import Link from 'next/link';
import { Network, List, ExternalLink, ArrowRight } from 'lucide-react';
import { TechnologyEntity } from '@/cms/models/technology';
import { getTechLogo } from '@/components/TechLogos';
import { ARCHITECTURAL_EDGES } from '@/cms/models/knowledgeGraph';

interface NodePosition {
  id: string;
  name: string;
  category: string;
  x: number; // 0..1000 viewBox
  y: number; // 0..520 viewBox
  color: string;
}

const GRAPH_NODES: NodePosition[] = [
  // Backend & Core (Left-Center)
  { id: 'laravel', name: 'Laravel', category: 'Backend Framework', x: 280, y: 190, color: '#FF2D20' },
  { id: 'php', name: 'PHP 8.3', category: 'Language', x: 120, y: 110, color: '#777BB4' },
  { id: 'mysql', name: 'MySQL 8.0', category: 'Database', x: 130, y: 310, color: '#00758F' },
  { id: 'redis', name: 'Redis', category: 'Cache & Queues', x: 450, y: 110, color: '#DC382D' },

  // Infrastructure (Bottom-Center)
  { id: 'docker', name: 'Docker', category: 'Containerization', x: 380, y: 380, color: '#2496ED' },
  { id: 'linux', name: 'Linux', category: 'Infrastructure', x: 600, y: 390, color: '#C9A45C' },

  // Frontend & Full-Stack (Right-Center)
  { id: 'nextjs', name: 'Next.js 16', category: 'Full-Stack', x: 670, y: 140, color: '#E4C88A' },
  { id: 'react', name: 'React 19', category: 'Frontend', x: 860, y: 180, color: '#61DAFB' },
  { id: 'javascript', name: 'JavaScript', category: 'Language', x: 830, y: 340, color: '#F7DF1E' },
];

export interface ConnectedKnowledgeGraphProps {
  technologies: TechnologyEntity[];
}

export function ConnectedKnowledgeGraph({ technologies }: ConnectedKnowledgeGraphProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('laravel');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'matrix'>('graph');
  const svgDescId = useId();

  const activeNodeId = hoveredNodeId || selectedNodeId;
  const activeNode = GRAPH_NODES.find((n) => n.id === activeNodeId) || GRAPH_NODES[0];
  const activeTech = technologies.find((t) => t.id === activeNodeId);

  // Filter edges connected to the active node
  const connectedEdges = ARCHITECTURAL_EDGES.filter(
    (e) => e.source === activeNodeId || e.target === activeNodeId
  );

  const connectedNodeIds = new Set<string>();
  connectedEdges.forEach((e) => {
    connectedNodeIds.add(e.source);
    connectedNodeIds.add(e.target);
  });

  return (
    <div className="atlas-knowledge-container" aria-label="Connected Knowledge Architecture">
      {/* Controls: Graph vs Accessible Matrix */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.5rem',
              color: 'var(--color-ivory)',
              marginBottom: '0.25rem',
            }}
          >
            How My Stack Connects
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-ivory-muted)' }}>
            Interactive architectural topology showing verified data flows, runtime bindings, and infrastructure orchestration.
          </p>
        </div>

        <div style={{ display: 'inline-flex', gap: '0.5rem', background: 'var(--color-obsidian)', padding: '4px', borderRadius: '6px', border: '1px solid rgba(201, 164, 92, 0.2)' }}>
          <button
            type="button"
            onClick={() => setViewMode('graph')}
            className={`atlas-filter-btn ${viewMode === 'graph' ? 'active' : ''}`}
            aria-pressed={viewMode === 'graph'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: 'none' }}
          >
            <Network size={14} />
            <span>Topology Graph</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('matrix')}
            className={`atlas-filter-btn ${viewMode === 'matrix' ? 'active' : ''}`}
            aria-pressed={viewMode === 'matrix'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: 'none' }}
          >
            <List size={14} />
            <span>Accessible Matrix</span>
          </button>
        </div>
      </div>

      {viewMode === 'graph' ? (
        <>
          <div className="atlas-graph-svg-wrap" role="region" aria-label="Interactive Architecture Graph">
            <svg
              viewBox="0 0 1000 520"
              width="100%"
              height="100%"
              style={{ overflow: 'visible' }}
              aria-describedby={svgDescId}
            >
              <desc id={svgDescId}>
                Interactive network diagram displaying architectural relationships between Laravel, PHP, MySQL, Redis, Docker, Linux, Next.js, React, and JavaScript.
              </desc>

              <defs>
                {/* Glow Filter */}
                <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                {/* Subtle Grid Pattern */}
                <pattern id="graphGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(201, 164, 92, 0.05)" strokeWidth="1" />
                </pattern>
              </defs>

              {/* Background grid */}
              <rect width="1000" height="520" fill="url(#graphGrid)" rx="8" />

              {/* Edges */}
              {ARCHITECTURAL_EDGES.map((edge, idx) => {
                const sNode = GRAPH_NODES.find((n) => n.id === edge.source);
                const tNode = GRAPH_NODES.find((n) => n.id === edge.target);
                if (!sNode || !tNode) return null;

                const isConnected =
                  edge.source === activeNodeId || edge.target === activeNodeId;

                const strokeColor = isConnected
                  ? 'var(--color-gold-light, #E4C88A)'
                  : 'rgba(201, 164, 92, 0.18)';
                const strokeWidth = isConnected ? 2.5 : 1.2;
                const strokeDash = isConnected ? 'none' : '4,4';
                const opacity = isConnected ? 1 : 0.45;

                const midX = (sNode.x + tNode.x) / 2;
                const midY = (sNode.y + tNode.y) / 2;

                return (
                  <g key={`${edge.source}-${edge.target}-${idx}`} opacity={opacity} style={{ transition: 'opacity 0.25s ease' }}>
                    <line
                      x1={sNode.x}
                      y1={sNode.y}
                      x2={tNode.x}
                      y2={tNode.y}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDash}
                    />
                    {isConnected && (
                      <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                          x="-55"
                          y="-11"
                          width="110"
                          height="22"
                          rx="4"
                          fill="var(--color-obsidian, #0A0A0D)"
                          stroke="rgba(201, 164, 92, 0.4)"
                          strokeWidth="1"
                        />
                        <text
                          textAnchor="middle"
                          y="4"
                          fill="var(--color-ivory, #F6F3EC)"
                          fontSize="9.5"
                          fontFamily="var(--font-mono)"
                          letterSpacing="0.05em"
                        >
                          {edge.label}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Nodes */}
              {GRAPH_NODES.map((node) => {
                const isSelected = node.id === activeNodeId;
                const isNeighbor = connectedNodeIds.has(node.id);
                const LogoComponent = getTechLogo(node.id);

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    className="atlas-graph-interactive-node"
                    onClick={() => setSelectedNodeId(node.id)}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Select ${node.name} architecture node`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedNodeId(node.id);
                      }
                    }}
                  >
                    {/* Pulsing ring for selected */}
                    {isSelected && (
                      <circle
                        r="34"
                        fill="none"
                        stroke="var(--color-gold)"
                        strokeWidth="1.5"
                        strokeDasharray="4,3"
                        opacity="0.8"
                      />
                    )}

                    {/* Node Background Circle */}
                    <circle
                      r="26"
                      fill={isSelected ? 'var(--color-charcoal-card)' : 'var(--color-obsidian)'}
                      stroke={
                        isSelected
                          ? 'var(--color-gold)'
                          : isNeighbor
                          ? 'rgba(201, 164, 92, 0.5)'
                          : 'rgba(255, 255, 255, 0.12)'
                      }
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      filter={isSelected ? 'url(#goldGlow)' : undefined}
                    />

                    {/* Tech Logo */}
                    <foreignObject x="-14" y="-14" width="28" height="28" style={{ pointerEvents: 'none' }}>
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <LogoComponent size={24} />
                      </div>
                    </foreignObject>

                    {/* Node Label Below */}
                    <text
                      textAnchor="middle"
                      y="44"
                      fill={isSelected ? 'var(--color-gold-light)' : 'var(--color-ivory)'}
                      fontSize="12"
                      fontWeight={isSelected ? '700' : '500'}
                      fontFamily="var(--font-sans)"
                    >
                      {node.name}
                    </text>

                    <text
                      textAnchor="middle"
                      y="56"
                      fill="var(--color-text-dim)"
                      fontSize="9"
                      fontFamily="var(--font-mono)"
                      letterSpacing="0.04em"
                    >
                      {node.category}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Connected Details Overlay Panel */}
          <div className="atlas-graph-details-overlay">
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    color: 'var(--color-gold)',
                    letterSpacing: '0.08em',
                  }}
                >
                  Active Hub:
                </span>
                <strong
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.25rem',
                    color: 'var(--color-ivory)',
                  }}
                >
                  {activeNode.name}
                </strong>
                <span className="atlas-status-badge actively_using">
                  <span className="atlas-status-dot" />
                  Actively Used
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {connectedEdges.map((edge, idx) => {
                  const siblingId = edge.source === activeNodeId ? edge.target : edge.source;
                  const sibling = GRAPH_NODES.find((n) => n.id === siblingId);

                  return (
                    <div
                      key={idx}
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--color-ivory-muted)',
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '0.5rem',
                      }}
                    >
                      <ArrowRight size={13} style={{ color: 'var(--color-gold)', flexShrink: 0 }} />
                      <span>
                        <strong style={{ color: 'var(--color-gold-light)' }}>
                          {sibling?.name} ({edge.label}):
                        </strong>{' '}
                        {edge.relationship}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {activeTech && (
              <Link
                href={`/skills/${activeTech.id}`}
                className="btn-outline-gold"
                style={{ flexShrink: 0, padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
              >
                <span>Deep Dive Profile</span>
                <ExternalLink size={14} />
              </Link>
            )}
          </div>
        </>
      ) : (
        /* Accessible Non-Graph Matrix View */
        <div style={{ marginTop: '1rem' }}>
          <div className="admin-table-container">
            <table className="admin-table" aria-label="Architecture Connections Matrix">
              <thead>
                <tr>
                  <th scope="col">Primary Technology</th>
                  <th scope="col">Architectural Integration</th>
                  <th scope="col">Integration Nature</th>
                  <th scope="col">Verified Technical Purpose</th>
                </tr>
              </thead>
              <tbody>
                {ARCHITECTURAL_EDGES.map((edge, idx) => {
                  const sNode = GRAPH_NODES.find((n) => n.id === edge.source);
                  const tNode = GRAPH_NODES.find((n) => n.id === edge.target);

                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: 'var(--color-ivory)' }}>
                        <Link href={`/skills/${edge.source}`} style={{ color: 'var(--color-gold-light)', textDecoration: 'none' }}>
                          {sNode?.name || edge.source}
                        </Link>
                      </td>
                      <td>
                        <Link href={`/skills/${edge.target}`} style={{ color: 'var(--color-ivory)', textDecoration: 'none' }}>
                          {tNode?.name || edge.target}
                        </Link>
                      </td>
                      <td>
                        <span className="atlas-tech-cap-tag" style={{ color: 'var(--color-gold)' }}>
                          {edge.label}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.875rem', color: 'var(--color-ivory-muted)' }}>
                        {edge.relationship}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
