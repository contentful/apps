import { AssetProps, ContentTypeProps, EntryProps, QueryOptions } from 'contentful-management';
import {
  CmaClient,
  OrphanKind,
  OrphanResult,
  ScanCriterion,
  ScanOutcome,
  ScanProgress,
} from '../types';
import {
  CONTENT_TYPE_PAGE_LIMIT,
  PAGE_LIMIT,
  TEXT_FIELD_TYPES,
  USER_PAGE_LIMIT,
} from './constants';

/**
 * Scan settings. The limits and the untouched filter come from installation
 * parameters (see src/parameters.ts); the criterion and the two scope flags
 * are a per-run choice made on the page.
 */
export interface ScanOptions {
  /** What "orphan" means for this scan: untitled or unreferenced drafts. */
  criterion: ScanCriterion;
  maxCandidates: number;
  /** Concurrent CMA entry queries while scanning. */
  batchSize: number;
  /** Scan entries of all content types. */
  includeEntries: boolean;
  /** Scan media-library assets. */
  includeAssets: boolean;
}

export const fetchAllContentTypes = async (cma: CmaClient): Promise<ContentTypeProps[]> => {
  const all: ContentTypeProps[] = [];
  let skip = 0;
  let total = Infinity;
  // The CMA caps collections at 1000 items per request, so this is a single
  // round trip for virtually every space; the loop only continues for spaces
  // with more than 1000 content types.
  while (skip < total) {
    const response = await cma.contentType.getMany({
      query: { skip, limit: CONTENT_TYPE_PAGE_LIMIT, order: 'name' },
    });
    all.push(...response.items);
    total = response.total;
    if (response.items.length === 0) break;
    skip += response.items.length;
  }
  return all;
};

/**
 * Returns the id of the content type's display field if it is a text field,
 * otherwise undefined. The display field is what the Contentful UI shows as
 * the entry title; only Symbol/Text fields can hold a missing-title signal,
 * so content types without one are excluded from the scan entirely.
 */
export const getTextDisplayFieldId = (contentType: ContentTypeProps): string | undefined => {
  const field = contentType.fields.find((f) => f.id === contentType.displayField);
  return field && TEXT_FIELD_TYPES.includes(field.type) ? field.id : undefined;
};

export const getEntryTitle = (
  entry: EntryProps,
  contentType: ContentTypeProps,
  defaultLocale: string
): string | undefined => {
  const displayFieldId = getTextDisplayFieldId(contentType);
  if (!displayFieldId) return undefined;
  // CMA entries key every field by locale; a whitespace-only title is treated
  // the same as a missing one so it still renders as "Untitled" in the UI.
  // `fields` itself can be absent: when a query `select`s specific fields and
  // an entry has no value in any of them, the CMA omits the object entirely —
  // which is exactly the shape of the orphans this scan looks for.
  const value = entry.fields?.[displayFieldId]?.[defaultLocale];
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
};

/**
 * Builds the CMA entry query for one content type. The draft scope (never
 * published, not archived) is filtered server-side; whether the display field
 * is empty is checked client-side by `getEntryTitle`, because the API's
 * `[exists]` operator would miss whitespace-only titles.
 */
export const buildDraftEntryQuery = (contentType: ContentTypeProps): QueryOptions => {
  const displayFieldId = getTextDisplayFieldId(contentType);
  return {
    content_type: contentType.sys.id,
    // "Draft" means the entry has never been published. Entries that were
    // published and then changed have a publishedAt and are excluded.
    'sys.publishedAt[exists]': false,
    'sys.archivedAt[exists]': false,
    // The sys.id tiebreaker makes the order deterministic when many entries
    // share an updatedAt (e.g. a bulk import); without it, skip-based paging
    // can drop or duplicate entries across pages.
    order: '-sys.updatedAt,sys.id',
    // The scan only reads sys and the title, so skip every other field to
    // keep response payloads small. Selecting fields requires content_type,
    // which this query always sets.
    select: displayFieldId ? `sys,fields.${displayFieldId}` : 'sys',
  };
};

