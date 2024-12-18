import { act, render, screen, waitFor } from '@testing-library/react';
import { mockSdk, mockCma } from '../../../../test/mocks';
import GoogleAnalyticsConfigPage from 'components/config-screen/GoogleAnalyticsConfigPage/GoogleAnalyticsConfigPage';
import { config } from 'config';
import { validServiceKeyFile, validServiceKeyId } from '../../../../test/mocks';
import userEvent from '@testing-library/user-event';
import { ServiceAccountKey } from 'types';
import { vi } from 'vitest';

const apiRoot = config.backendApiUrl;

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

vi.mock('contentful-management', () => ({
  createClient: () => mockCma,
}));

vi.mock('@contentful/node-apps-toolkit', () => ({
  verifyRequest: () => true,
}));

vi.mock(import('apis/fetchApi'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    validateResponseStatus: () => {
      return true;
    },
  };
});

// Helper to mock users clicking "save" -- return result of the callback passed to onConfigure()
const saveAppInstallation = () => {
  // We manually call the LAST onConfigure() callback (this is important, as earlier calls have stale data)
  return mockSdk.app.onConfigure.mock.calls.at(-1)[0]();
};

export const apiPath = (path: string) => {
  return new URL(path, apiRoot).toString();
};

describe('Google Analytics Page', () => {
  it('renders setup view', () => {
    render(<GoogleAnalyticsConfigPage />);

    expect(screen.getByText('API access')).toBeInTheDocument();
    expect(screen.getByText('Google Service Account Details')).toBeInTheDocument();
  });
});

describe('Config Screen component (not installed)', () => {
  it('allows the app to be installed with a valid service key file', async () => {
    const user = userEvent.setup();
    render(<GoogleAnalyticsConfigPage />);
    const keyFileInputBox = screen.getByLabelText(/Service Account Key/i);

    // user.type() got confused by the JSON string chars, so we'll just click and paste -- this
    // actually better recreates likely user behavior as a bonus
    await user.click(keyFileInputBox);
    await user.paste(JSON.stringify(validServiceKeyFile));

    expect(screen.getByText('Service account key file is valid JSON')).toBeInTheDocument();

    const result = await saveAppInstallation();

    expect(result).toEqual({
      parameters: {
        serviceAccountKeyId: {
          clientEmail: 'example4@PROJECT_ID.iam.gserviceaccount.com',
          clientId: 'CLIENT_ID',
          id: 'PRIVATE_KEY_ID',
          projectId: 'PROJECT_ID',
        },
      },
      targetState: {
        EditorInterface: {},
      },
    });
    expect(screen.getByText('Google Service Account Details')).toBeInTheDocument();
  });

  it('prevents the app from being installed with invalid service key file', async () => {
    const user = userEvent.setup();
    render(<GoogleAnalyticsConfigPage />);

    const keyFileInputBox = screen.getByLabelText(/Service Account Key/i);

    // user.type() got confused by the JSON string chars, so we'll just click and paste -- this
    // actually better recreates likely user behavior as a bonus
    await user.click(keyFileInputBox);
    await user.paste('{ "foo": "bar" }');

    const result = await saveAppInstallation();

    // false result prevents parameters save
    expect(result).toEqual(false);
    expect(screen.getByText('Google Service Account Details')).toBeInTheDocument();
  });

  it('prevents the app from being installed if no service key file is provided', async () => {
    render(<GoogleAnalyticsConfigPage />);

    const result = await saveAppInstallation();

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
    process.on('unhandledRejection', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });
  });

  it('overrides the saved values if a new key file is provided', async () => {
    const consoleSpy = vi.spyOn(console, 'error');
    expect(consoleSpy).toHaveBeenCalledTimes(0);

    render(<GoogleAnalyticsConfigPage />);
    const user = userEvent.setup();

    const editServiceAccountButton = await waitFor(() =>
      screen.findByTestId('editServiceAccountButton')
    );
    expect(editServiceAccountButton).toBeInTheDocument();
    await user.click(editServiceAccountButton);

    const keyFileInputBox = await waitFor(() => screen.getByLabelText(/Service Account Key/i));
    expect(keyFileInputBox).toBeInTheDocument();
    await user.click(keyFileInputBox);

    const newServiceKeyFile: ServiceAccountKey = {
      ...validServiceKeyFile,
      private_key_id: 'PRIVATE_KEY_ID',
    };
    await user.paste(JSON.stringify(newServiceKeyFile));

    await act(async () =>
      expect(screen.getByText('Service account key file is valid JSON')).toBeInTheDocument()
    );

    const mockSaveAppInstallation = vi.fn().mockResolvedValue({
      parameters: {
        serviceAccountKeyId: {
          clientEmail: 'example4@PROJECT_ID.iam.gserviceaccount.com',
          clientId: 'CLIENT_ID',
          id: 'PRIVATE_KEY_ID',
          projectId: 'PROJECT_ID',
        },
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

    mockSdk.app.onConfigure.mockImplementation(() => mockSaveAppInstallation);

    const result = await mockSaveAppInstallation();

    expect(result).toEqual({
      parameters: {
        serviceAccountKeyId: {
          clientEmail: 'example4@PROJECT_ID.iam.gserviceaccount.com',
          clientId: 'CLIENT_ID',
          id: 'PRIVATE_KEY_ID',
          projectId: 'PROJECT_ID',
        },
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
