/**
 * PHILOZZ CMS — Owner Admin Claim Provisioning Script
 * Phase 16B: Secure Admin Authentication
 *
 * Usage:
 *   npx tsx scripts/set-admin-claim.ts <owner-email-or-uid>
 *
 * Example:
 *   npx tsx scripts/set-admin-claim.ts felopater455@gmail.com
 *
 * Security Rationale:
 * Admin rights can NEVER be granted by a client-side request or auto-promotion.
 * The owner MUST explicitly run this server-side provisioning script using the
 * trusted Firebase Admin SDK credentials.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

// Native env loader without external dependencies
function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

loadEnvFile(path.resolve(process.cwd(), '.env.local'));
loadEnvFile(path.resolve(process.cwd(), '.env'));

async function provisionOwnerAdminClaim() {
  const targetUserIdentifier = process.argv[2];

  if (!targetUserIdentifier) {
    console.error('\n[ERROR] Missing required argument.');
    console.log('Usage: npx tsx scripts/set-admin-claim.ts <owner-email-or-uid>');
    console.log('Example: npx tsx scripts/set-admin-claim.ts felopater455@gmail.com\n');
    process.exit(1);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error('\n[ERROR] Missing Firebase Admin credentials in environment.');
    console.log('Please ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set.');
    console.log('Refer to .env.example for configuration details.\n');
    process.exit(1);
  }

  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  const adminAuth = getAuth();
  console.log(`\nLooking up Firebase user for identifier: "${targetUserIdentifier}"...`);

  let targetUser;
  if (targetUserIdentifier.includes('@')) {
    targetUser = await adminAuth.getUserByEmail(targetUserIdentifier);
  } else {
    targetUser = await adminAuth.getUser(targetUserIdentifier);
  }

  console.log(`Found user: ${targetUser.email || 'N/A'} (UID: ${targetUser.uid})`);
  console.log('Current custom claims:', targetUser.customClaims || 'None');

  const configuredOwnerUid = process.env.ADMIN_OWNER_UID?.trim();
  const configuredOwnerEmail = process.env.ADMIN_OWNER_EMAIL?.trim();

  // Strict UID verification if ADMIN_OWNER_UID is already set in environment
  if (configuredOwnerUid && targetUser.uid !== configuredOwnerUid) {
    console.error(
      `\n[SECURITY REJECTION] Target UID (${targetUser.uid}) does not match configured ADMIN_OWNER_UID (${configuredOwnerUid}).`
    );
    console.error('Refusing to set admin claim to prevent privilege misassignment.');
    process.exit(1);
  }

  // Strict email verification if ADMIN_OWNER_EMAIL is configured
  if (configuredOwnerEmail && targetUser.email && targetUser.email.toLowerCase() !== configuredOwnerEmail.toLowerCase()) {
    console.error(
      `\n[SECURITY REJECTION] Target email (${targetUser.email}) does not match configured ADMIN_OWNER_EMAIL (${configuredOwnerEmail}).`
    );
    process.exit(1);
  }

  // Set the admin claim while strictly preserving any existing custom claims
  await adminAuth.setCustomUserClaims(targetUser.uid, {
    ...targetUser.customClaims,
    admin: true,
  });

  // Verify the updated user record from Firebase
  const updatedUser = await adminAuth.getUser(targetUser.uid);
  console.log('\n[SUCCESS] Successfully provisioned admin claim!');
  console.log('Updated custom claims:', updatedUser.customClaims);

  if (!configuredOwnerUid) {
    console.log('\n======================================================');
    console.log('  CRITICAL ACTION REQUIRED IN YOUR .env.local:');
    console.log(`  ADMIN_OWNER_UID="${targetUser.uid}"`);
    console.log('======================================================');
    console.log('PHILOZZ requires BOTH custom claim "admin: true" and exact');
    console.log('ADMIN_OWNER_UID matching. Ensure this UID is saved in .env.local.\n');
  } else {
    console.log(`\nVerified: User UID matches configured ADMIN_OWNER_UID (${configuredOwnerUid}).`);
    console.log(`The owner (${targetUser.email || targetUser.uid}) can now sign in at /admin/login.`);
  }

  console.log('Note: If the user is currently signed in on a browser, sign out and sign back in to refresh token claims.\n');
}

provisionOwnerAdminClaim().catch((err) => {
  console.error('\n[FAILED] Error provisioning admin claim:', err.message || err);
  process.exit(1);
});
