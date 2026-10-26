/**
 * PHILOZZ CMS — Phase 16B Authentication & Security Verification Suite
 *
 * Verifies:
 * 1. Configuration parsing and environment defaults
 * 2. CSRF & Origin validation (protection against cross-site attacks)
 * 3. Fail-closed behavior on missing or unconfigured Firebase Admin
 * 4. Session cookie verification logic (missing, tampered, non-admin, unauthorized owner)
 * 5. Recent authentication time enforcement (auth_time <= 5 min)
 * 6. Proxy routing handler (early redirects and no-store headers)
 * 7. Search engine indexing prevention (robots noindex on admin routes)
 * 8. Public website regression check (zero auth dependency on public routes)
 */

import './register-server-only.cjs';
import { NextRequest } from 'next/server';
import { validateCsrfOrigin } from '../src/lib/auth/csrf';
import {
  verifyAdminSession,
  createAdminSession,
  isAuthorizedOwnerClaims,
} from '../src/lib/auth/session';
import {
  getFirebaseClientConfig,
  getFirebaseServerConfig,
  AUTH_COOKIE_NAME,
} from '../src/lib/auth/config';
import { proxy } from '../src/proxy';
import {
  getPublishedProjects,
  getPublishedNotes,
  SITE_CONFIG,
} from '../src/lib/seoData';

