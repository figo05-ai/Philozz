/**
 * PHILOZZ CMS — Session Revocation & Logout Route Handler
 * POST /api/auth/logout
 * Phase 16B: Secure Admin Authentication
 *
 * Clears the session cookie, optionally revokes server refresh tokens,
 * and confirms logout with no-store headers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { revokeAdminSession } from '@/lib/auth/session';
import { validateCsrfOrigin } from '@/lib/auth/csrf';
import { AUTH_COOKIE_NAME } from '@/lib/auth/config';

export async function POST(request: NextRequest) {
  // 1. CSRF Origin / Referer Validation
  const csrfResult = validateCsrfOrigin(request);
  if (!csrfResult.valid) {
    return NextResponse.json(
      { success: false, error: csrfResult.error || 'CSRF validation failed.' },
      { status: 403 }
    );
  }

  // 2. Read existing session cookie to revoke in Firebase
  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (sessionCookie) {
    // Revoke refresh tokens asynchronously (best effort)
    try {
      await revokeAdminSession(sessionCookie);
    } catch {
      // Ignore failure on revocation to ensure cookie clearance proceeds
    }
  }

  // 3. Clear Session Cookie
  const isProd = process.env.NODE_ENV === 'production';
  const response = NextResponse.json(
    { success: true, message: 'Successfully signed out.' },
    { status: 200 }
  );

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  // Explicitly prevent response caching
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

  return response;
}
