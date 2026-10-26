/**
 * PHILOZZ CMS — Authentication & Firebase Configuration
 * Phase 16B: Secure Admin Authentication
 */

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface FirebaseServerConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  ownerEmail?: string;
  ownerUid?: string;
  sessionCookieName: string;
  sessionExpiryDays: number;
  siteUrl: string;
}

/**
 * Reads Firebase Client configuration from environment variables.
 */
export function getFirebaseClientConfig(): FirebaseClientConfig | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (!apiKey || !projectId) {
    return null;
  }

  return {
    apiKey,
    authDomain: authDomain || `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: storageBucket || `${projectId}.appspot.com`,
    messagingSenderId: messagingSenderId || '',
    appId: appId || '',
  };
}

/**
 * Checks if client Firebase is fully configured.
 */
export function isFirebaseClientConfigured(): boolean {
  return getFirebaseClientConfig() !== null;
}

/**
 * Reads Firebase Admin (server-only) configuration.
 */
export function getFirebaseServerConfig(): FirebaseServerConfig | null {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  // Handle escaped newlines in environment variable
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  const sessionExpiryDays = parseInt(process.env.SESSION_EXPIRY_DAYS || '5', 10);
  const validExpiry = isNaN(sessionExpiryDays) || sessionExpiryDays < 1 || sessionExpiryDays > 14
    ? 5
    : sessionExpiryDays;

  return {
    projectId,
    clientEmail,
    privateKey,
    ownerEmail: process.env.ADMIN_OWNER_EMAIL,
    ownerUid: process.env.ADMIN_OWNER_UID,
    sessionCookieName: process.env.SESSION_COOKIE_NAME || '__session',
    sessionExpiryDays: validExpiry,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://philozz.com',
  };
}

/**
 * Checks if server Firebase Admin is fully configured.
 */
export function isFirebaseServerConfigured(): boolean {
  return getFirebaseServerConfig() !== null;
}

export const AUTH_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || '__session';
export const DEFAULT_SESSION_EXPIRY_MS = 5 * 24 * 60 * 60 * 1000; // 5 days