/**
 * Returns the asset's title in the default locale, or undefined when it is
 * missing or whitespace-only. Assets have a fixed shape (every asset has a
 * localized title field), so unlike entries no display-field lookup is
 * needed. The same `select` caveat applies: the CMA omits the fields object
 * entirely from assets with no value in any selected field.
 */
export const getAssetTitle = (asset: AssetProps, defaultLocale: string): string | undefined => {
  const value = (asset.fields as Partial<AssetProps['fields']> | undefined)?.title?.[defaultLocale];
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
};

/**
 * Builds the CMA asset query. Mirrors `buildDraftEntryQuery`, but assets are
 * homogeneous — no content type, so no `content_type` filter is needed for
 * `select` and the whole media library is one paged query.
 */
export const buildDraftAssetQuery = (): QueryOptions => ({
  'sys.publishedAt[exists]': false,
  'sys.archivedAt[exists]': false,
  order: '-sys.updatedAt,sys.id',
  select: 'sys,fields.title',
});

/**
 * Fetches all draft entries of one content type, paging until either the
 * collection is exhausted or `budget` entries have been collected.
 */
const fetchDraftsOfContentType = async (
  cma: CmaClient,
  contentType: ContentTypeProps,
  budget: number
): Promise<{ entry: EntryProps; contentType: ContentTypeProps }[]> => {
  const items: { entry: EntryProps; contentType: ContentTypeProps }[] = [];
  let skip = 0;
  let total = Infinity;
  while (skip < total && items.length < budget) {
    const limit = Math.min(PAGE_LIMIT, budget - items.length);
    const response = await cma.entry.getMany({
      query: { ...buildDraftEntryQuery(contentType), skip, limit },
    });
    items.push(...response.items.map((entry) => ({ entry, contentType })));
    total = response.total;
    if (response.items.length === 0) break;
    skip += response.items.length;
  }
  return items;
};

/** The sys.createdBy link target: a user, or an app/automation identity. */
interface CreatorLink {
  id: string;
  linkType: string;
}

const toCreatorLink = (sys: EntryProps['sys'] | AssetProps['sys']): CreatorLink | undefined =>
  sys.createdBy?.sys;

/**
 * Resolves creator user ids to display names via batched space-user lookups
 * (`sys.id[in]`, USER_PAGE_LIMIT ids per request). Lookup failures and users
 * who are no longer space members simply stay absent from the mapping —
 * callers fall back to "Unknown user", and the scan stays useful even when
 * the caller may not list space users at all.
 */
export const resolveCreatorNames = async (
  cma: CmaClient,
  userIds: string[]
): Promise<Record<string, string>> => {
  const names: Record<string, string> = {};
  for (let i = 0; i < userIds.length; i += USER_PAGE_LIMIT) {
    const chunk = userIds.slice(i, i + USER_PAGE_LIMIT);
    try {
      const response = await cma.user.getManyForSpace({
        query: { 'sys.id[in]': chunk.join(','), limit: chunk.length },
      });
      for (const user of response.items) {
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
        names[user.sys.id] = fullName || user.email;
      }
    } catch {
      // Tolerated — these ids render as "Unknown user".
    }
  }
  return names;
};

/**
 * Fetches all draft assets, paging until either the media library is
 * exhausted or `budget` assets have been collected.
 */
const fetchDraftAssets = async (cma: CmaClient, budget: number): Promise<AssetProps[]> => {
  const items: AssetProps[] = [];
  let skip = 0;
  let total = Infinity;
  while (skip < total && items.length < budget) {
    const limit = Math.min(PAGE_LIMIT, budget - items.length);
    const response = await cma.asset.getMany({
      query: { ...buildDraftAssetQuery(), skip, limit },
    });
    items.push(...response.items);
    total = response.total;
    if (response.items.length === 0) break;
    skip += response.items.length;
  }
  return items;
};

/**
 * Collects draft entries across all scannable content types, stopping once
 * `maxCandidates` entries have been gathered so a large space cannot trigger
 * an unbounded number of API calls.
 *
 * Content types are queried `concurrency` at a time: one query per content
 * type is unavoidable (entry queries require a single content_type), but the
 * queries are independent, so running them in parallel divides the wall-clock
 * time of the scan by the concurrency factor.
 *
 * `progressTotal` is the number of steps the whole scan reports (content
 * types plus the asset step, when enabled), so the progress counter does not
 * jump backwards when the asset step follows.
 */
