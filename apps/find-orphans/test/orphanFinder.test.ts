import { describe, expect, it, vi } from 'vitest';
import {
  buildDraftEntryQuery,
  fetchAllContentTypes,
  findOrphanedEntries,
  getEntryTitle,
  getTextDisplayFieldId,
} from '../src/locations/Page/utils/orphanFinder';
import {
  createMockCma,
  makeMockEntry,
  mockArticleContentType,
  mockNumericDisplayContentType,
} from './mocks';

const noProgress = vi.fn();
const limits = { maxCandidates: 500, batchSize: 5 };

describe('getTextDisplayFieldId', () => {
  it('returns the display field id when it is a text field', () => {
    expect(getTextDisplayFieldId(mockArticleContentType)).toBe('title');
  });

  it('returns undefined when the display field is not a text field', () => {
    expect(getTextDisplayFieldId(mockNumericDisplayContentType)).toBeUndefined();
  });
});

describe('getEntryTitle', () => {
  it('returns the display field value in the default locale', () => {
    const entry = makeMockEntry('e1', 'article', { title: { 'en-US': 'Hello' } });
    expect(getEntryTitle(entry, mockArticleContentType, 'en-US')).toBe('Hello');
  });

  it('returns undefined for empty or missing values', () => {
    const empty = makeMockEntry('e1', 'article', { title: { 'en-US': '   ' } });
    const missing = makeMockEntry('e2', 'article');
    expect(getEntryTitle(empty, mockArticleContentType, 'en-US')).toBeUndefined();
    expect(getEntryTitle(missing, mockArticleContentType, 'en-US')).toBeUndefined();
  });

  it('returns undefined when the fields object is absent entirely', () => {
    // With a `select` query, the CMA omits `fields` from entries that have no
    // value in any selected field — the exact shape of an orphaned entry.
    const noFields = makeMockEntry('e3', 'article');
    delete (noFields as Partial<typeof noFields>).fields;
    expect(getEntryTitle(noFields, mockArticleContentType, 'en-US')).toBeUndefined();
  });
});

describe('buildDraftEntryQuery', () => {
  it('scopes to non-archived draft entries of the content type', () => {
    const query = buildDraftEntryQuery(mockArticleContentType);
    expect(query).toMatchObject({
      content_type: 'article',
      'sys.publishedAt[exists]': false,
      'sys.archivedAt[exists]': false,
    });
  });

  it('orders with a sys.id tiebreaker for stable skip-based pagination', () => {
    // Without the tiebreaker, entries sharing an updatedAt (bulk imports)
    // sort non-deterministically and paging can drop or duplicate them.
    expect(buildDraftEntryQuery(mockArticleContentType).order).toBe('-sys.updatedAt,sys.id');
  });

  it('selects only sys and the display field to keep payloads small', () => {
    expect(buildDraftEntryQuery(mockArticleContentType).select).toBe('sys,fields.title');
  });
});

describe('fetchAllContentTypes', () => {
  it('returns all content types', async () => {
    const { cma } = createMockCma({
      contentTypes: [mockArticleContentType, mockNumericDisplayContentType],
    });
    const types = await fetchAllContentTypes(cma);
    expect(types).toHaveLength(2);
  });
});

describe('findOrphanedEntries', () => {
  it('lists drafts with an empty display field and excludes titled ones', async () => {
    const orphan = makeMockEntry('orphan', 'article');
    const healthy = makeMockEntry('healthy', 'article', { title: { 'en-US': 'Has title' } });
    const { cma } = createMockCma({
      entriesByContentType: { article: [orphan, healthy] },
    });

    const outcome = await findOrphanedEntries(
      cma,
      [mockArticleContentType],
      'en-US',
      noProgress,
      limits
    );

    expect(outcome.truncated).toBe(false);
    expect(outcome.results).toHaveLength(1);
    expect(outcome.results[0].entry.sys.id).toBe('orphan');
  });

  it('treats a whitespace-only title as missing', async () => {
    const blank = makeMockEntry('blank', 'article', { title: { 'en-US': '   ' } });
    const { cma } = createMockCma({ entriesByContentType: { article: [blank] } });

    const outcome = await findOrphanedEntries(
      cma,
      [mockArticleContentType],
      'en-US',
      noProgress,
      limits
    );

    expect(outcome.results.map((r) => r.entry.sys.id)).toEqual(['blank']);
  });

  it('skips content types without a text display field', async () => {
    // Entries of such types cannot be missing a title, so querying them
    // would only waste API calls.
    const { cma, entryGetMany } = createMockCma({
      entriesByContentType: { counter: [makeMockEntry('c1', 'counter')] },
    });

    const outcome = await findOrphanedEntries(
      cma,
      [mockNumericDisplayContentType],
      'en-US',
      noProgress,
      limits
    );

    expect(outcome.results).toHaveLength(0);
    expect(entryGetMany).not.toHaveBeenCalled();
  });

  it('caps the fetched drafts at maxCandidates and reports truncation', async () => {
    const entries = [makeMockEntry('e1', 'article'), makeMockEntry('e2', 'article')];
    const { cma } = createMockCma({ entriesByContentType: { article: entries } });

    const outcome = await findOrphanedEntries(cma, [mockArticleContentType], 'en-US', noProgress, {
      maxCandidates: 1,
      batchSize: 5,
    });

    expect(outcome.truncated).toBe(true);
    expect(outcome.results).toHaveLength(1);
  });

  it('combines results from multiple content types scanned in one parallel chunk', async () => {
    const articleType = mockArticleContentType;
    // A second scannable type: clone the article type under a different id
    // so both have a text display field.
    const noteType = {
      ...mockArticleContentType,
      sys: { ...mockArticleContentType.sys, id: 'note' },
      name: 'Note',
    };
    const { cma, entryGetMany } = createMockCma({
      entriesByContentType: {
        article: [makeMockEntry('a1', 'article')],
        note: [makeMockEntry('n1', 'note')],
      },
    });

    const outcome = await findOrphanedEntries(
      cma,
      [articleType, noteType],
      'en-US',
      noProgress,
      limits
    );

    expect(outcome.results.map((r) => r.entry.sys.id)).toEqual(
      expect.arrayContaining(['a1', 'n1'])
    );
    // One entry query per content type; there is no reference-count phase.
    expect(entryGetMany).toHaveBeenCalledTimes(2);
  });

  it('reports progress with the content types being checked', async () => {
    const onProgress = vi.fn();
    const orphan = makeMockEntry('orphan', 'article');
    const { cma } = createMockCma({ entriesByContentType: { article: [orphan] } });

    await findOrphanedEntries(cma, [mockArticleContentType], 'en-US', onProgress, limits);

    expect(onProgress).toHaveBeenCalledWith({
      current: 1,
      total: 1,
      contentTypeNames: ['Article'],
    });
  });
});
