import { ProjectItem, NoteItem, ExpertiseArea } from '@/types';

export const BRAND_INFO = {
  name: 'PHILOZZ',
  developerName: 'Felopater Nabil',
  role: 'Full-Stack Software Engineer',
  specialization: 'Backend Engineering, System Architecture, Databases & Queues',
  tagline: 'Full-Stack Engineer. Backend at Heart.',
  statement:
    'Building performant, scalable, and meaningful web applications. I turn ideas into robust backend systems and delightful digital experiences.',
  philosophy: 'Scroll to Discover. Click to Explore. 3D to Impress.',
  transformationHeadline: 'Tools for Bigger Ideas.',
  finaleHeadline: 'Get In Touch',
  email: 'felopater455@gmail.com',
  brandEmail: 'hello@philozz.com',
  domain: 'philozz.com',
  phone: '+20 111 320 6558',
  location: 'Alexandria, Egypt',
  github: 'https://github.com/figo05-ai',
  linkedin: 'https://linkedin.com/in/felopter-alexandir',
  cvAvailable: true,
  cvUrl: '/images/felopater-cv.pdf',
  experienceYears: '3+',
  projectsCount: '20+',
  curiosity: '∞',
  status: 'Available for high-impact backend & full-stack engineering engagements',
  isDemoEnvironment: false,
};

export const PHOTO_ASSETS = {
  portraitThinking: '/images/felopater-portrait-thinking.jpg',
  portraitSitting: '/images/felopater-portrait-sitting.jpg',
  workspaceStudio: '/images/studio-workspace-backdrop.jpg',
  cvPdf: '/images/felopater-cv.pdf',
};

export const STACK_DETAILS = {
  primaryBackend: ['Laravel', 'PHP', 'MySQL', 'Redis', 'Message Queues'],
  frontend: ['React', 'JavaScript', 'TypeScript', 'Next.js App Router', 'Modern CSS'],
  infrastructure: ['Linux', 'Docker', 'CI/CD Pipelines', 'Nginx', 'Laravel Horizon'],
};

export const EXPERTISE_AREAS: ExpertiseArea[] = [
  {
    id: 'backend',
    name: 'Backend Engineering',
    level: 'Core Specialization',
    description:
      'Designing idiomatic service layers, bulletproof APIs, and resilient business logic that withstand edge-cases and maintain transactional integrity.',
    coreConcepts: ['Domain-Driven Design', 'Idempotent APIs', 'Transactional Boundaries', 'Strict Typing', 'Event Sourcing'],
  },
  {
    id: 'system-design',
    name: 'System Design',
    level: 'Core Specialization',
    description:
      'Architecting decoupled distributed systems with clear blast radiuses, predictable latency profiles, and graceful degradation paths.',
    coreConcepts: ['Microservices & Monoliths', 'Fault Isolation', 'Rate Limiting', 'Load Shedding', 'Consistency Models'],
  },
  {
    id: 'database',
    name: 'Database Engineering',
    level: 'Core Specialization',
    description:
      'Relational data modeling, composite indexing strategies, query execution plan tuning, and managing locking contention under concurrency.',
    coreConcepts: ['B-Tree Index Tuning', 'Lock Isolation Levels', 'Query Optimization', 'Partitioning', 'Migration Zero-Downtime'],
  },
  {
    id: 'background-processing',
    name: 'Background Processing',
    level: 'Core Specialization',
    description:
      'Asynchronous task orchestrations using queues, exponential backoff retries, dead-letter pipelines, and distributed worker management.',
    coreConcepts: ['Redis Queues', 'Dead Letter Queues (DLQ)', 'Idempotency Keys', 'Batch Processing', 'Worker Concurrency'],
  },
  {
    id: 'devops',
    name: 'DevOps & Infrastructure',
    level: 'Core Specialization',
    description:
      'Containerized deployments, automated CI/CD workflows, reverse proxy topologies, and infrastructure automation for rapid releases.',
    coreConcepts: ['Docker Multi-stage Builds', 'CI/CD Pipelines', 'Nginx Configuration', 'Linux SysAdmin', 'Health Probes'],
  },
  {
    id: 'fullstack',
    name: 'Full-Stack Development',
    level: 'Core Specialization',
    description:
      'Connecting robust backend services with modern responsive frontend interfaces, ensuring snappy client-side state and accessible UX.',
    coreConcepts: ['React & TypeScript', 'SSR & Hydration', 'Accessible DOM Patterns', 'Client-Server Contracts', 'State Management'],
  },
];