const fetchDraftCandidates = async (
  cma: CmaClient,
  contentTypes: ContentTypeProps[],
  maxCandidates: number,
  concurrency: number,
  progressTotal: number,
  onProgress: (progress: ScanProgress) => void
): Promise<{
  candidates: { entry: EntryProps; contentType: ContentTypeProps }[];
  truncated: boolean;
}> => {
  const candidates: { entry: EntryProps; contentType: ContentTypeProps }[] = [];
  let truncated = false;
  let processed = 0;

  for (let i = 0; i < contentTypes.length && candidates.length < maxCandidates; i += concurrency) {
    const chunk = contentTypes.slice(i, i + concurrency);
    // Every content type in the chunk shares the same remaining-budget
    // snapshot, so a chunk can overshoot the cap; the combined list is
    // trimmed below and the overshoot reported as truncation.
    const budget = maxCandidates - candidates.length;
    processed += chunk.length;
    // Report before the requests fire so the UI names the content types
    // being checked while they are actually in flight.
    onProgress({
      current: processed,
      total: progressTotal,
      stepNames: chunk.map((contentType) => contentType.name),
    });
    const chunkResults = await Promise.all(
      chunk.map((contentType) => fetchDraftsOfContentType(cma, contentType, budget))
    );
    candidates.push(...chunkResults.flat());
  }

  if (candidates.length >= maxCandidates) {
    // The cap was hit mid-scan: remaining content types (and pages) were
    // not inspected, so the caller must surface a truncation warning.
    truncated = true;
    candidates.length = maxCandidates;
  }

  return { candidates, truncated };
};

/**
 * One draft candidate, flattened to what both criteria and the result
 * mapping need, so entries and assets flow through the same filters.
 */
interface Candidate {
  kind: OrphanKind;
  id: string;
  typeName: string;
  createdAt: string;
  title: string | undefined;
  version: number;
  creator: CreatorLink | undefined;
}

/**
 * Keeps only candidates that no entry links to. Referenced-ness cannot be
 * queried in bulk — links_to_entry / links_to_asset filter by ONE target id
 * per query — so this is one count request per candidate (limit: 0 returns
 * just the total), batched `batchSize` at a time. This makes the
 * unreferenced criterion by far the more expensive scan: budget one request
 * per draft, on top of the candidate paging.
 */
const filterUnreferenced = async (
  cma: CmaClient,
  candidates: Candidate[],
  batchSize: number,
  onProgress: (progress: ScanProgress) => void
): Promise<Candidate[]> => {
  const unreferenced: Candidate[] = [];
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    onProgress({
      current: Math.min(i + batch.length, candidates.length),
      total: candidates.length,
      stepNames: ['references'],
    });
    const totals = await Promise.all(
      batch.map((candidate) =>
        cma.entry
          .getMany({
            query: {
              [candidate.kind === 'entry' ? 'links_to_entry' : 'links_to_asset']: candidate.id,
              limit: 0,
            },
          })
          .then((response) => response.total)
      )
    );
    unreferenced.push(...batch.filter((_, index) => totals[index] === 0));
  }
  return unreferenced;
};

/**
 * Scans the environment for orphaned drafts (never published, not archived)
 * matching the chosen criterion:
 *
 * - "untitled": no title value in the default locale. For entries the title
 *   is the content type's display field, and content types whose display
 *   field is not a text field are skipped — their entries cannot be missing
 *   a title.
 * - "unreferenced": no entry links to the item. Every content type
 *   participates (any entry can be a link target) and titles are irrelevant.
 *
 * Both scans are broad with respect to edit history: every result carries a
 * `neverEdited` flag and the UI filters on it visibly instead of the scan
 * excluding anything silently.
 */
