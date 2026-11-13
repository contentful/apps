import { describe, expect, it, vi } from 'vitest';
import {
  buildDraftAssetQuery,
  buildDraftEntryQuery,
  fetchAllContentTypes,
  findOrphans,
  getAssetTitle,
  getEntryTitle,
  getTextDisplayFieldId,
} from '../src/locations/Page/utils/orphanFinder';
import {
  createMockCma,
  makeMockAsset,
  makeMockEntry,
  makeMockUser,
  mockArticleContentType,
  mockNoDisplayFieldContentType,
  mockNumericDisplayContentType,
} from './mocks';

const noProgress = vi.fn();
const options = {
  criterion: 'untitled' as const,
  maxCandidates: 500,
  batchSize: 5,
  includeEntries: true,
  includeAssets: true,
};

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

describe('getAssetTitle', () => {
  it('returns the title in the default locale', () => {
    expect(getAssetTitle(makeMockAsset('a1', 'Sunset photo'), 'en-US')).toBe('Sunset photo');
  });

  it('returns undefined for whitespace-only titles and absent fields', () => {
    expect(getAssetTitle(makeMockAsset('a1', '   '), 'en-US')).toBeUndefined();
    // No title argument = no fields object, the shape a select query returns
    // for an asset with no value in any selected field.
    expect(getAssetTitle(makeMockAsset('a2'), 'en-US')).toBeUndefined();
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

describe('buildDraftAssetQuery', () => {
  it('mirrors the entry query without a content type filter', () => {
    expect(buildDraftAssetQuery()).toEqual({
      'sys.publishedAt[exists]': false,
      'sys.archivedAt[exists]': false,
      order: '-sys.updatedAt,sys.id',
      select: 'sys,fields.title',
    });
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

describe('findOrphans', () => {
  it('lists drafts with an empty display field and excludes titled ones', async () => {
    const orphan = makeMockEntry('orphan', 'article');
    const healthy = makeMockEntry('healthy', 'article', { title: { 'en-US': 'Has title' } });
    const { cma } = createMockCma({
      entriesByContentType: { article: [orphan, healthy] },
    });

    const outcome = await findOrphans(cma, [mockArticleContentType], 'en-US', noProgress, options);

    expect(outcome.truncated).toBe(false);
    expect(outcome.results).toHaveLength(1);
    expect(outcome.results[0]).toMatchObject({ kind: 'entry', id: 'orphan', typeName: 'Article' });
  });

  it('treats a whitespace-only title as missing', async () => {
    const blank = makeMockEntry('blank', 'article', { title: { 'en-US': '   ' } });
    const { cma } = createMockCma({ entriesByContentType: { article: [blank] } });

    const outcome = await findOrphans(cma, [mockArticleContentType], 'en-US', noProgress, options);

    expect(outcome.results.map((r) => r.id)).toEqual(['blank']);
  });

  it('lists untitled draft assets and excludes titled ones', async () => {
    const { cma } = createMockCma({
      assets: [makeMockAsset('orphan-asset'), makeMockAsset('photo', 'Sunset photo')],
    });

    const outcome = await findOrphans(cma, [], 'en-US', noProgress, options);

    expect(outcome.results).toHaveLength(1);
    expect(outcome.results[0]).toMatchObject({
      kind: 'asset',
      id: 'orphan-asset',
      typeName: 'Asset',
    });
  });

  it('resolves creator names, labelling app identities and departed users', async () => {
    const byJane = makeMockEntry('by-jane', 'article', {}, '2026-01-01T00:00:00Z', 1, 'user-jane');
    // A creator id with no matching space user models someone who left.
    const departed = makeMockEntry(
      'departed',
      'article',
      {},
      '2026-01-01T00:00:00Z',
      1,
      'user-gone'
    );
    const appMade = makeMockEntry('app-made', 'article');
    (appMade.sys.createdBy as { sys: { linkType: string } }).sys.linkType = 'AppDefinition';
    const { cma } = createMockCma({
      entriesByContentType: { article: [byJane, departed, appMade] },
      assets: [makeMockAsset('asset-by-jane', undefined, '2026-01-01T00:00:00Z', 1, 'user-jane')],
      users: [makeMockUser('user-jane', 'Jane', 'Doe')],
    });

    const outcome = await findOrphans(cma, [mockArticleContentType], 'en-US', noProgress, options);

    const creators = Object.fromEntries(outcome.results.map((r) => [r.id, r.createdBy]));
    expect(creators).toEqual({
      'by-jane': 'Jane Doe',
      departed: 'Unknown user',
      'app-made': 'App',
      'asset-by-jane': 'Jane Doe',
    });
  });

  it('skips the users lookup when no orphan has a user creator', async () => {
    const appMade = makeMockEntry('app-made', 'article');
    (appMade.sys.createdBy as { sys: { linkType: string } }).sys.linkType = 'AppDefinition';
    const { cma, userGetManyForSpace } = createMockCma({
      entriesByContentType: { article: [appMade] },
    });

    await findOrphans(cma, [mockArticleContentType], 'en-US', noProgress, options);

    expect(userGetManyForSpace).not.toHaveBeenCalled();
  });

  it('surfaces the creation date on results', async () => {
    const orphan = makeMockEntry('orphan', 'article', {}, '2026-03-05T00:00:00Z');
    const { cma } = createMockCma({ entriesByContentType: { article: [orphan] } });

    const outcome = await findOrphans(cma, [mockArticleContentType], 'en-US', noProgress, options);

    expect(outcome.results[0].createdAt).toBe('2026-03-05T00:00:00Z');
  });

  it('includes edited untitled drafts and marks never-edited ones with a flag', async () => {
    // The scan is deliberately broad: edit history never excludes a result.
    // sys.version increments on every save, so version 1 = never edited —
    // carried as a flag for the UI's "Never edited" filter.
    const untouched = makeMockEntry('untouched', 'article');
    const edited = makeMockEntry('edited', 'article', {}, '2026-06-01T00:00:00Z', 4);
    const { cma } = createMockCma({
      entriesByContentType: { article: [untouched, edited] },
      assets: [makeMockAsset('touched-asset', undefined, '2026-06-01T00:00:00Z', 3)],
    });

    const outcome = await findOrphans(cma, [mockArticleContentType], 'en-US', noProgress, options);

    const flags = Object.fromEntries(outcome.results.map((r) => [r.id, r.neverEdited]));
    expect(flags).toEqual({
      untouched: true,
      edited: false,
      'touched-asset': false,
    });
  });

  it('skips entries or assets when their scope is off', async () => {
    const { cma, entryGetMany, assetGetMany } = createMockCma({
      entriesByContentType: { article: [makeMockEntry('orphan', 'article')] },
      assets: [makeMockAsset('orphan-asset')],
    });

    const entriesOnly = await findOrphans(cma, [mockArticleContentType], 'en-US', noProgress, {
      ...options,
      includeAssets: false,
    });
    expect(entriesOnly.results.map((r) => r.id)).toEqual(['orphan']);
    expect(assetGetMany).not.toHaveBeenCalled();

    entryGetMany.mockClear();
    const assetsOnly = await findOrphans(cma, [mockArticleContentType], 'en-US', noProgress, {
      ...options,
      includeEntries: false,
    });
    expect(assetsOnly.results.map((r) => r.id)).toEqual(['orphan-asset']);
    expect(entryGetMany).not.toHaveBeenCalled();
  });

  it('finds untitled never-edited drafts under both criteria', async () => {
    // Cross-criterion consistency: a version-1 untitled draft that nothing
    // references is an orphan by either definition, so it must appear in
    // both scans' results.
    const orphan = makeMockEntry('orphan', 'article');
    const { cma } = createMockCma({ entriesByContentType: { article: [orphan] } });

    const untitled = await findOrphans(cma, [mockArticleContentType], 'en-US', noProgress, options);
    const unreferenced = await findOrphans(cma, [mockArticleContentType], 'en-US', noProgress, {
      ...options,
      criterion: 'unreferenced',
    });

    expect(untitled.results.map((r) => r.id)).toEqual(['orphan']);
    expect(unreferenced.results.map((r) => r.id)).toEqual(['orphan']);
  });

  it('skips content types with no display field configured (unreferenced-scan-only territory)', async () => {
    // Component types (banners, teasers) often have no entry title at all;
    // their entries always render as "Untitled" in Contentful, but the
    // untitled scan deliberately skips them — flagging every draft of such
    // types would sweep in legitimate work-in-progress. They still surface
    // in the unreferenced scan, which is why an "Untitled" row can appear
    // there and not here. Pinned so the discrepancy is documented behavior.
    const bannerDraft = makeMockEntry('banner-1', 'banner');
    const { cma, entryGetMany } = createMockCma({
      entriesByContentType: { banner: [bannerDraft] },
    });

    const outcome = await findOrphans(cma, [mockNoDisplayFieldContentType], 'en-US', noProgress, {
      ...options,
      includeAssets: false,
    });

    expect(outcome.results).toHaveLength(0);
    expect(entryGetMany).not.toHaveBeenCalled();

    // The same type IS scanned under the unreferenced criterion.
    const unreferenced = await findOrphans(
      cma,
      [mockNoDisplayFieldContentType],
      'en-US',
      noProgress,
      {
        ...options,
        criterion: 'unreferenced',
        includeAssets: false,
      }
    );
    expect(unreferenced.results.map((r) => r.id)).toEqual(['banner-1']);
  });

  it('skips content types without a text display field', async () => {
    // Entries of such types cannot be missing a title, so querying them
    // would only waste API calls.
    const { cma, entryGetMany } = createMockCma({
      entriesByContentType: { counter: [makeMockEntry('c1', 'counter')] },
    });

    const outcome = await findOrphans(cma, [mockNumericDisplayContentType], 'en-US', noProgress, {
      ...options,
      includeAssets: false,
    });

    expect(outcome.results).toHaveLength(0);
    expect(entryGetMany).not.toHaveBeenCalled();
  });

  it('caps the fetched drafts at maxCandidates across entries and assets', async () => {
    const entries = [makeMockEntry('e1', 'article'), makeMockEntry('e2', 'article')];
    const { cma, assetGetMany } = createMockCma({
      entriesByContentType: { article: entries },
      assets: [makeMockAsset('a1')],
    });

    const outcome = await findOrphans(cma, [mockArticleContentType], 'en-US', noProgress, {
      ...options,
      maxCandidates: 1,
    });

    expect(outcome.truncated).toBe(true);
    expect(outcome.results).toHaveLength(1);
    // Entries consumed the whole budget, so the asset query never fires.
    expect(assetGetMany).not.toHaveBeenCalled();
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

    const outcome = await findOrphans(cma, [articleType, noteType], 'en-US', noProgress, {
      ...options,
      includeAssets: false,
    });

    expect(outcome.results.map((r) => r.id)).toEqual(expect.arrayContaining(['a1', 'n1']));
    // One entry query per content type; there is no reference-count phase.
    expect(entryGetMany).toHaveBeenCalledTimes(2);
  });

  it('reports content type and asset steps against one combined total', async () => {
    const onProgress = vi.fn();
    const orphan = makeMockEntry('orphan', 'article');
    const { cma } = createMockCma({ entriesByContentType: { article: [orphan] } });

    await findOrphans(cma, [mockArticleContentType], 'en-US', onProgress, options);

    // One content type plus the asset step = 2 total steps.
    expect(onProgress).toHaveBeenNthCalledWith(1, {
      current: 1,
      total: 2,
      stepNames: ['Article'],
    });
    expect(onProgress).toHaveBeenNthCalledWith(2, {
      current: 2,
      total: 2,
      stepNames: ['Media assets'],
    });
  });
});

describe('findOrphans (unreferenced criterion)', () => {
  const unreferencedOptions = { ...options, criterion: 'unreferenced' as const };

  it('keeps only drafts that no entry links to, with their titles', async () => {
    const linked = makeMockEntry('linked', 'article', { title: { 'en-US': 'Linked' } });
    const unlinked = makeMockEntry('unlinked', 'article', { title: { 'en-US': 'Unlinked' } });
    const { cma } = createMockCma({
      entriesByContentType: { article: [linked, unlinked] },
      assets: [makeMockAsset('used-asset', 'Hero'), makeMockAsset('unused-asset', 'Spare')],
      referenceCounts: { linked: 3, 'used-asset': 1 },
    });

    const outcome = await findOrphans(
      cma,
      [mockArticleContentType],
      'en-US',
      noProgress,
      unreferencedOptions
    );

    expect(outcome.results.map((r) => r.id).sort()).toEqual(['unlinked', 'unused-asset']);
    // Unreferenced results keep their real titles for display.
    expect(outcome.results.find((r) => r.id === 'unlinked')?.title).toBe('Unlinked');
  });

  it('includes content types without a text display field', async () => {
    // Any entry can be a link target, so the untitled-scan restriction to
    // text display fields does not apply here.
    const { cma } = createMockCma({
      entriesByContentType: { counter: [makeMockEntry('c1', 'counter')] },
    });

    const outcome = await findOrphans(cma, [mockNumericDisplayContentType], 'en-US', noProgress, {
      ...unreferencedOptions,
      includeAssets: false,
    });

    expect(outcome.results.map((r) => r.id)).toEqual(['c1']);
  });

  it('includes edited drafts, carrying the neverEdited flag', async () => {
    // An unreferenced entry is worth flagging no matter how often it was
    // edited; the flag still rides along for the UI filter.
    const edited = makeMockEntry(
      'edited',
      'article',
      { title: { 'en-US': 'Edited' } },
      '2026-01-01T00:00:00Z',
      7
    );
    const { cma } = createMockCma({ entriesByContentType: { article: [edited] } });

    const outcome = await findOrphans(cma, [mockArticleContentType], 'en-US', noProgress, {
      ...unreferencedOptions,
      includeAssets: false,
    });

    expect(outcome.results.map((r) => r.id)).toEqual(['edited']);
    expect(outcome.results[0].neverEdited).toBe(false);
  });

  it('reports reference-count progress after the candidate phases', async () => {
    const onProgress = vi.fn();
    const { cma } = createMockCma({
      entriesByContentType: { article: [makeMockEntry('e1', 'article')] },
    });

    await findOrphans(cma, [mockArticleContentType], 'en-US', onProgress, {
      ...unreferencedOptions,
      includeAssets: false,
    });

    expect(onProgress).toHaveBeenLastCalledWith({
      current: 1,
      total: 1,
      stepNames: ['references'],
    });
  });
});
