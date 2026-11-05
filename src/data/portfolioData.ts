import { ProjectItem, NoteItem, ExpertiseArea, CompactProjectMeta, BlogCategoryFilter } from '@/types';

export const BRAND_INFO = {
  name: 'PHILOZZ',
  developerName: 'Philopater Nabil (Philo)',
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
  facebook: 'https://www.facebook.com/profile.php?id=61594098597146',
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
    title: 'SkillUp HRMS',
    tagline: 'Enterprise Workforce Management & Automated Reporting Engine',
    role: 'Full-Stack Software Engineer & Backend Architect',
    period: 'Production System',
    clientOrContext: 'B2B Enterprise Workforce & HR Outsourcing',
    category: 'Full-Stack & Automated Reporting',
    technologies: ['Laravel 13', 'React 19', 'Tailwind CSS v4', 'MySQL 8', 'Laravel Sanctum', 'Vite', 'Recharts', 'Docker'],
    summary:
      'An enterprise HR management system built to eliminate manual workforce tracking across distributed client companies. Connecting a decoupled React 19 frontend with a robust Laravel 13 backend, the platform centralizes attendance logging, real-time working hour calculations, and automated monthly compliance report generation.',
    challenge:
      'Managing workforce attendance across multiple external client companies relied on fragmented spreadsheets, creating payroll discrepancies, untracked overtime, and days of manual reporting every month. Generating consolidated, multi-page monthly audit reports in PDF and Excel for hundreds of employees consistently timed out server requests and overwhelmed PHP memory limits.',
    responsibilities: [
      'Architected a decoupled Full-Stack system featuring a reactive React 19 / Vite frontend communicating with a Laravel 13 REST API secured via Sanctum token authentication.',
      'Engineered an automated monthly reporting pipeline using mPDF and background queue workers (GenerateCompanyReportsJob), converting days of manual spreadsheet compilation into instant, single-click report generation.',
      'Implemented an interactive executive analytics dashboard with Recharts, giving leadership immediate visibility into employee attendance patterns, client allocations, and active tasks.',
      'Established a strict Service Layer architecture with typed Form Requests, DTOs, and standardized API responses to ensure high testability and clean business logic separation.',
    ],
    architectureSummary:
      'The client application (React 19, Tailwind CSS v4) manages state locally and communicates via authenticated Axios requests with Laravel 13 API endpoints. Complex monthly attendance audits and multi-employee PDF/Excel compilations are offloaded to background queue jobs, streaming processed output to non-blocking downloads without degrading interactive UI performance.',
    architectureNodes: [
      { name: 'Executive Presentation Layer', description: 'React 19 single-page dashboard with real-time KPI visualization, client filters, and interactive task boards.', tech: 'React 19 & Tailwind CSS v4' },
      { name: 'API & Service Gateway', description: 'Sanctum-authenticated REST controllers delegating to domain-specific business service classes.', tech: 'Laravel 13 REST' },
      { name: 'Reporting Queue Worker', description: 'Asynchronous workers compiling comprehensive monthly attendance, task, and client audit reports.', tech: 'PHP 8.3 CLI Worker' },
      { name: 'Relational Data Store', description: 'Relational schema tracking employees, check-ins, tasks, and system audit logs with foreign key constraints.', tech: 'MySQL 8.0' },
      { name: 'Export & Document Engine', description: 'High-fidelity multi-page PDF generation and structured Excel workbook exports.', tech: 'mPDF & Maatwebsite Excel' },
    ],
    technicalDecisions: [
      {
        title: 'Asynchronous Background Report Compilation',
        rationale: 'Offloading multi-employee monthly PDF generation to queued jobs prevents HTTP 504 gateway timeouts and guarantees sub-second UI responsiveness during peak payroll cycles.',
      },
      {
        title: 'Decoupled Token-Based Architecture',
        rationale: 'Separating the React 19 frontend from Laravel via Sanctum tokens ensures seamless client-side state transitions while maintaining strict session security and audit accountability.',
      },
      {
        title: 'Service Layer & Interface Contracts',
        rationale: 'Isolating domain logic into dedicated service classes behind interfaces keeps controllers lightweight and allows independent unit testing of critical attendance calculations.',
      },
    ],
    demoVisualType: 'task-flow',
    lessonsLearned: [
      'Heavy PDF rendering engines require calibrated memory boundaries and backtrack limits when compiling complex multi-table employee matrices.',
      'Client-side debounce and optimistic feedback on task boards significantly enhance perceived responsiveness for remote operational staff.',
      'Audit trail logs (SystemLog) must capture pre- and post-state snapshots to provide unambiguous accountability during payroll dispute resolutions.',
    ],
    hasLiveDemo: true,
    demoUrl: 'https://skillup.philozz.com',
    productionUrl: 'https://skillup.philozz.com',
    coverImageUrl: '/images/projects/skillup/03_dashboard.png',
    thumbnailUrl: '/images/projects/skillup/03_dashboard.png',
    galleryImages: [
      '/images/projects/skillup/03_dashboard.png',
      '/images/projects/skillup/01_landing_page.png',
      '/images/projects/skillup/04_employees_overview.png',
      '/images/projects/skillup/09_attendance_report.png',
      '/images/projects/skillup/11_task_report.png',
      '/images/projects/skillup/12_employee_performance.png',
      '/images/projects/skillup/08_clients_list.png',
      '/images/projects/skillup/05_company_details.png',
      '/images/projects/skillup/07_remote_workers.png',
    ],
    githubUrl: 'https://github.com/figo05-ai/Skill-Up-PHP',
  },
  {
    slug: 'smartpos-erp',
    title: 'SmartPOS ERP',
    tagline: 'Multi-Branch Retail POS, Hardware Terminal & Device Diagnostics ERP',
    role: 'Lead System Architect & Full-Stack Engineer',
    period: 'Production ERP System',
    clientOrContext: 'Mobile Electronics Retail Chains & Repair Centers',
    category: 'Enterprise Desktop ERP & POS',
    technologies: [
      'Laravel 11 / 12',
      'Filament v3',
      'Livewire 3',
      'NativePHP / Electron',
      'MySQL 8.0',
      'Hardware Barcode & IMEI Scanner',
      'ESC/POS Thermal Printing',
      'Tailwind CSS',
    ],
    summary:
      'A high-performance enterprise POS and backoffice ERP engineered for multi-branch mobile electronics retailers and authorized service centers. Featuring a sub-second Livewire cashier terminal with hardware barcode/IMEI scanning, manager PIN-protected price overrides, phone trade-in valuation, automated customer installment financing, phone repair diagnostic lifecycles with thermal sticker printing, dual-tier cashier shift reconciliation, and cryptographic hardware device pairing.',
    challenge:
      'Mobile electronics stores operate under unique operational hazards: tracking individual serial numbers/IMEIs per unit, handling customer phone trade-ins with fluctuating appraisals, managing repair tickets across technician benches without losing spare part inventories, and preventing register shrinkage across multiple branches. Traditional web POS systems fail under rapid keyboard scanner bursts, cause register desynchronization during shift handoffs, and lack hardware-level access to thermal receipt and ESC/POS barcode printers.',
    responsibilities: [
      'Architected a sub-second Livewire POS cashier interface (PosScreen) with rapid keyboard scanner stream intake, dynamic cart line calculation, and manager PIN authentication for cart item deletions and custom discounts.',
      'Engineered a full hardware repair diagnostics pipeline (RepairOrderResource) tracking device intake condition, passcodes, diagnostic notes, technician assignment, spare parts consumption, and thermal barcode tracking stickers.',
      'Designed a cryptographic hardware device pairing handshake (EnsureDeviceIsAuthorized & DeviceRegistrationService) that validates workstation machine UUIDs, claim secrets, and branch role capabilities before granting terminal access.',
      'Built a dual-tier cash drawer reconciliation engine (Shift & TreasuryTransaction) tracking shift opening balances, expected vs. actual closing cash, and inter-branch treasury transfers with Spatie Activitylog audit trails.',
      'Implemented an end-to-end customer installment engine (InstallmentResource) calculating down payments, monthly installment schedules, penalty formulas, and automated accounts receivable aging analytics.',
      'Engineered a specialized ESC/POS barcode and thermal label printing engine (BarcodePrinter) generating customizable item labels, warranty barcodes, and repair ticket stickers.',
    ],
    architectureSummary:
      'Built on Laravel 11/12 and Filament v3, SmartPOS runs either as a centralized multi-tenant cloud master or an offline-capable NativePHP desktop binary. Client workstations authenticate via cryptographically signed device UUID tokens (X-Device-UUID, X-Device-Token), enforcing strict branch isolation. Livewire 3 drives the reactive cashier terminal and repair dispatchers, while MySQL 8 handles transactional ledgering with pessimistic row locking on stock adjustments and IMEI allocations.',
    architectureNodes: [
      { name: 'Hardware Device Gateway', description: 'Token and UUID cryptographic pairing handshake preventing unauthorized terminals from accessing branch databases (EnsureDeviceIsAuthorized).', tech: 'Cryptographic Device Auth' },
      { name: 'Livewire POS Terminal', description: 'Sub-second reactive sales register with barcode scanner listening, trade-in valuation, and manager PIN escalation.', tech: 'Livewire 3 & Alpine.js' },
      { name: 'Repair Center State Machine', description: 'Multi-stage device lifecycle tracker (Received -> In-Repair -> Ready -> Delivered) with spare parts consumption.', tech: 'Filament v3 Pipeline' },
      { name: 'Financial Ledger & Shift Engine', description: 'Real-time shift reconciliation, cash drawer tracking, installment schedules, and net profit ledger.', tech: 'MySQL 8.0 & Spatie Activitylog' },
      { name: 'Hardware Thermal Print Engine', description: 'ESC/POS formatted receipt, barcode label, and repair sticker rasterization.', tech: 'Thermal Printer Driver' },
    ],
    technicalDecisions: [
      {
        title: 'Cryptographic Workstation Pairing & Hardware UUID Handshake',
        rationale: 'Rather than relying on simple user logins, terminals must be paired via one-time hardware authorization tickets (/device/auth) with unique machine UUIDs and branch capability policies, eliminating remote cashier spoofing.',
      },
      {
        title: 'Dual-Layer Manager PIN Escalation for High-Risk Actions',
        rationale: 'Cart removals, line-item price overrides, and manual discounts trigger an asynchronous manager PIN prompt (verifyManagerPin), preventing cashier fraud while keeping the checkout flow uninterrupted.',
      },
      {
        title: 'Integrated Phone Trade-In & Refurbishment Ledger',
        rationale: 'Built-in trade-in workflow directly credits customer purchases while automatically checking the incoming device IMEI into secondary used inventory with automated valuation.',
      },
      {
        title: 'Atomic Shift Handoff & Cash Drawer Variance Auditing',
        rationale: 'Shifts require mandatory dual-balance verification (expected vs actual closing cash) with discrepancy logging via Spatie Activitylog before the next cashier can open a session.',
      },
    ],
    demoVisualType: 'smartpos-hardware',
    lessonsLearned: [
      'Hardware barcode scanners emit rapid keystroke events (10-30ms intervals); input fields require strict autofocus capture with debounced buffer termination to avoid partial reads.',
      'IMEI tracking requires unique constraint validation both in the inventory catalog and during warranty verification to prevent duplicate serial numbers across trade-in cycles.',
      'Multi-tenant branch architectures must enforce branch scoping at the global model scope level to guarantee no cashier ever accesses or transfers inventory across unauthorized branches.',
    ],
    hasLiveDemo: true,
    demoUrl: 'https://smartpos.philozz.com',
    productionUrl: 'https://smartpos.philozz.com',
    coverImageUrl: '/images/projects/smartpos/01_pos_cashier_screen.png',
    thumbnailUrl: '/images/projects/smartpos/01_pos_cashier_screen.png',
    galleryImages: [
      '/images/projects/smartpos/01_pos_cashier_screen.png',
      '/images/projects/smartpos/02_filament_admin_dashboard.png',
      '/images/projects/smartpos/03_inventory_imei_management.png',
      '/images/projects/smartpos/04_repair_orders_center.png',
      '/images/projects/smartpos/05_sales_invoices_pipeline.png',
      '/images/projects/smartpos/06_cashier_shifts_treasury.png',
      '/images/projects/smartpos/07_installments_financing.png',
      '/images/projects/smartpos/08_barcode_label_printer.png',
      '/images/projects/smartpos/09_financial_profit_loss.png',
      '/images/projects/smartpos/10_hardware_device_auth.png',
    ],
    githubUrl: 'https://github.com/figo05-ai/SmartPOS-ERP',
  },
  {
    slug: 'tanqia-skills',
    title: 'Tanqia Platform',
    tagline: 'Intelligent Departmental Task Distribution & Operations Platform',
    role: 'Lead Backend Architect & System Developer',
    period: 'Production System',
    clientOrContext: 'Enterprise Institutional Operations Management',
    category: 'Backend & Workflow Automation',
    technologies: ['Laravel 11 / 12', 'PHP 8.2+', 'MySQL 8.0', 'Laravel Queues (Job Batches)', 'OpenSpout (Streaming Excel)', 'Docker', 'Blade / Vite'],
    summary:
      'An enterprise operations platform engineered to automate and balance departmental task distribution across multi-company structures. Featuring an intelligent workload dispatcher and a standardized institutional operations catalog across 40 departments, the system enables operations managers to allocate, balance, and track team workloads seamlessly with zero duplicated tasks.',
    challenge:
      'In large organizations managing multiple corporate subsidiaries, distributing operational tasks among departmental teams was bottlenecked by manual delegation. Managers faced severe workload imbalances where some team members were overwhelmed while others were underutilized. Executing bulk task assignments across hundreds of employees simultaneously caused server request timeouts, while generating consolidated multi-departmental progress reports frequently crashed due to PHP memory exhaustion.',
    responsibilities: [
      'Architected an intelligent departmental task dispatcher that balances operational workloads evenly across team members according to department quotas and specialty.',
      'Engineered an asynchronous batch distribution pipeline using Laravel Job Batches, allowing operations managers to trigger bulk task allocations to hundreds of staff members with sub-second UI response.',
      'Implemented strict transactional idempotency guards (DB transactions, status transition locks, and firstOrCreate semantics) guaranteeing zero duplicate task assignments during network interruptions or worker retries.',
      'Built a standardized departmental operations catalog for 40 functional roles with deterministic Arabic title normalization (DepartmentTitleNormalizer) to ensure seamless role-to-department matching.',
      'Integrated high-performance memory-bounded Excel streaming via OpenSpout, enabling instantaneous exports of massive departmental audit reports with near-zero RAM usage.',
    ],
    architectureSummary:
      'Operations managers define distribution runs through an Arabic-native RTL workbench. The workload engine calculates departmental quotas and dispatches chunked, batchable queue jobs (ProcessDistributionRunItemJob). Each allocation executes within an isolated ACID transaction that checks employee capacity, assigns the appropriate operational task from the departmental library, and records audit logs. Comprehensive progress reports stream directly to secure disk storage.',
    architectureNodes: [
      { name: 'Institutional RTL Workbench', description: 'Arabic right-to-left management UI with live monitoring drawers, departmental filters, and quota confirmation gates.', tech: 'Blade, CSS & Vite' },
      { name: 'Batch Distribution Engine', description: 'Asynchronous worker pool orchestrating bulk departmental task allocation and workload balancing.', tech: 'Laravel Job Batches' },
      { name: 'Department Operations Library', description: 'Standardized operational task definitions across 40 organizational departments with Arabic normalization.', tech: 'PHP 8.2 Service Layer' },
      { name: 'Transactional State Store', description: 'ACID-compliant MySQL 8 datastore with composite indexes and strict status lock isolation.', tech: 'MySQL 8.0 InnoDB' },
      { name: 'Streaming Report Pipeline', description: 'Memory-bounded Excel export generator streaming large datasets directly to private encrypted disk.', tech: 'OpenSpout Streaming I/O' },
    ],
    technicalDecisions: [
      {
        title: 'Chunked Job Batches vs Synchronous Dispatch',
        rationale: 'Dividing bulk multi-employee task allocations into monitored Job Batches prevents HTTP timeouts, enables real-time progress tracking, and isolates individual item failures without cancelling the entire run.',
      },
      {
        title: 'Database-Level Idempotency Guards',
        rationale: 'Enforcing unique run-item bindings and atomic DB transactions guarantees that network retries or worker restarts never duplicate task submissions or corrupt employee quotas.',
      },
      {
        title: 'OpenSpout Streaming vs In-Memory Excel Export',
        rationale: 'Streaming row-by-row directly to file storage maintains a flat, negligible memory footprint, preventing out-of-memory crashes even when exporting tens of thousands of records.',
      },
      {
        title: 'Deterministic Arabic Title Normalization',
        rationale: 'Pre-normalizing hamzas, diacritics, and departmental prefixes in memory guarantees reliable relational lookups between imported employee rosters and standardized task banks.',
      },
    ],
    demoVisualType: 'tanqia-pipeline',
    lessonsLearned: [
      'Departmental workload balancing requires atomic quota increments inside database transactions to prevent race conditions during concurrent batch runs.',
      'Queue workers executing batch jobs must periodically verify batch cancellation flags to halt gracefully when administrators abort an active run.',
      'Streaming file exports must write to private, non-public directories and be gated behind authorized streaming response controllers to maintain enterprise data sovereignty.',
    ],
    hasLiveDemo: true,
    demoUrl: 'https://tanqia.philozz.com',
    productionUrl: 'https://tanqia.philozz.com',
    coverImageUrl: '/images/projects/tanqia/02_dashboard_overview.png',
    thumbnailUrl: '/images/projects/tanqia/02_dashboard_overview.png',
    galleryImages: [
      '/images/projects/tanqia/02_dashboard_overview.png',
      '/images/projects/tanqia/01_login_page.png',
      '/images/projects/tanqia/03_dashboard_companies.png',
      '/images/projects/tanqia/04_dashboard_submissions.png',
      '/images/projects/tanqia/05_company_management.png',
      '/images/projects/tanqia/07_add_employee_modal.png',
      '/images/projects/tanqia/11_employee_workspace.png',
    ],
    githubUrl: 'https://github.com/figo05-ai/Tanqia',
  },
  {
    slug: 'sip-and-snug',
    title: 'Sip & Snug Cafe',
    tagline: 'Cafe E-Commerce Platform, Order Fulfillment Pipeline & OpenAPI Contracts',
    role: 'Lead Backend & API Architect',
    period: 'Production System',
    clientOrContext: 'Specialty Cafe & Food Service E-Commerce',
    category: 'Full-Stack E-Commerce & RESTful APIs',
    technologies: ['Laravel 11', 'PHP 8.3 / 8.5', 'MySQL 8.0', 'Laravel Sanctum', 'L5-Swagger (OpenAPI 3.0)', 'Blade & AJAX', 'Bootstrap 5', 'Docker'],
    summary:
      'An end-to-end cafe ordering and operations platform connecting a dynamic Blade/AJAX customer storefront with a Sanctum-secured RESTful API backend and a comprehensive Admin management dashboard. Engineered with strict Service Layer separation, the system orchestrates persistent custom drink carts with add-on modifiers, atomic order checkouts with real-time stock deduction, zone-based delivery fee calculations, and self-documenting OpenAPI 3.0 endpoints.',
    challenge:
      'Beverage e-commerce introduces complex state calculations: customers customize drinks with multi-attribute add-ons (milk type, sweetness, syrups, extra shots) that alter base prices and must be tracked immutably across carts, order lines, and kitchen tickets. Handling concurrent checkouts risked stock over-allocation, and delivery fees vary dynamically by geographic zones. Furthermore, supporting both a decoupled mobile client and a web frontend required unified, regression-free API contracts without documentation drift.',
    responsibilities: [
      'Architected a clean Service Layer (OrderService, CartService) isolating domain business rules from HTTP controllers and ensuring ACID transaction boundaries.',
      'Engineered a dynamic drink cart system supporting complex JSON-stored add-on modifiers with variant deduplication via JSON containment queries (whereJsonContains).',
      'Implemented an atomic checkout pipeline within database transactions, snapshotting historical item and add-on pricing to protect financial records against future catalog price edits.',
      'Designed a relational delivery zone engine matching customer addresses with configured delivery radiuses and calculating zone-specific delivery fees.',
      'Generated interactive OpenAPI 3.0 documentation using L5-Swagger attributes, providing contract-compliant API specifications for mobile client teams.',
      'Built an administrative order fulfillment suite featuring real-time status transitions (pending, preparing, out_for_delivery, delivered, canceled) and stock shortage telemetry.',
    ],
    architectureSummary:
      'Client requests are validated against strict FormRequest schemas and routed through Sanctum-authenticated controllers into domain services (CartService, OrderService). Order placement executes inside atomic MySQL database transactions that verify stock, calculate subtotal and delivery fees, create immutable order item snapshots, decrement inventory safely, and award customer loyalty points (1 point per 10 EGP spent). L5-Swagger automatically maps PHP 8 attributes into an interactive Swagger UI for developer testing.',
    architectureNodes: [
      { name: 'Storefront & Customer UI', description: 'Blade & AJAX interface featuring drink filter tabs, product modal customization, live cart counters, and admin order board.', tech: 'Blade, Bootstrap 5 & AJAX' },
      { name: 'API Gateway & Security', description: 'Sanctum token and session authentication enforcing customer vs admin role authorization guards and rate limiting.', tech: 'Laravel Sanctum' },
      { name: 'Order Fulfillment Pipeline', description: 'Transactional order placement engine handling stock allocation, price snapshotting, and status transitions.', tech: 'OrderService & DB Transactions' },
      { name: 'Modifier & Pricing Engine', description: 'Multi-level modifier calculation resolving base prices, effective sale discounts, and additive add-on adjustments.', tech: 'Product & AddOn Services' },
      { name: 'Relational Datastore', description: 'Relational MySQL schema with foreign key cascades, ULID/UUID primary identifiers, and JSON modifier indices.', tech: 'MySQL 8.0 InnoDB' },
      { name: 'Contract & Documentation', description: 'Attribute-driven OpenAPI 3.0 specification generator providing interactive testing sandbox.', tech: 'L5-Swagger' },
    ],
    technicalDecisions: [
      {
        title: 'Atomic Price Snapshotting at Checkout',
        rationale: 'Rather than referencing mutable product and add-on tables for historical invoices, the checkout service persists historical unit prices and modifier adjustments directly into order_items and order_item_addons rows, guaranteeing financial audit integrity even if menu prices change later.',
      },
      {
        title: 'Variant Cart Deduplication via JSON Containment',
        rationale: 'Using whereJsonContains("add_ons", ...) ensures that adding the exact same beverage customization increments the existing cart item quantity rather than duplicating lines, preserving a clean cart state for both mobile and web clients.',
      },
      {
        title: 'Zone-Based Geographic Delivery Matrix',
        rationale: 'Linking delivery addresses directly to delivery_zones tables allows dynamic shipping fee computation based on operational coverage rather than flat-rate fees, ensuring operational profitability on long-distance orders.',
      },
      {
        title: 'IDOR Protection via Scoped Relationship Queries',
        rationale: 'Cart modification and removal endpoints scope queries using whereHas("cart", fn($q) => $q->where("user_id", $userId)), preventing malicious users from tampering with other customers\' shopping baskets via forged cart item IDs.',
      },
    ],
    demoVisualType: 'security-topology',
    lessonsLearned: [
      'Multi-addon modifiers require strict validation schemas to prevent client-side price tampering when submitting nested JSON payloads.',
      'Order placement must execute inside an ACID transaction before clearing the user\'s cart; deleting cart items prematurely leads to cart loss if payment or database insertion fails.',
      'Decoupling API contracts through OpenAPI attributes early in development prevents coordination bottlenecks between web and mobile engineers.',
    ],
    hasLiveDemo: false,
    coverImageUrl: '/images/projects/sip-snug/01_landing_hero.png',
    thumbnailUrl: '/images/projects/sip-snug/01_landing_hero.png',
    galleryImages: [
      '/images/projects/sip-snug/01_landing_hero.png',
      '/images/projects/sip-snug/03_menu_catalog.png',
      '/images/projects/sip-snug/04_product_modal.png',
      '/images/projects/sip-snug/02_categories_section.png',
      '/images/projects/sip-snug/08_admin_dashboard_overview.png',
      '/images/projects/sip-snug/09_admin_products_management.png',
      '/images/projects/sip-snug/10_admin_orders_management.png',
      '/images/projects/sip-snug/11_admin_addons_management.png',
      '/images/projects/sip-snug/06_cart_page.png',
      '/images/projects/sip-snug/07_checkout_page.png',
      '/images/projects/sip-snug/12_api_swagger_documentation.png',
      '/images/projects/sip-snug/05_login_page.png',
    ],
    githubUrl: 'https://github.com/figo05-ai',
  },
  {
    slug: 'academy-lms',
    title: 'Academy LMS & CAD Licensing Engine',
    tagline: 'Architectural Education Platform & Desktop CAD Plugin Licensing Service',
    role: 'Lead Software Engineer & System Architect',
    period: 'Production Platform',
    clientOrContext: 'The Technical Office for Landscaping Works',
    category: 'EdTech, Desktop Integration & Security',
    technologies: ['Laravel 13.x', 'PHP 8.3 / 8.5', 'MySQL 8.0', 'Desktop CAD Integration (SketchUp & AutoCAD)', 'RFC 8628 Device Flow', 'Tailwind CSS v4', 'Blade', 'Docker'],
    summary:
      'A specialized educational and software entitlement platform built for The Technical Office for Landscaping Works. Connecting an advanced architectural course LMS with a secure desktop licensing engine, the platform manages sequential student video progression while authorizing and distributing proprietary desktop plugins for SketchUp (RBZ), AutoCAD, and Maxtree 3D block libraries via an RFC 8628-inspired hardware device authorization protocol.',
    challenge:
      'Engineering and architectural academies face severe piracy and intellectual property leakage: proprietary 3D/CAD plugins and high-value training assets are easily distributed outside paid enrollments. The system required: (1) sequential student course progress tracking that unlocks lessons only upon prerequisite completion; (2) a secure mechanism allowing desktop CAD software (running on Windows workstations) to authenticate students and verify active license entitlements without storing permanent master credentials on local desktop machines.',
    responsibilities: [
      'Architected a hybrid Web LMS and Desktop Licensing Hub serving student course curricula alongside desktop plugin entitlements.',
      'Implemented an RFC 8628-inspired Device Authorization Flow allowing SketchUp and AutoCAD desktop tools to authenticate users via secure 10-character pairing codes and SHA-256 hashed challenges.',
      'Engineered sequential course progression logic in the database (course_sessions, session_user) with dynamic overall completion percentage telemetry.',
      'Designed a granular administrative licensing studio enabling managers to activate, extend, or revoke individual SketchUp, AutoCAD, and Maxtree licenses per student.',
      'Built a cryptographic download pipeline enforcing SHA-256 integrity verification on distributed SketchUp RBZ extension packages before release.',
      'Hardened application endpoints with strict HTTP Security Headers (CSP, Referrer-Policy: no-referrer, Cache-Control: no-store, and HTTPS enforcement).',
    ],
    architectureSummary:
      'The web platform provides a dark-mode glassmorphic LMS where authenticated students stream curriculum lectures and track their milestone progress. When a student launches proprietary tools inside desktop SketchUp or AutoCAD, the plugin initiates a device pairing request. The student confirms the authorization code in the browser; the backend verifies active student status, links the device, and issues an entitlement lease. Administrators monitor enrolled students, toggle activation flags, and manage multi-software license validity from a unified dashboard.',
    architectureNodes: [
      { name: 'Student Classroom & Video Portal', description: 'Curriculum player featuring organized module trees, session completion toggles, and direct lecture resource downloads.', tech: 'Blade, Tailwind CSS & Alpine.js' },
      { name: 'CAD Device Authorization Bridge', description: 'OAuth2 Device Flow (RFC 8628) endpoint exchanging one-time pairing codes for authenticated workstation sessions.', tech: 'SketchupAuthorizationController' },
      { name: 'License Entitlement Store', description: 'Granular license models tracking activation status, expiration timestamps, and device bindings across SketchUp, AutoCAD, and Maxtree.', tech: 'MySQL 8.0 & Eloquent Relations' },
      { name: 'Admin Management Studio', description: 'Centralized console for course creation, session reordering, student enrollment approvals, and license provisioning.', tech: 'AdminController & AdminUserController' },
      { name: 'Cryptographic Package Distributor', description: 'Verified delivery endpoint serving official signed RBZ extensions verified against pre-computed SHA-256 digests.', tech: 'Download Controllers & Hash Verification' },
    ],
    technicalDecisions: [
      {
        title: 'RFC 8628 Device Authorization Flow for Desktop Plugins',
        rationale: 'Desktop CAD environments cannot securely host browser OAuth redirects or store user passwords in local scripts. The 10-character one-time pairing code lets the user authorize on the web via their existing session, maintaining zero password exposure to local plugins.',
      },
      {
        title: 'Decoupled License Modularity per Software Tool',
        rationale: 'Structuring licenses as separate HasOne relations (sketchupLicense, autocadLicense, maxtreeLicense) instead of a generic flag enables independent billing, custom expiration dates, and granular feature gating for each desktop product.',
      },
      {
        title: 'Sequential Learning State Machine with Milestone Validation',
        rationale: 'Storing progress in a session_user pivot table with order-indexed constraints ensures students master prerequisite lessons before subsequent chapters unlock, preserving educational integrity.',
      },
      {
        title: 'Cryptographic Payload Hashing (SHA-256 RBZ Verification)',
        rationale: 'Enforcing pre-computed SHA-256 hash checks on /sketchup/download ensures desktop clients only receive authentic, untampered plugin binaries, preventing supply chain attacks or corrupted distributions.',
      },
    ],
    demoVisualType: 'license-matrix',
    lessonsLearned: [
      'Desktop plugins operating within restrictive CAD sandbox environments require lightweight HTTP communication with robust timeout and offline retry handling.',
      'Device authorization requests must enforce aggressive time-to-live (TTL) limits and single-use consumption flags to prevent replay attacks during pairing.',
      'Separating student course enrollment status from software tool license status gives administrators flexibility to offer software-only or course-only access tiers.',
    ],
    hasLiveDemo: false,
    coverImageUrl: '/images/projects/academy/01_landing_hero.png',
    thumbnailUrl: '/images/projects/academy/01_landing_hero.png',
    galleryImages: [
      '/images/projects/academy/01_landing_hero.png',
      '/images/projects/academy/04_student_dashboard.png',
      '/images/projects/academy/07_course_classroom_player.png',
      '/images/projects/academy/08_admin_dashboard_courses.png',
      '/images/projects/academy/09_admin_users_and_licensing.png',
      '/images/projects/academy/02_landing_courses.png',
      '/images/projects/academy/05_student_my_courses.png',
      '/images/projects/academy/06_student_explore_courses.png',
      '/images/projects/academy/03_login_page.png',
    ],
    githubUrl: 'https://github.com/figo05-ai',
  },
  {
    slug: 'clothes-ecommerce',
    title: 'Clothes Enterprise E-Commerce',
    tagline: 'Multi-Variant Fashion Platform, Digital Wallet Ledger & Filament v3 Backoffice',
    role: 'Full-Stack Architect & Backend Lead',
    period: 'Production System',
    clientOrContext: 'Apparel & Luxury Fashion E-Commerce',
    category: 'E-Commerce, Financial Ledgers & Operations',
    technologies: ['Laravel 11.x', 'PHP 8.3 / 8.5', 'Filament v3', 'Livewire', 'MySQL 8.0', 'Tailwind CSS', 'Alpine.js', 'L5-Swagger', 'Docker'],
    summary:
      'An enterprise-grade fashion e-commerce ecosystem integrating a luxury customer storefront with a full Filament v3 administration suite and an immutable financial ledger. Engineered with a domain-driven Service Layer, the platform powers multi-variant apparel cataloging (size, color, SKU matrices), pessimistic stock reservation locks (lockForUpdate), a closed-loop customer Digital Wallet with append-only transaction logs, an RMA (Return Merchandise Authorization) lifecycle pipeline, and real-time shipment status tracking.',
    challenge:
      'High-velocity apparel retail introduces unique architectural friction: (1) Flash sales on popular clothing variants create inventory race conditions that cause overselling if stock checks and checkout deductions are not serialized; (2) Integrating a store credit / digital wallet system requires strict financial atomicity to prevent double-spending across checkout tabs; (3) Post-purchase logistics require a formal RMA state machine for size exchanges, refunds, and support ticket coordination without administrative bottlenecks.',
    responsibilities: [
      'Architected a Clean Service-Oriented architecture across 20+ specialized domain modules (Wallet, Order, Cart, Catalog, RMA, Shipping, Discount, Loyalty, Support).',
      'Implemented pessimistic row-level locking (Product::lockForUpdate()) within ACID database transactions, guaranteeing zero stock overselling during concurrent checkout bursts.',
      'Engineered a closed-loop Digital Wallet accounting engine with append-only credit/debit transaction logs and stateful wallet activation gates.',
      'Constructed an automated customer RMA (Return Merchandise Authorization) and ticketing workflow managing return requests, status inspections, and customer notifications.',
      'Built a comprehensive backoffice suite using Filament v3 with dedicated resources for Orders, Inventory, Coupons, Shipments, Support Tickets, and Wallet Audits.',
      'Integrated coupon validation logic with minimum spend gates, percentage discounts, and customer usage quota enforcement.',
    ],
    architectureSummary:
      'Customer storefront interactions (Blade, Tailwind CSS, Alpine.js) dispatch to dedicated service controllers. Checkout operations execute inside atomic MySQL transactions that acquire row-level locks on requested variant rows, deduct inventory, apply coupon/loyalty discounts, and debit user wallets. Store managers oversee fulfillment through a real-time Filament v3 backoffice panel equipped with interactive table filters, shipment tracking numbers, and financial transaction audit trails.',
    architectureNodes: [
      { name: 'Customer Presentation Layer', description: 'Modern apparel storefront featuring category navigation, multi-variant selectors (colors/sizes), wishlist, cart, and self-service wallet portal.', tech: 'Blade, Tailwind CSS & Alpine.js' },
      { name: 'Filament Backoffice Suite', description: 'TALL-stack administrative control plane managing product catalogs, shipment carriers, return authorizations, and customer support.', tech: 'Filament v3 & Livewire' },
      { name: 'Pessimistic Checkout Pipeline', description: 'ACID transaction pipeline with row-level locks, stock decrements, and combined wallet/loyalty discount calculations.', tech: 'OrderService & DB Transactions' },
      { name: 'Digital Wallet Ledger', description: 'Immutable accounting engine recording credit/debit mutations and self-service top-up transactions.', tech: 'WalletService & WalletTransaction Model' },
      { name: 'RMA & Logistics Dispatcher', description: 'State machine tracking return requests from submission to inspection, warehouse return, and refund issuance.', tech: 'ReturnService & ShippingService' },
      { name: 'Relational E-Commerce Store', description: 'MySQL 8 schema with ULID primary keys, composite variant indexes, and relational shipment/order cascades.', tech: 'MySQL 8.0 InnoDB' },
    ],
    technicalDecisions: [
      {
        title: 'Pessimistic Row-Level Locking on Inventory',
        rationale: 'Apparel variants with limited stock risk severe overselling during checkout bursts. Using Product::lockForUpdate() within an ACID transaction ensures that concurrent checkouts wait for the row lock, preventing negative inventory and order cancellation headaches.',
      },
      {
        title: 'Append-Only Digital Wallet Transaction Journal',
        rationale: 'Directly mutating user balance fields without audit logs creates vulnerability to balance discrepancies. All balance changes trigger an append-only wallet_transactions record (credit or debit), ensuring full traceability during financial reconciliations.',
      },
      {
        title: 'Domain-Driven Service Layer Separation',
        rationale: 'Isolating business rules into 20+ decoupled service directories (e.g. OrderService, WalletService, LoyaltyService) keeps controllers under 60 lines and allows administrative tools and customer APIs to share identical domain validation.',
      },
      {
        title: 'Filament v3 Resource Scoping & Policy Authorization',
        rationale: 'Leveraging Filament v3 resources with built-in table filters, bulk actions, and modal forms eliminated hundreds of hours of bespoke administrative frontend work while enforcing strict role-based access control.',
      },
    ],
    demoVisualType: 'task-flow',
    lessonsLearned: [
      'Pessimistic database locks should only be held for the minimal duration required to verify stock and commit orders to avoid database worker thread starvation.',
      'Multi-variant products (color x size) require compound database indexes on (product_id, size, color) to keep inventory lookup queries under 5ms.',
      'Self-service return systems require clear state transition constraints (e.g., cannot approve a return on an order that is still in transit) to prevent logistics fraud.',
    ],
    hasLiveDemo: false,
    coverImageUrl: '/images/projects/clothes/01_storefront_homepage.png',
    thumbnailUrl: '/images/projects/clothes/01_storefront_homepage.png',
    galleryImages: [
      '/images/projects/clothes/01_storefront_homepage.png',
      '/images/projects/clothes/02_catalog_category_filters.png',
      '/images/projects/clothes/03_product_detail_variants.png',
      '/images/projects/clothes/07_filament_admin_dashboard.png',
      '/images/projects/clothes/08_filament_products_resource.png',
      '/images/projects/clothes/09_filament_orders_fulfillment.png',
      '/images/projects/clothes/10_filament_wallet_transactions.png',
      '/images/projects/clothes/04_digital_wallet_management.png',
      '/images/projects/clothes/05_checkout_and_coupons.png',
      '/images/projects/clothes/06_customer_rma_returns.png',
      '/images/projects/clothes/11_api_swagger_documentation.png',
    ],
    githubUrl: 'https://github.com/figo05-ai',
  },
  {
    slug: 'travel-worldwide',
    title: 'Travela Worldwide',
    tagline: 'Global Tourism Engine, Curated Tour Packages & Online Booking Platform',
    role: 'Lead Frontend & UI Architect',
    period: 'Production Platform',
    clientOrContext: 'International Tourism Agency & Destination Operator',
    category: 'Travel Tech & Tour Operations',
    technologies: [
      'JavaScript (ES6+)',
      'Bootstrap 5',
      'HTML5 / SCSS',
      'Owl Carousel 2',
      'Lightbox Gallery',
      'Animate.css',
      'Responsive Web Design',
    ],
    summary:
      'A comprehensive, high-conversion international travel and tourism web platform engineered for global tour operators. Featuring an interactive destination explorer, tiered package pricing matrices, dynamic booking forms, high-resolution media galleries with lightbox previews, and dedicated tour guide profiles across worldwide destinations.',
    challenge:
      'Travel portals typically suffer from massive image payload bloat, slow time-to-interactive during heavy carousel initialization, and confusing multi-step booking flows that increase drop-offs. The platform required sub-second visual rendering across international itineraries, optimized responsive layouts for mobile travelers, and an intuitive reservation system for multi-country travel packages.',
    responsibilities: [
      'Architected a modular multi-page travel platform comprising 12 specialized views (destinations, packages, tour itineraries, booking engine, guides, testimonials).',
      'Engineered an interactive tour booking and inquiry workflow with client-side form validation, destination selection, and date pickers.',
      'Optimized asset delivery pipeline with lazy loading for high-resolution destination galleries, reducing initial page weight by over 60%.',
      'Built fluid destination filtering and interactive carousel cards using Owl Carousel and Lightbox for immersive imagery exploration.',
      'Ensured full cross-device responsiveness with mobile-first SCSS architecture and accessible navigation menus.',
    ],
    architectureSummary:
      'Built with a high-performance modular frontend architecture combining semantic HTML5, modern SCSS, and vanilla JavaScript. Dynamic destination tabs and tour package carousels operate with zero-layout-shift (CLS) guarantees. Form submissions validate traveler inputs and dispatch booking inquiries, while responsive grid layouts guarantee seamless browsing on cellular networks across diverse international devices.',
    architectureNodes: [
      { name: 'Traveler Presentation Layer', description: 'Responsive multi-page UI featuring destination sliders, tour packages, and animated guide profiles.', tech: 'Bootstrap 5 & Custom SCSS' },
      { name: 'Booking & Inquiry Engine', description: 'Validated reservation forms with travel date pickers, ticket counts, and destination selection.', tech: 'JavaScript ES6+' },
      { name: 'Visual Media Gallery', description: 'Optimized high-resolution lightbox portfolio with touch-friendly mobile carousel exploration.', tech: 'Lightbox & Owl Carousel' },
      { name: 'Itinerary & Pricing Matrix', description: 'Structured tier packages comparing hotel categories, flights, day-by-day tours, and excursions.', tech: 'Modular CSS Grid' },
    ],
    technicalDecisions: [
      {
        title: 'Modular SCSS Architecture over Monolithic CSS',
        rationale: 'Organizing styles into discrete component modules (navbar, hero, packages, testimonial, booking) ensures maintainability and allows fine-grained critical CSS extraction.',
      },
      {
        title: 'Zero-Layout-Shift Media Loading Strategy',
        rationale: 'Pre-specifying aspect ratios on destination cards and utilizing progressive image loading eliminates Cumulative Layout Shift (CLS) when browsing image-heavy packages.',
      },
      {
        title: 'Client-Side Form Validation Guardrails',
        rationale: 'Validating date ranges, traveler counts, and required contact channels prior to dispatch minimizes redundant server roundtrips and prevents abandoned bookings.',
      },
    ],
    demoVisualType: 'task-flow',
    lessonsLearned: [
      'High-resolution travel imagery requires responsive srcset definitions and progressive WebP formats to prevent high latency for international users on mobile roaming.',
      'Touch interactions on mobile tour sliders must be calibrated to prevent scroll interception during vertical page browsing.',
    ],
    hasLiveDemo: false,
    coverImageUrl: '/images/projects/travel-worldwide/01_landing_hero.png',
    thumbnailUrl: '/images/projects/travel-worldwide/01_landing_hero.png',
    galleryImages: [
      '/images/projects/travel-worldwide/01_landing_hero.png',
      '/images/projects/travel-worldwide/02_packages_pricing.png',
      '/images/projects/travel-worldwide/03_destinations_catalog.png',
      '/images/projects/travel-worldwide/04_online_booking_system.png',
      '/images/projects/travel-worldwide/05_tours_itinerary.png',
      '/images/projects/travel-worldwide/06_travel_gallery.png',
      '/images/projects/travel-worldwide/07_services_benefits.png',
      '/images/projects/travel-worldwide/08_expert_travel_guides.png',
    ],
    githubUrl: 'https://github.com/figo05-ai/travel-worldwide',
  },
  {
    slug: 'religious-tourism',
    title: 'Nur Al-Haramain Pilgrimage',
    tagline: 'Luxury Islamic Pilgrimage (Hajj & Umrah) Portal with Multi-Lingual Architecture',
    role: 'Full-Stack Web Architect',
    period: 'Production Platform',
    clientOrContext: 'VIP Hajj, Umrah & Sacred Ziyarat Travel Agency',
    category: 'Hospitality & Religious Tourism',
    technologies: [
      'JavaScript (ES6+)',
      'Bilingual i18n (Arabic RTL & English LTR)',
      'Bootstrap 5',
      'CSS3 Grid / Flexbox',
      'jQuery UI Range Sliders',
      'FOUC Elimination Engine',
      'Owl Carousel 2',
    ],
    summary:
      'A luxury Islamic pilgrimage web platform designed for VIP Hajj, Umrah, and Ziyarat journeys. Featuring instant bilingual switching (Arabic RTL & English LTR) with zero Flash of Unstyled Content (FOUC), an interactive multi-tab pilgrimage booking configurator, price range filtering, holy sanctuary galleries, and live seasonal countdown timers for Ramadan and Hajj seasons.',
    challenge:
      'Bilingual Arabic/English platforms frequently suffer from Flash of Unstyled Content (FOUC) when switching directionality (RTL/LTR), causing jarring font re-renders and misplaced UI elements. Furthermore, religious pilgrims require comprehensive clarity on hotel distances from Al-Masjid al-Haram, scholarly guidance credentials, visa processing timelines, and customizable package budgets.',
    responsibilities: [
      'Engineered an instant client-side internationalization (i18n) engine seamlessly toggling between Arabic (RTL) and English (LTR) with persistent language state.',
      'Eliminated Flash of Unstyled Content (FOUC) through inline critical rendering scripts that set initial opacity and manual scroll restoration before stylesheet execution.',
      'Implemented a multi-category booking tab system (Umrah, VIP Hajj, Haram-Facing Hotels, Flights, Guided Ziyarat tours) with interactive jQuery UI budget range sliders.',
      'Constructed a live Ramadan/Hajj season countdown timer component with automated days/hours/minutes synchronization.',
      'Designed a sacred visual design system utilizing royal emerald green (#0a4d3c), golden accents (#d4af37), and high-contrast Islamic typography.',
    ],
    architectureSummary:
      'The portal utilizes a single-page architecture with deep semantic anchoring and bilingual dictionary mapping. A lightweight runtime script executes in the document head to detect language preference and enforce RTL/LTR directionality before the DOM renders, guaranteeing zero visual jumps. Interactive tabs filter pilgrimage packages dynamically without page reloads, accompanied by budget range sliders and booking consultation inquiry forms.',
    architectureNodes: [
      { name: 'Bilingual i18n & RTL Engine', description: 'Zero-FOUC language toggle seamlessly flipping document directionality and Arabic/English text matrices.', tech: 'Native JS & i18n Dict' },
      { name: 'Pilgrimage Booking Configurator', description: 'Interactive multi-tab selector for Umrah, VIP Hajj, Makkah/Madinah Hotels, and Ziyarat excursions.', tech: 'jQuery UI & Tab System' },
      { name: 'Budget Range Filter', description: 'Real-time price slider filtering pilgrimage packages according to traveler budget constraints.', tech: 'jQuery UI Slider' },
      { name: 'Seasonal Event Timer', description: 'Synchronized live countdown tracking remaining days until Ramadan and Hajj pilgrimage departures.', tech: 'JavaScript Clock Loop' },
      { name: 'Sanctuary Visual Gallery', description: 'High-fidelity imagery showcase highlighting sacred Islamic monuments and 5-star hotel views.', tech: 'CSS3 & Filterizr' },
    ],
    technicalDecisions: [
      {
        title: 'Zero-FOUC Inline Pre-Rendering Execution',
        rationale: 'Executing critical language and directionality resolution in an inline head script before DOM painting prevents the jarring visual snap common in client-side RTL transitions.',
      },
      {
        title: 'Unified Multi-Category Booking Workspace',
        rationale: 'Consolidating Umrah, Hajj, Hotels, and Ziyarat into tabbed panels with synchronized budget filters lets pilgrims tailor complete journeys in a single intuitive interface.',
      },
      {
        title: 'Culturally Calibrated Color & Typography Palette',
        rationale: 'Combining deep emerald (#0a4d3c) and soft gold (#d4af37) with elegant Poppins and Rufina fonts conveys spiritual reverence and luxury hospitality standards.',
      },
    ],
    demoVisualType: 'task-flow',
    lessonsLearned: [
      'RTL layouts require mirrored icon alignments and flipped CSS animations to maintain natural visual rhythm for native Arabic readers.',
      'Budget sliders for travel packages must format currencies dynamically based on the active locale to prevent traveler confusion.',
    ],
    hasLiveDemo: false,
    coverImageUrl: '/images/projects/religious-tourism/01_sacred_hero_booking.png',
    thumbnailUrl: '/images/projects/religious-tourism/01_sacred_hero_booking.png',
    galleryImages: [
      '/images/projects/religious-tourism/01_sacred_hero_booking.png',
      '/images/projects/religious-tourism/02_vip_pilgrimage_services.png',
      '/images/projects/religious-tourism/03_hajj_umrah_packages.png',
      '/images/projects/religious-tourism/04_ramadan_special_offers.png',
      '/images/projects/religious-tourism/05_holy_sanctuaries_gallery.png',
      '/images/projects/religious-tourism/06_pilgrims_scholarly_guidance.png',
    ],
    githubUrl: 'https://github.com/figo05-ai/religious-tourism',
  },
  {
    slug: 'synapse-platform',
    title: 'Synapse Platform',
    tagline: 'Collaborative Engineering Agency Platform, Team Matrix & Integrated Admin Studio',
    role: 'Lead Backend & System Developer',
    period: 'Production Platform',
    clientOrContext: 'Specialized Software Development Agency',
    category: 'Full-Stack & Agency Systems',
    technologies: [
      'Laravel 11',
      'PHP 8.2+',
      'React 19',
      'TypeScript',
      'Vite',
      'Tailwind CSS',
      'TanStack Query',
      'Zustand',
      'Sanctum Cookie Auth',
      'SQLite / MySQL',
    ],
    summary:
      'A software engineering agency platform and backoffice portal engineered for collaborative developer teams. Featuring a high-performance React 19 frontend with client-side state management (Zustand & TanStack Query), coupled to a robust Laravel 11 REST API with Sanctum cookie-based authentication, an interactive team skill matrix, project case study showcases, service catalog management, and a full-featured Admin Studio.',
    challenge:
      'Agency websites frequently decouple their frontend from content administration, resulting in static portfolios that quickly become outdated. Synapse required a dual-surface architecture: a blistering-fast, SEO-optimized public showcase displaying multi-engineer contributions per project, coupled with a private, authenticated Admin Studio for real-time CRUD management of team members, project galleries, client inquiries, and service tiers with zero page reloads.',
    responsibilities: [
      'Architected a decoupled Full-Stack application pairing a React 19 / TypeScript SPA with a hardened Laravel 11 RESTful backend.',
      'Implemented secure cookie-based SPA authentication via Laravel Sanctum with CSRF protection, HttpOnly cookies, and role authorization.',
      'Designed relational schema modeling team members, multi-member project contributions (ProjectTeamContribution), service feature tiers, and contact inquiries.',
      'Built a reactive administrative studio (AdminLayout) with optimistic data mutations via TanStack Query and centralized modal state in Zustand.',
      'Engineered an interactive engineering team showcase displaying individual member tech stacks, GitHub/LinkedIn links, and specialized agency disciplines.',
    ],
    architectureSummary:
      'The frontend (React 19, TypeScript, Tailwind CSS) communicates with the Laravel 11 backend via authenticated Axios instances. State is orchestrated through TanStack Query for remote server-state caching and Zustand for client UI state. The backend implements RESTful controllers with Form Request validation, Eloquent relationships, and Sanctum middleware guards, serving data from an optimized database store.',
    architectureNodes: [
      { name: 'Public Client Experience', description: 'React 19 single-page application with fluid transitions, project filters, and team contribution showcases.', tech: 'React 19 & Tailwind CSS' },
      { name: 'State & Cache Orchestrator', description: 'Dual-layer state architecture with remote query caching and local client store.', tech: 'TanStack Query & Zustand' },
      { name: 'API Gateway & Security', description: 'Sanctum-authenticated REST API with CSRF token exchange, rate limiting, and typed requests.', tech: 'Laravel 11 REST' },
      { name: 'Admin Studio Control Panel', description: 'Full CRUD dashboard managing team rosters, project releases, and client consultation inquiries.', tech: 'Admin Studio SPA' },
      { name: 'Relational Entity Store', description: 'Normalized relational schema tracking projects, image galleries, and team contributions.', tech: 'MySQL / SQLite' },
    ],
    technicalDecisions: [
      {
        title: 'Cookie-Based Sanctum SPA Authentication',
        rationale: 'Using first-party HttpOnly session cookies instead of localStorage bearer tokens eliminates XSS token-theft vulnerabilities while maintaining seamless Single Page Application state.',
      },
      {
        title: 'TanStack Query Server-State Caching',
        rationale: 'Decoupling remote entity caching from local component state enables instant optimistic updates on the admin panel with automatic background stale-while-revalidate synchronization.',
      },
      {
        title: 'Project-Team Contribution Pivot Modeling',
        rationale: 'Modeling ProjectTeamContribution as an explicit relational entity allows displaying which specific engineers architected which system components on every project case study.',
      },
    ],
    demoVisualType: 'task-flow',
    lessonsLearned: [
      'SPA cookie authentication requires strict CORS and same-site cookie calibration between distinct frontend and backend development ports.',
      'Optimistic mutations in administrative tables must include rollback error handlers to maintain UI consistency when backend validation fails.',
    ],
    hasLiveDemo: false,
    coverImageUrl: '/images/projects/synapse/01_agency_landing_hero.png',
    thumbnailUrl: '/images/projects/synapse/01_agency_landing_hero.png',
    galleryImages: [
      '/images/projects/synapse/01_agency_landing_hero.png',
      '/images/projects/synapse/03_engineering_team_matrix.png',
      '/images/projects/synapse/04_services_capabilities.png',
      '/images/projects/synapse/05_about_methodology.png',
      '/images/projects/synapse/06_admin_studio_login.png',
    ],
    githubUrl: 'https://github.com/figo05-ai/Synapse',
  },
  {
    slug: 'zodiak-portfolio',
    title: 'ZODiAK Cybersecurity',
    tagline: 'Offensive Security Research Portal, Attack Topology Visualizer & Live Exploits Log',
    role: 'Lead Full-Stack & AppSec Engineer',
    period: 'Production Platform',
    clientOrContext: 'Offensive Security Researcher & Penetration Tester (Ebrahim Hammad)',
    category: 'Cybersecurity, AppSec & Threat Intel',
    technologies: [
      'Cloud Firestore',
      'Firebase Auth (Custom Claims)',
      'Three.js (3D Ambient Particles)',
      'JavaScript (ES6+)',
      'Marked.js & DOMPurify',
      'ImgBB API Integration',
      'Vercel Jamstack',
    ],
    summary:
      'A cyber-intelligence portfolio and offensive research portal built for an elite penetration tester and security researcher (Ranked #1 in Egypt on TryHackMe). Featuring an interactive Three.js 3D attack surface topology visualizer, live telemetry feeds, OSCP/eJPT certification verification portals, technical vulnerability writeup reader with sanitized Markdown, and a hardened administrative studio guarded by 25KB of Cloud Firestore Security Rules.',
    challenge:
      'Cybersecurity portfolios demand exceptional security posture: publicizing penetration testing findings and exploit writeups creates an attractive target for malicious threat actors. The application required: (1) strict client-side Markdown sanitization preventing stored XSS injection; (2) declarative, audited Cloud Firestore Security Rules guaranteeing zero unauthorized read/write access to unpublished research or visitor messages; (3) an immersive Cyberpunk visual identity with high-performance 3D particle simulation without lagging low-spec client hardware.',
    responsibilities: [
      'Architected a high-security Jamstack portal deployed globally on Vercel with Cloud Firestore as a reactive, serverless document store.',
      'Engineered an interactive 3D attack surface topology visualizer using Three.js and HTML5 Canvas, simulating live reconnaissance telemetry.',
      'Authored and audited 25KB of hardened Cloud Firestore Security Rules (firestore.rules) enforcing strict role authorization, field type checks, and schema validation.',
      'Built a sanitized vulnerability writeup reader using Marked.js, DOMPurify, and Highlight.js, neutralizing XSS risks while rendering code syntax highlighting.',
      'Developed an administrative security gateway (/admin/login.html) with Firebase Authentication, providing full CRUD management for writeups, certificates, and research files.',
      'Integrated zero-cost asset pipeline using ImgBB API for authenticated image uploads with automated Firestore document referencing.',
    ],
    architectureSummary:
      'Built on a serverless Jamstack architecture, the client runs on global edge CDN nodes. Dynamic research data, certifications, and vulnerability writeups stream reactively via Firebase Web SDK v10. All write operations to Firestore pass through hardened server-side security rules enforcing schema types and authentication claims. The administrative dashboard enables full CRUD operations, while visitor contact submissions write to isolated, admin-only message queues.',
    architectureNodes: [
      { name: 'Cyberpunk Presentation Layer', description: 'Three.js 3D particle canvas, CRT terminal headers, and neon telemetry HUD displays.', tech: 'Three.js & CSS Variables' },
      { name: 'Reactive Document Datastore', description: 'Serverless Firestore collections for writeups, certificates, tools, and system settings.', tech: 'Google Cloud Firestore' },
      { name: 'Declarative Security Rules Gate', description: '25KB hardened firestore.rules validating user claims, field constraints, and read/write policies.', tech: 'Firestore Security Rules' },
      { name: 'Sanitized Markdown Engine', description: 'XSS-neutralized writeup parser with syntax highlighting and responsive lightbox expansion.', tech: 'Marked.js & DOMPurify' },
      { name: 'Admin Security Gateway', description: 'Firebase Auth protected CRUD management console for research articles and incoming messages.', tech: 'Firebase Auth & Admin UI' },
    ],
    technicalDecisions: [
      {
        title: 'Declarative Cloud Firestore Rules Enforcement',
        rationale: 'Enforcing all authorization logic, field constraints, and ownership boundaries directly in firestore.rules guarantees that no rogue client can inject unverified writeups or exfiltrate visitor messages.',
      },
      {
        title: 'Multi-Stage DOMPurify Sanitization Pipeline',
        rationale: 'Parsing raw community writeups through DOMPurify before inserting into the DOM completely eliminates Stored XSS vectors even when displaying malicious exploit proof-of-concept scripts.',
      },
      {
        title: 'Three.js Adaptive Particle Throttling',
        rationale: 'Binding the 3D particle simulation loop to requestAnimationFrame with device-pixel-ratio caps ensures fluid 60 FPS animation on mobile devices without battery drain.',
      },
    ],
    demoVisualType: 'security-topology',
    lessonsLearned: [
      'Client-side Firestore queries must be bounded with limit() constraints and composite indexes to prevent high read latency during viral traffic spikes.',
      'Scroll-reveal animations must include fallback triggers to ensure accessibility tools and headless crawlers render the entire document without opacity suppression.',
    ],
    hasLiveDemo: false,
    coverImageUrl: '/images/projects/zodiak/01_cyberpunk_hero_terminal.png',
    thumbnailUrl: '/images/projects/zodiak/01_cyberpunk_hero_terminal.png',
    galleryImages: [
      '/images/projects/zodiak/01_cyberpunk_hero_terminal.png',
      '/images/projects/zodiak/02_oscp_security_certifications.png',
      '/images/projects/zodiak/03_bug_bounty_exploits.png',
      '/images/projects/zodiak/04_penetration_testing_writeup.png',
      '/images/projects/zodiak/05_admin_security_gateway.png',
      '/images/projects/zodiak/06_credential_validation_viewer.png',
    ],
    githubUrl: 'https://github.com/figo05-ai/zodiak-portfolio',
  },
  {
    slug: 'wholesale-produce-pos',
    title: 'Al-Rayan Wholesale Produce ERP',
    tagline: 'Wholesale Produce Agency ERP, Farmer Advances & Packaging Deposit System',
    role: 'Lead System Architect & Core Engineer',
    period: 'Enterprise Production System',
    clientOrContext: 'Wholesale Produce Agencies & Agricultural Trading Hubs (Al-Rayan & El-Eman Co., Badr Center)',
    category: 'Enterprise Desktop ERP & POS',
    technologies: [
      'Laravel 13 (PHP 8.5)',
      'Flutter 3.47+ (Desktop)',
      'MySQL 8.0 (50 Tables)',
      'Domain-Driven Design (DDD)',
      'ESC/POS & Thermal Printing',
      'Farmer Advances Ledger',
      'Packaging Deposit System',
      'InnoSetup Native Bundle',
    ],
    summary:
      'A mission-critical desktop ERP and high-velocity point-of-sale system engineered specifically for Egyptian and regional wholesale fruit and vegetable trading agencies (وكالات وتجار الخضار والفاكهة). Backed by a domain-driven Laravel 13 API and a reactive Flutter 3.47+ Windows desktop client, the system automates morning auction sales, multi-tier commission rules, empty crate security deposits (رهن الفوارغ والعدايات), and agricultural farmer advance ledgers (سلف ومستلزمات الفلاحين) with strict separation between operational asset exchanges and agency P&L profits.',
    challenge:
      'Agricultural wholesale agencies operate in volatile, high-velocity environments: hundreds of produce crates are weighed and auctioned in minutes during dawn market rushes, farmers receive upfront supplies (seeds, fertilizer, seedlings, cash loans) that must never be illicitly netted against crop sales without cash disbursement, and crate shrinkage (العدايات والأقفاص) erodes agency capital if deposit rates (Rahn) are not bound to strict temporal intervals. Furthermore, frequent market power outages require an offline-first localhost architecture capable of 100% offline uptime.',
    responsibilities: [
      'Architected a modular Domain-Driven Design (DDD) backend across 10 distinct bounded domains (Agricultural, Closing, Packaging, Parties, Sales, Supply, Cash, Reports, Inventory, Users) backed by 50 optimized MySQL tables.',
      'Engineered the specialized Agricultural Receivables & Farmer Advances engine (CreateAgriculturalLoanAction & CreateAgriculturalRepaymentAction), enforcing that seed/fertilizer/seedling supplies and cash loans operate strictly as balance sheet asset exchanges (Cash ↓ ⟺ Receivable ↑) without distorting agency profit.',
      'Designed the Packaging & Crates Deposit Architecture (PackagingType, DepositRate), replacing abstract entities with direct packaging ownership and strict temporal validity bounding (effective_from, effective_to) to safeguard historical deposit auditability.',
      'Developed the Flutter 3.47+ Windows desktop application with full RTL Arabic typography, keyboard-only rapid data entry, real-time KPI dashboard, and direct print preview.',
      'Implemented the Daily Safe Closing Guard (DailyClosingGuardService) with mutex-locked daily reconciliation, Spatie-style audit trails (audit_logs), and automated database backups (D:\\\\WholesaleFruitBackups).',
      'Authored comprehensive test suites comprising 923 backend automated tests (3,454 assertions) and 284 Flutter integration/widget tests achieving a 100% pass rate with zero warnings.',
    ],
    architectureSummary:
      'Engineered as an offline-first desktop deployment packaged with InnoSetup (WholesaleFruit-Setup-1.0.0.exe). A local Laravel 13 API engine runs over PHP 8.5 with OPcache, communicating with a Flutter 3.47+ desktop client through low-latency loopback HTTP endpoints. Transactional integrity is guaranteed through MySQL 8 InnoDB row-level locking on inventory movements, daily safe mutexes, and temporal deposit rate bounding.',
    architectureNodes: [
      {
        name: 'Agricultural Loan & Repayment Engine',
        description: 'Domain action pipeline managing farmer supplies (seeds, fertilizer, seedlings) and cash advances as strict monetary receivables.',
        tech: 'Laravel 13 DDD',
      },
      {
        name: 'Packaging & Crates Deposit Ledger',
        description: 'Temporal rate-bounding system tracking refundable deposit rates (Rahn) and crate inventory balances per party.',
        tech: 'Temporal SQL & Eloquent',
      },
      {
        name: 'Flutter Desktop Client',
        description: 'High-performance RTL Arabic desktop interface optimized for rapid keyboard data entry and dual-tab wholesale workflows.',
        tech: 'Flutter 3.47+ Windows',
      },
      {
        name: 'Daily Safe & Audit Guard',
        description: 'Cryptographic closing mutex preventing multi-operator safe discrepancies with automated database checkpointing.',
        tech: 'DailyClosingGuardService',
      },
      {
        name: 'Thermal & A4 Invoice Rasterizer',
        description: 'Bespoke HTML/CSS and PDF invoice engine producing branded commercial receipts and supplier settlement sheets.',
        tech: 'Bespoke Print Engine',
      },
    ],
    technicalDecisions: [
      {
        title: 'Strict Separation of Agricultural Receivables from Crop Consignments',
        rationale:
          'In traditional agricultural markets, arbitrary netting of supply loans against daily crop sales creates untraceable discrepancies. The system mandates that agricultural inputs are monetary debts repaid purely in cash, preserving balance sheet truth.',
      },
      {
        title: 'Direct Packaging-to-Deposit Rate Temporal Bounding',
        rationale:
          'Removed abstract deposit types in favor of direct packaging ownership (PackagingType 1 -> * DepositRate) with temporal validity intervals (effective_from, effective_to), preventing retroactive tampering with historical invoice rates.',
      },
      {
        title: 'Offline-First Localhost Architecture via Native InnoSetup Installer',
        rationale:
          'Wholesale vegetable markets suffer from severe internet instability. Bundling the complete PHP 8.5 runtime, MySQL 8, and Flutter desktop app into a 130MB standalone installer guarantees uninterrupted operation.',
      },
      {
        title: 'Dual-Scope Agency Commission Resolution Hierarchy',
        rationale:
          'Implemented an automatic commission resolution mechanism that evaluates specific SUPPLY or SALE rules before falling back to general BOTH rules, ensuring accurate agency margins across mixed transaction lots.',
      },
    ],
    demoVisualType: 'smartpos-hardware',
    lessonsLearned: [
      'Wholesale produce auction operators rarely touch a mouse during morning peak; all POS workflows require dedicated keyboard navigation, auto-focus indices, and numpad ergonomics.',
      'Empty crate logistics (العدايات والأقفاص) carry greater cumulative financial risk than daily crop margins; without automated deposit tracking, container shrinkage severely erodes agency capital.',
      'Local desktop installations require automated, fail-safe database backup and disaster recovery checkpoints (D:\\\\WholesaleFruitBackups) to survive sudden market hardware shutdowns.',
    ],
    hasLiveDemo: true,
    demoUrl: 'https://wholesale-pos.philozz.com',
    productionUrl: 'https://wholesale-pos.philozz.com',
    coverImageUrl: '/images/projects/pos/01-dashboard.png',
    thumbnailUrl: '/images/projects/pos/01-dashboard.png',
    galleryImages: [
      '/images/projects/pos/01-dashboard.png',
      '/images/projects/pos/02-agricultural-accounts.png',
      '/images/projects/pos/03-sales-invoices.png',
      '/images/projects/pos/04-customers-ledger.png',
      '/images/projects/pos/05-suppliers-lots.png',
      '/images/projects/pos/06-packaging-deposits.png',
      '/images/projects/pos/07-daily-closing-safe.png',
      '/images/projects/pos/08-financial-reports.png',
      '/images/projects/pos/09-users-permissions.png',
      '/images/projects/pos/10-printed-invoice.png',
      '/images/projects/pos/11-desktop-windows-app.png',
      '/images/projects/pos/12-filled-invoice-sample.png',
    ],
    githubUrl: 'https://github.com/figo05-ai/Wholesale-Produce-ERP',
  },
];

