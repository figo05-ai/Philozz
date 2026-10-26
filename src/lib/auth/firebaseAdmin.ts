import 'server-only';

/**
 * PHILOZZ CMS — Firebase Admin SDK Module
 * Phase 16B: Secure Admin Authentication
 *
 * Scope: Server-only. The Firebase Admin SDK must never enter the browser bundle.
 * Handles server-side ID token verification, session-cookie creation,
 * session-cookie verification, and custom admin claim verification.
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getFirebaseServerConfig } from './config';

let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;

export function getFirebaseAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  const config = getFirebaseServerConfig();
  if (!config) {
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      adminApp = initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'philozz',
      });
      return adminApp;
    }

    throw new Error(
      'Firebase Admin SDK is not configured. Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY.'
    );
  }

  adminApp = initializeApp({
    projectId: config.projectId,
    credential: cert({
      projectId: config.projectId,
      clientEmail: config.clientEmail,
      privateKey: config.privateKey,
    }),
  });

  return adminApp;
}

export function getFirebaseAdminAuth(): Auth {
  if (adminAuth) {
    return adminAuth;
  }

  const app = getFirebaseAdminApp();
  adminAuth = getAuth(app);
  return adminAuth;
}

export function getFirebaseFirestore(): Firestore {
  if (adminDb) {
    return adminDb;
  }

  const app = getFirebaseAdminApp();
  adminDb = getFirestore(app);
  return adminDb;
}

