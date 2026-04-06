import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { mockSdk } from '../mocks';
import Page from '@/components/locations/Page';

jest.mock('@contentful/react-apps-toolkit', () => ({
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
        getMany: jest.fn().mockResolvedValue({
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
        getMany: jest.fn().mockResolvedValue({
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
        createWithResponse: jest.fn().mockResolvedValue({
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
});
