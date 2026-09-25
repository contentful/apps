import 'dotenv/config';
import { createClient } from 'contentful-management';

const {
  CONTENTFUL_ACCESS_TOKEN,
  CONTENTFUL_SPACE_ID,
  CONTENTFUL_ENVIRONMENT_ID = 'master',
  CONTENTFUL_APP_DEF_ID,
} = process.env;
if (!CONTENTFUL_ACCESS_TOKEN || !CONTENTFUL_SPACE_ID || !CONTENTFUL_APP_DEF_ID) {
  console.error('Set CONTENTFUL_ACCESS_TOKEN, CONTENTFUL_SPACE_ID, CONTENTFUL_APP_DEF_ID in .env');
  process.exit(1);
}
const [startDate = '2026-01-01', endDate = '2026-12-31'] = process.argv.slice(2);
const client = createClient({ accessToken: CONTENTFUL_ACCESS_TOKEN }, { type: 'plain' });
const env = { spaceId: CONTENTFUL_SPACE_ID, environmentId: CONTENTFUL_ENVIRONMENT_ID };

const actions = await client.appAction.getManyForEnvironment(env);
const action = actions.items.find(
  (a) => a.name === 'listAuditLogFiles' && a.sys.appDefinition.sys.id === CONTENTFUL_APP_DEF_ID,
);
if (!action) {
  console.error('App action "listAuditLogFiles" not found — run npm run configure-app first');
  process.exit(1);
}
const call = await client.appActionCall.createWithResult(
  { ...env, appDefinitionId: CONTENTFUL_APP_DEF_ID, appActionId: action.sys.id, retries: 15 },
  { parameters: { startDate, endDate } },
);
if (call.sys.status !== 'succeeded') {
  console.error(JSON.stringify(call.sys, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(call.sys.result, null, 2));
