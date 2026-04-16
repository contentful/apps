import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { mockSdk } from '../mocks';
import Page from '@/components/locations/Page';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
}));

describe('Page component', () => {
  beforeEach(() => {
    mockSdk.parameters.installation = {
      selectedContentTypeIds: ['article'],
    };
    mockSdk.app.getCurrentState.mockResolvedValue({
      EditorInterface: {
        article: { sidebar: { position: 1 } },
      },
    });
    mockSdk.cma = {
      contentType: {
        getMany: vi.fn().mockResolvedValue({
          items: [
            {
              sys: { id: 'article' },
              name: 'Article',
              displayField: 'title',
              fields: [
                { id: 'title', name: 'Title', type: 'Symbol' },
                { id: 'body', name: 'Body', type: 'Text' },
              ],
            },
          ],
        }),
      },
      entry: {
        getMany: vi.fn().mockResolvedValue({
          items: [
            {
              sys: {
                id: 'entry-1',
                contentType: { sys: { id: 'article' } },
              },
              fields: {
                title: { 'en-US': 'Release Notes' },
                body: { 'en-US': 'Visit https://example.invalid/not-found' },
              },
            },
          ],
        }),
      },
      appAction: {
        getMany: vi.fn().mockResolvedValue({
          items: [
            {
              sys: {
                id: 'check-link-action',
                appDefinition: { sys: { id: mockSdk.ids.app } },
              },
              function: { sys: { id: 'checkLink' } },
            },
          ],
        }),
      },
      appActionCall: {
        createWithResponse: vi.fn().mockResolvedValue({
          response: { body: JSON.stringify({ status: 404 }) },
        }),
      },
    };
  });

  it('renders scanned links in the page table', async () => {
    render(<Page />);
    fireEvent.click(screen.getByRole('button', { name: 'Run scan' }));

    await screen.findByText('https://example.invalid/not-found');
  });

  it('does not implicitly allow the current domain when the allow list is configured', async () => {
    mockSdk.parameters.installation = {
      selectedContentTypeIds: ['article'],
      baseUrl: 'https://contentful.com',
      allowedUrlPatterns: 'ally.com',
    };
    mockSdk.cma = {
      contentType: {
        getMany: vi.fn().mockResolvedValue({
          items: [
            {
              sys: { id: 'article' },
              name: 'Article',
              displayField: 'title',
              fields: [
                { id: 'title', name: 'Title', type: 'Symbol' },
                { id: 'body', name: 'Body', type: 'Text' },
              ],
            },
          ],
        }),
      },
      entry: {
        getMany: vi.fn().mockResolvedValue({
          items: [
            {
              sys: {
                id: 'entry-1',
                contentType: { sys: { id: 'article' } },
              },
              fields: {
                title: { 'en-US': 'Release Notes' },
                body: { 'en-US': 'Visit /help' },
              },
            },
          ],
        }),
      },
      appAction: {
        getMany: vi.fn().mockResolvedValue({
          items: [
            {
              sys: {
                id: 'check-link-action',
                appDefinition: { sys: { id: mockSdk.ids.app } },
              },
              function: { sys: { id: 'checkLink' } },
            },
          ],
        }),
      },
      appActionCall: {
        createWithResponse: vi.fn(),
      },
    };

    render(<Page />);
    fireEvent.click(screen.getByRole('button', { name: 'Run scan' }));

    await screen.findByText('/help');
    await screen.findByText(/not on allow list/i);
    expect(screen.getByText(/resolves to https:\/\/contentful.com\/help/i)).toBeInTheDocument();
    expect(mockSdk.cma.appActionCall.createWithResponse).not.toHaveBeenCalled();
  });

  it('does not scan every entry when assigned content types have no supported fields', async () => {
    const getMany = vi.fn().mockResolvedValue({
      items: [
        {
          sys: { id: 'article' },
          name: 'Article',
          displayField: 'title',
          fields: [{ id: 'heroImage', name: 'Hero image', type: 'Link' }],
        },
      ],
    });
    const getEntries = vi.fn();

    mockSdk.cma = {
      contentType: {
        getMany,
      },
      entry: {
        getMany: getEntries,
      },
      appAction: {
        getMany: vi.fn(),
      },
      appActionCall: {
        createWithResponse: vi.fn(),
      },
    };

    render(<Page />);
    fireEvent.click(screen.getByRole('button', { name: 'Run scan' }));

    await screen.findByText(
      /do not contain any supported Symbol, Text, Rich Text, or matching list fields/i
    );
    expect(getEntries).not.toHaveBeenCalled();
  });

  it('does not allow spoofed hostnames that only contain the pattern', async () => {
    const createWithResponse = vi.fn();

    mockSdk.parameters.installation = {
      selectedContentTypeIds: ['article'],
      allowedUrlPatterns: 'contentful.com',
    };
    mockSdk.cma = {
      contentType: {
        getMany: vi.fn().mockResolvedValue({
          items: [
            {
              sys: { id: 'article' },
              name: 'Article',
              displayField: 'title',
              fields: [
                { id: 'title', name: 'Title', type: 'Symbol' },
                { id: 'body', name: 'Body', type: 'Text' },
              ],
            },
          ],
        }),
      },
      entry: {
        getMany: vi
          .fn()
          .mockResolvedValueOnce({
            items: [
              {
                sys: {
                  id: 'entry-1',
                  contentType: { sys: { id: 'article' } },
                },
                fields: {
                  title: { 'en-US': 'Release Notes' },
                  body: { 'en-US': 'Visit https://contentful.com.evil.test/path' },
                },
              },
            ],
          })
          .mockResolvedValueOnce({ items: [] }),
      },
      appAction: {
        getMany: vi.fn().mockResolvedValue({
          items: [
            {
              sys: {
                id: 'check-link-action',
                appDefinition: { sys: { id: mockSdk.ids.app } },
              },
              function: { sys: { id: 'checkLink' } },
            },
          ],
        }),
      },
      appActionCall: {
        createWithResponse,
      },
    };

    render(<Page />);
    fireEvent.click(screen.getByRole('button', { name: 'Run scan' }));

    await screen.findByText(/not on allow list/i);
    await waitFor(() => {
      expect(createWithResponse).not.toHaveBeenCalled();
    });
  });

  it('checks www URLs as absolute https URLs instead of resolving them against the current domain', async () => {
    const createWithResponse = vi.fn().mockResolvedValue({
      response: { body: JSON.stringify({ status: 200 }) },
    });

    mockSdk.parameters.installation = {
      selectedContentTypeIds: ['article'],
      baseUrl: 'https://contentful.com',
    };
    mockSdk.cma = {
      contentType: {
        getMany: vi.fn().mockResolvedValue({
          items: [
            {
              sys: { id: 'article' },
              name: 'Article',
              displayField: 'title',
              fields: [
                { id: 'title', name: 'Title', type: 'Symbol' },
                { id: 'body', name: 'Body', type: 'Text' },
              ],
            },
          ],
        }),
      },
      entry: {
        getMany: vi
          .fn()
          .mockResolvedValueOnce({
            items: [
              {
                sys: {
                  id: 'entry-1',
                  contentType: { sys: { id: 'article' } },
                },
                fields: {
                  title: { 'en-US': 'Release Notes' },
                  body: { 'en-US': 'Visit www.example.com/help' },
                },
              },
            ],
          })
          .mockResolvedValueOnce({ items: [] }),
      },
      appAction: {
        getMany: vi.fn().mockResolvedValue({
          items: [
            {
              sys: {
                id: 'check-link-action',
                appDefinition: { sys: { id: mockSdk.ids.app } },
              },
              function: { sys: { id: 'checkLink' } },
            },
          ],
        }),
      },
      appActionCall: {
        createWithResponse,
      },
    };

    render(<Page />);
    fireEvent.click(screen.getByRole('button', { name: 'Run scan' }));

    await screen.findByRole('link', { name: 'https://www.example.com/help' });
    expect(screen.getByRole('link', { name: 'https://www.example.com/help' })).toHaveAttribute(
      'href',
      'https://www.example.com/help'
    );
    await waitFor(() => {
      expect(createWithResponse).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          parameters: { url: 'https://www.example.com/help' },
        })
      );
    });
  });
});
