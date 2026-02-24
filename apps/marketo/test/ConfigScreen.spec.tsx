import { act, render, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockCma, mockSdk } from './mocks';
import ConfigScreen from '../src/locations/ConfigScreen';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => ({ ...mockSdk, cma: mockCma }),
  useCMA: () => mockCma,
}));

async function runOnConfigure(): Promise<unknown> {
  const onConfigureCallback = mockSdk.app.onConfigure.mock.calls.at(-1)?.[0];
  return await act(async () => {
    return onConfigureCallback ? await onConfigureCallback() : undefined;
  });
}

async function renderAndWaitReady() {
  const result = render(<ConfigScreen />);
  await waitFor(() => {
    expect(mockSdk.app.setReady).toHaveBeenCalled();
  });
  return result;
}

function fillCredentials(
  clientId = 'client-id',
  clientSecret = 'client-secret',
  munchkinId = 'munchkin-id'
) {
  const user = userEvent.setup();

  return async () => {
    await user.type(screen.getByLabelText(/Marketo Client ID/), clientId);
    await user.type(screen.getByLabelText(/Marketo Client Secret/), clientSecret);
    await user.type(screen.getByLabelText(/Marketo Munchkin Id/), munchkinId);
  };
}

describe('ConfigScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk.app.getParameters.mockResolvedValue(null);
    mockSdk.app.getCurrentState.mockResolvedValue(null);
    mockSdk.app.isInstalled.mockResolvedValue(true);
    mockCma.appActionCall.createWithResponse.mockResolvedValue({
      response: { body: JSON.stringify({ valid: true }) },
    });
    mockSdk.notifier.error.mockClear();
  });

  it('renders heading and credential fields', async () => {
    const { getByText, getByLabelText, getByRole } = render(<ConfigScreen />);

    await waitFor(() => {
      expect(mockSdk.app.setReady).toHaveBeenCalled();
    });

    expect(getByText('Set up the Marketo App')).toBeInTheDocument();
    expect(getByLabelText(/Marketo Client ID/)).toBeInTheDocument();
    expect(getByLabelText(/Marketo Client Secret/)).toBeInTheDocument();
    expect(getByLabelText(/Marketo Munchkin Id/)).toBeInTheDocument();
    expect(getByRole('button', { name: /test marketo connection/i })).toBeInTheDocument();
  });

  it('onConfigure returns parameters and targetState when all required fields are valid', async () => {
    const params = {
      clientId: 'client-id',
      clientSecret: 'client-secret',
      munchkinId: 'munchkin-id',
    };
    mockSdk.app.getParameters.mockResolvedValue(params);
    mockSdk.app.getCurrentState.mockResolvedValue({ EditorInterface: {} });

    render(<ConfigScreen />);
    await waitFor(() => {
      expect(mockSdk.app.setReady).toHaveBeenCalled();
    });

    const result = await runOnConfigure();

    expect(result).toEqual({
      parameters: params,
      targetState: { EditorInterface: {} },
    });
    expect(mockSdk.notifier.error).not.toHaveBeenCalled();
  });

  it('onConfigure shows validation errors and returns false when required fields are empty', async () => {
    render(<ConfigScreen />);
    await waitFor(() => {
      expect(mockSdk.app.setReady).toHaveBeenCalled();
    });

    const result = await runOnConfigure();

    expect(result).toBe(false);
    expect(mockSdk.notifier.error).toHaveBeenCalledWith(
      'Please fill in all required fields with valid values before saving.'
    );
    expect(screen.getByText('Enter a valid Client ID')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid Client Secret')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid Munchkin ID')).toBeInTheDocument();
  });

  it('test connection shows error and does not call app action when required fields are empty', async () => {
    await renderAndWaitReady();

    const testButton = screen.getByRole('button', { name: /test marketo connection/i });
    await userEvent.click(testButton);

    expect(mockSdk.notifier.error).toHaveBeenCalledWith(
      'Please fill in all required fields before testing the connection.'
    );
    expect(mockCma.appActionCall.createWithResponse).not.toHaveBeenCalled();
  });

  it('test connection shows error and does not call app action when app is not installed', async () => {
    mockSdk.app.isInstalled.mockResolvedValue(false);
    await renderAndWaitReady();
    await fillCredentials()();

    const testButton = screen.getByRole('button', { name: /test marketo connection/i });
    await userEvent.click(testButton);

    expect(mockSdk.notifier.error).toHaveBeenCalledWith('Please install the app first.');
    expect(mockCma.appActionCall.createWithResponse).not.toHaveBeenCalled();
  });

  it('test connection calls app action with credentials and shows success note when response is valid', async () => {
    await renderAndWaitReady();
    await fillCredentials()();
    const testButton = screen.getByRole('button', { name: /test marketo connection/i });

    await act(async () => {
      await userEvent.click(testButton);
    });

    await waitFor(() => {
      expect(mockCma.appActionCall.createWithResponse).toHaveBeenCalledWith(
        { appDefinitionId: 'test-app', appActionId: 'validateMarketoCredentialsAction' },
        {
          parameters: {
            clientId: 'client-id',
            clientSecret: 'client-secret',
            munchkinId: 'munchkin-id',
          },
        }
      );
    });
    await waitFor(() => {
      expect(
        screen.getByText(/Connection successful. Your Marketo credentials are valid./)
      ).toBeInTheDocument();
    });
    expect(mockSdk.notifier.error).not.toHaveBeenCalled();
  });

  it('test connection shows error note when app action returns valid: false', async () => {
    mockCma.appActionCall.createWithResponse.mockResolvedValue({
      response: {
        body: JSON.stringify({
          valid: false,
          message: 'Connection failed. Please check your credentials.',
        }),
      },
    });
    await renderAndWaitReady();
    await fillCredentials()();
    const testButton = screen.getByRole('button', { name: /test marketo connection/i });

    await act(async () => {
      await userEvent.click(testButton);
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Connection failed. Please check your credentials./)
      ).toBeInTheDocument();
    });
  });

  it('test connection shows error note when app action throws', async () => {
    mockCma.appActionCall.createWithResponse.mockRejectedValue(new Error('Network error'));
    await renderAndWaitReady();
    await fillCredentials()();
    const testButton = screen.getByRole('button', { name: /test marketo connection/i });

    await act(async () => {
      await userEvent.click(testButton);
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          /Connection failed. Please check your Client ID, Client Secret and Munchkin ID and try again./
        )
      ).toBeInTheDocument();
    });
  });
});
