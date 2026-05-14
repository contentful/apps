import { handler } from '../../functions/checkEntryLinks';
import { vi } from 'vitest';

describe('checkEntryLinks handler', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch;
  });

  it('checks links from a targeted rich text field and returns a summary', async () => {
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
            body: {
              'en-US': {
                nodeType: 'document',
                content: [
                  {
                    nodeType: 'paragraph',
                    content: [
                      {
                        nodeType: 'hyperlink',
                        data: { uri: 'https://example.com/healthy' },
                        content: [{ nodeType: 'text', value: 'healthy' }],
                      },
                      {
                        nodeType: 'text',
                        value: ' and ',
                      },
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
          fields: [{ id: 'body', name: 'Body', type: 'RichText' }],
        }),
      },
    };

    const result = await handler(
      {
        body: {
          entryId: 'entry-123',
          fieldId: 'body',
          locale: 'en-US',
        },
      },
      {
        cma: mockCma as any,
        appInstallationParameters: {},
      } as any
    );

    expect(result.checkedCount).toBe(2);
    expect(result.validCount).toBe(1);
    expect(result.invalidCount).toBe(1);
    expect(result.skippedCount).toBe(0);
    expect(result.summary).toContain('Link Checker scanned 2 link(s)');
    expect(result.summary).toContain('https://example.com/healthy: HTTP 200');
    expect(result.summary).toContain('https://example.com/missing: HTTP 404');
  });

  it('resolves relative links with the configured base URL', async () => {
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
              'en-US': 'See /pricing for details.',
            },
          },
        }),
      },
      contentType: {
        get: vi.fn().mockResolvedValue({
          fields: [{ id: 'body', name: 'Body', type: 'Text' }],
        }),
      },
    };

    const result = await handler(
      {
        body: {
          entryId: 'entry-123',
          fieldId: 'body',
        },
      },
      {
        cma: mockCma as any,
        appInstallationParameters: {
          baseUrl: 'https://www.contentful.com',
        },
      } as any
    );

    expect(result.checkedCount).toBe(1);
    expect(result.results[0].resolvedUrl).toBe('https://www.contentful.com/pricing');
  });

  it('marks links invalid when they violate allow and deny lists', async () => {
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
              'en-US': 'Links: https://blocked.example.com and https://private.contentful.com',
            },
          },
        }),
      },
      contentType: {
        get: vi.fn().mockResolvedValue({
          fields: [{ id: 'body', name: 'Body', type: 'Text' }],
        }),
      },
    };

    const result = await handler(
      {
        body: {
          entryId: 'entry-123',
          fieldId: 'body',
        },
      },
      {
        cma: mockCma as any,
        appInstallationParameters: {
          allowedUrlPatterns: 'contentful.com',
          forbiddenUrlPatterns: 'private.contentful.com',
        },
      } as any
    );

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.invalidCount).toBe(2);
    expect(result.results[0].error).toBe('Not on allow list');
    expect(result.results[1].error).toBe('On deny list');
  });

  it('throws when the requested field does not exist', async () => {
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
          fields: {},
        }),
      },
      contentType: {
        get: vi.fn().mockResolvedValue({
          fields: [{ id: 'body', name: 'Body', type: 'RichText' }],
        }),
      },
    };

    await expect(
      handler(
        {
          body: {
            entryId: 'entry-123',
            fieldId: 'missingField',
          },
        },
        {
          cma: mockCma as any,
          appInstallationParameters: {},
        } as any
      )
    ).rejects.toThrow('Field missingField was not found on the content type.');
  });
});
