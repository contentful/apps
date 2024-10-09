import React from 'react';
import ConfigScreen from './ConfigScreen';
import { act, render, screen, waitFor } from '@testing-library/react';
import { authStore } from '../auth.store';
import { makeMockSdk } from '../../test/mocks/mockSdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { Mock, vi } from 'vitest';
import { apiClient } from '../requests';

vi.mock('../requests', () => {
  const realRequests = vi.importActual('../requests');
  return {
    ...realRequests,
    apiClient: {
      getChannels: vi.fn(),
      getWorkspace: vi.fn(),
      createAuthToken: vi.fn(),
    },
  };
});

vi.mock(import('@contentful/react-apps-toolkit'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useSDK: vi.fn(),
    useCMA: vi.fn(),
  };
});

let realUseContext: any;
let useContextMock: any;

beforeEach(() => {
  realUseContext = React.useContext;
  useContextMock = React.useContext = vi.fn();
});

afterEach(() => {
  React.useContext = realUseContext;
  vi.resetAllMocks();
});

describe('Config Screen component', () => {
  let callbacks: any;
  beforeEach(() => {
    const result = makeMockSdk();
    useContextMock.mockReturnValue({ api: { install: vi.fn() } });
    (useSDK as Mock).mockReturnValue(result.sdk);
    callbacks = result.callbacks;
  });
  it('Component text exists', async () => {
    const { getByText } = render(<ConfigScreen />);

    await act(callbacks.onConfigure);

    expect(getByText('Connect to Slack')).toBeDefined();
  });
  it('Shows the connected workspace if installation parameters are set', async () => {
    const { sdk } = makeMockSdk();
    sdk.app.getParameters = () => ({ workspaces: ['whatever'], notifications: [] });
    (useSDK as Mock).mockReturnValue(sdk);
    (apiClient.getWorkspace as Mock).mockResolvedValueOnce({
      id: 'so-unique',
      name: 'nice workspace',
      icon: { image_68: 'whatever' },
    });
    (apiClient.getWorkspace as Mock).mockResolvedValueOnce([]);

    const { getByText } = render(<ConfigScreen />);
    await waitFor(() => screen.findByText('Slack workspace'));

    await waitFor(() => screen.findByText('nice workspace'));

    expect(getByText('nice workspace')).toBeDefined();
  });
  it('Shows an error message if fetching the workspace failed', async () => {
    const { sdk } = makeMockSdk();

    (apiClient.getWorkspace as Mock).mockRejectedValueOnce(new Error());
    sdk.app.getParameters = () => ({ workspaces: ['whatever'], notifications: [] });
    (useSDK as Mock).mockReturnValue(sdk);

    const { getByText } = render(<ConfigScreen />);

    await waitFor(() => screen.findByText('Failed to fetch workspace'));

    expect(getByText('Failed to fetch workspace')).toBeDefined();
  });
  it('Saves the token after first installation', async () => {
    const UUID = '1234';
    const { sdk, callbacks } = makeMockSdk();
    sdk.app.isInstalled = () => Promise.resolve(false);
    (useSDK as Mock).mockReturnValue(sdk);

    authStore.getState().setTemporaryRefreshToken('not-empty');
    authStore.getState().setInstallationUuid(UUID);
    render(<ConfigScreen />);

    await act(callbacks.onConfigure);
    await waitFor(() => act(callbacks.onConfigurationCompleted));

    expect(apiClient.createAuthToken).toHaveBeenCalledWith(sdk, undefined, 'not-empty', UUID);
  });
});
