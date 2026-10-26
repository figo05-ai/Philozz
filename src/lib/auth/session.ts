import 'server-only';

/**
 * PHILOZZ CMS — Secure Server Session Management
 * Phase 16B.1: Live Firebase Activation & Owner Access Verification
 *
 * Implements strict single-owner authorization and Firebase Admin SDK session-cookie handling:
 * 1. Verify fresh ID token with revocation check.
 * 2. Confirm recent authentication time (within 5 minutes).
 * 3. Enforce BOTH:
 *    a. Valid custom claim: admin === true
 *    b. Exact Firebase UID matching mandatory ADMIN_OWNER_UID
 * 4. Create cryptographically signed Firebase session cookie.
 * 5. Verify incoming session cookies with revocation check on protected boundaries.
 */

import { getFirebaseAdminAuth } from './firebaseAdmin';
import { getFirebaseServerConfig, isFirebaseServerConfigured, DEFAULT_SESSION_EXPIRY_MS } from './config';

export interface AdminUser {
  uid: string;
  email?: string;
  admin: true;
}

export type OwnerAuthorizationRejectionReason =
  | 'missing_owner_uid_config'
  | 'non_admin'
  | 'unauthorized_uid'
  | 'unauthorized_email';

export interface OwnerAuthorizationResult {
  authorized: boolean;
  reason?: OwnerAuthorizationRejectionReason;
}

export interface SessionVerificationResult {
  authenticated: boolean;
  user?: AdminUser;
  reason?:
    | 'missing_session'
    | 'unconfigured_backend'
    | 'missing_owner_uid_config'
    | 'non_admin'
    | 'unauthorized_uid'
    | 'unauthorized_email'
    | 'unauthorized_owner'
    | 'invalid_or_revoked';
}

export interface CreateSessionResult {
  success: boolean;
  sessionCookie?: string;
  expiresInMs?: number;
  user?: AdminUser;
  error?: string;
}

/**
 * Reusable, authoritative check for strict single-owner administrative privileges:
 * 1. ADMIN_OWNER_UID is mandatory in server configuration (fails closed if missing).
 * 2. Custom claim admin === true must be present.
 * 3. Token UID must strictly match configured ADMIN_OWNER_UID.
 * 4. Token email must be nonempty and match ADMIN_OWNER_EMAIL (if ADMIN_OWNER_EMAIL is configured).
 */
export function isAuthorizedOwnerClaims(claims: {
  uid: string;
  admin?: unknown;
  email?: string;
}): OwnerAuthorizationResult {
  const config = getFirebaseServerConfig();

  // Mandatory ADMIN_OWNER_UID configuration check
  if (!config?.ownerUid || config.ownerUid.trim() === '') {
    return { authorized: false, reason: 'missing_owner_uid_config' };
  }

  // Mandatory custom claim admin: true
  if (claims.admin !== true) {
    return { authorized: false, reason: 'non_admin' };
  }

  // Mandatory exact UID matching check
  if (claims.uid !== config.ownerUid.trim()) {
    return { authorized: false, reason: 'unauthorized_uid' };
  }

  // Owner email verification (when ADMIN_OWNER_EMAIL is configured, require a nonempty matching email claim)
  if (config.ownerEmail && config.ownerEmail.trim() !== '') {
    if (!claims.email || claims.email.trim() === '') {
      return { authorized: false, reason: 'unauthorized_email' };
    }
    if (claims.email.trim().toLowerCase() !== config.ownerEmail.trim().toLowerCase()) {
      return { authorized: false, reason: 'unauthorized_email' };
    }
  }

  return { authorized: true };
}

/**
 * Creates an authorized Firebase session cookie from a freshly acquired client ID token.
 */
