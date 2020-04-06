/* global global */
import React from 'react';
import { render, cleanup, wait } from '@testing-library/react';

import Sidebar from './Sidebar';

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
    onSysChanged: jest.fn(),
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
    const { container } = render(<Sidebar sdk={mockSdk} />);

    expect(container).toMatchSnapshot();
  });

  it('should debounce the fetch', async () => {
    const mockFetch = jest.fn(() => Promise.resolve());
    let timerComplete = false;
    global.fetch = mockFetch;
    mockSdk.entry.onSysChanged.mockImplementationOnce(fn => {
      fn();
      setTimeout(() => {
        timerComplete = true;
      }, 1000);
      return jest.fn();
    });

    render(<Sidebar sdk={mockSdk} />);

    await wait(
      () => {
        if (timerComplete) {
          return;
        }
        throw 0;
      },
      { timeout: 5000 }
    );

    expect(mockFetch).toHaveBeenCalledWith('https://webhook.com', {
      body: '{}',
      headers: {
        'Content-Type': 'application/json',
        'x-preview-auth-token': 'test-token',
        'x-preview-update-source': 'contentful-sidebar-extension'
      },
      method: 'POST'
    });
  });
});
