/* global global */
import React from 'react';
import { render, cleanup, wait, fireEvent } from '@testing-library/react';

import Sidebar from './Sidebar';

const getMockContent = () => ({
  id: '123',
  space: {
    sys: {
      id: '456',
    },
  },
  updatedAt: '2390-08-23T15:27:27.861Z',
});

const mockSdk = {
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
};


describe('Gatsby App Sidebar', () => {
  afterEach(cleanup);
  beforeEach(() => {
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
    mockSdk.entry.onSysChanged.mockImplementationOnce(fn => {
      fn({ ...getMockContent() });
      return jest.fn();
    });

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

  it('should call window.fetch and window.open with the correct urls when a user has added a Content Sync Url', async () => {});
});
