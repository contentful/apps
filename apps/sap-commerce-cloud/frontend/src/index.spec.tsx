import { mockCma } from '@__mocks__/mockCma';
import { makeSdkMock } from '@__mocks__/mockSdk';
import { locations } from '@contentful/app-sdk';
import AppConfig from '@components/AppConfig/AppConfig';
import { SDKProvider } from '@contentful/react-apps-toolkit';
import { PropsWithChildren } from 'react';
import { vi } from 'vitest';

let renderMock: any;

vi.mock('@contentful/app-sdk', () => ({
  init: vi.fn((cb) => {
    const sdk = {
      location: {
        is: vi.fn((location) => location === mockLocation),
      },
    };
    cb(sdk);
  }),
  locations: {
    LOCATION_APP_CONFIG: 'app-config',
    LOCATION_ENTRY_FIELD: 'entry-field',
    LOCATION_DIALOG: 'dialog',
  },
}));

let mockLocation: any = locations.LOCATION_APP_CONFIG;

document.body.innerHTML = '<div id="root"></div>';

describe('index.tsx', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mock('contentful-management', () => ({
      createClient: () => mockCma,
    }));

    const mockSdk = makeSdkMock();
    vi.mock('@contentful/react-apps-toolkit', () => ({
      useSDK: () => mockSdk,
      useCMA: () => mockCma,
      SDKProvider: ({ children }: PropsWithChildren<React.ReactNode>) => children,
    }));

    mockLocation = locations.LOCATION_APP_CONFIG;

    renderMock = vi.fn();
    vi.doMock('react-dom/client', () => ({
      createRoot: vi.fn().mockReturnValue({
        render: renderMock,
      }),
    }));
  });

  it('renders AppConfig component when location is LOCATION_APP_CONFIG', async () => {
    await import('./index');

    expect(renderMock).toHaveBeenCalledWith(
      <SDKProvider>
        <AppConfig
          name="SAP Commerce Cloud App"
          description={expect.any(String)}
          logo={expect.any(String)}
          color={expect.any(String)}
          parameterDefinitions={expect.any(Array)}
          validateParameters={expect.any(Function)}
        />
      </SDKProvider>
    );
  });
});
