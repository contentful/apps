import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchDocumentSelection } from '../../src/utils/fetchDocumentSelection';
import { WorkflowRunError, WorkflowFailureReason } from '@types';

const DOC_ID = 'doc-abc-123';
const TOKEN = 'oauth-token-xyz';
const EXPECTED_URL = `https://docs.googleapis.com/v1/documents/${DOC_ID}?includeTabsContent=true`;

function mockFetchResponse(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: vi.fn().mockResolvedValue(body),
  });
}

describe('fetchDocumentSelection', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getDocumentSelectionConfig — tab flattening and image counting', () => {
    it('returns a single tab with no images for a flat single-tab doc', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetchResponse(200, {
          tabs: [
            {
              tabProperties: { tabId: 'tab-1', title: 'Main', index: 0, nestingLevel: 0 },
              documentTab: {},
            },
          ],
        })
      );

      const result = await fetchDocumentSelection(DOC_ID, TOKEN);
      expect(result.tabs).toEqual([{ id: 'tab-1', title: 'Main', index: 0 }]);
      expect(result.imageCount).toBe(0);
    });

    it('flattens nested child tabs into a single list', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetchResponse(200, {
          tabs: [
            {
              tabProperties: { tabId: 'parent', title: 'Parent', index: 0, nestingLevel: 0 },
              documentTab: {},
              childTabs: [
                {
                  tabProperties: { tabId: 'child-1', title: 'Child 1', index: 0, nestingLevel: 1 },
                  documentTab: {},
                },
                {
                  tabProperties: { tabId: 'child-2', title: 'Child 2', index: 1, nestingLevel: 1 },
                  documentTab: {},
                },
              ],
            },
          ],
        })
      );

      const result = await fetchDocumentSelection(DOC_ID, TOKEN);
      expect(result.tabs).toHaveLength(3);
      expect(result.tabs.map((t) => t.id)).toEqual(['parent', 'child-1', 'child-2']);
    });

    it('counts inlineObjects and positionedObjects across all tabs', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetchResponse(200, {
          tabs: [
            {
              tabProperties: { tabId: 'tab-1', title: 'Tab 1', index: 0, nestingLevel: 0 },
              documentTab: {
                inlineObjects: { img1: {}, img2: {} },
                positionedObjects: { pos1: {} },
              },
            },
            {
              tabProperties: { tabId: 'tab-2', title: 'Tab 2', index: 1, nestingLevel: 0 },
              documentTab: {
                inlineObjects: { img3: {} },
              },
            },
          ],
        })
      );

      const result = await fetchDocumentSelection(DOC_ID, TOKEN);
      expect(result.imageCount).toBe(4);
    });

    it('falls back to top-level inlineObjects when doc has no tabs', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetchResponse(200, {
          inlineObjects: { img1: {}, img2: {} },
          positionedObjects: { pos1: {} },
        })
      );

      const result = await fetchDocumentSelection(DOC_ID, TOKEN);
      expect(result.tabs).toHaveLength(0);
      expect(result.imageCount).toBe(3);
    });

    it('uses fallback tab id and title when tabProperties are missing', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetchResponse(200, {
          tabs: [{ documentTab: {} }],
        })
      );

      const result = await fetchDocumentSelection(DOC_ID, TOKEN);
      expect(result.tabs[0].id).toBe('tab-1');
      expect(result.tabs[0].title).toBe('Tab 1');
    });

    it('trims whitespace from tab titles', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetchResponse(200, {
          tabs: [
            {
              tabProperties: { tabId: 'tab-1', title: '  Introduction  ', index: 0 },
              documentTab: {},
            },
          ],
        })
      );

      const result = await fetchDocumentSelection(DOC_ID, TOKEN);
      expect(result.tabs[0].title).toBe('Introduction');
    });
  });

  describe('fetchDocumentSelection — HTTP behavior', () => {
    it('sends the auth header with the provided oauth token', async () => {
      const mockFetch = mockFetchResponse(200, { tabs: [] });
      vi.stubGlobal('fetch', mockFetch);

      await fetchDocumentSelection(DOC_ID, TOKEN);

      expect(mockFetch).toHaveBeenCalledWith(EXPECTED_URL, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
    });

    it('throws GOOGLE_DRIVE_AUTH_EXPIRED for 401 + UNAUTHENTICATED', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetchResponse(401, { error: { code: 401, status: 'UNAUTHENTICATED' } })
      );

      await expect(fetchDocumentSelection(DOC_ID, TOKEN)).rejects.toSatisfy(
        (e: unknown) =>
          e instanceof WorkflowRunError &&
          e.reason === WorkflowFailureReason.GOOGLE_DRIVE_AUTH_EXPIRED
      );
    });

    it('throws GOOGLE_DOCS_NOT_FOUND for 404', async () => {
      vi.stubGlobal('fetch', mockFetchResponse(404, { error: { code: 404 } }));

      await expect(fetchDocumentSelection(DOC_ID, TOKEN)).rejects.toSatisfy(
        (e: unknown) =>
          e instanceof WorkflowRunError && e.reason === WorkflowFailureReason.GOOGLE_DOCS_NOT_FOUND
      );
    });

    it('throws GOOGLE_DOCS_NOT_FOUND for PERMISSION_DENIED (not auth-expired)', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetchResponse(403, { error: { code: 403, status: 'PERMISSION_DENIED' } })
      );

      await expect(fetchDocumentSelection(DOC_ID, TOKEN)).rejects.toSatisfy(
        (e: unknown) =>
          e instanceof WorkflowRunError && e.reason === WorkflowFailureReason.GOOGLE_DOCS_NOT_FOUND
      );
    });

    it('does NOT treat 401 + PERMISSION_DENIED as auth-expired', async () => {
      // PERMISSION_DENIED on a 401 means the doc is inaccessible, not that the token expired
      vi.stubGlobal(
        'fetch',
        mockFetchResponse(401, { error: { code: 401, status: 'PERMISSION_DENIED' } })
      );

      await expect(fetchDocumentSelection(DOC_ID, TOKEN)).rejects.toSatisfy(
        (e: unknown) =>
          e instanceof WorkflowRunError && e.reason === WorkflowFailureReason.GOOGLE_DOCS_NOT_FOUND
      );
    });

    it('throws GENERIC for unexpected non-OK status', async () => {
      vi.stubGlobal('fetch', mockFetchResponse(500, { error: { code: 500 } }));

      await expect(fetchDocumentSelection(DOC_ID, TOKEN)).rejects.toSatisfy(
        (e: unknown) => e instanceof WorkflowRunError && e.reason === WorkflowFailureReason.GENERIC
      );
    });

    it('throws GENERIC even when the error body is unparseable', async () => {
      vi.stubGlobal('fetch', () =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: () => Promise.reject(new Error('not json')),
        })
      );

      await expect(fetchDocumentSelection(DOC_ID, TOKEN)).rejects.toSatisfy(
        (e: unknown) => e instanceof WorkflowRunError && e.reason === WorkflowFailureReason.GENERIC
      );
    });
  });
});
