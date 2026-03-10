import { act, render, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockCma, mockSdk } from './mocks';
import ConfigScreen from '../src/locations/ConfigScreen';
import {
  CONFIG_SAVE_REQUIRED_FIELDS_MESSAGE,
  INVALID_CREDENTIALS_RESPONSE,
  TEST_CONNECTION_REQUIRED_FIELDS_MESSAGE,
} from '../src/const';

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
      response: {
        body: JSON.stringify({ valid: true, message: 'Your Marketo credentials are valid.' }),
      },
    });
    mockSdk.notifier.error.mockClear();
  });

  it('renders heading and credential fields', async () => {
    const { getByText, getByLabelText, getByRole } = render(<ConfigScreen />);

    await waitFor(() => {
      expect(mockSdk.app.setReady).toHaveBeenCalled();
    });

    expect(getByText('Set up the Adobe Marketo Form Selector App')).toBeInTheDocument();
    expect(getByLabelText(/Marketo Client ID/)).toBeInTheDocument();
    expect(getByLabelText(/Marketo Client Secret/)).toBeInTheDocument();
    expect(getByLabelText(/Marketo Munchkin Id/)).toBeInTheDocument();
    expect(getByRole('button', { name: 'Test' })).toBeInTheDocument();
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
    expect(mockSdk.notifier.error).toHaveBeenCalledWith(CONFIG_SAVE_REQUIRED_FIELDS_MESSAGE);
    expect(screen.getByText('Enter a valid Client ID')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid Client Secret')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid Munchkin ID')).toBeInTheDocument();
  });

  it('test connection shows error and does not call app action when required fields are empty', async () => {
    await renderAndWaitReady();

    const testButton = screen.getByRole('button', { name: 'Test' });
    await userEvent.click(testButton);

    expect(mockSdk.notifier.error).toHaveBeenCalledWith(TEST_CONNECTION_REQUIRED_FIELDS_MESSAGE);
    expect(mockCma.appActionCall.createWithResponse).not.toHaveBeenCalled();
  });

  it('does not show test connection button when app is not installed', async () => {
    mockSdk.app.isInstalled.mockResolvedValue(false);
    await renderAndWaitReady();
    await fillCredentials()();

    expect(screen.queryByRole('button', { name: 'Test' })).not.toBeInTheDocument();
  });

  it('shows test connection button when app is installed', async () => {
    mockSdk.app.isInstalled.mockResolvedValue(true);
    await renderAndWaitReady();
    await fillCredentials()();

    expect(screen.getByRole('button', { name: 'Test' })).toBeInTheDocument();
  });

  it('test connection calls app action with credentials and shows Connected badge when response is valid', async () => {
    await renderAndWaitReady();
    await fillCredentials()();
    const testButton = screen.getByRole('button', { name: 'Test' });

    await userEvent.click(testButton);

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
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });
    expect(mockSdk.notifier.error).not.toHaveBeenCalled();
  });

  it('test connection shows error note when app action returns valid: false', async () => {
    mockCma.appActionCall.createWithResponse.mockResolvedValue({
      response: {
        body: JSON.stringify({
          valid: false,
          message: INVALID_CREDENTIALS_RESPONSE,
        }),
      },
    });
    await renderAndWaitReady();
    await fillCredentials()();
    const testButton = screen.getByRole('button', { name: 'Test' });

    await userEvent.click(testButton);

    await waitFor(() => {
      expect(screen.getByText(INVALID_CREDENTIALS_RESPONSE)).toBeInTheDocument();
    });
  });

  it('test connection shows error note when app action throws error', async () => {
    mockCma.appActionCall.createWithResponse.mockRejectedValue(new Error('Network error'));
    await renderAndWaitReady();
    await fillCredentials()();
    const testButton = screen.getByRole('button', { name: 'Test' });

    await userEvent.click(testButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });
});
