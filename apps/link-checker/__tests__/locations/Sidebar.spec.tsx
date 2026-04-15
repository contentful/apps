import React from 'react';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { mockCma, mockSdk } from '../mocks';
import Sidebar from '@/components/locations/Sidebar';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
  useAutoResizer: () => {},
}));

describe('Sidebar component', () => {
  beforeEach(() => {
    mockSdk.parameters.installation = {};
    mockSdk.entry.fields = {};
    mockSdk.cma = {};
  });

  it('renders the Check links button', () => {
    render(<Sidebar />);
    expect(screen.getByRole('button', { name: /check links/i })).toBeInTheDocument();
  });

  it('shows no-URLs message when entry has no fields with URLs and user runs check', async () => {
    mockSdk.entry.fields = {};
    render(<Sidebar />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /check links/i }));
    });

    await screen.findByText(/no URLs found/i);
  });

  it('flags links that are not on the allow list before calling the app action', async () => {
    const createWithResponse = vi.fn();

    mockSdk.parameters.installation = {
      allowedUrlPatterns: 'contentful.com',
    };
    mockSdk.entry.fields = {
      body: {
        id: 'body',
        name: 'Body',
        type: 'Text',
        locales: ['en-US'],
        getValue: () => 'Visit https://example.com for more details.',
      },
    };
    mockSdk.cma = {
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

    render(<Sidebar />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /check links/i }));
    });

    await screen.findByText(/not on allow list/i);
    expect(createWithResponse).not.toHaveBeenCalled();
  });

  it('does not allow spoofed hostnames that only contain the pattern', async () => {
    const createWithResponse = vi.fn();

    mockSdk.parameters.installation = {
      allowedUrlPatterns: 'contentful.com',
    };
    mockSdk.entry.fields = {
      body: {
        id: 'body',
        name: 'Body',
        type: 'Text',
        locales: ['en-US'],
        getValue: () => 'Visit https://contentful.com.evil.test/path for more details.',
      },
    };
    mockSdk.cma = {
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

    render(<Sidebar />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /check links/i }));
    });

    await screen.findByText(/not on allow list/i);
    expect(createWithResponse).not.toHaveBeenCalled();
  });

  it('does not implicitly allow the current domain when the allow list is configured', async () => {
    const createWithResponse = vi.fn();

    mockSdk.parameters.installation = {
      baseUrl: 'https://contentful.com',
      allowedUrlPatterns: 'ally.com',
    };
    mockSdk.entry.fields = {
      body: {
        id: 'body',
        name: 'Body',
        type: 'Text',
        locales: ['en-US'],
        getValue: () => 'Visit /help for more details.',
      },
    };
    mockSdk.cma = {
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

    render(<Sidebar />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /check links/i }));
    });

    await screen.findByText(/not on allow list/i);
    expect(screen.getByRole('link', { name: '/help' })).toHaveAttribute(
      'href',
      'https://contentful.com/help'
    );
    expect(createWithResponse).not.toHaveBeenCalled();
  });

  it('checks www URLs as absolute https URLs instead of resolving them against the current domain', async () => {
    const createWithResponse = vi.fn().mockResolvedValue({
      response: { body: JSON.stringify({ status: 200 }) },
    });

    mockSdk.parameters.installation = {
      baseUrl: 'https://contentful.com',
    };
    mockSdk.entry.fields = {
      body: {
        id: 'body',
        name: 'Body',
        type: 'Text',
        locales: ['en-US'],
        getValue: () => 'Visit www.example.com/help for more details.',
      },
    };
    mockSdk.cma = {
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

    render(<Sidebar />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /check links/i }));
    });

    await screen.findByText(/1 valid link/i);

    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox', { name: /show valid links/i }));
    });

    expect(screen.getByRole('link', { name: 'https://www.example.com/help' })).toHaveAttribute(
      'href',
      'https://www.example.com/help'
    );
    expect(createWithResponse).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        parameters: { url: 'https://www.example.com/help' },
      })
    );
  });

  it('shows only non-invalid results when remaining links are expanded', async () => {
    const createWithResponse = vi
      .fn()
      .mockResolvedValueOnce({ response: { body: JSON.stringify({ status: 404 }) } })
      .mockResolvedValueOnce({ response: { body: JSON.stringify({ status: 200 }) } });

    mockSdk.entry.fields = {
      body: {
        id: 'body',
        name: 'Body',
        type: 'Text',
        locales: ['en-US'],
        getValue: () =>
          'Broken https://broken.example.com and valid https://www.contentful.com/help',
      },
    };
    mockSdk.cma = {
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

    render(<Sidebar />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /check links/i }));
    });

    await screen.findByText(/1 invalid link/i);
    expect(screen.getByRole('checkbox', { name: /show valid links/i })).toBeInTheDocument();
    expect(screen.getByText(/1 valid link/i)).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox', { name: /show valid links/i }));
    });

    expect(screen.getByText('https://www.contentful.com/help')).toBeInTheDocument();
    expect(screen.queryAllByText('https://broken.example.com')).toHaveLength(1);
  });
});
