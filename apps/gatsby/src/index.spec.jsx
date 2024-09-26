/* global global */
import { render } from 'react-dom';
import { vi } from 'vitest';

function loadEntryPoint() {
  vi.resetModules(() => {
    require('./index');
  });
}

vi.mock('react-dom');

const mockSdk = {
  location: {
    is: (val) => val === 'entry-sidebar',
  },
  parameters: {
    installation: {
      previewUrl: 'https://preview.com',
      webhookUrl: 'https://webhook.com',
      authToken: 'test-token',
    },
  },
  hostnames: {
    webapp: 'app.contentful.com',
  },
  entry: {
    onSysChanged: vi.fn(() => ({
      id: '123',
      space: {
        sys: {
          id: '456',
        },
      },
      updatedAt: '2390-08-23T15:27:27.861Z',
    })),
    fields: {
      slug: {
        getValue: vi.fn(() => 'preview-slug'),
      },
    },
  },
  window: {
    startAutoResizer: vi.fn(),
  },
  notifier: {
    success: vi.fn(),
    error: vi.fn(),
  },
};

function doSdkMock() {
  vi.doMock('@contentful/app-sdk', () => {
    return {
      __esModule: true,
      init: vi.fn((fn) => fn(mockSdk)),
      locations: {
        LOCATION_ENTRY_SIDEBAR: 'entry-sidebar',
      },
    };
  });
}

let fetchSpy;
let getElementByIdSpy;
describe('Gatsby Preview entry point', () => {
  beforeEach(() => {
    fetchSpy = vi.spyOn(window, 'fetch');
    fetchSpy.mockImplementation(() => Promise.resolve());

    getElementByIdSpy = vi.spyOn(document, 'getElementById');
    getElementByIdSpy.mockImplementation((id) => id);

    doSdkMock();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    getElementByIdSpy.mockRestore();
    render.mockClear();
    vi.unmock('@contentful/app-sdk');
  });

  it('should initialize the app', async () => {
    await import('./index');
    // loadEntryPoint();

    console.log(render.mock.calls);
    const [renderedComponent, root] = render.mock.calls[0];
    expect(renderedComponent.props).toEqual({ sdk: mockSdk });
    expect(root).toEqual('root');
  });
});
