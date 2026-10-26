/**
 * PHILOZZ CMS — Session Creation Route Handler
 * POST /api/auth/session
 * Phase 16B: Secure Admin Authentication
 *
 * Receives fresh Firebase ID token, validates CSRF origin, verifies token and
 * admin custom claims, creates Firebase session cookie, and returns httpOnly cookie.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminSession } from '@/lib/auth/session';
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

  // 2. Parse & Validate Payload
  let body: { idToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON request payload.' },
      { status: 400 }
    );
  }

  const { idToken } = body;
  if (!idToken || typeof idToken !== 'string') {
    return NextResponse.json(
      { success: false, error: 'Missing idToken field in request payload.' },
      { status: 400 }
    );
  }

  // 3. Create Admin Session Cookie
  const sessionResult = await createAdminSession(idToken);

  if (!sessionResult.success || !sessionResult.sessionCookie) {
    const status = sessionResult.error?.includes('missing verified admin') ? 403 : 401;
    return NextResponse.json(
      { success: false, error: sessionResult.error || 'Session creation failed.' },
      { status }
    );
  }

  // 4. Set Secure Session Cookie
  const isProd = process.env.NODE_ENV === 'production';
  const response = NextResponse.json(
    {
      success: true,
      user: sessionResult.user,
    },
    { status: 200 }
  );

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: sessionResult.sessionCookie,
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor((sessionResult.expiresInMs || 5 * 24 * 60 * 60 * 1000) / 1000),
  });

  // Explicitly prevent response caching
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');

  return response;
}
