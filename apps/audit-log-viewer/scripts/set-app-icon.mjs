import 'dotenv/config';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createClient } from 'contentful-management';

// Sets the app definition's icon (shown in the Apps list) from assets/logo.png.
// The AppDetails API requires a data URI — raw base64 is rejected with
// "Icon is not in base64 format". A ~100px PNG keeps the payload small.
const { CONTENTFUL_ACCESS_TOKEN, CONTENTFUL_ORG_ID, CONTENTFUL_APP_DEF_ID } = process.env;
if (!CONTENTFUL_ACCESS_TOKEN || !CONTENTFUL_ORG_ID || !CONTENTFUL_APP_DEF_ID) {
  console.error('Set CONTENTFUL_ACCESS_TOKEN, CONTENTFUL_ORG_ID, CONTENTFUL_APP_DEF_ID in .env');
  process.exit(1);
}

const small = '/tmp/audit-log-viewer-icon-100.png';
execFileSync('sips', ['-z', '100', '100', 'assets/logo.png', '--out', small], { stdio: 'ignore' });

const client = createClient({ accessToken: CONTENTFUL_ACCESS_TOKEN }, { type: 'plain' });
const details = await client.appDetails.upsert(
  { organizationId: CONTENTFUL_ORG_ID, appDefinitionId: CONTENTFUL_APP_DEF_ID },
  { icon: { value: `data:image/png;base64,${readFileSync(small).toString('base64')}`, type: 'base64' } },
);
console.log('✔ app icon set:', Boolean(details.icon));