export const PROJECTS: ProjectItem[] = [
  {
    slug: 'skillup-platform',
    title: 'SkillUp Platform',
    tagline: 'High-Concurrency Growth & Performance Platform',
    role: 'Full Stack Developer / Backend Architect',
    period: '2024 – Present',
    clientOrContext: 'Enterprise Production Platform',
    category: 'High-Concurrency & Queue Architecture',
    technologies: ['Laravel', 'PHP 8.3', 'Redis Cluster', 'MySQL 8', 'Docker', 'Laravel Horizon'],
    summary:
      'Architected and implemented a high-throughput backend infrastructure engineered to handle traffic spikes and concurrent user requests efficiently with Redis caching layers and asynchronous background queue workers.',
    challenge:
      'Handling sudden traffic spikes and continuous background queue jobs with sub-50ms response latency while guaranteeing zero lost transactions and optimized database query execution plans.',
    responsibilities: [
      'Spearheaded core API engineering and backend architecture using Laravel and MySQL.',
      'Integrated Redis caching layers and asynchronous queue workers via Laravel Horizon.',
      'Optimized database performance with composite indexing, query execution tuning, and read/write connection splitting.',
      'Implemented robust RESTful APIs with strict validation and error telemetry.',
    ],
    architectureSummary:
      'Client requests hit the API Gateway, validating payload signatures before enqueuing to prioritized Redis streams. Dedicated worker pools pull jobs using atomic claims, commit results to MySQL within a database transaction, and emit heartbeat signals back to the orchestration registry.',
    architectureNodes: [
      { name: 'API Gateway', description: 'Request validation, signature verification, and payload normalization.', tech: 'Laravel 11 REST' },
      { name: 'Redis Queue Cluster', description: 'Priority streams with backpressure controls and Horizon supervision.', tech: 'Redis Cluster' },
      { name: 'Worker Cluster', description: 'Autonomous execution processes operating under supervisor daemons.', tech: 'PHP 8.3 CLI Workers' },
      { name: 'Primary Datastore', description: 'ACID-compliant storage for user records, audit logs, and status transitions.', tech: 'MySQL 8.0' },
      { name: 'Dead-Letter Registry', description: 'Automatic capture and triage of poison-pill messages after retry exhaustion.', tech: 'Redis DLQ' },
    ],
    technicalDecisions: [
      {
        title: 'Composite Covering Indexes',
        rationale: 'Created targeted composite indexes covering filter and order columns to eliminate costly filesort passes.',
      },
      {
        title: 'Redis Horizon Queue Segregation',
        rationale: 'Separated critical user-facing jobs from heavy batch pipelines into dedicated queue pools.',
      },
      {
        title: 'Read/Write Connection Splitting',
        rationale: 'Offloaded heavy analytical read queries to read replicas while keeping mutations on the primary master.',
      },
    ],
    demoVisualType: 'skillup-horizon',
    lessonsLearned: [
      'Visibility timeouts must be calibrated against P99 job execution times to prevent false retries.',
      'Worker memory leak mitigation requires periodic worker recycling after fixed iterations.',
      'Graceful SIGTERM handlers in worker loops are essential for zero-downtime rolling deploys.',
    ],
    hasLiveDemo: false,
    githubUrl: 'https://github.com/figo05-ai',
  },
  {
    slug: 'smartpos-erp',
    title: 'SmartPOS ERP',
    tagline: 'Mobile Retail Point-of-Sale & Inventory System',
    role: 'System Architect & Backend Developer',
    period: 'Production Prototype',
    clientOrContext: 'Retail POS & Inventory Management',
    category: 'Enterprise Desktop ERP & POS',
    technologies: ['Laravel', 'NativePHP', 'MySQL', 'Barcode/IMEI Scanner', 'Docker'],
    summary:
      'A cross-platform desktop POS application tailored for mobile phone stores and electronics retailers, featuring multi-attribute variant inventory tracking, unique IMEI device verification, fast checkout, printable receipts, and automated profit/loss margin calculations.',
    challenge:
      'Handling strict serial-number/IMEI tracking under rapid barcode scanning bursts with sub-second receipt printing and offline stock threshold reconciliation.',
    responsibilities: [
      'Architected offline-resilient local POS transaction engine using Laravel and NativePHP.',
      'Designed multi-attribute stock indexing for device color, storage, and carrier lock variants.',
      'Integrated real-time barcode reader event streams with instant checkout calculation.',
      'Constructed automated daily profit/loss reporting and low-stock telemetry alerts.',
    ],
    architectureSummary:
      'Desktop runtime communicates with local SQLite cache for instantaneous barcode scans, then synchronizes committed invoice batches with the central MySQL cluster upon network confirmation.',
    architectureNodes: [
      { name: 'Desktop Host (NativePHP)', description: 'Cross-platform desktop application runtime with local hardware hooks.', tech: 'NativePHP' },
      { name: 'Barcode/IMEI Scanner Pipe', description: 'Raw serial stream parser with debounced transaction accumulation.', tech: 'Hardware I/O' },
      { name: 'Invoice Engine', description: 'Transactional receipt builder with tax and discount calculation.', tech: 'Laravel Services' },
      { name: 'Inventory Ledger', description: 'Multi-variant stock levels and serial track records.', tech: 'MySQL 8.0' },
      { name: 'Report Generator', description: 'Automated P&L statements and inventory reorder alerts.', tech: 'PHP 8.3 Cron' },
    ],
    technicalDecisions: [
      {
        title: 'NativePHP Desktop Packaging',
        rationale: 'Allowed shipping a unified Laravel codebase as a native desktop binary with direct access to barcode printers.',
      },
      {
        title: 'Optimistic Stock Reservation',
        rationale: 'Items are held with short lease timers in memory to prevent double-sale during concurrent register checkout.',
      },
      {
        title: 'Asynchronous PDF Receipt Streaming',
        rationale: 'Thermal printer rasterization occurs in a background worker, keeping register response time instantaneous.',
      },
    ],
    demoVisualType: 'smartpos-hardware',
    lessonsLearned: [
      'Hardware barcode scanners emit rapid keystroke events requiring strict debouncing.',
      'IMEI checksum algorithms (Luhn formula) should be validated on the client before network dispatch.',
    ],
    hasLiveDemo: false,
    githubUrl: 'https://github.com/figo05-ai',
  },
  {
    slug: 'tanqia-skills',
    title: 'Tanqia Skills',
    tagline: 'Employee Task Management System',
    role: 'Lead Backend Architect',
    period: 'Production System',
    clientOrContext: 'Demonstration System (Task Workflow)',
    category: 'Backend & Distributed Queues',
    technologies: ['Laravel', 'Tailwind CSS', 'MySQL 8', 'Docker', 'Excel Processing'],
    summary:
      'A comprehensive web platform with role-based access control (Admin/Employee) streamlining task delegation, automated bulk Excel data processing, and automated database backups to ensure operational reliability.',
    challenge:
      'Workflows required reliable job scheduling where concurrent workers process batches of high-priority tasks without duplicate executions, queue starvations, or unhandled worker crashes during external provider timeouts.',
    responsibilities: [
      'Architected transactional job dispatchers ensuring zero lost tasks during worker node failures.',
      'Designed a token-bucket rate limiter and dynamic worker rotation system in Redis.',
      'Implemented database advisory locks to guarantee strict idempotency across parallel batch jobs.',
      'Created structured logging and failure telemetry for dead-letter queue investigation.',
    ],
    architectureSummary:
      'Client requests hit the API Gateway, validating payload signatures before enqueuing to prioritized Redis streams. Dedicated worker pools pull jobs using atomic claims, commit results to MySQL within a database transaction, and emit heartbeat signals back to the orchestration registry.',
    architectureNodes: [
      { name: 'API Gateway', description: 'Request validation, signature verification, and payload normalization.', tech: 'Laravel API' },
      { name: 'Priority Queue Hub', description: 'Segregated task queues (Critical, Standard, Batch) with backpressure controls.', tech: 'Redis Streams' },
      { name: 'Worker Cluster', description: 'Autonomous execution processes operating under supervisor daemons.', tech: 'PHP 8 CLI Workers' },
      { name: 'State Store', description: 'ACID-compliant storage for task records, audit logs, and status transitions.', tech: 'MySQL 8.0' },
      { name: 'Dead-Letter Registry', description: 'Automatic capture and triage of poison-pill messages after retry exhaustion.', tech: 'Redis DLQ' },
    ],
    technicalDecisions: [
      {
        title: 'Advisory Locks vs Row Locking',
        rationale: 'Database advisory locks prevent transaction bloat and table lock contention during rapid batch assignment passes.',
      },
      {
        title: 'Payload Hashing for Idempotency',
        rationale: 'SHA-256 payload hashes stored with TTL in Redis ensure that duplicate incoming webhooks are discarded immediately without DB hits.',
      },
      {
        title: 'Exponential Backoff with Jitter',
        rationale: 'Prevents thundering herd problems when downstream third-party services recover from brief outages.',
      },
    ],
    demoVisualType: 'tanqia-pipeline',
    lessonsLearned: [
      'Hardware barcode scanners emit rapid keystroke events requiring strict debouncing.',
      'IMEI checksum algorithms (Luhn formula) should be validated on the client before network dispatch.',
    ],
    hasLiveDemo: false,
    githubUrl: 'https://github.com/figo05-ai',
  },
  {
    slug: 'sip-and-snug',
    title: 'Sip & Snug',
    tagline: 'E-Commerce System & RESTful API',
    role: 'Backend API Engineer',
    period: 'Production System',
    clientOrContext: 'Food & Beverage E-Commerce',
    category: 'E-Commerce & OpenAPI Services',
    technologies: ['Laravel 13', 'MySQL 8', 'L5-Swagger', 'Laravel Sanctum', 'Eloquent ORM'],
    summary:
      'Built an end-to-end backend system powering both mobile and web clients through secure, token-based API endpoints (Laravel Sanctum), dynamic carts, delivery zones, order fulfillment, and interactive OpenAPI 3.0 documentation.',
    challenge:
      'Developing a high-throughput API with dynamic delivery zone calculation, concurrent cart reservation, and automated Swagger/OpenAPI documentation for client teams.',
    responsibilities: [
      'Engineered token-authenticated RESTful API endpoints using Laravel Sanctum.',
      'Designed relational schema for complex product add-ons, modifiers, and variable pricing.',
      'Generated interactive OpenAPI 3.0 documentation using L5-Swagger.',
      'Implemented strict FormRequest validation classes enforcing complete data integrity.',
    ],
    architectureSummary:
      'Requests arrive via HTTPS, validated against strict FormRequest rules, dispatched through dedicated service classes, and persisted via Eloquent with eager loading to prevent N+1 bottlenecks.',
    architectureNodes: [
      { name: 'API Gateway', description: 'Token authentication and rate-limited endpoints.', tech: 'Laravel Sanctum' },
      { name: 'OpenAPI Documentation', description: 'Automated Swagger interactive API specifications.', tech: 'L5-Swagger' },
      { name: 'Cart & Order Pipeline', description: 'Atomic checkout and order status state machine.', tech: 'Laravel Services' },
      { name: 'Database Cluster', description: 'Relational store for menus, variants, and customer histories.', tech: 'MySQL 8.0' },
    ],
    technicalDecisions: [
      {
        title: 'Eager Loading Query Guard',
        rationale: 'Prevented N+1 database queries across nested product add-on relationships using Eloquent with() constraints.',
      },
      {
        title: 'L5-Swagger Automated Annotations',
        rationale: 'Ensured that documentation never drifted from implementation across rapid deployment sprints.',
      },
    ],
    demoVisualType: 'security-topology',
    lessonsLearned: [
      'Contract-first OpenAPI development accelerates mobile frontend integration significantly.',
      'Dynamic delivery distance calculations should be cached in Redis with geohash keys.',
    ],
    hasLiveDemo: false,
    githubUrl: 'https://github.com/figo05-ai',
  },
  {
    slug: 'academy-lms',
    title: 'Academy LMS',
    tagline: 'Enterprise Learning Management System',
    role: 'Full Stack Backend Lead',
    period: 'Production Platform',
    clientOrContext: 'Education & Certification',
    category: 'Education Technology & Security',
    technologies: ['Laravel 13.x', 'SQLite/MySQL', 'Docker', 'CSP Headers', 'Rate Limiting'],
    summary:
      'Developed a secure, integrated LMS platform to manage courses, track student progress sequentially, and handle user permissions using Services Design Pattern, strengthened with CSP headers and dedicated Admin Guards.',
    challenge:
      'Managing complex student lifecycle state transitions across multiple prerequisite modules while maintaining strict role-based separation and zero unauthorized access.',
    responsibilities: [
      'Applied Services Design Pattern (UserLifeCycleService) to handle state calculations.',
      'Implemented Content Security Policy (CSP) headers, Rate Limiting, and Admin Guards.',
      'Constructed student certification generators with cryptographically verified serials.',
      'Built real-time quiz assessment and progress milestone telemetry.',
    ],
    architectureSummary:
      'Layered architecture cleanly segregating Controllers, Services, and Repositories, backed by middleware security filters and automated role-based capability verification.',
    architectureNodes: [
      { name: 'Security Middleware', description: 'CSP header enforcement, rate limiting, and session verification.', tech: 'Laravel Middleware' },
      { name: 'UserLifeCycleService', description: 'Sequential course progression and eligibility state machine.', tech: 'Domain Service' },
      { name: 'Quiz Assessment Engine', description: 'Automated grade calculation and credential issuance.', tech: 'PHP 8.3 CLI' },
      { name: 'Core Database', description: 'Course curricula, video metadata, and student progress records.', tech: 'MySQL 8.0' },
    ],
    technicalDecisions: [
      {
        title: 'Services Design Pattern',
        rationale: 'Separated business rules out of controllers into testable, reusable domain service classes.',
      },
      {
        title: 'Cryptographic Certificate Verification',
        rationale: 'Public verification URLs allow employers to authenticate student credentials via signed SHA-256 hashes.',
      },
    ],
    demoVisualType: 'task-flow',
    lessonsLearned: [
      'Strict CSP headers require careful noncing for inline scripts and styles.',
      'Course video playback positions should be debounced before submitting progress heartbeats.',
    ],
    hasLiveDemo: false,
    githubUrl: 'https://github.com/figo05-ai',
  },
  {
    slug: 'clothes-ecommerce',
    title: 'Clothes Enterprise',
    tagline: 'Enterprise Fashion E-Commerce & RMA Platform',
    role: 'Backend & Filament Architect',
    period: 'Production System',
    clientOrContext: 'Fashion Retail & Warehouse',
    category: 'E-Commerce & Financial Modules',
    technologies: ['Laravel 13', 'Filament v3', 'TALL Stack', 'Digital Wallet', 'Loyalty Points'],
    summary:
      'Engineered a scalable, modern e-commerce backend utilizing a Clean Service-Oriented MVC architecture to separate heavy business logic, with Digital Wallet, Loyalty Points reward engine, RMA system, and Filament v3 administration.',
    challenge:
      'Building financial balance transactions with double-entry bookkeeping guarantees alongside complex returns management and warehouse inventory tracking.',
    responsibilities: [
      'Architected digital wallet ledger with atomic credit/debit transaction isolation.',
      'Developed loyalty points accrual and redemption algorithms.',
      'Implemented Return Merchandise Authorization (RMA) ticket workflow with automated return labels.',
      'Configured interactive Filament v3 admin dashboards for inventory and store managers.',
    ],
    architectureSummary:
      'TALL stack administration panel interfacing with a hardened Laravel service layer that enforces double-entry ledger bookkeeping for all wallet mutations.',
    architectureNodes: [
      { name: 'Filament Admin Panel', description: 'Livewire and Alpine-powered backoffice management UI.', tech: 'Filament v3' },
      { name: 'Wallet Ledger Engine', description: 'Double-entry transactional accounting module.', tech: 'Laravel Services' },
      { name: 'RMA Workflow Engine', description: 'Return merchandise authorization state machine.', tech: 'Domain Event Bus' },
      { name: 'Commerce Store', description: 'Product catalog, customer tiers, and invoice records.', tech: 'MySQL 8.0' },
    ],
    technicalDecisions: [
      {
        title: 'Double-Entry Accounting Ledger',
        rationale: 'Guarantees that user wallet balances match aggregate transaction sums, preventing financial discrepancies.',
      },
      {
        title: 'Filament v3 Resource Integration',
        rationale: 'Reduced administrative UI development overhead while maintaining strict policy authorization per model.',
      },
    ],
    demoVisualType: 'license-matrix',
    lessonsLearned: [
      'Financial ledgers should never perform mutable updates; only append-only debit/credit entries are allowed.',
      'Livewire components handling bulk actions need pagination limits to prevent memory bloat.',
    ],
    hasLiveDemo: false,
    githubUrl: 'https://github.com/figo05-ai',
  },
  {
    slug: 'maxtree-licensing',
    title: 'Maxtree Licensing System',
    tagline: 'Cryptographic License Verification & Authorization Service',
    role: 'API & Security Engineer',
    period: 'Production Prototype',
    clientOrContext: 'Demonstration System (Desktop Plugin Auth)',
    category: 'Security & API Architecture',
    technologies: ['Laravel', 'Python 3', 'Asymmetric Cryptography', 'MySQL', 'Docker'],
    summary:
      'A secure authorization backend and client verification module for desktop 3D CAD/3ds Max plugins, enforcing license validity while supporting offline grace periods and tamper resistance.',
    challenge:
      'The licensing service needed to authenticate desktop plugin clients securely without exposing master private keys, while gracefully handling flaky client connections and preventing replay attacks.',
    responsibilities: [
      'Formulated an asymmetric key-pair signing architecture (Ed25519) for tamper-evident license tokens.',
      'Constructed a hardened Laravel REST API with strict rate limiting and hardware-fingerprint binding.',
      'Wrote a lightweight Python verification bridge for native integration with the desktop 3ds Max runtime.',
      'Implemented a secure offline grace-period validator with monotonic local timestamp checking.',
    ],
    architectureSummary:
      'The desktop plugin collects machine fingerprints and submits a signed challenge to the Laravel API. The API validates entitlements, generates an Ed25519-signed JWT containing valid feature flags, and returns it. The plugin verifies the signature using the embedded public key.',
    architectureNodes: [
      { name: 'Desktop Host (3ds Max)', description: 'Plugin environment running Python client verification runtime.', tech: 'Python 3.11' },
      { name: 'Hardware Fingerprinter', description: 'Obfuscated CPU, motherboard, and disk identifier hashing.', tech: 'Native OS Bridge' },
      { name: 'Licensing API Gateway', description: 'High-availability endpoint with mTLS and token issuance.', tech: 'Laravel 11 REST' },
      { name: 'Entitlement Database', description: 'Customer licenses, active activations, and seat allocations.', tech: 'MySQL 8.0' },
      { name: 'Cryptographic Signer', description: 'Isolated signing module utilizing asymmetric Ed25519 keys.', tech: 'Sodium Cryptography' },
    ],
    technicalDecisions: [
      {
        title: 'Asymmetric Ed25519 Signatures',
        rationale: 'Allows the desktop client to verify license validity offline using only a public key, without risking secret compromise.',
      },
      {
        title: 'Fail-Closed with Capped Leeway',
        rationale: 'Strikes the optimal balance between customer continuity during internet dropouts and piracy resistance.',
      },
      {
        title: 'Seat Allocation Leases',
        rationale: 'Heartbeat renew leases automatically, freeing seats when workstations shut down without explicit logout.',
      },
    ],
    demoVisualType: 'license-matrix',
    lessonsLearned: [
      'Virtual machine environments require multi-factor hardware hashing to avoid duplicate activation spoofing.',
      'Clock-skew mitigation is mandatory when desktop system times drift relative to NTP servers.',
      'Public keys must be embedded with integrity checks to prevent binary patching.',
    ],
    hasLiveDemo: false,
    githubUrl: undefined,
  },
  {
    slug: 'zodiak-portfolio',
    title: 'ZODiAK Platform',
    tagline: 'Security-Conscious Web Portal & Access Topology',
    role: 'Full-Stack Engineer',
    period: 'Production Prototype',
    clientOrContext: 'Demonstration System (Security Web App)',
    category: 'Full-Stack & Security UI',
    technologies: ['React', 'TypeScript', 'Firebase Auth', 'Firestore Rules', 'Tailwind CSS'],
    summary:
      'A responsive cybersecurity intelligence platform featuring declarative role-based access control, encrypted payload transfer, and real-time posture monitoring views.',
    challenge:
      'Developing a reactive dashboard that presents complex vulnerability metrics and administrative hierarchies while strictly isolating multitenant audit data at the rule layer.',
    responsibilities: [
      'Developed modular React UI components with strict accessibility standards and zero layout shifts.',
      'Drafted comprehensive Firestore Security Rules providing row-level authorization and field integrity.',
      'Implemented real-time synchronization pipelines for threat alerts and security incident notices.',
      'Created interactive SVG-based network topology visualizers for infrastructure posture inspection.',
    ],
    architectureSummary:
      'Users authenticate via Firebase Auth with custom claims. The frontend binds to Firestore through security-rule-enforced reactive collections. Changes in security telemetry propagate instantly through real-time snapshots.',
    architectureNodes: [
      { name: 'Client Presentation', description: 'Type-safe single page interface with immediate optimistic updates.', tech: 'React & TypeScript' },
      { name: 'Authentication Layer', description: 'Identity verification with custom claims and multi-factor enforcement.', tech: 'Firebase Auth' },
      { name: 'Declarative Security Rules', description: 'Granular read/write authorization based on user tenancy and role.', tech: 'Firestore Rules' },
      { name: 'Real-time Datastore', description: 'Document database with streaming listener support.', tech: 'Cloud Firestore' },
    ],
    technicalDecisions: [
      {
        title: 'Declarative Rule Enforcement',
        rationale: 'Guarantees that security boundaries are enforced at the database layer rather than relying on frontend logic.',
      },
      {
        title: 'Zero External CSS Bloat',
        rationale: 'Maintains sub-second bundle parsing and prevents third-party CSS injection vulnerabilities.',
      },
      {
        title: 'Optimistic UI with Rollback',
        rationale: 'Provides instant user feedback while preserving state consistency on permission denial.',
      },
    ],
    demoVisualType: 'security-topology',
    lessonsLearned: [
      'Always test security rules against automated unit test suites to catch regression escapes.',
      'Large collections must use composite index cursors to prevent unbounded read costs.',
      'Separation of concerns between telemetry display and administrative control is crucial for audits.',
    ],
    hasLiveDemo: false,
    githubUrl: undefined,
  },
];