export interface ProjectCategoryFilter {
  id: string;
  label: string;
}

export const ARCHIVE_CATEGORIES: ProjectCategoryFilter[] = [
  { id: 'all', label: 'All Projects' },
  { id: 'backend', label: 'Backend Systems' },
  { id: 'erp-pos', label: 'ERP / POS' },
  { id: 'ecommerce', label: 'E-Commerce & APIs' },
  { id: 'security', label: 'Security & Systems' },
  { id: 'learning', label: 'Learning Platforms' },
  { id: 'travel', label: 'Travel & Tourism' },
];

export const COMPACT_PROJECT_META: Record<string, CompactProjectMeta> = {
  'skillup-platform': {
    categoryLabel: 'FULL-STACK & WORKFORCE AUTOMATION',
    archiveCategory: 'backend',
    shortSummary:
      'Decoupled React 19 & Laravel 13 HRMS with automated monthly attendance and task reporting engines, replacing manual spreadsheets across distributed client companies.',
    primaryTechs: ['Laravel 13', 'React 19', 'MySQL 8'],
  },
  'smartpos-erp': {
    categoryLabel: 'MULTI-BRANCH ERP & HARDWARE TERMINAL',
    archiveCategory: 'erp-pos',
    shortSummary:
      'High-performance retail POS & ERP featuring hardware barcode/IMEI scanning, repair order diagnostics, cashier shift reconciliation, and cryptographic device pairing.',
    primaryTechs: ['Laravel 11/12', 'Filament v3', 'Livewire 3'],
  },
  'tanqia-skills': {
    categoryLabel: 'DEPARTMENTAL WORKFLOW & BATCH ARCHITECTURE',
    archiveCategory: 'backend',
    shortSummary:
      'Multi-tenant operations platform with an intelligent workload distributor that balances operational tasks across departmental teams with zero-timeout batch processing.',
    primaryTechs: ['Laravel 11/12', 'Job Batches', 'OpenSpout'],
  },
  'sip-and-snug': {
    categoryLabel: 'E-COMMERCE & ORDER FULFILLMENT PIPELINE',
    archiveCategory: 'ecommerce',
    shortSummary:
      'Full-stack cafe e-commerce system with dynamic add-on customizations, atomic checkout, zone-based delivery fees, and OpenAPI 3.0 API contracts.',
    primaryTechs: ['Laravel 11', 'Sanctum', 'OpenAPI 3.0'],
  },
  'academy-lms': {
    categoryLabel: 'CAD INTEGRATION & DESKTOP LICENSING',
    archiveCategory: 'learning',
    shortSummary:
      'Architectural learning platform integrated with desktop CAD plugin licensing (SketchUp & AutoCAD) via RFC 8628 device authorization.',
    primaryTechs: ['Laravel 13', 'CAD Licensing', 'RFC 8628'],
  },
  'clothes-ecommerce': {
    categoryLabel: 'APPAREL COMMERCE & FINANCIAL LEDGER',
    archiveCategory: 'ecommerce',
    shortSummary:
      'Multi-variant fashion e-commerce platform with pessimistic stock locks, customer digital wallet ledger, RMA returns, and Filament v3 backoffice.',
    primaryTechs: ['Laravel 11', 'Filament v3', 'Digital Wallet'],
  },
  'travel-worldwide': {
    categoryLabel: 'TRAVEL TECH & TOUR OPERATIONS',
    archiveCategory: 'travel',
    shortSummary:
      'International travel platform with curated destination packages, tour itinerary matrices, high-resolution galleries, and dynamic booking forms.',
    primaryTechs: ['Bootstrap 5', 'JavaScript', 'SCSS'],
  },
  'religious-tourism': {
    categoryLabel: 'HOSPITALITY & RELIGIOUS TOURISM',
    archiveCategory: 'travel',
    shortSummary:
      'Luxury Islamic pilgrimage portal for VIP Hajj & Umrah journeys with zero-FOUC bilingual Arabic/English switching and interactive booking configurator.',
    primaryTechs: ['JavaScript', 'Bilingual i18n', 'Bootstrap 5'],
  },
  'synapse-platform': {
    categoryLabel: 'FULL-STACK & AGENCY SYSTEMS',
    archiveCategory: 'backend',
    shortSummary:
      'Collaborative software agency platform combining a React 19/TypeScript SPA with a Laravel 11 REST API, team skill matrix, and Admin Studio.',
    primaryTechs: ['Laravel 11', 'React 19', 'TypeScript'],
  },
  'zodiak-portfolio': {
    categoryLabel: 'CYBERSECURITY & THREAT INTEL',
    archiveCategory: 'security',
    shortSummary:
      'Cybersecurity intelligence portal with Three.js 3D attack surface topology, sanitized writeups, and hardened Cloud Firestore rules.',
    primaryTechs: ['Cloud Firestore', 'Three.js', 'Firebase Auth'],
  },
  'wholesale-produce-pos': {
    categoryLabel: 'AGRICULTURAL ERP & DESKTOP POS',
    archiveCategory: 'erp-pos',
    shortSummary:
      'Domain-driven wholesale agricultural produce ERP and Flutter desktop client for auction sales, farmer advances, crates deposit ledger, and daily safe audits.',
    primaryTechs: ['Laravel 13', 'Flutter 3.47', 'MySQL 8 (DDD)'],
  },
};

