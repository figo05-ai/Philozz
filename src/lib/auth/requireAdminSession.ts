import 'server-only';

/**
 * PHILOZZ CMS — Server Boundary Route Protection Helper
 * Phase 16B: Secure Admin Authentication
 *
 * Enforces admin authorization at server component and route boundaries.
 * Fails closed. If session is missing or invalid, redirects to /admin/login.
 * If user is authenticated but lacks admin privileges, redirects to /admin/unauthorized.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminSession, AdminUser } from './session';
import { AUTH_COOKIE_NAME } from './config';

/**
 * Requires a verified admin session for Server Components.
 * Redirects if unauthorized. Returns the authenticated AdminUser if verified.
 */
export async function requireAdminSession(): Promise<AdminUser> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  const result = await verifyAdminSession(sessionCookie);

  if (!result.authenticated || !result.user) {
    if (
      result.reason === 'non_admin' ||
      result.reason === 'unauthorized_uid' ||
      result.reason === 'unauthorized_email' ||
      result.reason === 'unauthorized_owner' ||
      result.reason === 'missing_owner_uid_config'
    ) {
      redirect('/admin/unauthorized');
    }
    redirect('/admin/login');
  }

  return result.user;
}

/**
 * Optional session check helper that does not redirect.
 * Useful for login page to check if already authenticated, or for conditional UI.
 */
export async function getAdminSession(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const result = await verifyAdminSession(sessionCookie);
    return result.authenticated && result.user ? result.user : null;
  } catch {
    return null;
  }
}

/**
 * Asserts a verified admin owner session for Server Actions and API mutations.
 * Throws a strict Error if unauthenticated or unauthorized.
 */
export async function assertAdminSession(explicitCookie?: string): Promise<AdminUser> {
  let cookieVal = explicitCookie;
  if (cookieVal === undefined) {
    const cookieStore = await cookies();
    cookieVal = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  }
  const result = await verifyAdminSession(cookieVal);
  if (!result.authenticated || !result.user) {
    throw new Error(`Unauthorized: Owner session verification failed (${result.reason || 'unknown'}).`);
  }
  return result.user;
}

