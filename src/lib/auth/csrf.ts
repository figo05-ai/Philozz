import 'server-only';

/**
 * PHILOZZ CMS — CSRF & Origin Protection Module
 * Phase 16B: Secure Admin Authentication
 *
 * Validates request Origin and Referer headers on state-mutating endpoints
 * (session creation, logout, and future admin mutations).
 */

import { NextRequest } from 'next/server';

export interface CsrfValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates request origin against allowed hostnames to prevent Cross-Site Request Forgery.
 */
export function validateCsrfOrigin(request: NextRequest): CsrfValidationResult {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // If both origin and referer are missing on a POST request, reject
  if (!origin && !referer) {
    return {
      valid: false,
      error: 'Missing origin and referer headers. Request rejected for security.',
    };
  }

  const hostHeader = request.headers.get('host') || request.nextUrl.host;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const allowedOrigins: string[] = [];

  if (siteUrl) {
    try {
      allowedOrigins.push(new URL(siteUrl).origin);
    } catch {
      // Invalid URL ignored
    }
  }

  // Always allow request's own host
  if (hostHeader) {
    allowedOrigins.push(`http://${hostHeader}`);
    allowedOrigins.push(`https://${hostHeader}`);
  }

  // In development, permit localhost and 127.0.0.1
  const isDev = process.env.NODE_ENV !== 'production';

  const checkUrl = (urlStr: string): boolean => {
    try {
      const parsed = new URL(urlStr);
      if (allowedOrigins.includes(parsed.origin)) {
        return true;
      }
      if (isDev && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  if (origin && !checkUrl(origin)) {
    return {
      valid: false,
      error: `Invalid request origin "${origin}". CSRF validation failed.`,
    };
  }

  if (referer && !checkUrl(referer)) {
    return {
      valid: false,
      error: `Invalid request referer "${referer}". CSRF validation failed.`,
    };
  }

  return { valid: true };
}