export const NOTES: NoteItem[] = [
  {
    slug: 'building-scalable-apis-with-laravel',
    title: 'Building Scalable APIs with Laravel',
    category: 'Backend Architecture',
    readTime: '8 min read',
    date: 'Apr 12, 2026',
    abstract:
      'A practical guide to designing high-throughput RESTful APIs: strict FormRequests, idempotent endpoints, rate limiting, and contract testing with OpenAPI.',
    sections: [
      {
        heading: '1. The Architectural Role of the API Gateway',
        content:
          'When designing APIs intended to serve multiple clients—mobile apps, web frontends, and external webhooks—the API layer must act as a strict gatekeeper. It is responsible for payload normalization, rate enforcement, token authentication, and contract compliance before business services ever receive input.',
        codeSnippet: `// Example: Idempotent FormRequest in Laravel 11/13
public function authorize(): bool
{
    return $this->user()->can('create', Task::class);
}

public function rules(): array
{
    return [
        'idempotency_key' => ['required', 'string', 'uuid'],
        'payload' => ['required', 'array'],
        'payload.title' => ['required', 'string', 'max:255'],
    ];
}`,
        codeLang: 'php',
      },
      {
        heading: '2. Idempotency Keys and Atomic Locks',
        content:
          'To prevent duplicate execution during client network retry storms, incoming mutate requests carry an Idempotency-Key. Redis stores the hashed request with a 24-hour TTL. If the key exists, the cached result is returned immediately with a 200 OK without re-executing state mutation.',
      },
      {
        heading: '3. Eloquent Resource Transforms & OpenAPI Synchronization',
        content:
          'Controllers should never return Eloquent models directly. By passing models through JsonResource transformers and annotating them with L5-Swagger attributes, your OpenAPI documentation remains in sync with actual wire payloads.',
      },
    ],
  },
  {
    slug: 'my-development-workflow-2026',
    title: 'My Development Workflow in 2026',
    category: 'Developer Tooling',
    readTime: '6 min read',
    date: 'Mar 28, 2026',
    abstract:
      'Tools, habits, and mindset for building robust backend systems: Docker environments, Laravel Pulse profiling, PHPStan level 8, and automated CI/CD checks.',
    sections: [
      {
        heading: '1. Local Consistency via Containerization',
        content:
          'Every service runs in containerized Docker setups with matching PHP 8.3, MySQL 8, and Redis configurations. This eliminates the "works on my machine" anti-pattern and guarantees reproducible builds across dev, staging, and production.',
      },
      {
        heading: '2. Static Analysis: PHPStan & Larastan at Level 8',
        content:
          'Writing PHP without static analysis is like walking on a wire without a net. By running Larastan at Level 8 in CI pipelines, null pointer exceptions, incorrect return types, and invalid docblocks are caught before code review.',
      },
      {
        heading: '3. Real-Time Telemetry with Laravel Pulse & Horizon',
        content:
          'Profiling slow queries and queue worker throughput in real time allows pinpointing N+1 queries and memory bloat during active development cycles.',
      },
    ],
  },
  {
    slug: 'what-ive-learned-as-a-developer',
    title: "What I've Learned as a Developer",
    category: 'Engineering Principles',
    readTime: '7 min read',
    date: 'Feb 18, 2026',
    abstract:
      'Key lessons, mistakes, and architectural principles that transformed my journey from writing syntax to engineering reliable, scalable backend systems.',
    sections: [
      {
        heading: '1. Simplicity Outlives Cleverness',
        content:
          'Early in my engineering journey, I favored clever one-liners and complex abstractions. Over time, maintaining high-traffic production platforms taught me that explicit, readable code with clear transactional boundaries is far superior to esoteric designs.',
      },
      {
        heading: '2. Databases Are the Ultimate Bottleneck',
        content:
          'Code is easy to scale horizontally with stateless containers. Databases are stateful and bounded by disk I/O, lock contention, and index structures. Investing time in schema design, composite indexing, and query execution plans pays the highest dividends.',
      },
      {
        heading: '3. Fail Fast, Log Contextually',
        content:
          'When something fails in a background worker, vague error logs are useless. Structured JSON logging with correlation IDs, job payload contexts, and stack traces allows resolving production issues in minutes rather than hours.',
      },
    ],
  },
  {
    slug: 'sql-query-optimization',
    title: 'SQL Query Optimization: From Slow Scans to Index-Only Executions',
    category: 'Database Engineering',
    readTime: '9 min read',
    date: 'Jan 24, 2026',
    abstract:
      'A practical deep-dive into examining Postgres/MySQL EXPLAIN ANALYZE trees, eliminating accidental sequential scans, and leveraging composite covering indexes for high-throughput queries.',
    sections: [
      {
        heading: '1. The Anatomy of an Unintended Table Scan',
        content:
          'When relational tables grow past hundreds of thousands of rows, queries that performed well in local development suddenly trigger full table scans. The most common culprit is filtering on multiple columns where only a single-column index exists, or applying SQL functions directly to indexed columns, which prevents the query planner from using the index tree efficiently.',
        codeSnippet: `-- Problematic Query: Triggers Full Table Scan due to DATE() function
SELECT id, status, total_amount 
FROM orders 
WHERE DATE(created_at) = '2026-04-12' AND status = 'completed';

-- Optimized Query: Range scan utilizing composite index (status, created_at)
SELECT id, status, total_amount 
FROM orders 
WHERE status = 'completed'
  AND created_at >= '2026-04-12 00:00:00' 
  AND created_at <= '2026-04-12 23:59:59';`,
        codeLang: 'sql',
      },
      {
        heading: '2. Understanding Index Left-Prefix Matching',
        content:
          'A composite B-Tree index on (tenant_id, status, created_at) can be visualized as an index sorted primarily by tenant_id, then by status, then by created_at. Queries filtering by tenant_id alone or (tenant_id, status) utilize the index effectively. However, querying by status alone cannot jump into the index tree and falls back to a scan.',
      },
      {
        heading: '3. Covering Indexes: Eliminating Heap Table Access',
        content:
          'When all columns requested in the SELECT clause and WHERE clauses are present within the index leaf pages, the database engine executes an "Index-Only Scan". The engine never visits the actual heap table on disk, resulting in pure in-memory index traversal and sub-millisecond execution times.',
      },
    ],
  },
  {
    slug: 'reliable-background-jobs',
    title: 'Reliable Background Jobs: Queues, Retries, and Idempotency',
    category: 'Distributed Systems',
    readTime: '8 min read',
    date: 'Jan 10, 2026',
    abstract:
      'Designing background queue pipelines that never drop messages, prevent double execution during worker crashes, and handle poisoned tasks gracefully.',
    sections: [
      {
        heading: '1. The Fallacy of At-Most-Once Processing',
        content:
          'Network dropouts, worker memory exhaustion, and external API timeouts make guaranteed single execution mathematically impossible. Production queue architectures must be built around "At-Least-Once Delivery" coupled with strict application-level idempotency.',
        codeSnippet: `// Idempotent Job Execution in Laravel
public function handle(PaymentGateway $gateway): void
{
    // Acquire a distributed advisory lock using the idempotency key
    $lock = Cache::lock("job:settlement:{$this->orderId}", 30);

    if (! $lock->get()) {
        $this->release(5); // Another worker is actively processing; back off
        return;
    }

    try {
        DB::transaction(function () use ($gateway) {
            $order = Order::lockForUpdate()->findOrFail($this->orderId);
            
            if ($order->isSettled()) {
                return; // Already executed by previous attempt; idempotent no-op
            }

            $gateway->capture($order);
            $order->markAsSettled();
        });
    } finally {
        $lock->release();
    }
}`,
        codeLang: 'php',
      },
      {
        heading: '2. Exponential Backoff with Random Jitter',
        content:
          'When an external service experiences an outage, retrying immediately causes a "thundering herd" effect that keeps the downstream service overwhelmed. Applying exponential backoff with randomized jitter spreads out incoming retries across an expanding time window.',
      },
      {
        heading: '3. Dead-Letter Queues (DLQ) and Poison Pill Triage',
        content:
          'Tasks that fail repeatedly past maximum retry thresholds must not block the queue. They are automatically evacuated to a Dead-Letter Queue with full failure context, allowing engineers to inspect the offending payload without losing customer data.',
      },
    ],
  },
  {
    slug: 'clean-architecture-in-laravel',
    title: 'Clean Architecture in Laravel: Service Layers & Domain Separation',
    category: 'Software Architecture',
    readTime: '7 min read',
    date: 'Dec 18, 2025',
    abstract:
      'Breaking out of fat controllers and bloated Eloquent models: applying Service-Oriented MVC, DTOs, and interface contracts in modern Laravel applications.',
    sections: [
      {
        heading: '1. Fat Controllers: The Technical Debt Flywheel',
        content:
          'As projects grow, placing business logic directly inside HTTP controllers leads to unmaintainable code that cannot be re-used by queue workers or CLI commands. A Clean Architecture enforces that controllers only handle HTTP requests and responses, delegating all domain logic to dedicated Service classes.',
      },
      {
        heading: '2. Data Transfer Objects (DTOs) for Strict Typings',
        content:
          'Instead of passing raw array payloads between layers, type-safe Data Transfer Objects enforce validation constraints at runtime and provide IDE autocompletion across the entire application stack.',
      },
    ],
  },
  {
    slug: 'designing-scalable-systems',
    title: 'Designing Scalable Systems: From Monolith to Decoupled Services',
    category: 'System Design',
    readTime: '9 min read',
    date: 'Nov 30, 2025',
    abstract:
      'Strategic patterns for scaling backend systems: caching layers, database read/write replicas, asynchronous decoupling, and fault isolation boundaries.',
    sections: [
      {
        heading: '1. Modular Monolith Before Microservices',
        content:
          'Premature microservice extraction introduces distributed latency, network partition failures, and complex distributed transactions. Starting with a cleanly decoupled modular monolith allows moving fast while maintaining strict domain boundaries.',
      },
      {
        heading: '2. Caching Hierarchy: In-Memory, Redis, and CDN',
        content:
          'A multi-tier caching strategy guarantees that hot paths never touch the primary transactional database, preserving I/O budget for critical business writes.',
      },
    ],
  },
];
