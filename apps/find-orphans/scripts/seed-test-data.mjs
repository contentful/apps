import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import contentfulManagement from 'contentful-management';

/**
 * Seeds a Contentful environment with test data for the Find Orphans app, so
 * the scan can be exercised against a space with a large number of drafts.
 *
 * Usage:
 *   npm run seed-test-data              # create the data
 *   npm run seed-test-data:cleanup      # remove everything the script created
 *
 * Configuration comes from .env.seed (see .env.seed.example), with .env as a
 * fallback for the access token. The token must be a CMA token with write
 * access to the target space — use a dedicated test space; the script creates
 * its own content type and never touches existing content, but the cleanup
 * mode deletes by tag, so keep the tag id out of real content.
 *
 * Everything created here is tagged `seedTestData`, which is what makes
 * cleanup safe and exact: cleanup deletes only tagged entries and assets,
 * then removes the seed content type and the tag itself.
 *
 * What gets created, per knob (all counts are env vars, see .env.seed.example):
 *
 * - SEED_UNTITLED_DRAFTS   drafts with no title -> found by the "untitled"
 *                          criterion. A SEED_EDITED_FRACTION of them get a
 *                          second save so the never-edited filter has both
 *                          version-1 and edited items to distinguish.
 * - SEED_TITLED_DRAFTS     drafts with a title and no inbound links -> found
 *                          by the "unreferenced" criterion only. Same edited
 *                          fraction applies.
 * - SEED_REFERENCED_DRAFTS titled drafts that published "container" entries
 *                          link to -> excluded by the unreferenced criterion,
 *                          proving the links_to_entry check works.
 * - SEED_PUBLISHED_ENTRIES published entries -> excluded from every scan.
 *                          This knob exists to answer "does total space size
 *                          matter?": the draft queries filter server-side, so
 *                          published volume adds zero API calls to the scan,
 *                          but it does grow the corpus the links_to_entry /
 *                          links_to_asset searches run over, and it counts
 *                          toward the plan's record limit.
 * - SEED_DRAFT_ASSETS      untitled draft assets with no inbound links ->
 *                          found by both criteria when asset scanning is on.
 * - SEED_REFERENCED_ASSETS untitled draft assets that containers link to ->
 *                          excluded by the unreferenced criterion.
 *
 * Rate limits: the CMA allows ~7 requests/second per space, and the SDK
 * retries 429s automatically, so the only cost of big numbers is wall-clock
 * time. Rough budget: one request per draft, two per published entry (create
 * + publish), plus one container per 25 referenced items. 5,000 drafts is
 * therefore ~12 minutes.
 */

// ---------------------------------------------------------------------------
// Environment loading. Values are read from .env.seed first, then .env, and
// real environment variables always win — the same precedence dotenv uses,
// implemented inline to avoid adding a dependency for two small files.
// ---------------------------------------------------------------------------

const loadEnvFile = (path) => {
  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch {
    return; // Missing files are fine; vars can come from the other file or the shell.
  }
  for (const line of text.split('\n')) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  }
};

const scriptDir = new URL('.', import.meta.url).pathname;
loadEnvFile(resolve(scriptDir, '..', '.env.seed'));
loadEnvFile(resolve(scriptDir, '..', '.env'));

const requireEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing environment variable ${name} — see .env.seed.example`);
    process.exit(1);
  }
  return value;
};

const intEnv = (name, fallback) => {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    console.error(`${name} must be a non-negative integer, got "${raw}"`);
    process.exit(1);
  }
  return parsed;
};

const ACCESS_TOKEN = requireEnv('CONTENTFUL_ACCESS_TOKEN');
const SPACE_ID = requireEnv('CONTENTFUL_SPACE_ID');
const ENVIRONMENT_ID = process.env.CONTENTFUL_ENVIRONMENT_ID || 'master';

const COUNTS = {
  untitledDrafts: intEnv('SEED_UNTITLED_DRAFTS', 200),
  titledDrafts: intEnv('SEED_TITLED_DRAFTS', 100),
  referencedDrafts: intEnv('SEED_REFERENCED_DRAFTS', 25),
  publishedEntries: intEnv('SEED_PUBLISHED_ENTRIES', 0),
  draftAssets: intEnv('SEED_DRAFT_ASSETS', 50),
  referencedAssets: intEnv('SEED_REFERENCED_ASSETS', 10),
};
// Fraction of untitled/titled drafts that receive a second save, so the
// scan's never-edited filter (sys.version === 1) has both kinds to show.
const EDITED_FRACTION = Number.parseFloat(process.env.SEED_EDITED_FRACTION ?? '0.25');
// Capped at the CMA rate limit of 7 req/s per space, same reasoning as the
// app's batchSize parameter — beyond that the SDK just burns requests
// retrying 429s.
const CONCURRENCY = Math.min(7, Math.max(1, intEnv('SEED_CONCURRENCY', 5)));

/** Everything the script creates carries this tag; cleanup deletes by it. */
const TAG_ID = 'seedTestData';
const CONTENT_TYPE_ID = 'seedOrphanTest';
/** Links per published container entry that references drafts/assets. */
const LINKS_PER_CONTAINER = 25;
/** Page size for cleanup queries (the CMA collection maximum is 1000). */
const CLEANUP_PAGE_LIMIT = 100;

const cma = contentfulManagement.createClient(
  { accessToken: ACCESS_TOKEN },
  { type: 'plain', defaults: { spaceId: SPACE_ID, environmentId: ENVIRONMENT_ID } }
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Runs `worker(index)` for indexes 0..count-1 with at most `concurrency` in
 * flight, mirroring how the app itself batches CMA calls. Failures are
 * collected instead of aborting the pool so one flaky request does not strand
 * a half-seeded space with no report of what happened.
 */
const runPool = async (count, worker, label) => {
  let next = 0;
  let done = 0;
  const errors = [];
  const runners = Array.from({ length: Math.min(CONCURRENCY, count) }, async () => {
    while (next < count) {
      const index = next++;
      try {
        await worker(index);
      } catch (error) {
        errors.push(error);
      }
      done += 1;
      if (done % 50 === 0) console.log(`  ${label}: ${done}/${count}`);
    }
  });
  await Promise.all(runners);
  if (errors.length > 0) {
    console.error(`  ${label}: ${errors.length} of ${count} failed; first error:`);
    console.error(`  ${errors[0].message ?? errors[0]}`);
  }
  return count - errors.length;
};

const tagLink = { sys: { type: 'Link', linkType: 'Tag', id: TAG_ID } };
const entryLink = (id) => ({ sys: { type: 'Link', linkType: 'Entry', id } });
const assetLink = (id) => ({ sys: { type: 'Link', linkType: 'Asset', id } });

const chunk = (items, size) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
};

const isNotFound = (error) => {
  // The SDK throws with the HTTP status on error.response or, for some call
  // paths, a JSON message body containing the status — check both shapes.
  if (error?.response?.status === 404) return true;
  try {
    return JSON.parse(error.message).status === 404;
  } catch {
    return false;
  }
};

// ---------------------------------------------------------------------------
// Shared setup: default locale, tag, and the seed content type
// ---------------------------------------------------------------------------

const getDefaultLocale = async () => {
  const locales = await cma.locale.getMany({ query: { limit: 100 } });
  return locales.items.find((locale) => locale.default).code;
};

const ensureTag = async () => {
  try {
    await cma.tag.get({ tagId: TAG_ID });
  } catch (error) {
    if (!isNotFound(error)) throw error;
    await cma.tag.createWithId(
      { tagId: TAG_ID },
      { name: 'Seed test data', sys: { visibility: 'private' } }
    );
  }
};

const ensureContentType = async () => {
  let contentType;
  try {
    contentType = await cma.contentType.get({ contentTypeId: CONTENT_TYPE_ID });
  } catch (error) {
    if (!isNotFound(error)) throw error;
    contentType = await cma.contentType.createWithId(
      { contentTypeId: CONTENT_TYPE_ID },
      {
        name: 'Seed Orphan Test',
        description: 'Created by scripts/seed-test-data.mjs. Safe to delete via its cleanup mode.',
        // A Symbol display field is what makes the type scannable by the
        // untitled criterion (see getTextDisplayFieldId in orphanFinder.ts).
        displayField: 'title',
        fields: [
          { id: 'title', name: 'Title', type: 'Symbol', required: false, localized: false },
          { id: 'body', name: 'Body', type: 'Text', required: false, localized: false },
          {
            id: 'relatedEntries',
            name: 'Related entries',
            type: 'Array',
            required: false,
            localized: false,
            items: { type: 'Link', linkType: 'Entry', validations: [] },
          },
          {
            id: 'relatedAssets',
            name: 'Related assets',
            type: 'Array',
            required: false,
            localized: false,
            items: { type: 'Link', linkType: 'Asset', validations: [] },
          },
        ],
      }
    );
  }
  // Entries cannot be created against an unpublished (or never-published)
  // content type, so activate it whether it was just created or left behind
  // unactivated by an interrupted earlier run.
  if (!contentType.sys.publishedVersion) {
    await cma.contentType.publish({ contentTypeId: CONTENT_TYPE_ID }, contentType);
  }
};

// ---------------------------------------------------------------------------
// Seeding
// ---------------------------------------------------------------------------

const seed = async () => {
  const locale = await getDefaultLocale();
  await ensureTag();
  await ensureContentType();

  const editedUntitled = Math.round(COUNTS.untitledDrafts * EDITED_FRACTION);
  const editedTitled = Math.round(COUNTS.titledDrafts * EDITED_FRACTION);
  const containerCount =
    Math.ceil(COUNTS.referencedDrafts / LINKS_PER_CONTAINER) +
    Math.ceil(COUNTS.referencedAssets / LINKS_PER_CONTAINER);
  // One request per create, one extra per edit, one extra per publish; used
  // only for the upfront time estimate, not for control flow.
  const requestEstimate =
    COUNTS.untitledDrafts +
    editedUntitled +
    COUNTS.titledDrafts +
    editedTitled +
    COUNTS.referencedDrafts +
    COUNTS.publishedEntries * 2 +
    COUNTS.draftAssets +
    COUNTS.referencedAssets +
    containerCount * 2;
  console.log(`Seeding space ${SPACE_ID} / environment ${ENVIRONMENT_ID} (locale ${locale})`);
  // Concurrency doubles as the requests-per-second estimate: each in-flight
  // slot completes roughly one request per second at typical CMA latency.
  console.log(
    `~${requestEstimate} CMA requests at ~${CONCURRENCY}/s: expect roughly ${Math.ceil(
      requestEstimate / CONCURRENCY / 60
    )} minute(s)\n`
  );

  const createEntry = (fields) =>
    cma.entry.create(
      { contentTypeId: CONTENT_TYPE_ID },
      { fields, metadata: { tags: [tagLink] } }
    );

  /** Second save: bumps sys.version past 1 so the item reads as "edited". */
  const editEntry = async (entry, locale) => {
    entry.fields.body = { [locale]: `${entry.fields.body?.[locale] ?? ''} (edited)` };
    await cma.entry.update({ entryId: entry.sys.id }, entry);
  };

  // Untitled drafts: body only, no title. The first editedUntitled of them
  // get a second save; the rest stay at version 1 (never edited).
  // Created counts are tracked right after each create succeeds, NOT from
  // runPool's success count: a failed follow-up (edit, publish) still leaves
  // a scannable draft in the environment, and the final summary must reflect
  // what actually exists rather than what completed flawlessly.
  console.log(`Creating ${COUNTS.untitledDrafts} untitled drafts (${editedUntitled} edited)...`);
  let untitledCreated = 0;
  await runPool(
    COUNTS.untitledDrafts,
    async (i) => {
      const entry = await createEntry({ body: { [locale]: `Untitled seed draft #${i + 1}` } });
      untitledCreated += 1;
      if (i < editedUntitled) await editEntry(entry, locale);
    },
    'untitled drafts'
  );

  console.log(`Creating ${COUNTS.titledDrafts} titled unreferenced drafts (${editedTitled} edited)...`);
  let titledCreated = 0;
  await runPool(
    COUNTS.titledDrafts,
    async (i) => {
      const entry = await createEntry({
        title: { [locale]: `Seed draft ${i + 1}` },
        body: { [locale]: `Titled seed draft #${i + 1}, nothing links here.` },
      });
      titledCreated += 1;
      if (i < editedTitled) await editEntry(entry, locale);
    },
    'titled drafts'
  );

  // Referenced drafts and assets are created first, then published container
  // entries link to them. Containers are published so the scans themselves
  // never surface them — only the drafts they point at matter.
  console.log(`Creating ${COUNTS.referencedDrafts} referenced drafts...`);
  const referencedEntryIds = [];
  await runPool(
    COUNTS.referencedDrafts,
    async (i) => {
      const entry = await createEntry({
        title: { [locale]: `Referenced seed draft ${i + 1}` },
      });
      referencedEntryIds.push(entry.sys.id);
    },
    'referenced drafts'
  );

  console.log(`Creating ${COUNTS.draftAssets} untitled draft assets...`);
  // The asset worker is a single create, so runPool's success count IS the
  // created count here — no follow-up request can fail after the create.
  const draftAssetsCreated = await runPool(
    COUNTS.draftAssets,
    // Description only — no title, no file. A fileless draft asset is exactly
    // the abandoned-upload shape the untitled asset scan is meant to catch.
    (i) =>
      cma.asset.create(
        {},
        {
          fields: { description: { [locale]: `Untitled seed asset #${i + 1}` } },
          metadata: { tags: [tagLink] },
        }
      ),
    'draft assets'
  );

  console.log(`Creating ${COUNTS.referencedAssets} referenced draft assets...`);
  const referencedAssetIds = [];
  await runPool(
    COUNTS.referencedAssets,
    async (i) => {
      const asset = await cma.asset.create(
        {},
        {
          fields: { description: { [locale]: `Referenced seed asset #${i + 1}` } },
          metadata: { tags: [tagLink] },
        }
      );
      referencedAssetIds.push(asset.sys.id);
    },
    'referenced assets'
  );

  const containers = [
    ...chunk(referencedEntryIds, LINKS_PER_CONTAINER).map((ids) => ({
      kind: 'entry',
      ids,
      fields: { relatedEntries: ids.map(entryLink) },
    })),
    ...chunk(referencedAssetIds, LINKS_PER_CONTAINER).map((ids) => ({
      kind: 'asset',
      ids,
      fields: { relatedAssets: ids.map(assetLink) },
    })),
  ];
  // Ids whose container entry was at least created. The app's unreferenced
  // scan counts links from drafts too (links_to_entry / links_to_asset have
  // no publish filter), so a created-but-unpublished container still makes
  // its targets referenced — only a failed CREATE leaves them unreferenced.
  const referencedIdCount = { entry: 0, asset: 0 };
  // Containers created but not published are themselves titled unreferenced
  // drafts, so they show up on the unreferenced tab (+1 entry each).
  let draftContainers = 0;
  if (containers.length > 0) {
    console.log(`Creating and publishing ${containers.length} container entries...`);
    await runPool(
      containers.length,
      async (i) => {
        const { kind, ids, fields } = containers[i];
        const entry = await createEntry({
          title: { [locale]: `Seed container ${i + 1}` },
          ...fields,
        });
        referencedIdCount[kind] += ids.length;
        try {
          await cma.entry.publish({ entryId: entry.sys.id }, entry);
        } catch (error) {
          draftContainers += 1;
          throw error; // Still counts as a failure in runPool's report.
        }
      },
      'containers'
    );
  }

  // Filler that was created but failed to publish is a titled unreferenced
  // draft, same as a stalled container.
  let draftFiller = 0;
  if (COUNTS.publishedEntries > 0) {
    console.log(`Creating and publishing ${COUNTS.publishedEntries} filler entries...`);
    await runPool(
      COUNTS.publishedEntries,
      async (i) => {
        const entry = await createEntry({
          title: { [locale]: `Published seed entry ${i + 1}` },
          body: { [locale]: 'Published filler to grow the total record count.' },
        });
        try {
          await cma.entry.publish({ entryId: entry.sys.id }, entry);
        } catch (error) {
          draftFiller += 1;
          throw error;
        }
      },
      'published entries'
    );
  }

  // The summary is computed from what was actually created, not the
  // configured counts, so partial failures never print misleading numbers.
  // Assets never have a title here, so both asset groups count as untitled
  // regardless of whether their container exists.
  const untitledAssets = draftAssetsCreated + referencedAssetIds.length;
  const unreferencedEntries =
    untitledCreated +
    titledCreated +
    (referencedEntryIds.length - referencedIdCount.entry) +
    draftContainers +
    draftFiller;
  const unreferencedAssets =
    draftAssetsCreated + (referencedAssetIds.length - referencedIdCount.asset);

  const asPlanned =
    untitledCreated === COUNTS.untitledDrafts &&
    titledCreated === COUNTS.titledDrafts &&
    referencedEntryIds.length === COUNTS.referencedDrafts &&
    draftAssetsCreated === COUNTS.draftAssets &&
    referencedAssetIds.length === COUNTS.referencedAssets &&
    referencedIdCount.entry === referencedEntryIds.length &&
    referencedIdCount.asset === referencedAssetIds.length &&
    draftContainers === 0 &&
    draftFiller === 0;
  console.log('\nDone.');
  if (!asPlanned) {
    console.warn(
      'Warning: some creates failed, so the numbers below reflect what actually exists,'
    );
    console.warn('not the configured counts. Re-run after cleanup for exact planned counts.');
    const strandedIds =
      referencedEntryIds.length -
      referencedIdCount.entry +
      (referencedAssetIds.length - referencedIdCount.asset);
    if (strandedIds > 0) {
      console.warn(
        `  ${strandedIds} "referenced" item(s) have no container linking to them and are` +
          ' counted as unreferenced below — the links_to_entry/links_to_asset exclusion is' +
          ' not fully exercised by this run.'
      );
    }
  }
  console.log('Expected scan results in this environment:');
  console.log(`  untitled criterion:     ${untitledCreated} entries + ${untitledAssets} assets`);
  console.log(
    `  unreferenced criterion: ${unreferencedEntries} entries + ${unreferencedAssets} assets`
  );
  console.log(`Remove everything with: npm run seed-test-data:cleanup`);
};

