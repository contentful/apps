import { act, render, screen, waitFor } from '@testing-library/react';
import { mockSdk, mockCma } from '../../../test/mocks';
import GoogleAnalyticsConfigPage from 'components/config-screen/GoogleAnalyticsConfigPage';
import { config } from '../../../src/config';
import { validServiceKeyFile, validServiceKeyId } from '../../../test/mocks';
import userEvent from '@testing-library/user-event';
import { ServiceAccountKey } from 'types';

const apiRoot = config.backendApiUrl;

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

jest.mock('contentful-management', () => ({
  createClient: () => mockCma,
}));

const RAW_SERVICE_ACCOUNT_KEY =
  '{"type":"service_account","project_id":"PROJECT_ID","private_key_id":"PRIVATE_KEY_ID","private_key":"----- PRIVATE_KEY-----","client_email":"example4@PROJECT_ID.iam.gserviceaccount.com","client_id":"CLIENT_ID","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/example4%40PROJECT_ID.iam.gserviceaccount.com"}';

// Helper to mock users clicking "save" -- return result of the callback passed to onConfigure()
const saveAppInstallation = async () => {
  // We manually call the LAST onConfigure() callback (this is important, as earlier calls have stale data)
  return await mockSdk.app.onConfigure.mock.calls.at(-1)[0]();
};

export const apiPath = (path: string) => {
  return new URL(path, apiRoot).toString();
};

describe('Google Analytics Page', () => {
  it('renders setup view', async () => {
    await act(async () => {
      render(<GoogleAnalyticsConfigPage />);
    });

    await screen.findByText('API access');
    await screen.findByText('Google Service Account Details');
  });
});

describe('Config Screen component (not installed)', () => {
  it('allows the app to be installed with a valid service key file', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<GoogleAnalyticsConfigPage />);
    });
    const keyFileInputBox = screen.getByLabelText(/Service Account Key/i);

    // user.type() got confused by the JSON string chars, so we'll just click and paste -- this
    // actually better recreates likely user behavior as a bonus
    await user.click(keyFileInputBox);
    await user.paste(JSON.stringify(validServiceKeyFile));

    await waitFor(() => {
      expect(screen.getByText('Service account key file is valid')).toBeInTheDocument();
    });

    let result;
    await act(async () => {
      result = await saveAppInstallation();
    });

    expect(result).toEqual({
      parameters: {
        serviceAccountKeyId: {
          clientEmail: 'example4@PROJECT_ID.iam.gserviceaccount.com',
          clientId: 'CLIENT_ID',
          id: 'PRIVATE_KEY_ID',
          projectId: 'PROJECT_ID',
        },
        rawServiceAccountKey: RAW_SERVICE_ACCOUNT_KEY,
      },
      targetState: {
        EditorInterface: {},
      },
    });
    expect(screen.getByText('Google Service Account Details')).toBeInTheDocument();
  });

  it('prevents the app from being installed with invalid service key file', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<GoogleAnalyticsConfigPage />);
    });

    const keyFileInputBox = screen.getByLabelText(/Service Account Key/i);

    // user.type() got confused by the JSON string chars, so we'll just click and paste -- this
    // actually better recreates likely user behavior as a bonus
    await user.click(keyFileInputBox);
    await user.paste('{ "foo": "bar" }');

    let result;
    await act(async () => {
      result = await saveAppInstallation();
    });

    // false result prevents parameters save
    expect(result).toEqual(false);
    expect(screen.getByText('Google Service Account Details')).toBeInTheDocument();
  });

  it('prevents the app from being installed if no service key file is provided', async () => {
    await act(async () => {
      render(<GoogleAnalyticsConfigPage />);
    });

    let result;
    await act(async () => {
      result = await saveAppInstallation();
    });

    // false result prevents parameters save
    expect(result).toEqual(false);
    expect(screen.getByText('Google Service Account Details')).toBeInTheDocument();
  });
});

describe('Installed Service Account Key', () => {
  beforeEach(() => {
    mockSdk.app.getParameters.mockReturnValue({
      serviceAccountKeyId: validServiceKeyId,
      propertyId: 'properties/1234',
      contentTypes: {
        course: { slugField: 'shortDescription', urlPrefix: 'about' },
      },
    });
    mockSdk.app.isInstalled.mockReturnValue(true);
  });

  it('overrides the saved values if a new key file is provided', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<GoogleAnalyticsConfigPage />);
    });

    const editServiceAccountButton = await screen.findByTestId('editServiceAccountButton');

    await user.click(editServiceAccountButton);
    const keyFileInputBox = screen.getByLabelText(/Service Account Key/i);
    await waitFor(() => user.click(keyFileInputBox));

    const newServiceKeyFile: ServiceAccountKey = {
      ...validServiceKeyFile,
      private_key_id: 'PRIVATE_KEY_ID',
    };
    await user.paste(JSON.stringify(newServiceKeyFile));

    await waitFor(() => {
      expect(screen.getByText('Service account key file is valid')).toBeInTheDocument();
    });

    let result;
    await act(async () => {
      result = await saveAppInstallation();
    });

    expect(result).toEqual({
      parameters: {
        serviceAccountKeyId: {
          clientEmail: 'example4@PROJECT_ID.iam.gserviceaccount.com',
          clientId: 'CLIENT_ID',
          id: 'PRIVATE_KEY_ID',
          projectId: 'PROJECT_ID',
        },
        rawServiceAccountKey: RAW_SERVICE_ACCOUNT_KEY,
        propertyId: 'properties/1234',
        contentTypes: {
          course: { slugField: 'shortDescription', urlPrefix: 'about' },
        },
      },
      targetState: {
        EditorInterface: {
          course: {
            sidebar: {
              position: 1,
            },
          },
        },
      },
    });
  });
});
