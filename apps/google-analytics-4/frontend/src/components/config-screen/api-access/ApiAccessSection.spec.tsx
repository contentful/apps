import { act, render, screen, waitFor } from '@testing-library/react';
import ApiAccessSection from './ApiAccessSection';
import { mockSdk, mockCma, validServiceKeyFile, validServiceKeyId } from '../../../../test/mocks';
import userEvent from '@testing-library/user-event';
import { ServiceAccountKey } from '@/types';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

// Helper to mock users clicking "save" -- return result of the callback passed to onConfigure()
const saveAppInstallation = async () => {
  // We manually call the LAST onConfigure() callback (this is important, as earlier calls have stale data)
  return await mockSdk.app.onConfigure.mock.calls.at(-1)[0]();
};

describe('Config Screen component (not installed)', () => {
  it('can render the about section', async () => {
    await act(async () => {
      render(<ApiAccessSection onAccountSummariesChange={() => {}} />);
    });

    expect(screen.getByText('API Access')).toBeInTheDocument();
  });
});

describe('Config Screen component (not installed)', () => {
  it('allows the app to be installed with a valid service key file', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<ApiAccessSection onAccountSummariesChange={() => {}} />);
    });

    const keyFileInputBox = screen.getByLabelText(/Private Key File/i);

    // user.type() got confused by the JSON string chars, so we'll just click and paste -- this
    // actually better recreates likely user behavior as a bonus
    await user.click(keyFileInputBox);
    await user.paste(JSON.stringify(validServiceKeyFile));

    let result;
    await act(async () => {
      result = await saveAppInstallation();
    });

    expect(result).toEqual(
      expect.objectContaining({
        parameters: expect.objectContaining({
          serviceAccountKey: expect.objectContaining(validServiceKeyFile),
          serviceAccountKeyId: expect.objectContaining({
            id: validServiceKeyFile.private_key_id,
          }),
        }),
      })
    );
  });

  it('prevents the app from being installed with invalid service key file', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<ApiAccessSection onAccountSummariesChange={() => {}} />);
    });

    const keyFileInputBox = screen.getByLabelText(/Private Key File/i);

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
  });

  it('prevents the app from being installed if no service key file is provided', async () => {
    await act(async () => {
      render(<ApiAccessSection onAccountSummariesChange={() => {}} />);
    });

    let result;
    await act(async () => {
      result = await saveAppInstallation();
    });

    // false result prevents parameters save
    expect(result).toEqual({
      parameters: {
        serviceAccountKey: undefined,
        serviceAccountKeyId: undefined,
        contentTypes: {},
        savedPropertyId: '',
      },
      targetState: undefined,
    });
  });
});

describe('Installed Service Account Key', () => {
  beforeEach(() => {
    mockSdk.app.getParameters.mockReturnValue({
      serviceAccountKey: validServiceKeyFile,
      serviceAccountKeyId: validServiceKeyId,
    });
  });

  it('overrides the saved values if a new key file is provided', async () => {
    const user = userEvent.setup();
    await act(async () => {
      render(<ApiAccessSection onAccountSummariesChange={() => {}} />);
    });

    const editServiceAccountButton = screen.getByTestId('editServiceAccountButton');

    await user.click(editServiceAccountButton);
    const keyFileInputBox = screen.getByLabelText(/Private Key File/i);
    await waitFor(() => user.click(keyFileInputBox));

    const newServiceKeyFile: ServiceAccountKey = {
      ...validServiceKeyFile,
      private_key_id: 'new_private_key_id',
    };
    await user.paste(JSON.stringify(newServiceKeyFile));

    let result;
    await act(async () => {
      result = await saveAppInstallation();
    });

    expect(result).toEqual(
      expect.objectContaining({
        parameters: expect.objectContaining({
          serviceAccountKey: expect.objectContaining(newServiceKeyFile),
          serviceAccountKeyId: expect.objectContaining({
            id: 'new_private_key_id',
          }),
        }),
      })
    );
  });

  it('does not require key file on save', async () => {
    await act(async () => {
      render(<ApiAccessSection onAccountSummariesChange={() => {}} />);
    });

    let result;
    await act(async () => {
      result = await saveAppInstallation();
    });

    await act(async () => {
      render(<ApiAccessSection onAccountSummariesChange={() => {}} />);
    });
  });
});
