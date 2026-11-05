export interface ProjectItem {
  slug: string;
  title: string;
  tagline: string;
  role: string;
  period: string;
  clientOrContext: string;
  category: string;
  technologies: string[];
  summary: string;
  challenge: string;
  responsibilities: string[];
  architectureSummary: string;
  architectureNodes: {
    name: string;
    description: string;
    tech: string;
  }[];
  technicalDecisions: {
    title: string;
    rationale: string;
  }[];
  demoVisualType:
    | 'task-flow'
    | 'license-matrix'
    | 'security-topology'
    | 'skillup-horizon'
    | 'smartpos-hardware'
    | 'tanqia-pipeline';
  lessonsLearned: string[];
  hasLiveDemo: boolean;
  demoUrl?: string;
  productionUrl?: string;
  githubUrl?: string;
  coverImageUrl?: string;
  thumbnailUrl?: string;
  galleryImages?: string[];
}

export interface CompactProjectMeta {
  shortSummary: string;
  primaryTechs: string[];
  categoryLabel: string;
  archiveCategory: string;
}

export interface NoteItem {
  slug: string;
  title: string;
  category: string;
  readTime: string;
  date: string;
  abstract: string;
  archiveCategory?: string;
  tags?: string[];
  featured?: boolean;
  sections: {
    heading: string;
    content: string;
    codeSnippet?: string;
    codeLang?: string;
  }[];
}

export interface BlogCategoryFilter {
  id: string;
  label: string;
}

export interface ExpertiseArea {
  id: string;
  name: string;
  level: string;
  description: string;
  coreConcepts: string[];
}

export interface SystemNodeSpec {
  id: string;
  label: string;
  category: 'gateway' | 'queue' | 'cache' | 'database' | 'worker';
  position: [number, number, number];
  color: string;
  description: string;
}
