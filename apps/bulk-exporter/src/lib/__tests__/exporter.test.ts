import { describe, it, expect, vi } from 'vitest';
import { Exporter, type ExportProgress } from '../exporter';
import { exportData } from '../exportFormats';
import { scanMatchingEntries, choosePagingMode } from '../paginate';
import { getStatusPostFilter } from '../queryBuilder';
import type { ContentType, Entry } from '../flatten';

vi.mock('../exportFormats', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../exportFormats')>()),
  exportData: vi.fn().mockResolvedValue(undefined),
}));

describe('Exporter', () => {
  it('surfaces the real CMA error message even when the error is not an Error instance', async () => {
    const cmaError = {
      sys: { type: 'Error', id: 'BadRequest' },
      message: 'Response size too big. Maximum allowed response size: 7340032B.',
      requestId: '9a90d083-9da4-46c0-adcf-cad04aea653a',
    };

    const mockCma = {
      entry: {
        getMany: vi.fn().mockRejectedValue(cmaError),
      },
    };

    const exporter = new Exporter(mockCma as any);
    const progressUpdates: ExportProgress[] = [];

    await expect(
      exporter.start({ contentType: null, contentTypeId: 'statement', locales: ['en-US'] }, (p) =>
        progressUpdates.push(p)
      )
    ).rejects.toBe(cmaError);

    const errorUpdate = progressUpdates.find((p) => p.status === 'error');
    expect(errorUpdate?.message).toBe(
      'Export failed: Response size too big. Maximum allowed response size: 7340032B.'
    );
  });

  it('unwraps the message from the JSON blob the App Framework bridge delivers', async () => {
    // The web app relays a rejection into the app's iframe over postMessage,
    // leaving a plain object whose `message` is contentful-sdk-core's JSON
    // blob. Reporting that blob verbatim would also put the (obscured) auth
    // header in front of the user.
    const bridgedError = {
      code: 'BadRequest',
      message: JSON.stringify({
        status: 400,
        statusText: 'Bad Request',
        message: 'Response size too big. Maximum allowed response size: 7340032B.',
        request: {
          url: '/spaces/60i3uyhfow4o/environments/master/entries',
          headers: { Authorization: 'Bearer ...ecret' },
        },
      }),
    };

    const mockCma = { entry: { getMany: vi.fn().mockRejectedValue(bridgedError) } };
    const exporter = new Exporter(mockCma as any);
    const progressUpdates: ExportProgress[] = [];

    await expect(
      exporter.start({ contentType: null, contentTypeId: 'statement', locales: ['en-US'] }, (p) =>
        progressUpdates.push(p)
      )
    ).rejects.toBe(bridgedError);

    const errorUpdate = progressUpdates.find((p) => p.status === 'error');
    expect(errorUpdate?.message).toBe(
      'Export failed: Response size too big. Maximum allowed response size: 7340032B.'
    );
    expect(errorUpdate?.message).not.toContain('Authorization');
  });

  it('falls back to "Unknown error" when the thrown value has no message', async () => {
    const mockCma = {
      entry: {
        getMany: vi.fn().mockRejectedValue('not an object'),
      },
    };

    const exporter = new Exporter(mockCma as any);
    const progressUpdates: ExportProgress[] = [];

    await expect(
      exporter.start({ contentType: null, contentTypeId: 'statement', locales: ['en-US'] }, (p) =>
        progressUpdates.push(p)
      )
    ).rejects.toBe('not an object');

    const errorUpdate = progressUpdates.find((p) => p.status === 'error');
    expect(errorUpdate?.message).toBe('Export failed: Unknown error');
  });

  describe('Published export over a mixed published and changed fixture', () => {
    const contentType: ContentType = {
      sys: { id: 'caseStudy' },
      name: 'Case Study',
      fields: [{ id: 'title', name: 'Title', type: 'Symbol', localized: false }],
    };

    // Every fourth entry has an unpublished edit (version 9 vs publishedVersion 4); the CMA cannot
    // tell it apart from a published entry, so a Published search still fetches it.
    const makeFixture = (count: number): Entry[] =>
      Array.from({ length: count }, (_, i) => ({
        sys: {
          id: `e${i}`,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          version: i % 4 === 3 ? 9 : 5,
          publishedVersion: 4,
          contentType: { sys: { id: 'caseStudy' } },
        },
        fields: { title: { 'en-US': `Case study ${i}` } },
      }));

    const makeCma = (fixture: Entry[]) => ({
      entry: {
        getMany: vi.fn().mockImplementation(({ query }) => {
          if (query.limit === 0) return Promise.resolve({ items: [], total: fixture.length });
          const skip = query.skip ?? 0;
          return Promise.resolve({
            items: fixture.slice(skip, skip + query.limit),
            total: fixture.length,
          });
        }),
      },
    });

    const throttledFetch = <T>(fn: () => Promise<T>) => fn();
    const postFilter = getStatusPostFilter('published')!;

    const runExport = async (fixture: Entry[], useSchema: boolean) => {
      vi.mocked(exportData).mockClear();
      await new Exporter(makeCma(fixture) as any).start(
        {
          contentType: useSchema ? contentType : null,
          contentTypeId: 'caseStudy',
          locales: ['en-US'],
          statusPostFilter: postFilter,
        },
        () => {}
      );
      const [data] = vi.mocked(exportData).mock.calls[0];
      return data.rows;
    };

    it('within the cap, the count, the matching ids, and the exported rows agree and are all Published', async () => {
      const fixture = makeFixture(200);
      const scan = await scanMatchingEntries(
        makeCma(fixture) as any,
        { contentType: 'caseStudy' },
        postFilter,
        throttledFetch,
        9000
      );
      const rows = await runExport(fixture, true);

      expect(choosePagingMode(scan)).toBe('matching-list');
      expect(scan.matchingIds).toHaveLength(150);
      expect(rows).toHaveLength(scan.matchingIds.length);
      expect(rows.map((r) => r['Entry ID'])).toEqual(scan.matchingIds);
      expect(rows.every((r) => r['Status'] === 'Published')).toBe(true);
    });

    it('above the cap, the count is the raw total but the export still holds only Published rows', async () => {
      const fixture = makeFixture(1200);
      const scan = await scanMatchingEntries(
        makeCma(fixture) as any,
        { contentType: 'caseStudy' },
        postFilter,
        throttledFetch,
        1000
      );
      const rows = await runExport(fixture, true);

      expect(choosePagingMode(scan)).toBe('skip-paging');
      expect(scan.rawTotal).toBe(1200);
      expect(rows).toHaveLength(900);
      expect(rows.length).not.toBe(scan.rawTotal);
      expect(rows.every((r) => r['Status'] === 'Published')).toBe(true);
    });

    it.each([
      ['with a content type schema', true],
      ['without a content type schema', false],
    ])('reads Changed in the Status column for unpublished edits %s', async (_label, useSchema) => {
      const fixture = makeFixture(8);
      // No post-filter: an Any or Changed export carries both kinds of row.
      vi.mocked(exportData).mockClear();
      await new Exporter(makeCma(fixture) as any).start(
        {
          contentType: useSchema ? contentType : null,
          contentTypeId: 'caseStudy',
          locales: ['en-US'],
        },
        () => {}
      );
      const [data] = vi.mocked(exportData).mock.calls[0];

      expect(data.rows.map((r) => [r['Entry ID'], r['Status']])).toEqual([
        ['e0', 'Published'],
        ['e1', 'Published'],
        ['e2', 'Published'],
        ['e3', 'Changed'],
        ['e4', 'Published'],
        ['e5', 'Published'],
        ['e6', 'Published'],
        ['e7', 'Changed'],
      ]);
    });

    it('does not write the unpublished-edit rows into a Published export without a schema', async () => {
      const rows = await runExport(makeFixture(8), false);

      expect(rows.map((r) => r['Entry ID'])).toEqual(['e0', 'e1', 'e2', 'e4', 'e5', 'e6']);
      expect(rows.every((r) => r['Status'] === 'Published')).toBe(true);
    });
  });
});
