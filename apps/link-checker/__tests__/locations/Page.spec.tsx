import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { mockSdk } from '../mocks';
import Page from '@/components/locations/Page';

const triggerVisibilityChange = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
};

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
    fireEvent.click(screen.getByRole('button', { name: 'Find links' }));

    await screen.findByText('https://example.invalid/not-found');

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
    fireEvent.click(screen.getByRole('button', { name: 'Find links' }));

    await screen.findByText('/help');

    fireEvent.click(screen.getByRole('button', { name: 'Run scan' }));

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
    fireEvent.click(screen.getByRole('button', { name: 'Find links' }));

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
    fireEvent.click(screen.getByRole('button', { name: 'Find links' }));

    await screen.findByText('https://contentful.com.evil.test/path');

    fireEvent.click(screen.getByRole('button', { name: 'Run scan' }));

    await screen.findByText(/not on allow list/i);
    await waitFor(() => {
      expect(createWithResponse).not.toHaveBeenCalled();
    });
  });

  it('reloads when installation parameters have changed on visibility restored', async () => {
    const reload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload },
      configurable: true,
      writable: true,
    });

    mockSdk.cma.appInstallation = {
      getForOrganization: vi.fn().mockResolvedValue({
        items: [
          {
            sys: {
              space: { sys: { id: mockSdk.ids.space } },
              environment: { sys: { id: mockSdk.ids.environment } },
            },
            parameters: {
              selectedContentTypeIds: ['article'],
              allowedUrlPatterns: 'new-domain.com',
            },
          },
        ],
      }),
    };

    render(<Page />);

    triggerVisibilityChange('hidden');
    triggerVisibilityChange('visible');

    await waitFor(() => {
      expect(reload).toHaveBeenCalled();
    });
  });

  it('does not reload when installation parameters are unchanged on visibility restored', async () => {
    const reload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload },
      configurable: true,
      writable: true,
    });

    mockSdk.parameters.installation = { selectedContentTypeIds: ['article'] };

    mockSdk.cma.appInstallation = {
      getForOrganization: vi.fn().mockResolvedValue({
        items: [
          {
            sys: {
              space: { sys: { id: mockSdk.ids.space } },
              environment: { sys: { id: mockSdk.ids.environment } },
            },
            parameters: { selectedContentTypeIds: ['article'] },
          },
        ],
      }),
    };

    render(<Page />);

    triggerVisibilityChange('hidden');
    triggerVisibilityChange('visible');

    await waitFor(() => {
      expect(mockSdk.cma.appInstallation.getForOrganization).toHaveBeenCalled();
    });
    expect(reload).not.toHaveBeenCalled();
  });

  it('does not reload when installation parameters match but CMA returns keys in different order', async () => {
    const reload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload },
      configurable: true,
      writable: true,
    });

    mockSdk.parameters.installation = {
      allowedUrlPatterns: 'example.com',
      selectedContentTypeIds: ['article'],
    };

    mockSdk.cma.appInstallation = {
      getForOrganization: vi.fn().mockResolvedValue({
        items: [
          {
            sys: {
              space: { sys: { id: mockSdk.ids.space } },
              environment: { sys: { id: mockSdk.ids.environment } },
            },
            // Same values, different key order — must not trigger spurious reload
            parameters: { selectedContentTypeIds: ['article'], allowedUrlPatterns: 'example.com' },
          },
        ],
      }),
    };

    render(<Page />);

    triggerVisibilityChange('hidden');
    triggerVisibilityChange('visible');

    await waitFor(() => {
      expect(mockSdk.cma.appInstallation.getForOrganization).toHaveBeenCalled();
    });
    expect(reload).not.toHaveBeenCalled();
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
    fireEvent.click(screen.getByRole('button', { name: 'Find links' }));

    await screen.findByRole('link', { name: 'https://www.example.com/help' });

    fireEvent.click(screen.getByRole('button', { name: 'Run scan' }));

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
