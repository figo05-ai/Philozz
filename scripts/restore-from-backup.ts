/**
 * PHILOZZ CMS — Firestore Content Restore Engine
 * Phase 16F: Content Migration & Disaster Recovery
 *
 * Restores Firestore CMS collections from the verified migration-backup.json.
 * 
 * Safety Guarantees:
 * 1. Default mode is DRY RUN.
 * 2. Requires --execute and RESTORE_AUTHORIZED="true" to perform live batch writes.
 * 3. Never deletes unmanaged media (e.g. ImageKit uploads).
 */

import './register-server-only.cjs';
import fs from 'fs';
import path from 'path';
import { getFirebaseFirestore } from '../src/lib/auth/firebaseAdmin';
import { FIRESTORE_COLLECTIONS, FIRESTORE_SINGLETON_DOCS } from '../src/cms/repositories/firestore/firestoreContracts';
import { MigrationSeedBundle } from '../src/cms/migration/migrationTransformer';

export async function restoreFromBackup(mode: 'dry-run' | 'execute' = 'dry-run') {
  console.log('====================================================');
  console.log(`   PHILOZZ CMS — RESTORE FROM BACKUP (${mode.toUpperCase()})`);
  console.log('====================================================');

  const backupFilePath = path.resolve(process.cwd(), 'verification/migration-backup.json');
  if (!fs.existsSync(backupFilePath)) {
    throw new Error(`Backup file not found at: ${backupFilePath}`);
  }

  const raw = fs.readFileSync(backupFilePath, 'utf-8');
  const bundle: MigrationSeedBundle = JSON.parse(raw);

  console.log(`Loaded backup bundle version: ${bundle.version}, exportedAt: ${bundle.exportedAt}`);
  console.log(`Backup counts: Projects: ${bundle.counts.projects}, Articles: ${bundle.counts.articles}, Singletons: 5`);

  if (mode === 'dry-run') {
    console.log('\n[DRY RUN] Verified backup file is valid and readable.');
    console.log('To execute real restore, pass --execute with RESTORE_AUTHORIZED="true".');
    return;
  }

  if (mode === 'execute') {
    if (process.env.RESTORE_AUTHORIZED !== 'true') {
      throw new Error('SAFETY ABORT: Real restore requires RESTORE_AUTHORIZED="true" environment variable.');
    }

    const db = getFirebaseFirestore();
    const batch = db.batch();

    // 1. Projects
    for (const project of bundle.collections.projects) {
      const docRef = db.collection(FIRESTORE_COLLECTIONS.PROJECTS).doc(project.slug);
      batch.set(docRef, project, { merge: true });
    }

    // 2. Articles
    for (const article of bundle.collections.articles) {
      const docRef = db.collection(FIRESTORE_COLLECTIONS.ARTICLES).doc(article.slug);
      batch.set(docRef, article, { merge: true });
    }

    // 3. Categories
    for (const cat of bundle.collections.categories) {
      const docRef = db.collection(FIRESTORE_COLLECTIONS.CATEGORIES).doc(cat.id);
      batch.set(docRef, cat, { merge: true });
    }

    // 4. Technologies
    for (const tech of bundle.collections.technologies) {
      const docRef = db.collection(FIRESTORE_COLLECTIONS.TECHNOLOGIES).doc(tech.id);
      batch.set(docRef, tech, { merge: true });
    }

    // 5. Expertise areas
    for (const area of bundle.collections.expertiseAreas) {
      const docRef = db.collection(FIRESTORE_COLLECTIONS.EXPERTISE_AREAS).doc(area.id);
      batch.set(docRef, area, { merge: true });
    }

    // 6. Media assets (merge only, preserves any additional live assets)
    for (const media of bundle.collections.mediaAssets) {
      const docRef = db.collection(FIRESTORE_COLLECTIONS.MEDIA).doc(media.id);
      batch.set(docRef, media, { merge: true });
    }

    // 7. Singletons
    const brandRef = db.collection(FIRESTORE_COLLECTIONS.SITE_CONFIG).doc(FIRESTORE_SINGLETON_DOCS.BRAND_INFO);
    batch.set(brandRef, bundle.collections.brandInfo, { merge: true });

    const homepageRef = db.collection(FIRESTORE_COLLECTIONS.SITE_CONFIG).doc(FIRESTORE_SINGLETON_DOCS.HOMEPAGE_CONFIG);
    batch.set(homepageRef, bundle.collections.homepageConfig, { merge: true });

    const stackRef = db.collection(FIRESTORE_COLLECTIONS.SITE_CONFIG).doc(FIRESTORE_SINGLETON_DOCS.STACK_DETAILS);
    batch.set(stackRef, bundle.collections.stackDetails, { merge: true });

    const orbitRef = db.collection(FIRESTORE_COLLECTIONS.SITE_CONFIG).doc(FIRESTORE_SINGLETON_DOCS.ORBIT_SLOTS);
    batch.set(orbitRef, { slotTechnologyIds: bundle.collections.orbitSlots, updatedAt: new Date().toISOString() }, { merge: true });

    const seoRef = db.collection(FIRESTORE_COLLECTIONS.SITE_CONFIG).doc(FIRESTORE_SINGLETON_DOCS.SEO_CONFIG);
    batch.set(seoRef, bundle.collections.seoConfig, { merge: true });

    await batch.commit();
    console.log('\n[SUCCESS] Restore batch committed successfully to Firestore.');
  }
}

if (require.main === module || process.argv[1]?.includes('restore-from-backup')) {
  const isExec = process.argv.includes('--execute');
  restoreFromBackup(isExec ? 'execute' : 'dry-run').catch((err) => {
    console.error('Restore execution failed:', err);
    process.exit(1);
  });
}
