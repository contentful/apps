import contentfulManagement from 'contentful-management';

/**
 * Upserts the app definition's installation parameter definitions via the
 * CMA, so they never have to be maintained by hand in the web UI.
 *
 * Usage:
 *   CONTENTFUL_ACCESS_TOKEN=... CONTENTFUL_ORG_ID=... CONTENTFUL_APP_DEF_ID=... \
 *     npm run update-app-parameters
 *
 * The token must have access to the organization that owns the app
 * definition (a personal CMA token of an org member with app permissions
 * works). This REPLACES the installation parameter list wholesale — it is
 * the single source of truth, so keep it in sync with
 * `AppInstallationParameters` in src/parameters.ts and the README table.
 */
const INSTALLATION_PARAMETERS = [
  {
    id: 'maxCandidates',
    name: 'Maximum entries per scan',
    description:
      'The scan stops after this many draft entries and assets, to stay friendly to API rate limits.',
    type: 'Number',
    required: true,
    default: 500,
  },
  {
    id: 'batchSize',
    name: 'Concurrent API requests',
    description:
      'How many CMA requests run at once while scanning and archiving. Must be between 1 and 7, the CMA rate limit per second.',
    type: 'Number',
    required: true,
    default: 5,
  },
];

const { CONTENTFUL_ACCESS_TOKEN, CONTENTFUL_ORG_ID, CONTENTFUL_APP_DEF_ID } = process.env;

const missing = [
  ['CONTENTFUL_ACCESS_TOKEN', CONTENTFUL_ACCESS_TOKEN],
  ['CONTENTFUL_ORG_ID', CONTENTFUL_ORG_ID],
  ['CONTENTFUL_APP_DEF_ID', CONTENTFUL_APP_DEF_ID],
].filter(([, value]) => !value);

if (missing.length > 0) {
  console.error(`Missing environment variables: ${missing.map(([name]) => name).join(', ')}`);
  console.error(
    'Find the org and app definition ids in the Contentful web app under Organization settings > Apps.'
  );
  process.exit(1);
}

const client = contentfulManagement.createClient(
  { accessToken: CONTENTFUL_ACCESS_TOKEN },
  { type: 'plain' }
);

const scope = { organizationId: CONTENTFUL_ORG_ID, appDefinitionId: CONTENTFUL_APP_DEF_ID };
const definition = await client.appDefinition.get(scope);

const before = (definition.parameters?.installation ?? []).map((parameter) => parameter.id);

// Replace only the installation parameters; instance parameters and every
// other definition field (name, locations, bundle) pass through untouched.
// The fetched definition carries sys.version, which the CMA uses for
// optimistic locking on the update.
const updated = await client.appDefinition.update(scope, {
  ...definition,
  parameters: { ...definition.parameters, installation: INSTALLATION_PARAMETERS },
});

console.log(`Updated app definition "${updated.name}" (${updated.sys.id})`);
console.log(`  before: ${before.length > 0 ? before.join(', ') : '(none)'}`);
console.log(
  `  after:  ${(updated.parameters?.installation ?? []).map((parameter) => parameter.id).join(', ')}`
);