export const findOrphans = async (
  cma: CmaClient,
  contentTypes: ContentTypeProps[],
  defaultLocale: string,
  onProgress: (progress: ScanProgress) => void,
  options: ScanOptions
): Promise<ScanOutcome> => {
  const scannableTypes = options.includeEntries
    ? options.criterion === 'untitled'
      ? contentTypes.filter((ct) => getTextDisplayFieldId(ct) !== undefined)
      : contentTypes
    : [];
  const progressTotal = scannableTypes.length + (options.includeAssets ? 1 : 0);

  const { candidates, truncated: entriesTruncated } = await fetchDraftCandidates(
    cma,
    scannableTypes,
    options.maxCandidates,
    options.batchSize,
    progressTotal,
    onProgress
  );

  // Assets and entries share one maxCandidates budget, so the cap holds for
  // the scan as a whole no matter which scopes are enabled.
  let truncated = entriesTruncated;
  let assetCandidates: AssetProps[] = [];
  if (options.includeAssets) {
    onProgress({ current: progressTotal, total: progressTotal, stepNames: ['Media assets'] });
    const budget = options.maxCandidates - candidates.length;
    if (budget > 0) {
      assetCandidates = await fetchDraftAssets(cma, budget);
      if (candidates.length + assetCandidates.length >= options.maxCandidates) {
        truncated = true;
      }
    }
  }

  // Entries and assets are flattened into one candidate list so both
  // criteria filter the same shape. Titles ride along: the untitled
  // criterion filters on them, the unreferenced one displays them (an
  // unreferenced entry usually has a real title).
  const allCandidates: Candidate[] = [
    ...candidates.map(({ entry, contentType }) => ({
      kind: 'entry' as const,
      id: entry.sys.id,
      typeName: contentType.name,
      createdAt: entry.sys.createdAt,
      title: getEntryTitle(entry, contentType, defaultLocale),
      version: entry.sys.version,
      creator: toCreatorLink(entry.sys),
    })),
    ...assetCandidates.map((asset) => ({
      kind: 'asset' as const,
      id: asset.sys.id,
      typeName: 'Asset',
      createdAt: asset.sys.createdAt,
      title: getAssetTitle(asset, defaultLocale),
      version: asset.sys.version,
      creator: toCreatorLink(asset.sys),
    })),
  ];

  // The scan itself is deliberately broad — the "never edited" distinction
  // is carried on each result (see neverEdited below) and applied as a
  // visible filter in the UI, never as a silent scan-time exclusion.
  let orphans: Candidate[];
  if (options.criterion === 'unreferenced') {
    orphans = await filterUnreferenced(cma, allCandidates, options.batchSize, onProgress);
  } else {
    orphans = allCandidates.filter((candidate) => candidate.title === undefined);
  }

  // sys.createdBy only carries a link, so creators are resolved to names in
  // one batched users lookup per USER_PAGE_LIMIT unique ids — the "who
  // created this" column is often the fastest way to find the person or
  // workflow that produces orphans. Resolution runs after filtering so only
  // actual orphans' creators are looked up.
  const userIds = [
    ...new Set(
      orphans
        .map((orphan) => orphan.creator)
        .filter((link): link is CreatorLink => link !== undefined && link.linkType === 'User')
        .map((link) => link.id)
    ),
  ];
  const names = await resolveCreatorNames(cma, userIds);
  const creatorName = (link: CreatorLink | undefined): string => {
    // Non-user identities (apps, automations) are not in the users endpoint;
    // label them collectively rather than showing a raw id.
    if (link && link.linkType !== 'User') return 'App';
    return (link && names[link.id]) || 'Unknown user';
  };

  const results: OrphanResult[] = orphans.map((orphan) => ({
    kind: orphan.kind,
    id: orphan.id,
    typeName: orphan.typeName,
    title: orphan.title,
    createdAt: orphan.createdAt,
    createdBy: creatorName(orphan.creator),
    // The CMA bumps sys.version on every write (updates, but also publish,
    // unpublish, archive and unarchive — and for assets, file processing).
    // Publish and archive states are excluded by the draft queries, so
    // version 1 can only mean the item was never saved after creation. The
    // check must be client-side anyway: sys.version is not a queryable
    // attribute in CMA searches.
    neverEdited: orphan.version === 1,
  }));

  return { results, truncated };
};
