import { handler } from '../../functions/checkAllEntryLinks';
import { vi } from 'vitest';

describe('checkAllEntryLinks handler', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch;
  });

  it('checks links across supported fields and returns a combined summary', async () => {
    mockFetch
      .mockResolvedValueOnce({ status: 200, ok: true })
      .mockResolvedValueOnce({ status: 404, ok: false })
      .mockResolvedValueOnce({ status: 404, ok: false });

    const mockCma = {
      entry: {
        get: vi.fn().mockResolvedValue({
          sys: {
            contentType: {
              sys: {
                id: 'post',
              },
            },
          },
          fields: {
            ctaUrl: {
              'en-US': 'https://example.com/healthy',
            },
            body: {
              'en-US': {
                nodeType: 'document',
                content: [
                  {
                    nodeType: 'paragraph',
                    content: [
                      {
                        nodeType: 'hyperlink',
                        data: { uri: 'https://example.com/missing' },
                        content: [{ nodeType: 'text', value: 'missing' }],
                      },
                    ],
                  },
                ],
              },
            },
          },
        }),
      },
      contentType: {
        get: vi.fn().mockResolvedValue({
          fields: [
            { id: 'ctaUrl', name: 'CTA URL', type: 'Symbol' },
            { id: 'body', name: 'Body', type: 'RichText' },
            { id: 'views', name: 'Views', type: 'Number' },
          ],
        }),
      },
    };

    const result = await handler(
      {
        body: {
          entryId: 'entry-123',
          locale: 'en-US',
        },
      },
      {
        cma: mockCma as any,
        appInstallationParameters: {},
      } as any
    );

    expect(result.checkedFieldIds).toEqual(['ctaUrl', 'body']);
    expect(result.checkedCount).toBe(2);
    expect(result.validCount).toBe(1);
    expect(result.invalidCount).toBe(1);
    expect(result.summary).toContain('across 2 field(s)');
    expect(result.summary).toContain('CTA URL (en-US): https://example.com/healthy HTTP 200');
    expect(result.summary).toContain('Body (en-US): https://example.com/missing HTTP 404');
  });

  it('supports restricting the scan to specific field ids', async () => {
    mockFetch.mockResolvedValueOnce({ status: 200, ok: true });

    const mockCma = {
      entry: {
        get: vi.fn().mockResolvedValue({
          sys: {
            contentType: {
              sys: {
                id: 'post',
              },
            },
          },
          fields: {
            ctaUrl: {
              'en-US': 'https://example.com/healthy',
            },
            body: {
              'en-US': 'https://example.com/ignored',
            },
          },
        }),
      },
      contentType: {
        get: vi.fn().mockResolvedValue({
          fields: [
            { id: 'ctaUrl', name: 'CTA URL', type: 'Symbol' },
            { id: 'body', name: 'Body', type: 'Text' },
          ],
        }),
      },
    };

    const result = await handler(
      {
        body: {
          entryId: 'entry-123',
          fieldIds: ['ctaUrl'],
        },
      },
      {
        cma: mockCma as any,
        appInstallationParameters: {},
      } as any
    );

    expect(result.checkedFieldIds).toEqual(['ctaUrl']);
    expect(result.checkedCount).toBe(1);
    expect(result.results).toHaveLength(1);
    expect(result.results[0].fieldId).toBe('ctaUrl');
  });

  it('skips fields that do not have the requested locale instead of aborting the scan', async () => {
    mockFetch.mockResolvedValueOnce({ status: 200, ok: true });

    const mockCma = {
      entry: {
        get: vi.fn().mockResolvedValue({
          sys: {
            contentType: {
              sys: {
                id: 'post',
              },
            },
          },
          fields: {
            body: {
              'en-US': 'https://example.com/ignored-for-locale',
            },
            ctaUrl: {
              'de-DE': 'https://example.com/checked',
            },
          },
        }),
      },
      contentType: {
        get: vi.fn().mockResolvedValue({
          fields: [
            { id: 'body', name: 'Body', type: 'Text' },
            { id: 'ctaUrl', name: 'CTA URL', type: 'Symbol' },
          ],
        }),
      },
    };

    const result = await handler(
      {
        body: {
          entryId: 'entry-123',
          locale: 'de-DE',
        },
      },
      {
        cma: mockCma as any,
        appInstallationParameters: {},
      } as any
    );

    expect(result.checkedFieldIds).toEqual(['ctaUrl']);
    expect(result.checkedCount).toBe(1);
    expect(result.results[0].fieldId).toBe('ctaUrl');
  });

  it('uses hostname-aware allow list matching for all-fields scans', async () => {
    const mockCma = {
      entry: {
        get: vi.fn().mockResolvedValue({
          sys: {
            contentType: {
              sys: {
                id: 'post',
              },
            },
          },
          fields: {
            ctaUrl: {
              'en-US': 'https://notcontentful.com/landing',
            },
          },
        }),
      },
      contentType: {
        get: vi.fn().mockResolvedValue({
          fields: [{ id: 'ctaUrl', name: 'CTA URL', type: 'Symbol' }],
        }),
      },
    };

    const result = await handler(
      {
        body: {
          entryId: 'entry-123',
        },
      },
      {
        cma: mockCma as any,
        appInstallationParameters: {
          allowedUrlPatterns: 'contentful.com',
        },
      } as any
    );

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.invalidCount).toBe(1);
    expect(result.results[0].error).toBe('Not on allow list');
  });
});
