import { NextRequest, NextResponse } from 'next/server';

/**
 * PHILOZZ CMS — Lightweight Proxy Routing Handler
 * Phase 16B: Secure Admin Authentication
 *
 * Implements modern Next.js 16 proxy routing convention.
 * Performs safe, lightweight early routing checks and prevents caching on admin routes.
 *
 * NOTE: Cryptographic session verification and admin authorization are strictly
 * enforced at protected server component boundaries via requireAdminSession().
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only handle admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const sessionCookieName = process.env.SESSION_COOKIE_NAME || '__session';
  const hasSessionCookie = Boolean(request.cookies.get(sessionCookieName)?.value);

  // Early redirect for unauthenticated visitors attempting to reach protected /admin
  const isPublicAdminRoute = pathname === '/admin/login' || pathname === '/admin/unauthorized';

  if (!hasSessionCookie && !isPublicAdminRoute) {
    const loginUrl = new URL('/admin/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    return response;
  }

  // Prevent caching and search engine indexing on all admin routes
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');

  return response;
}
