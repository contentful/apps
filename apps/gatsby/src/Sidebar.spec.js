/* global global */
import React from 'react';
import { render, cleanup, wait } from '@testing-library/react';

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

  it('should match snapshot', () => {
    mockSdk.entry.getSys.mockReturnValue(getMockContent());
    const { container } = render(<Sidebar sdk={mockSdk} />);

    expect(container).toMatchSnapshot();
  });

  it('should call onSysChanged and create a manifestId', async () => {
    const mockFetch = jest.fn(() => Promise.resolve());
    global.fetch = mockFetch;
    mockSdk.entry.onSysChanged.mockImplementationOnce(fn => {
      fn({ ...getMockContent() });
      return jest.fn();
    });

    mockSdk.entry.getSys.mockReturnValue(getMockContent());

    render(<Sidebar sdk={mockSdk} />);
  });
});