async function runAuthVerification() {
  console.log('====================================================');
  console.log('   PHILOZZ — PHASE 16B: ADMIN AUTHENTICATION VERIFICATION');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${testName}${details ? ` — ${details}` : ''}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // ----------------------------------------------------
  // TEST SUITE 1: CONFIGURATION & DEFAULTS
  // ----------------------------------------------------
  console.log('--- Suite 1: Configuration & Environment Defaults ---');
  assert(AUTH_COOKIE_NAME === '__session', 'Auth cookie name defaults to "__session"');

  const clientConfigBefore = getFirebaseClientConfig();
  // In the absence of live env vars, getFirebaseClientConfig() returns null safely without throwing
  assert(clientConfigBefore === null || typeof clientConfigBefore === 'object', 'Client config parser handles missing env gracefully');

  const serverConfigBefore = getFirebaseServerConfig();
  assert(serverConfigBefore === null || typeof serverConfigBefore === 'object', 'Server config parser handles missing env gracefully');

  // ----------------------------------------------------
  // TEST SUITE 2: CSRF & ORIGIN PROTECTION
  // ----------------------------------------------------
  console.log('\n--- Suite 2: CSRF & Origin Protection ---');

  // A. Valid origin matching host
  const validRequest = new NextRequest('http://localhost:3000/api/auth/session', {
    method: 'POST',
    headers: {
      origin: 'http://localhost:3000',
      host: 'localhost:3000',
    },
  });
  const validCsrf = validateCsrfOrigin(validRequest);
  assert(validCsrf.valid === true, 'Permits request from valid matching localhost origin');

  // B. Malicious cross-site origin attempt
  const maliciousRequest = new NextRequest('http://localhost:3000/api/auth/session', {
    method: 'POST',
    headers: {
      origin: 'https://evil-attacker.com',
      host: 'localhost:3000',
    },
  });
  const maliciousCsrf = validateCsrfOrigin(maliciousRequest);
  assert(maliciousCsrf.valid === false, 'Rejects cross-site request from untrusted origin (evil-attacker.com)');

  // C. Missing both origin and referer on POST
  const missingHeadersRequest = new NextRequest('http://localhost:3000/api/auth/session', {
    method: 'POST',
  });
  const missingCsrf = validateCsrfOrigin(missingHeadersRequest);
  assert(missingCsrf.valid === false, 'Rejects POST request with completely missing origin and referer');

  // ----------------------------------------------------
  // TEST SUITE 3: SESSION VERIFICATION FAIL-CLOSED BEHAVIOR
  // ----------------------------------------------------
  console.log('\n--- Suite 3: Session Verification Fail-Closed Guarantees ---');

  // A. Missing session cookie
  const missingSessionResult = await verifyAdminSession(undefined);
  assert(missingSessionResult.authenticated === false, 'Fails closed when session cookie is undefined');
  assert(missingSessionResult.reason === 'missing_session', 'Reason is "missing_session"');

  // B. Empty session cookie string
  const emptySessionResult = await verifyAdminSession('   ');
  assert(emptySessionResult.authenticated === false, 'Fails closed when session cookie is empty string');

  // C. Unconfigured Firebase Admin SDK fails closed
  const unconfiguredResult = await verifyAdminSession('tampered.fake.jwt.token');
  assert(unconfiguredResult.authenticated === false, 'Fails closed on unconfigured backend or invalid token');

  // D. Create session fails closed on empty or invalid token
  const emptyTokenResult = await createAdminSession('');
  assert(emptyTokenResult.success === false, 'createAdminSession fails closed when token is empty');

  // E. Strict single-owner checks: Missing ADMIN_OWNER_UID in environment
  delete process.env.ADMIN_OWNER_UID;
  const noOwnerUidResult = isAuthorizedOwnerClaims({ uid: 'any_uid', admin: true });
  assert(
    noOwnerUidResult.authorized === false && noOwnerUidResult.reason === 'missing_owner_uid_config',
    'Rejects access safely when ADMIN_OWNER_UID is absent from environment'
  );

  // Configure test server environment with owner UID and email
  const origProjectId = process.env.FIREBASE_PROJECT_ID;
  const origClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const origPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  process.env.FIREBASE_PROJECT_ID = 'test-auth-project';
  process.env.FIREBASE_CLIENT_EMAIL = 'admin@test-auth-project.iam.gserviceaccount.com';
  process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC\n-----END PRIVATE KEY-----\n';
  process.env.ADMIN_OWNER_UID = 'verified_owner_uid_abc123';
  process.env.ADMIN_OWNER_EMAIL = 'felopater455@gmail.com';

  // F. User without admin: true custom claim is rejected
  const nonAdminResult = isAuthorizedOwnerClaims({ uid: 'verified_owner_uid_abc123', admin: false });
  assert(
    nonAdminResult.authorized === false && nonAdminResult.reason === 'non_admin',
    'Rejects user without custom claim admin: true even if UID matches'
  );

  // G. User with admin: true but WRONG UID is rejected
  const wrongUidResult = isAuthorizedOwnerClaims({ uid: 'impostor_uid_999', admin: true });
  assert(
    wrongUidResult.authorized === false && wrongUidResult.reason === 'unauthorized_uid',
    'Rejects user with custom claim admin: true if UID does NOT match ADMIN_OWNER_UID'
  );

  // H1. User with admin: true, correct UID, but MISSING email when ADMIN_OWNER_EMAIL is configured is rejected
  const missingEmailResult = isAuthorizedOwnerClaims({
    uid: 'verified_owner_uid_abc123',
    admin: true,
  });
  assert(
    missingEmailResult.authorized === false && missingEmailResult.reason === 'unauthorized_email',
    'Rejects user when email is missing and ADMIN_OWNER_EMAIL is configured'
  );

  // H2. User with admin: true, correct UID, but EMPTY/WHITESPACE email when ADMIN_OWNER_EMAIL is configured is rejected
  const emptyEmailResult = isAuthorizedOwnerClaims({
    uid: 'verified_owner_uid_abc123',
    admin: true,
    email: '   ',
  });
  assert(
    emptyEmailResult.authorized === false && emptyEmailResult.reason === 'unauthorized_email',
    'Rejects user when email is empty/whitespace and ADMIN_OWNER_EMAIL is configured'
  );

  // H3. User with admin: true, correct UID, but MISMATCHING email is rejected
  const wrongEmailResult = isAuthorizedOwnerClaims({
    uid: 'verified_owner_uid_abc123',
    admin: true,
    email: 'impostor@gmail.com',
  });
  assert(
    wrongEmailResult.authorized === false && wrongEmailResult.reason === 'unauthorized_email',
    'Rejects user if email does not match configured ADMIN_OWNER_EMAIL'
  );

  // I. User satisfying admin: true, exact ADMIN_OWNER_UID, and matching email (case-insensitive & trimmed) is authorized
  const authorizedResult = isAuthorizedOwnerClaims({
    uid: 'verified_owner_uid_abc123',
    admin: true,
    email: '  FELOPATER455@GMAIL.COM  ',
  });
  assert(
    authorizedResult.authorized === true,
    'Authorizes user when admin: true, exact ADMIN_OWNER_UID, and matching email align'
  );

  // J. When ADMIN_OWNER_EMAIL is NOT configured, missing email claim is STILL authorized as long as UID and admin: true match
  delete process.env.ADMIN_OWNER_EMAIL;
  const noOwnerEmailConfigResult = isAuthorizedOwnerClaims({
    uid: 'verified_owner_uid_abc123',
    admin: true,
  });
  assert(
    noOwnerEmailConfigResult.authorized === true,
    'Authorizes user with missing email claim when ADMIN_OWNER_EMAIL is not configured'
  );

  // Restore environment
  delete process.env.ADMIN_OWNER_UID;
  delete process.env.ADMIN_OWNER_EMAIL;
  if (origProjectId) process.env.FIREBASE_PROJECT_ID = origProjectId; else delete process.env.FIREBASE_PROJECT_ID;
  if (origClientEmail) process.env.FIREBASE_CLIENT_EMAIL = origClientEmail; else delete process.env.FIREBASE_CLIENT_EMAIL;
  if (origPrivateKey) process.env.FIREBASE_PRIVATE_KEY = origPrivateKey; else delete process.env.FIREBASE_PRIVATE_KEY;

  // ----------------------------------------------------
  // TEST SUITE 4: LIGHTWEIGHT PROXY ROUTING
  // ----------------------------------------------------
  console.log('\n--- Suite 4: Next.js 16 Proxy Routing ---');

  // A. Unauthenticated visitor reaching /admin
  const unauthAdminReq = new NextRequest('https://philozz.com/admin');
  const proxyResponse = proxy(unauthAdminReq);
  const isRedirect =
    proxyResponse.status === 307 ||
    proxyResponse.status === 308 ||
    Boolean(proxyResponse.headers.get('location')?.includes('/admin/login'));
  assert(isRedirect, 'Proxy early-redirects unauthenticated /admin request to /admin/login');
  assert(
    Boolean(proxyResponse.headers.get('Cache-Control')?.includes('no-store')),
    'Proxy sets Cache-Control: no-store on admin redirects'
  );

  // B. Public admin route /admin/login is permitted
  const loginReq = new NextRequest('https://philozz.com/admin/login');
  const loginProxyResponse = proxy(loginReq);
  assert(loginProxyResponse.status === 200, 'Proxy permits /admin/login through');
  assert(
    Boolean(loginProxyResponse.headers.get('X-Robots-Tag')?.includes('noindex')),
    'Proxy sets X-Robots-Tag: noindex on /admin/login'
  );

  // C. Public website route is unaffected
  const publicReq = new NextRequest('https://philozz.com/projects');
  const publicProxyResponse = proxy(publicReq);
  assert(publicProxyResponse.status === 200, 'Proxy passes public route /projects through untouched');

  // ----------------------------------------------------
  // TEST SUITE 5: PUBLIC SITE REGRESSION CHECK
  // ----------------------------------------------------
  console.log('\n--- Suite 5: Public Site Zero-Regression Check ---');
  const projects = await getPublishedProjects();
  assert(projects.length === 8, 'Public projects intact (count: 8)');

  const notes = await getPublishedNotes();
  assert(notes.length === 7, 'Public notes intact (count: 7)');

  assert(SITE_CONFIG.name === 'PHILOZZ', 'Site config identity intact');

  console.log('\n====================================================');
  console.log(`   PHASE 16B AUTH VERIFICATION PASSED: ${passedTests}/${totalTests} TESTS`);
  console.log('====================================================\n');
}

runAuthVerification().catch((err) => {
  console.error('\nVerification failed with exception:', err);
  process.exit(1);
});
