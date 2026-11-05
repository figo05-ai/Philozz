import './register-server-only.cjs';
import fs from 'fs';
import path from 'path';
import { getFirebaseFirestore } from '../src/lib/auth/firebaseAdmin';
import { MigrationTransformer } from '../src/cms/migration/migrationTransformer';
import { FIRESTORE_COLLECTIONS, FIRESTORE_SINGLETON_DOCS } from '../src/cms/repositories/firestore/firestoreContracts';

export interface DiffReport {
  timestamp: string;
  summary: {
    toCreate: number;
    toUpdate: number;
    unchanged: number;
    preservedUntouched: number;
    totalAfterMigration: number;
  };
  collections: Record<string, {
    create: string[];
    update: string[];
    unchanged: string[];
    preservedUntouched: string[];
  }>;
}

export async function computeDryRunDiff(): Promise<DiffReport> {
  const db = getFirebaseFirestore();
  const bundle = await MigrationTransformer.generateMigrationBundle();

  const report: DiffReport = {
    timestamp: new Date().toISOString(),
    summary: {
      toCreate: 0,
      toUpdate: 0,
      unchanged: 0,
      preservedUntouched: 0,
      totalAfterMigration: 0,
    },
    collections: {},
  };

  const collectionsToCheck: Array<{
    name: string;
    items: Array<{ id: string; data: Record<string, unknown> }>;
  }> = [
    {
      name: FIRESTORE_COLLECTIONS.PROJECTS,
      items: bundle.collections.projects.map((p) => ({ id: p.slug, data: p as unknown as Record<string, unknown> })),
    },
    {
      name: FIRESTORE_COLLECTIONS.ARTICLES,
      items: bundle.collections.articles.map((a) => ({ id: a.slug, data: a as unknown as Record<string, unknown> })),
    },
    {
      name: FIRESTORE_COLLECTIONS.CATEGORIES,
      items: bundle.collections.categories.map((c) => ({ id: c.id, data: c as unknown as Record<string, unknown> })),
    },
    {
      name: FIRESTORE_COLLECTIONS.TECHNOLOGIES,
      items: bundle.collections.technologies.map((t) => ({ id: t.id, data: t as unknown as Record<string, unknown> })),
    },
    {
      name: FIRESTORE_COLLECTIONS.EXPERTISE_AREAS,
      items: bundle.collections.expertiseAreas.map((e) => ({ id: e.id, data: e as unknown as Record<string, unknown> })),
    },
    {
      name: FIRESTORE_COLLECTIONS.MEDIA,
      items: bundle.collections.mediaAssets.map((m) => ({ id: m.id, data: m as unknown as Record<string, unknown> })),
    },
    {
      name: FIRESTORE_COLLECTIONS.SITE_CONFIG,
      items: [
        { id: FIRESTORE_SINGLETON_DOCS.BRAND_INFO, data: bundle.collections.brandInfo as unknown as Record<string, unknown> },
        { id: FIRESTORE_SINGLETON_DOCS.HOMEPAGE_CONFIG, data: bundle.collections.homepageConfig as unknown as Record<string, unknown> },
        { id: FIRESTORE_SINGLETON_DOCS.STACK_DETAILS, data: bundle.collections.stackDetails as unknown as Record<string, unknown> },
        { id: FIRESTORE_SINGLETON_DOCS.ORBIT_SLOTS, data: { slotTechnologyIds: bundle.collections.orbitSlots } },
        { id: FIRESTORE_SINGLETON_DOCS.SEO_CONFIG, data: bundle.collections.seoConfig as unknown as Record<string, unknown> },
      ],
    },
  ];

  for (const col of collectionsToCheck) {
    const colSnap = await db.collection(col.name).get();
    const existingDocs = new Map(colSnap.docs.map((d) => [d.id, d.data()]));
    const plannedDocIds = new Set(col.items.map((i) => i.id));

    const colDiff = {
      create: [] as string[],
      update: [] as string[],
      unchanged: [] as string[],
      preservedUntouched: [] as string[],
    };

    for (const item of col.items) {
      if (!existingDocs.has(item.id)) {
        colDiff.create.push(item.id);
      } else {
        const existing = existingDocs.get(item.id);
        const isDiff = Object.keys(item.data).some((k) => {
          // ignore auto-generated timestamps if content is identical
          if (k === 'updatedAt' || k === 'createdAt') return false;
          return JSON.stringify(item.data[k]) !== JSON.stringify(existing?.[k]);
        });
        if (isDiff) {
          colDiff.update.push(item.id);
        } else {
          colDiff.unchanged.push(item.id);
        }
      }
    }

    // Check existing docs in Firestore that are NOT in planned items (e.g. live ImageKit media)
    for (const existingId of existingDocs.keys()) {
      if (!plannedDocIds.has(existingId)) {
        colDiff.preservedUntouched.push(existingId);
      }
    }

    report.collections[col.name] = colDiff;
    report.summary.toCreate += colDiff.create.length;
    report.summary.toUpdate += colDiff.update.length;
    report.summary.unchanged += colDiff.unchanged.length;
    report.summary.preservedUntouched += colDiff.preservedUntouched.length;
  }

  report.summary.totalAfterMigration =
    report.summary.toCreate + report.summary.toUpdate + report.summary.unchanged + report.summary.preservedUntouched;

  const outPath = path.resolve(process.cwd(), 'verification/migration-diff-report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf-8');

  console.log('--- FIRESTORE DRY-RUN DIFF REPORT ---');
  console.log(`Documents to CREATE:             ${report.summary.toCreate}`);
  console.log(`Documents to UPDATE:             ${report.summary.toUpdate}`);
  console.log(`Documents UNCHANGED:             ${report.summary.unchanged}`);
  console.log(`Live Docs PRESERVED UNTOUCHED:   ${report.summary.preservedUntouched}`);
  console.log(`TOTAL FIRESTORE DOCS AFTER:      ${report.summary.totalAfterMigration}`);
  console.log('\nBreakdown by Collection:');
  for (const [colName, diff] of Object.entries(report.collections)) {
    console.log(`  [${colName}] Create: ${diff.create.length}, Update: ${diff.update.length}, Unchanged: ${diff.unchanged.length}, Preserved: ${diff.preservedUntouched.length}`);
    if (diff.create.length > 0) console.log(`      -> Creates: ${diff.create.join(', ')}`);
    if (diff.preservedUntouched.length > 0) console.log(`      -> Preserved: ${diff.preservedUntouched.join(', ')}`);
  }

  return report;
}

computeDryRunDiff().catch(console.error);