// ---------------------------------------------------------------------------
// Cleanup: delete everything tagged, then the content type and tag
// ---------------------------------------------------------------------------

const cleanup = async () => {
  console.log(`Cleaning seed data from space ${SPACE_ID} / environment ${ENVIRONMENT_ID}...`);

  // Deleting shrinks the collection under the query, so always fetch page 0
  // and loop until the tagged set is empty rather than advancing a skip.
  const deleteAllTagged = async (collection, label) => {
    let removed = 0;
    while (true) {
      const page = await collection.getMany({
        query: { 'metadata.tags.sys.id[in]': TAG_ID, limit: CLEANUP_PAGE_LIMIT },
      });
      if (page.items.length === 0) break;
      const succeeded = await runPool(
        page.items.length,
        async (i) => {
          const item = page.items[i];
          const params = label === 'entries' ? { entryId: item.sys.id } : { assetId: item.sys.id };
          if (item.sys.publishedVersion) await collection.unpublish(params);
          await collection.delete(params);
        },
        label
      );
      // The loop refetches page 0 until the tagged set is empty; if nothing
      // in a page could be deleted, refetching would spin on the same items
      // forever, so stop and leave the error report above as the outcome.
      if (succeeded === 0) break;
      removed += succeeded;
    }
    console.log(`  deleted ${removed} ${label}`);
  };

  await deleteAllTagged(cma.entry, 'entries');
  await deleteAllTagged(cma.asset, 'assets');

  try {
    const contentType = await cma.contentType.get({ contentTypeId: CONTENT_TYPE_ID });
    if (contentType.sys.publishedVersion) {
      await cma.contentType.unpublish({ contentTypeId: CONTENT_TYPE_ID });
    }
    await cma.contentType.delete({ contentTypeId: CONTENT_TYPE_ID });
    console.log(`  deleted content type ${CONTENT_TYPE_ID}`);
  } catch (error) {
    if (!isNotFound(error)) throw error;
  }

  try {
    const tag = await cma.tag.get({ tagId: TAG_ID });
    await cma.tag.delete({ tagId: TAG_ID, version: tag.sys.version });
    console.log(`  deleted tag ${TAG_ID}`);
  } catch (error) {
    if (!isNotFound(error)) throw error;
  }

  console.log('Cleanup complete.');
};

if (process.argv.includes('--cleanup')) {
  await cleanup();
} else {
  await seed();
}
