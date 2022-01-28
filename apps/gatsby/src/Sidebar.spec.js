/* global global */
import React from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';

import Sidebar from './Sidebar';

const PREVIEW_URL = 'https://preview.com';
const WEBHOOK_URL = 'https://webhook.com';

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
    is: (val) => val === 'entry-sidebar',
  },
  parameters: {
    installation: {
      previewUrl: PREVIEW_URL,
      webhookUrl: WEBHOOK_URL,
      authToken: 'test-token',
    },
  },
  entry: {
    onSysChanged: jest.fn((cb) => {
      cb(getMockContent());
    }),
    getSys: jest.fn(() => getMockContent()),
    fields: {
      slug: {
        getValue: jest.fn(() => 'preview-slug'),
      },
    },
  },
  window: {
    startAutoResizer: jest.fn(),
  },
  ids: {
    contentType: `content-type`,
    entry: `entry-id`,
  },
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
    const mockFetch = jest.fn(() => Promise.resolve({ ok: true }));
    const mockWindowOpen = jest.fn();

    global.fetch = mockFetch;
    global.open = mockWindowOpen;

    const { getByText } = render(<Sidebar sdk={mockSdk} />);

    expect(mockSdk.entry.onSysChanged).toBeCalled();

    fireEvent(
      getByText('Open Preview'),
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      })
    );

    await new Promise((res) => setTimeout(res, 2000));
    expect(mockFetch).toBeCalledWith(WEBHOOK_URL, expect.anything());
    expect(mockWindowOpen).toBeCalledWith(PREVIEW_URL);
  });

  it('should call window.fetch and window.open with the correct urls when a user has added a Content Sync Url', async () => {
    const mockFetch = jest.fn(() => Promise.resolve({ ok: true }));
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
      })
    );

    await new Promise((res) => setTimeout(res, 3000));

    expect(mockFetch).toBeCalledWith(WEBHOOK_URL, expect.anything());
    /**
     * The expected url should be in the form of:
     * {contentSyncUrl - from gatsby dashboard which includes the site id}/{the source plugin name}/{manifestId}
     */
    const pluginName = 'gatsby-source-contentful';
    const expectedManifestId = '123-456-2390-08-23T15:27:27.861Z';
    const contentId = btoa(`content-typeentry-id`);
    const expectedUrl = `${contentSyncUrl}/${pluginName}/${expectedManifestId}/${contentId}`;
    expect(mockWindowOpen).toBeCalledWith(expectedUrl, `GATSBY_TAB`);
  });
});
