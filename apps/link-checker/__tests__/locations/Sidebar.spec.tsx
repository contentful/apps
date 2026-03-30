import React from 'react';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { mockCma, mockSdk } from '../mocks';
import Sidebar from '@/components/locations/Sidebar';

jest.mock('@contentful/react-apps-toolkit', () => ({
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
    const createWithResponse = jest.fn();

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
        getMany: jest.fn().mockResolvedValue({
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
});