export const BLOG_CATEGORIES: BlogCategoryFilter[] = [
  { id: 'all', label: 'All Articles' },
  { id: 'backend', label: 'Backend Architecture' },
  { id: 'database', label: 'Database Engineering' },
  { id: 'distributed', label: 'Distributed Systems' },
  { id: 'architecture', label: 'Software Architecture' },
  { id: 'tooling', label: 'Developer Tooling' },
  { id: 'principles', label: 'Engineering Principles' },
];

export const NOTES: NoteItem[] = [
  {
    slug: 'building-scalable-apis-with-laravel',
    title: 'Building Scalable APIs with Laravel',
    category: 'Backend Architecture',
    archiveCategory: 'backend',
    readTime: '8 min read',
    date: 'Apr 12, 2026',
    featured: true,
    tags: ['Laravel', 'RESTful APIs', 'OpenAPI 3.0', 'Redis', 'Idempotency'],
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
    archiveCategory: 'tooling',
    readTime: '6 min read',
    date: 'Mar 28, 2026',
    tags: ['Docker', 'PHPStan L8', 'Laravel Pulse', 'CI/CD Pipelines'],
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
    archiveCategory: 'principles',
    readTime: '7 min read',
    date: 'Feb 18, 2026',
    tags: ['Engineering Principles', 'Database Scaling', 'Fail Fast', 'Simplicity'],
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
    archiveCategory: 'database',
    readTime: '9 min read',
    date: 'Jan 24, 2026',
    tags: ['PostgreSQL', 'MySQL 8', 'EXPLAIN ANALYZE', 'B-Tree Indexes', 'Covering Indexes'],
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
    archiveCategory: 'distributed',
    readTime: '8 min read',
    date: 'Jan 10, 2026',
    tags: ['Horizon Queues', 'Redis Locks', 'Dead-Letter Queues', 'Exponential Backoff'],
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
    archiveCategory: 'architecture',
    readTime: '7 min read',
    date: 'Dec 18, 2025',
    tags: ['Clean Architecture', 'DTOs', 'Service Layer', 'Interface Contracts'],
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
    archiveCategory: 'architecture',
    readTime: '9 min read',
    date: 'Nov 30, 2025',
    tags: ['System Design', 'Caching Hierarchy', 'Read/Write Replicas', 'Modular Monolith'],
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
