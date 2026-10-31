/**
 * PHILOZZ — Engineering Atlas Knowledge Graph Data & Architecture
 * Defines verified architectural edges, integration nature, and node metadata.
 */

export interface ArchitecturalEdge {
  source: string;
  target: string;
  label: string;
  relationship: string;
}

export const ARCHITECTURAL_EDGES: readonly ArchitecturalEdge[] = [
  {
    source: 'laravel',
    target: 'php',
    label: 'Engine & Foundation',
    relationship:
      'Laravel 11/13 runs on modern PHP 8.3 with strict typing, attributes, and fiber-based asynchronous concurrency.',
  },
  {
    source: 'laravel',
    target: 'mysql',
    label: 'Eloquent & ACID Store',
    relationship:
      'Primary relational datastore orchestrated through Eloquent ORM with composite indexes, foreign key cascades, and transactional locks.',
  },
  {
    source: 'laravel',
    target: 'redis',
    label: 'Queues & Fast Cache',
    relationship:
      'Redis acts as the queue broker for Laravel Horizon workers and high-speed cache layer for sub-50ms API responses.',
  },
  {
    source: 'laravel',
    target: 'docker',
    label: 'Container Parity',
    relationship:
      'Multi-stage Docker builds guarantee exact PHP, extension, and daemon parity across local development and production VPS environments.',
  },
  {
    source: 'redis',
    target: 'mysql',
    label: 'Cache-Aside Layer',
    relationship:
      'Redis insulates MySQL from read surges using cache tags, while atomic locks protect critical write operations from race conditions.',
  },
  {
    source: 'docker',
    target: 'linux',
    label: 'Daemon & Network Host',
    relationship:
      'Docker containers run on production Linux VPS instances managed by systemd daemons, bridge networks, and Nginx reverse proxies.',
  },
  {
    source: 'nextjs',
    target: 'react',
    label: 'Framework & Runtime',
    relationship:
      'Next.js App Router leverages React 19 Server Components, streaming SSR, and Concurrent Mode for instant page transitions.',
  },
  {
    source: 'nextjs',
    target: 'javascript',
    label: 'ES2024 Runtime',
    relationship:
      'Client-side hydration and dynamic browser APIs powered by modern asynchronous ECMAScript primitives and Web APIs.',
  },
  {
    source: 'react',
    target: 'javascript',
    label: 'Component Primitives',
    relationship:
      'Functional React components, custom hooks, and state machines built upon native JavaScript event loops and closures.',
  },
  {
    source: 'linux',
    target: 'laravel',
    label: 'systemd Supervisors',
    relationship:
      'Linux systemd supervisor units orchestrate background Laravel queue workers and scheduled cron tasks with automatic restart.',
  },
];
