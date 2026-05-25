// Generate APPLE_CLIENT_SECRET (a JWT signed with .p8 key)
// Run: node scripts/apple-secret.mjs
//
// Required env vars:
//   APPLE_TEAM_ID       - 10-char Team ID from Apple Developer membership
//   APPLE_KEY_ID        - 10-char Key ID from the .p8 file
//   APPLE_CLIENT_ID     - Services ID (e.g. com.kcal.tracker.signin)
//   APPLE_PRIVATE_KEY   - The .p8 file contents, with \n preserved
//
// Outputs the JWT to stdout. Add to .env.local:
//   APPLE_CLIENT_SECRET=<the printed JWT>
//
// Token is valid for 6 months (Apple max). Regenerate before expiry.

import { config } from 'dotenv';
import { SignJWT, importPKCS8 } from 'jose';

config({ path: '.env.local' });

const TEAM_ID = process.env.APPLE_TEAM_ID;
const KEY_ID = process.env.APPLE_KEY_ID;
const CLIENT_ID = process.env.APPLE_CLIENT_ID;
const PRIVATE_KEY = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!TEAM_ID || !KEY_ID || !CLIENT_ID || !PRIVATE_KEY) {
  console.error('Brak wymaganych zmiennych. Ustaw: APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_CLIENT_ID, APPLE_PRIVATE_KEY');
  process.exit(1);
}

const SIX_MONTHS = 60 * 60 * 24 * 180;
const now = Math.floor(Date.now() / 1000);

const key = await importPKCS8(PRIVATE_KEY, 'ES256');
const jwt = await new SignJWT({})
  .setProtectedHeader({ alg: 'ES256', kid: KEY_ID })
  .setIssuer(TEAM_ID)
  .setSubject(CLIENT_ID)
  .setAudience('https://appleid.apple.com')
  .setIssuedAt(now)
  .setExpirationTime(now + SIX_MONTHS)
  .sign(key);

console.log(jwt);
