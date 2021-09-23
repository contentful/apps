/* global global */
import { render } from 'react-dom';

jest.mock('react-dom')


function loadEntryPoint() {
  jest.isolateModules(() => {
    require('./index');
  });
}

jest.mock('react-dom');

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
    onSysChanged: jest.fn(() => ({
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
        getValue: jest.fn(() => 'preview-slug')
      }
    }
  },
  window: {
    startAutoResizer: jest.fn()
  },
  notifier: {
    success: jest.fn(),
    error: jest.fn()
  }
};

function doSdkMock() {
  jest.doMock('@contentful/app-sdk', () => {
    return {
      __esModule: true,
      init: jest.fn(fn => fn(mockSdk)),
      locations: {
        LOCATION_ENTRY_SIDEBAR: 'entry-sidebar'
      }
    };
  });
}

let fetchSpy
let getElementByIdSpy
describe('Gatsby Preview entry point', () => {
  beforeEach(() => {
    fetchSpy = jest.spyOn(window, "fetch");
    fetchSpy.mockImplementation(() => Promise.resolve())

    getElementByIdSpy = jest.spyOn(document, "getElementById");
    getElementByIdSpy.mockImplementation(id => id)

    doSdkMock();
  });

  afterEach(() => {
    fetchSpy.mockRestore()
    getElementByIdSpy.mockRestore()
    render.mockClear();
    jest.unmock('@contentful/app-sdk');
  });

  it('should initialize the app', () => {
    loadEntryPoint();

    const [renderedComponent, root] = render.mock.calls[0];
    expect(renderedComponent.props).toEqual({ sdk: mockSdk });
    expect(root).toEqual('root');
  });
});
