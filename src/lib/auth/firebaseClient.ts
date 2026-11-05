/**
 * PHILOZZ CMS — Firebase Client SDK Module
 * Phase 16B: Secure Admin Authentication
 *
 * Scope: Client-only. Initializes the Firebase Client SDK for email/password sign-in.
 * Once the ID token is obtained, it is exchanged for a server session cookie
 * and the client-side session is cleared immediately.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  Auth,
} from 'firebase/auth';
import { getFirebaseClientConfig } from './config';

let clientApp: FirebaseApp | null = null;
let clientAuth: Auth | null = null;

export function getClientAuth(): Auth {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Client Auth cannot be accessed during server-side execution.');
  }

  if (clientAuth) {
    return clientAuth;
  }

  const config = getFirebaseClientConfig();
  if (!config) {
    throw new Error(
      'Firebase client is not configured. Please supply NEXT_PUBLIC_FIREBASE_* environment variables.'
    );
  }

  clientApp = getApps().length > 0 ? getApp() : initializeApp(config);
  clientAuth = getAuth(clientApp);
  return clientAuth;
}

export interface SignInResult {
  success: boolean;
  idToken?: string;
  error?: string;
}

/**
 * Signs in the owner via Firebase email/password and returns a fresh ID token.
 * Immediately signs out of client-side Firebase Auth to avoid persistent tokens in IndexedDB/localStorage.
 */
export async function signInOwner(email: string, password: string): Promise<SignInResult> {
  try {
    const auth = getClientAuth();
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const idToken = await credential.user.getIdToken(true);

    // Clear client-side temporary auth state immediately
    await signOut(auth);

    return {
      success: true,
      idToken,
    };
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    let safeMessage = 'Authentication failed. Please check your credentials.';

    // Generic error responses preventing user enumeration
    if (
      error.code === 'auth/invalid-credential' ||
      error.code === 'auth/user-not-found' ||
      error.code === 'auth/wrong-password' ||
      error.code === 'auth/invalid-email'
    ) {
      safeMessage = 'Invalid email or password.';
    } else if (error.code === 'auth/too-many-requests') {
      safeMessage = 'Too many failed login attempts. Please try again later.';
    } else if (error.message?.includes('not configured')) {
      safeMessage = error.message;
    }

    return {
      success: false,
      error: safeMessage,
    };
  }
}
