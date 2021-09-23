/* global global */
import React from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';

import Sidebar from './Sidebar';

const getMockContent = () => ({
  id: '456',
  space: {
    sys: {
      id: '123',
    },
  },
  updatedAt: '2390-08-23T15:27:27.861Z',
});

const getMockSdk = () => ({
  location: {
    is: val => val === 'entry-sidebar'
  },
  parameters: {
    installation: {
      previewUrl: 'https://preview.com',
      webhookUrl: 'https://webhook.com',
      authToken: 'test-token'
    }
  },
  entry: {
    onSysChanged: jest.fn((cb) => {
      cb(getMockContent());
    }),
    getSys: jest.fn(() => getMockContent()),
    fields: {
      slug: {
        getValue: jest.fn(() => 'preview-slug')
      }
    }
  },
  window: {
    startAutoResizer: jest.fn()
  }
});

describe('Gatsby App Sidebar', () => {
  let mockSdk;
  afterEach(cleanup);
  beforeEach(() => {
    mockSdk = getMockSdk();
    mockSdk.entry.getSys.mockReturnValue(getMockContent());
  });

  it('should match snapshot', () => {
    const { container } = render(<Sidebar sdk={mockSdk} />);

    expect(container).toMatchSnapshot();
  });

  it('should call window.fetch and window.open with the correct urls when a user has not added a Content Sync Url', async () => {
    const mockFetch = jest.fn(() => Promise.resolve());
    const mockWindowOpen = jest.fn();
    global.fetch = mockFetch;
    global.open = mockWindowOpen;
    const { getByText } = render(<Sidebar sdk={mockSdk} />);
    
    fireEvent(
      getByText('Open Preview'),
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    );

    expect(mockFetch.mock.calls[0][0]).toEqual('https://webhook.com');
    expect(mockWindowOpen.mock.calls[0][0]).toEqual('https://preview.com');
  });

  it('should call window.fetch and window.open with the correct urls when a user has added a Content Sync Url', async () => {
    const mockFetch = jest.fn(() => Promise.resolve());
    const mockWindowOpen = jest.fn();
    global.fetch = mockFetch;
    global.open = mockWindowOpen;

    const contentSyncUrl = 'https://content-sync.com/content-sync/fake-site-id';
    mockSdk.parameters.installation.contentSyncUrl = contentSyncUrl;

    const { getByText } = render(<Sidebar sdk={mockSdk} />);
    
    fireEvent(
      getByText('Open Preview'),
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      }),
    );

    expect(mockFetch.mock.calls[0][0]).toEqual('https://webhook.com');
    /**
     * The expected url should be in the form of:
     * {contentSyncUrl - from gatsby dashboard which includes the site id}/{the source plugin name}/{manifestId}
     */
    const pluginName = 'gatsby-source-contentful'
    const expectedManifestId = '123-456-2390-08-23T15:27:27.861Z';
    const expectedUrl = `${contentSyncUrl}/${pluginName}/${expectedManifestId}`;
    expect(mockWindowOpen).toBeCalledWith(expectedUrl);
  });
});
