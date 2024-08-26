import { vi } from 'vitest';
import { locations } from '@contentful/app-sdk';
import AppConfig from '@components/AppConfig/AppConfig';

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
      <AppConfig
        sdk={expect.anything()}
        name="SAP Commerce Cloud App"
        description={expect.any(String)}
        logo={expect.any(String)}
        color={expect.any(String)}
        parameterDefinitions={expect.any(Array)}
        validateParameters={expect.any(Function)}
      />
    );
  });
});