export async function createAdminSession(idToken: string): Promise<CreateSessionResult> {
  if (!idToken || typeof idToken !== 'string') {
    return { success: false, error: 'ID token is required.' };
  }

  if (!isFirebaseServerConfigured()) {
    return {
      success: false,
      error: 'Firebase Admin SDK is not configured on the server.',
    };
  }

  const config = getFirebaseServerConfig();
  if (!config) {
    return { success: false, error: 'Server configuration unavailable.' };
  }

  try {
    const adminAuth = getFirebaseAdminAuth();

    // 1. Verify ID token with checkRevoked = true
    const decodedToken = await adminAuth.verifyIdToken(idToken, true);

    // 2. Ensure authentication occurred recently (within 5 minutes)
    const nowSeconds = Math.floor(Date.now() / 1000);
    const authTime = decodedToken.auth_time;
    if (nowSeconds - authTime > 5 * 60) {
      return {
        success: false,
        error: 'Recent authentication is required. Please sign in again.',
      };
    }

    // 3. Enforce strict single-owner authorization (admin: true AND exact ADMIN_OWNER_UID match)
    const ownerCheck = isAuthorizedOwnerClaims(decodedToken);
    if (!ownerCheck.authorized) {
      let errorMessage = 'Access denied: unauthorized account.';
      if (ownerCheck.reason === 'missing_owner_uid_config') {
        errorMessage = 'Server configuration error: ADMIN_OWNER_UID is mandatory but not configured in environment.';
      } else if (ownerCheck.reason === 'non_admin') {
        errorMessage = 'Access denied: account is missing verified admin privileges (custom claim admin: true).';
      } else if (ownerCheck.reason === 'unauthorized_uid') {
        errorMessage = 'Access denied: account UID does not match the configured ADMIN_OWNER_UID.';
      } else if (ownerCheck.reason === 'unauthorized_email') {
        errorMessage = 'Access denied: account email does not match authorized owner email.';
      }
      return {
        success: false,
        error: errorMessage,
      };
    }

    // 4. Generate Firebase session cookie
    const expiresInMs = config.sessionExpiryDays * 24 * 60 * 60 * 1000 || DEFAULT_SESSION_EXPIRY_MS;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: expiresInMs });

    return {
      success: true,
      sessionCookie,
      expiresInMs,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        admin: true,
      },
    };
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    return {
      success: false,
      error: error.message || 'Failed to create session cookie.',
    };
  }
}

/**
 * Verifies an incoming session cookie against Firebase Admin SDK.
 * Fails closed if cookie is missing, expired, revoked, non-admin, or non-matching UID.
 */
export async function verifyAdminSession(sessionCookieString?: string): Promise<SessionVerificationResult> {
  if (!sessionCookieString || sessionCookieString.trim() === '') {
    return { authenticated: false, reason: 'missing_session' };
  }

  if (!isFirebaseServerConfigured()) {
    return { authenticated: false, reason: 'unconfigured_backend' };
  }

  const config = getFirebaseServerConfig();
  if (!config) {
    return { authenticated: false, reason: 'unconfigured_backend' };
  }

  try {
    const adminAuth = getFirebaseAdminAuth();

    // Verify session cookie with checkRevoked = true
    const claims = await adminAuth.verifySessionCookie(sessionCookieString, true);

    // Enforce strict single-owner authorization (admin: true AND exact ADMIN_OWNER_UID match)
    const ownerCheck = isAuthorizedOwnerClaims(claims);
    if (!ownerCheck.authorized) {
      return { authenticated: false, reason: ownerCheck.reason };
    }

    return {
      authenticated: true,
      user: {
        uid: claims.uid,
        email: claims.email,
        admin: true,
      },
    };
  } catch {
    // Fails closed on any error (expired, revoked, malformed, tampered)
    return { authenticated: false, reason: 'invalid_or_revoked' };
  }
}

/**
 * Revokes active sessions for the user identified by the session cookie.
 */
export async function revokeAdminSession(sessionCookieString?: string): Promise<boolean> {
  if (!sessionCookieString || !isFirebaseServerConfigured()) {
    return false;
  }

  try {
    const adminAuth = getFirebaseAdminAuth();
    // Decode without checking revocation to obtain UID
    const claims = await adminAuth.verifySessionCookie(sessionCookieString, false);
    if (claims.uid) {
      await adminAuth.revokeRefreshTokens(claims.uid);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
