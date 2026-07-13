import { ContentTypeProps, EntryProps, QueryOptions } from 'contentful-management';
import { CmaClient, OrphanResult, ScanOutcome, ScanProgress } from '../types';
import { CONTENT_TYPE_PAGE_LIMIT, PAGE_LIMIT, TEXT_FIELD_TYPES } from './constants';

/** Scan settings, sourced from installation parameters (see src/parameters.ts). */
export interface ScanOptions {
  maxCandidates: number;
  /** Concurrent CMA entry queries while scanning. */
  batchSize: number;
  /** Only flag drafts never saved after creation (sys.version === 1). */
  untouchedOnly: boolean;
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

/**
 * Collects draft entries across all scannable content types, stopping once
 * `maxCandidates` entries have been gathered so a large space cannot trigger
 * an unbounded number of API calls.
 *
 * Content types are queried `concurrency` at a time: one query per content
 * type is unavoidable (entry queries require a single content_type), but the
 * queries are independent, so running them in parallel divides the wall-clock
 * time of the scan by the concurrency factor.
 */
const fetchDraftCandidates = async (
  cma: CmaClient,
  contentTypes: ContentTypeProps[],
  maxCandidates: number,
  concurrency: number,
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
      total: contentTypes.length,
      contentTypeNames: chunk.map((contentType) => contentType.name),
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
 * Scans the environment for orphaned draft entries: never published, not
 * archived, and with no value in their display (title) field in the default
 * locale. Content types whose display field is not a text field are skipped —
 * their entries cannot be missing a title.
 *
 * With `untouchedOnly` set, an untitled draft is only flagged when it was
 * never saved after creation, which filters out work-in-progress drafts that
 * simply have not been given a title yet.
 */
export const findOrphanedEntries = async (
  cma: CmaClient,
  contentTypes: ContentTypeProps[],
  defaultLocale: string,
  onProgress: (progress: ScanProgress) => void,
  options: ScanOptions
): Promise<ScanOutcome> => {
  const scannableTypes = contentTypes.filter((ct) => getTextDisplayFieldId(ct) !== undefined);

  const { candidates, truncated } = await fetchDraftCandidates(
    cma,
    scannableTypes,
    options.maxCandidates,
    options.batchSize,
    onProgress
  );

  const results: OrphanResult[] = candidates.filter(({ entry, contentType }) => {
    if (getEntryTitle(entry, contentType, defaultLocale) !== undefined) return false;
    // The CMA bumps sys.version on every write (updates, but also publish,
    // unpublish, archive and unarchive). Publish and archive states are
    // already excluded by the draft query, so on a candidate version 1 can
    // only mean the entry was never saved after creation. This check must
    // stay client-side: sys.version is not a queryable attribute in CMA
    // entry searches.
    return !options.untouchedOnly || entry.sys.version === 1;
  });

  return { results, truncated };
};
