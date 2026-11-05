import React from 'react';
import {
  Server,
  ShieldCheck,
  Cpu,
  Database,
  ArrowRight,
  Terminal,
  Sparkles,
  CheckCircle2,
  Workflow,
  Layers,
  Network,
  RotateCw,
} from 'lucide-react';

/**
 * Visual for Featured Article: "Building Scalable APIs with Laravel"
 * Represents API Gateway, Idempotency Guard, Redis Streams, and Database Services.
 */
export function ApiArchitectureVisual() {
  return (
    <div className="journal-vis-panel journal-api-vis" aria-label="API Architecture Pipeline Schematic">
      {/* Schematic Header */}
      <div className="journal-vis-header">
        <div className="journal-vis-title-group">
          <span className="journal-vis-dot" aria-hidden="true" />
          <Server size={14} className="text-gold" />
          <span className="journal-vis-title">API_GATEWAY // REQUEST-RESPONSE PIPELINE</span>
        </div>
        <span className="journal-vis-tag">OPENAPI 3.0 SPEC</span>
      </div>

      {/* Nodes Flow Diagram */}
      <div className="journal-vis-flow">
        {/* Node 1: Request Gateway */}
        <div className="journal-vis-node">
          <div className="journal-vis-node-header">
            <ShieldCheck size={13} className="text-gold" />
            <span>01. Gateway</span>
          </div>
          <div className="journal-vis-node-body">
            <span className="journal-vis-node-code">Idempotency-Key</span>
            <span className="journal-vis-node-sub">Rate Limiter Guard</span>
          </div>
        </div>

        <div className="journal-vis-arrow" aria-hidden="true">
          <ArrowRight size={14} />
        </div>

        {/* Node 2: FormRequest & Service */}
        <div className="journal-vis-node journal-vis-node-active">
          <div className="journal-vis-node-header">
            <Cpu size={13} className="text-gold" />
            <span>02. Service Layer</span>
          </div>
          <div className="journal-vis-node-body">
            <span className="journal-vis-node-code">Strict DTOs</span>
            <span className="journal-vis-node-sub">Horizon Queue Pub</span>
          </div>
        </div>

        <div className="journal-vis-arrow" aria-hidden="true">
          <ArrowRight size={14} />
        </div>

        {/* Node 3: Datastore & Replica */}
        <div className="journal-vis-node">
          <div className="journal-vis-node-header">
            <Database size={13} className="text-gold" />
            <span>03. Data Tier</span>
          </div>
          <div className="journal-vis-node-body">
            <span className="journal-vis-node-code">ACID Master</span>
            <span className="journal-vis-node-sub">Read Replica Split</span>
          </div>
        </div>
      </div>

      {/* Wire Payload Telemetry Bar */}
      <div className="journal-vis-payload-bar">
        <div className="journal-vis-code-line">
          <span className="text-gold">POST</span>
          <span>/api/v1/orders</span>
          <span className="journal-vis-badge-sub">200 OK • 38ms p99</span>
        </div>
        <div className="journal-vis-telemetry-pills">
          <span className="journal-vis-pill">Zero Duplicate Retries</span>
          <span className="journal-vis-pill text-gold">Validated Contracts</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Visual for Secondary Article 1: "My Development Workflow in 2026"
 * Represents containerized Docker tooling, static analysis, and real-time telemetry.
 */
export function WorkflowVisual() {
  return (
    <div className="journal-secondary-vis" aria-label="Development Workflow Terminal Preview">
      <div className="journal-sec-vis-bar">
        <div className="journal-sec-vis-left">
          <span className="journal-sec-dot journal-sec-dot-red" />
          <span className="journal-sec-dot journal-sec-dot-yellow" />
          <span className="journal-sec-dot journal-sec-dot-green" />
          <Terminal size={12} className="text-gold" style={{ marginLeft: '4px' }} />
          <span className="journal-sec-title">TOOLING // CI PIPELINE</span>
        </div>
        <span className="journal-sec-badge">PHP 8.3</span>
      </div>

      <div className="journal-sec-cmd-box">
        <span className="text-gold">$</span>
        <code>larastan analyse --level=8</code>
      </div>

      <div className="journal-sec-pipeline-row">
        <div className="journal-sec-step">
          <CheckCircle2 size={12} className="text-gold" />
          <span>Docker</span>
        </div>
        <span className="journal-sec-step-div">→</span>
        <div className="journal-sec-step">
          <CheckCircle2 size={12} className="text-gold" />
          <span>PHPStan L8</span>
        </div>
        <span className="journal-sec-step-div">→</span>
        <div className="journal-sec-step">
          <CheckCircle2 size={12} className="text-gold" />
          <span>Pulse</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Visual for Secondary Article 2: "What I've Learned as a Developer"
 * Represents engineering depth, architectural axioms, and simplicity.
 */
export function LessonsVisual() {
  return (
    <div className="journal-secondary-vis journal-lessons-vis" aria-label="Engineering Philosophy Axioms Preview">
      <div className="journal-sec-vis-bar">
        <div className="journal-sec-vis-left">
          <span className="journal-vis-dot" />
          <Sparkles size={12} className="text-gold" />
          <span className="journal-sec-title">ARCHITECTURAL AXIOMS</span>
        </div>
        <span className="journal-sec-badge">PRINCIPLES</span>
      </div>

      <div className="journal-axiom-quote">
        <span className="journal-axiom-mark">&ldquo;</span>
        <span className="journal-axiom-text">Simplicity outlives cleverness.</span>
      </div>

      <div className="journal-axiom-points">
        <div className="journal-axiom-point">
          <span className="journal-axiom-num">01</span>
          <span>Explicit transactional boundaries</span>
        </div>
        <div className="journal-axiom-point">
          <span className="journal-axiom-num">02</span>
          <span>Databases are the real bottleneck</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Visual for Secondary Article 3: "SQL Query Optimization: From Slow Scans to Index-Only Executions"
 * Represents B-Tree indexing, execution plan comparison, and zero heap table access.
 */
export function SqlOptimizationVisual() {
  return (
    <div className="journal-secondary-vis" aria-label="SQL Query Optimization EXPLAIN Preview">
      <div className="journal-sec-vis-bar">
        <div className="journal-sec-vis-left">
          <span className="journal-vis-dot" />
          <Database size={12} className="text-gold" />
          <span className="journal-sec-title">EXPLAIN ANALYZE // B-TREE</span>
        </div>
        <span className="journal-sec-badge text-gold">177x SPEEDUP</span>
      </div>

      <div className="journal-sql-compare">
        <div className="journal-sql-row journal-sql-before">
          <span className="journal-sql-tag">BEFORE</span>
          <span className="journal-sql-stat">Seq Scan: 142ms</span>
          <span className="journal-sql-cost">850k rows</span>
        </div>
        <div className="journal-sql-arrow">↓ Composite Index Applied</div>
        <div className="journal-sql-row journal-sql-after">
          <span className="journal-sql-tag journal-sql-tag-after">AFTER</span>
          <span className="journal-sql-stat text-gold">Index-Only: 0.8ms</span>
          <span className="journal-sql-cost text-gold">0 heap visits</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Visual for "Reliable Background Jobs: Queues, Retries, and Idempotency"
 * Represents Horizon queue pipelines, distributed advisory locks, and dead-letter queues.
 */
export function QueueJobsVisual() {
  return (
    <div className="journal-secondary-vis" aria-label="Reliable Background Jobs Queue Topology Preview">
      <div className="journal-sec-vis-bar">
        <div className="journal-sec-vis-left">
          <span className="journal-vis-dot" />
          <Workflow size={12} className="text-gold" />
          <span className="journal-sec-title">QUEUES // HORIZON WORKERS</span>
        </div>
        <span className="journal-sec-badge text-gold">REDIS LOCK</span>
      </div>

      <div className="journal-sec-cmd-box" style={{ justifyContent: 'space-between' }}>
        <span>Atomic Lock: <code style={{ color: 'var(--color-gold-light)' }}>job:settlement:UUID</code></span>
        <span style={{ color: 'rgba(214, 214, 226, 0.65)', fontSize: '0.72rem' }}>TTL 30s</span>
      </div>

      <div className="journal-sec-pipeline-row">
        <div className="journal-sec-step">
          <CheckCircle2 size={12} className="text-gold" />
          <span>At-Least-Once</span>
        </div>
        <span className="journal-sec-step-div">→</span>
        <div className="journal-sec-step">
          <RotateCw size={12} className="text-gold" />
          <span>Jitter Backoff</span>
        </div>
        <span className="journal-sec-step-div">→</span>
        <div className="journal-sec-step">
          <CheckCircle2 size={12} className="text-gold" />
          <span>DLQ Guard</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Visual for "Clean Architecture in Laravel: Service Layers & Domain Separation"
 * Represents Decoupled Controller -> DTO -> Service Layer -> Domain Contracts.
 */
export function CleanArchVisual() {
  return (
    <div className="journal-secondary-vis" aria-label="Clean Architecture Domain Separation Preview">
      <div className="journal-sec-vis-bar">
        <div className="journal-sec-vis-left">
          <span className="journal-vis-dot" />
          <Layers size={12} className="text-gold" />
          <span className="journal-sec-title">DOMAIN // SERVICE LAYER</span>
        </div>
        <span className="journal-sec-badge">DTO CONTRACT</span>
      </div>

      <div className="journal-axiom-quote" style={{ padding: '0.45rem 0.65rem' }}>
        <span className="journal-axiom-mark" style={{ fontSize: '1.2rem', top: '-6px' }}>&ldquo;</span>
        <span className="journal-axiom-text" style={{ fontSize: '0.82rem' }}>Skinny Controllers • Explicit DTO Boundaries</span>
      </div>

      <div className="journal-sec-pipeline-row" style={{ marginTop: '0.4rem' }}>
        <div className="journal-sec-step">
          <span style={{ color: 'var(--color-gold-light)', fontSize: '0.75rem', fontWeight: 600 }}>HTTP</span>
        </div>
        <span className="journal-sec-step-div">→</span>
        <div className="journal-sec-step">
          <span style={{ color: 'var(--color-gold)', fontSize: '0.75rem', fontWeight: 600 }}>DTO</span>
        </div>
        <span className="journal-sec-step-div">→</span>
        <div className="journal-sec-step">
          <span style={{ color: 'var(--color-ivory)', fontSize: '0.75rem', fontWeight: 600 }}>Service</span>
        </div>
        <span className="journal-sec-step-div">→</span>
        <div className="journal-sec-step">
          <span style={{ color: 'var(--color-gold-light)', fontSize: '0.75rem', fontWeight: 600 }}>Contract</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Visual for "Designing Scalable Systems: From Monolith to Decoupled Services"
 * Represents Caching Tiers, Load Balancing, and Database Replication.
 */
export function SystemDesignVisual() {
  return (
    <div className="journal-secondary-vis" aria-label="Scalable Systems Architecture Topology Preview">
      <div className="journal-sec-vis-bar">
        <div className="journal-sec-vis-left">
          <span className="journal-vis-dot" />
          <Network size={12} className="text-gold" />
          <span className="journal-sec-title">TOPOLOGY // MODULAR MONOLITH</span>
        </div>
        <span className="journal-sec-badge text-gold">HA CLUSTER</span>
      </div>

      <div className="journal-sec-cmd-box" style={{ justifyContent: 'space-between' }}>
        <span>Edge CDN → Envoy LB → App Cluster</span>
        <span style={{ color: 'var(--color-gold-light)', fontSize: '0.74rem' }}>P99 &lt; 35ms</span>
      </div>

      <div className="journal-sec-pipeline-row">
        <div className="journal-sec-step">
          <CheckCircle2 size={12} className="text-gold" />
          <span>In-Memory L1</span>
        </div>
        <span className="journal-sec-step-div">→</span>
        <div className="journal-sec-step">
          <CheckCircle2 size={12} className="text-gold" />
          <span>Redis L2</span>
        </div>
        <span className="journal-sec-step-div">→</span>
        <div className="journal-sec-step">
          <CheckCircle2 size={12} className="text-gold" />
          <span>DB Replica</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Unified Technical Visual Dispatcher for Blog Archive Cards
 */
export function BlogCardVisual({ slug }: { slug: string }) {
  switch (slug) {
    case 'building-scalable-apis-with-laravel':
      return <ApiArchitectureVisual />;
    case 'my-development-workflow-2026':
      return <WorkflowVisual />;
    case 'what-ive-learned-as-a-developer':
      return <LessonsVisual />;
    case 'sql-query-optimization':
      return <SqlOptimizationVisual />;
    case 'reliable-background-jobs':
      return <QueueJobsVisual />;
    case 'clean-architecture-in-laravel':
      return <CleanArchVisual />;
    case 'designing-scalable-systems':
      return <SystemDesignVisual />;
    default:
      return <WorkflowVisual />;
  }
}
