'use client';

import React, { useState } from 'react';
import {
  Play,
  Cpu,
  Database,
  ArrowRight,
  Server,
  ShieldCheck,
  ScanBarcode,
  Layers,
  FileSpreadsheet,
  Lock,
  RefreshCw,
  Terminal,
} from 'lucide-react';

export interface ProjectSchematicVisualProps {
  type?:
    | 'task-flow'
    | 'license-matrix'
    | 'security-topology'
    | 'skillup-horizon'
    | 'smartpos-hardware'
    | 'tanqia-pipeline';
  slug?: string;
  variant?: 'compact' | 'full';
}

export function ProjectSchematicVisual({
  type = 'skillup-horizon',
  slug,
  variant = 'full',
}: ProjectSchematicVisualProps) {
  // Normalize visual key
  let resolvedType = type;
  if (slug === 'skillup-platform' || type === 'task-flow' || type === 'skillup-horizon') {
    resolvedType = 'skillup-horizon';
  } else if (slug === 'smartpos-erp' || type === 'license-matrix' || type === 'smartpos-hardware') {
    resolvedType = 'smartpos-hardware';
  } else if (slug === 'tanqia-skills' || type === 'tanqia-pipeline') {
    resolvedType = 'tanqia-pipeline';
  } else if (slug === 'sip-and-snug' || type === 'security-topology') {
    resolvedType = 'security-topology';
  }

  const [burstCount, setBurstCount] = useState(1);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSimulating(true);
    setBurstCount((prev) => prev + 1);
    setTimeout(() => setIsSimulating(false), 900);
  };

  // =================================================================
  // COMPACT VARIANT (Engineered for 3-Column Gallery Cards)
  // =================================================================
  if (variant === 'compact') {
    if (resolvedType === 'skillup-horizon') {
      return (
        <div className="compact-schematic-wrap" aria-label="SkillUp Horizon Queue Architecture Preview">
          <div className="compact-schematic-bar">
            <div className="compact-bar-left">
              <span className="compact-pulse-dot" />
              <Cpu size={14} className="text-gold" />
              <span className="compact-schematic-title">HORIZON QUEUE CLUSTER</span>
            </div>
            <span className="compact-telemetry-tag">38ms p99</span>
          </div>

          <div className="compact-nodes-row">
            <div className="compact-node">
              <Server size={13} className="text-gold" />
              <span>Gateway</span>
            </div>
            <div className="compact-arrow" aria-hidden="true">→</div>
            <div className="compact-node compact-node-primary">
              <Cpu size={13} className="text-gold" />
              <span>16 Workers</span>
            </div>
            <div className="compact-arrow" aria-hidden="true">→</div>
            <div className="compact-node">
              <Database size={13} className="text-gold" />
              <span>MySQL Master</span>
            </div>
          </div>

          <div className="compact-schematic-footer">
            <span className="compact-footer-item">Redis Streams Priority</span>
            <span className="compact-footer-bullet">•</span>
            <span className="compact-footer-item text-gold">Zero Lost Jobs</span>
          </div>
        </div>
      );
    }

    if (resolvedType === 'smartpos-hardware') {
      return (
        <div className="compact-schematic-wrap" aria-label="SmartPOS Hardware Scanner Architecture Preview">
          <div className="compact-schematic-bar">
            <div className="compact-bar-left">
              <span className="compact-pulse-dot" />
              <ScanBarcode size={13} className="text-gold" />
              <span className="compact-schematic-title">NATIVEPHP HARDWARE I/O</span>
            </div>
            <span className="compact-telemetry-tag">Luhn Validated</span>
          </div>

          <div className="compact-nodes-row">
            <div className="compact-node">
              <ScanBarcode size={13} className="text-gold" />
              <span>Barcode/IMEI</span>
            </div>
            <div className="compact-arrow" aria-hidden="true">→</div>
            <div className="compact-node compact-node-primary">
              <Server size={13} className="text-gold" />
              <span>NativePHP</span>
            </div>
            <div className="compact-arrow" aria-hidden="true">→</div>
            <div className="compact-node">
              <Database size={13} className="text-gold" />
              <span>SQLite Sync</span>
            </div>
          </div>

          <div className="compact-schematic-footer">
            <span className="compact-footer-item">Sub-10ms Hardware Scan</span>
            <span className="compact-footer-bullet">•</span>
            <span className="compact-footer-item text-gold">Async Thermal Print</span>
          </div>
        </div>
      );
    }

    if (resolvedType === 'tanqia-pipeline') {
      return (
        <div className="compact-schematic-wrap" aria-label="Tanqia Skills Batch Ingestion Architecture Preview">
          <div className="compact-schematic-bar">
            <div className="compact-bar-left">
              <span className="compact-pulse-dot" />
              <Layers size={13} className="text-gold" />
              <span className="compact-schematic-title">RBAC BATCH PIPELINE</span>
            </div>
            <span className="compact-telemetry-tag">24MB Heap</span>
          </div>

          <div className="compact-nodes-row">
            <div className="compact-node">
              <ShieldCheck size={13} className="text-gold" />
              <span>Role Gate</span>
            </div>
            <div className="compact-arrow" aria-hidden="true">→</div>
            <div className="compact-node compact-node-primary">
              <FileSpreadsheet size={13} className="text-gold" />
              <span>Chunk Ingest</span>
            </div>
            <div className="compact-arrow" aria-hidden="true">→</div>
            <div className="compact-node">
              <Lock size={13} className="text-gold" />
              <span>Mutex Locks</span>
            </div>
          </div>

          <div className="compact-schematic-footer">
            <span className="compact-footer-item">500 Rows/Batch</span>
            <span className="compact-footer-bullet">•</span>
            <span className="compact-footer-item text-gold">Idempotent Locks</span>
          </div>
        </div>
      );
    }

    // Default compact for additional projects (e.g. Sip & Snug)
    return (
      <div className="compact-schematic-wrap" aria-label="RESTful Architecture Preview">
        <div className="compact-schematic-bar">
          <div className="compact-bar-left">
            <span className="compact-pulse-dot" />
            <ShieldCheck size={14} className="text-gold" />
            <span className="compact-schematic-title">SANCTUM REST API</span>
          </div>
          <span className="compact-telemetry-tag">OpenAPI 3.0</span>
        </div>

        <div className="compact-nodes-row">
          <div className="compact-node">
            <ShieldCheck size={14} className="text-gold" />
            <span>Sanctum</span>
          </div>
          <div className="compact-arrow" aria-hidden="true">→</div>
          <div className="compact-node compact-node-primary">
            <Server size={14} className="text-gold" />
            <span>Services</span>
          </div>
          <div className="compact-arrow" aria-hidden="true">→</div>
          <div className="compact-node">
            <Database size={14} className="text-gold" />
            <span>OpenAPI 3.0</span>
          </div>
        </div>

        <div className="compact-schematic-footer">
          <span className="compact-footer-item">Token Auth</span>
          <span className="compact-footer-bullet">•</span>
          <span className="compact-footer-item text-gold">Validated Schemas</span>
        </div>
      </div>
    );
  }

  // =================================================================
  // FULL VARIANT (For Dedicated Case Study Pages at /work/[slug])
  // =================================================================
  if (resolvedType === 'skillup-horizon') {
    return (
      <div className="schematic-container" aria-label="SkillUp Horizon Queue Architecture Schematic">
        {/* Terminal Header */}
        <div className="schematic-header">
          <div className="schematic-header-left">
            <span className="schematic-pulse-dot" />
            <Cpu size={16} className="text-gold" />
            <span className="schematic-title">SKILLUP_CORE // HORIZON_QUEUE_CLUSTER</span>
          </div>

          <div className="schematic-header-right">
            <span className="schematic-badge-spec">ENGINEERING SCHEMATIC</span>
            <button
              type="button"
              onClick={handleSimulate}
              disabled={isSimulating}
              className="schematic-action-btn"
              aria-label="Simulate burst traffic to test queue workers"
            >
              <Play size={13} className={isSimulating ? 'animate-spin' : ''} />
              <span>Simulate Burst #{burstCount}</span>
            </button>
          </div>
        </div>

        {/* 3-Stage Connected Architecture Flow */}
        <div className="schematic-stages-grid">
          {/* Stage 1: Ingestion */}
          <div className={`schematic-node ${isSimulating ? 'node-active' : ''}`}>
            <div className="node-eyebrow">STAGE 01 // INGESTION</div>
            <div className="node-title">
              <Server size={16} className="text-gold" />
              <span>API Gateway</span>
            </div>
            <div className="node-meta">
              <span className="meta-spec">Laravel 11 REST API</span>
              <span className="meta-stat">
                Throughput: <strong className="text-gold">{1800 + burstCount * 240} req/s</strong>
              </span>
            </div>
            <div className="node-pill">SHA-256 Idempotency Lock</div>
          </div>

          {/* Connector 1 */}
          <div className="schematic-flow-arrow" aria-hidden="true">
            <ArrowRight size={18} />
            <span className="flow-dash" />
          </div>

          {/* Stage 2: Queue Workers */}
          <div className={`schematic-node node-primary ${isSimulating ? 'node-active' : ''}`}>
            <div className="node-eyebrow">STAGE 02 // CONCURRENCY</div>
            <div className="node-title">
              <Cpu size={16} className="text-gold" />
              <span>Redis &amp; Horizon</span>
            </div>
            <div className="node-meta">
              <span className="meta-spec">16 Supervisor Daemons</span>
              <span className="meta-stat">
                Jobs Enqueued: <strong className="text-gold">{24 + burstCount * 8}</strong>
              </span>
            </div>
            <div className="node-pill">128MB Memory Cap / Auto-Recycle</div>
          </div>

          {/* Connector 2 */}
          <div className="schematic-flow-arrow" aria-hidden="true">
            <ArrowRight size={18} />
            <span className="flow-dash" />
          </div>

          {/* Stage 3: Persistence */}
          <div className={`schematic-node ${isSimulating ? 'node-active' : ''}`}>
            <div className="node-eyebrow">STAGE 03 // PERSISTENCE</div>
            <div className="node-title">
              <Database size={16} className="text-gold" />
              <span>MySQL 8 Replica Split</span>
            </div>
            <div className="node-meta">
              <span className="meta-spec">Composite Covering Indexes</span>
              <span className="meta-stat">
                Latency: <strong className="text-gold">&lt; 38ms p99</strong>
              </span>
            </div>
            <div className="node-pill">Zero Lost Transactions (ACID)</div>
          </div>
        </div>

        {/* Micro-Telemetry Terminal Footer */}
        <div className="schematic-footer">
          <div className="footer-metric">
            <span className="metric-lbl">ACTIVE POOLS</span>
            <span className="metric-val">4 Queues</span>
          </div>
          <div className="footer-divider" />
          <div className="footer-metric">
            <span className="metric-lbl">P99 RESPONSE</span>
            <span className="metric-val text-gold">38ms</span>
          </div>
          <div className="footer-divider" />
          <div className="footer-metric">
            <span className="metric-lbl">DEAD LETTER QUEUE</span>
            <span className="metric-val">0 (Clean)</span>
          </div>
          <div className="footer-log">
            <Terminal size={14} className="text-gold" />
            <code>
              {isSimulating
                ? `[BURST #${burstCount}] Ingested 240 jobs -> Horizon worker pool balanced in 34ms`
                : `[IDLE_STREAM] Horizon daemon heartbeat nominal • Read-replica query cache active`}
            </code>
          </div>
        </div>
      </div>
    );
  }

  if (resolvedType === 'smartpos-hardware') {
    return (
      <div className="schematic-container" aria-label="SmartPOS Hardware Scanner & NativePHP Architecture Schematic">
        <div className="schematic-header">
          <div className="schematic-header-left">
            <span className="schematic-pulse-dot" />
            <ScanBarcode size={16} className="text-gold" />
            <span className="schematic-title">SMARTPOS // NATIVEPHP_HARDWARE_IO</span>
          </div>

          <div className="schematic-header-right">
            <span className="schematic-badge-spec">ENGINEERING SCHEMATIC</span>
            <button
              type="button"
              onClick={handleSimulate}
              disabled={isSimulating}
              className="schematic-action-btn"
              aria-label="Simulate barcode scanner burst"
            >
              <ScanBarcode size={13} className={isSimulating ? 'animate-pulse' : ''} />
              <span>Simulate Scan #{burstCount}</span>
            </button>
          </div>
        </div>

        <div className="schematic-stages-grid">
          <div className={`schematic-node ${isSimulating ? 'node-active' : ''}`}>
            <div className="node-eyebrow">HARDWARE I/O // SCANNER</div>
            <div className="node-title">
              <ScanBarcode size={16} className="text-gold" />
              <span>Serial Stream Pipe</span>
            </div>
            <div className="node-meta">
              <span className="meta-spec">USB Barcode / Laser Stream</span>
              <span className="meta-stat">
                IMEI Check: <strong className="text-gold">Luhn 15-Digit PASS</strong>
              </span>
            </div>
            <div className="node-pill">Debounced Fast Keystroke Buffer</div>
          </div>

          <div className="schematic-flow-arrow" aria-hidden="true">
            <ArrowRight size={18} />
            <span className="flow-dash" />
          </div>

          <div className={`schematic-node node-primary ${isSimulating ? 'node-active' : ''}`}>
            <div className="node-eyebrow">LOCAL RUNTIME // DESKTOP</div>
            <div className="node-title">
              <Server size={16} className="text-gold" />
              <span>NativePHP Host</span>
            </div>
            <div className="node-meta">
              <span className="meta-spec">In-Memory SQLite Cache</span>
              <span className="meta-stat">
                Checkout Lease: <strong className="text-gold">120s Optimistic</strong>
              </span>
            </div>
            <div className="node-pill">Multi-Attribute Variant Matrix</div>
          </div>

          <div className="schematic-flow-arrow" aria-hidden="true">
            <ArrowRight size={18} />
            <span className="flow-dash" />
          </div>

          <div className={`schematic-node ${isSimulating ? 'node-active' : ''}`}>
            <div className="node-eyebrow">PRINTER // ASYNC SPOOLER</div>
            <div className="node-title">
              <Database size={16} className="text-gold" />
              <span>ESC/POS &amp; MySQL</span>
            </div>
            <div className="node-meta">
              <span className="meta-spec">Async Background PDF Spool</span>
              <span className="meta-stat">
                Batch Cloud Sync: <strong className="text-gold">Committed</strong>
              </span>
            </div>
            <div className="node-pill">Automated Daily P&amp;L Ledger</div>
          </div>
        </div>

        <div className="schematic-footer">
          <div className="footer-metric">
            <span className="metric-lbl">SERIAL SCANNER</span>
            <span className="metric-val text-gold">ARMED &amp; READY</span>
          </div>
          <div className="footer-divider" />
          <div className="footer-metric">
            <span className="metric-lbl">INVOICE RENDER</span>
            <span className="metric-val">&lt; 120ms</span>
          </div>
          <div className="footer-divider" />
          <div className="footer-metric">
            <span className="metric-lbl">OFFLINE SYNC</span>
            <span className="metric-val">Zero Double-Sale</span>
          </div>
          <div className="footer-log">
            <Terminal size={14} className="text-gold" />
            <code>
              {isSimulating
                ? `[SCAN #${burstCount}] IMEI 356938090284712 validated • Held in SQLite lease • Thermal print queued`
                : `[STANDBY] NativePHP hardware hooks listening on COM3 • Serial stream buffer clear`}
            </code>
          </div>
        </div>
      </div>
    );
  }

  if (resolvedType === 'tanqia-pipeline') {
    return (
      <div className="schematic-container" aria-label="Tanqia Skills Batch Ingestion & RBAC Schematic">
        <div className="schematic-header">
          <div className="schematic-header-left">
            <span className="schematic-pulse-dot" />
            <Layers size={16} className="text-gold" />
            <span className="schematic-title">TANQIA_PIPELINE // RBAC_BATCH_ORCHESTRATOR</span>
          </div>

          <div className="schematic-header-right">
            <span className="schematic-badge-spec">ENGINEERING SCHEMATIC</span>
            <button
              type="button"
              onClick={handleSimulate}
              disabled={isSimulating}
              className="schematic-action-btn"
              aria-label="Trigger chunked batch data ingest"
            >
              <RefreshCw size={13} className={isSimulating ? 'animate-spin' : ''} />
              <span>Trigger Batch #{burstCount}</span>
            </button>
          </div>
        </div>

        <div className="schematic-stages-grid">
          <div className={`schematic-node ${isSimulating ? 'node-active' : ''}`}>
            <div className="node-eyebrow">AUTH // GATEWAY</div>
            <div className="node-title">
              <ShieldCheck size={16} className="text-gold" />
              <span>RBAC Policy Guard</span>
            </div>
            <div className="node-meta">
              <span className="meta-spec">Admin / Employee Roles</span>
              <span className="meta-stat">
                Policy Gate: <strong className="text-gold">Strict Session Lock</strong>
              </span>
            </div>
            <div className="node-pill">CSRF &amp; Permission Middleware</div>
          </div>

          <div className="schematic-flow-arrow" aria-hidden="true">
            <ArrowRight size={18} />
            <span className="flow-dash" />
          </div>

          <div className={`schematic-node node-primary ${isSimulating ? 'node-active' : ''}`}>
            <div className="node-eyebrow">BATCH STREAM // INGESTION</div>
            <div className="node-title">
              <FileSpreadsheet size={16} className="text-gold" />
              <span>Chunked Excel Engine</span>
            </div>
            <div className="node-meta">
              <span className="meta-spec">500 Rows per Batch Chunk</span>
              <span className="meta-stat">
                Processed: <strong className="text-gold">{1500 + burstCount * 500} records</strong>
              </span>
            </div>
            <div className="node-pill">Constant 24MB Heap Cap (No OOM)</div>
          </div>

          <div className="schematic-flow-arrow" aria-hidden="true">
            <ArrowRight size={18} />
            <span className="flow-dash" />
          </div>

          <div className={`schematic-node ${isSimulating ? 'node-active' : ''}`}>
            <div className="node-eyebrow">MUTEX // CONCURRENCY</div>
            <div className="node-title">
              <Lock size={16} className="text-gold" />
              <span>MySQL Advisory Locks</span>
            </div>
            <div className="node-meta">
              <span className="meta-spec">GET_LOCK() Mutual Exclusion</span>
              <span className="meta-stat">
                Job Idempotency: <strong className="text-gold">100% Guaranteed</strong>
              </span>
            </div>
            <div className="node-pill">Automated Database Backups</div>
          </div>
        </div>

        <div className="schematic-footer">
          <div className="footer-metric">
            <span className="metric-lbl">MEMORY PROFILE</span>
            <span className="metric-val text-gold">24MB Cap (Stable)</span>
          </div>
          <div className="footer-divider" />
          <div className="footer-metric">
            <span className="metric-lbl">TASK DISPATCH</span>
            <span className="metric-val">0 Collisions</span>
          </div>
          <div className="footer-divider" />
          <div className="footer-metric">
            <span className="metric-lbl">BACKUP TELEMETRY</span>
            <span className="metric-val">Verified Daily</span>
          </div>
          <div className="footer-log">
            <Terminal size={14} className="text-gold" />
            <code>
              {isSimulating
                ? `[BATCH #${burstCount}] Ingested chunk of 500 records • MySQL advisory mutex acquired & released cleanly`
                : `[MUTEX_MONITOR] Advisory lock registry quiet • Scheduled backup snapshot verified`}
            </code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="schematic-container" aria-label="OpenAPI RESTful Architecture Schematic">
      <div className="schematic-header">
        <div className="schematic-header-left">
          <span className="schematic-pulse-dot" />
          <ShieldCheck size={16} className="text-gold" />
          <span className="schematic-title">REST_API // SANCTUM_TOKEN_AUTH</span>
        </div>
        <div className="schematic-header-right">
          <span className="schematic-badge-spec">ENGINEERING SCHEMATIC</span>
        </div>
      </div>

      <div className="schematic-stages-grid">
        <div className="schematic-node">
          <div className="node-eyebrow">API GATEWAY</div>
          <div className="node-title">
            <ShieldCheck size={16} className="text-gold" />
            <span>Sanctum Auth</span>
          </div>
          <div className="node-meta">
            <span className="meta-spec">Token Bearer Authentication</span>
            <span className="meta-stat">Rate Limit: 60 req/min</span>
          </div>
          <div className="node-pill">Strict FormRequest Validation</div>
        </div>

        <div className="schematic-flow-arrow" aria-hidden="true">
          <ArrowRight size={18} />
          <span className="flow-dash" />
        </div>

        <div className="schematic-node node-primary">
          <div className="node-eyebrow">BUSINESS LOGIC</div>
          <div className="node-title">
            <Server size={16} className="text-gold" />
            <span>Order &amp; Cart State</span>
          </div>
          <div className="node-meta">
            <span className="meta-spec">Dynamic Delivery Zones</span>
            <span className="meta-stat">Cart Reservation Lock</span>
          </div>
          <div className="node-pill">Eloquent Eager Loading Guard</div>
        </div>

        <div className="schematic-flow-arrow" aria-hidden="true">
          <ArrowRight size={18} />
          <span className="flow-dash" />
        </div>

        <div className="schematic-node">
          <div className="node-eyebrow">DOCUMENTATION</div>
          <div className="node-title">
            <Database size={16} className="text-gold" />
            <span>L5-Swagger OpenAPI</span>
          </div>
          <div className="node-meta">
            <span className="meta-spec">OpenAPI 3.0 Contract</span>
            <span className="meta-stat">Synchronized Endpoints</span>
          </div>
          <div className="node-pill">Automated Route Schema Sync</div>
        </div>
      </div>

      <div className="schematic-footer">
        <div className="footer-metric">
          <span className="metric-lbl">CONTRACT</span>
          <span className="metric-val text-gold">OpenAPI 3.0</span>
        </div>
        <div className="footer-divider" />
        <div className="footer-metric">
          <span className="metric-lbl">SECURITY</span>
          <span className="metric-val">Sanctum Protected</span>
        </div>
        <div className="footer-log">
          <Terminal size={14} className="text-gold" />
          <code>[GATEWAY] REST endpoints verified against OpenAPI 3.0 schema contract</code>
        </div>
      </div>
    </div>
  );
}
