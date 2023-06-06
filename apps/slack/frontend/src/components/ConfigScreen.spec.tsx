import React from 'react';
import ConfigScreen from './ConfigScreen';
import { act, render, screen, waitFor } from '@testing-library/react';
import { authStore } from '../auth.store';
import { makeMockSdk } from '../../test/mocks/mockSdk';
import { useSDK } from '@contentful/react-apps-toolkit';

jest.mock('../requests', () => {
  const realRequests = jest.requireActual('../requests');
  return {
    ...realRequests,
    apiClient: {
      getChannels: jest.fn(),
      getWorkspace: jest.fn(),
      createAuthToken: jest.fn(),
    },
  };
});

jest.mock('@contentful/react-apps-toolkit', () => {
  return {
    useSDK: jest.fn(),
    useCMA: jest.fn(),
  };
});

let realUseContext: any;
let useContextMock: any;

beforeEach(() => {
  realUseContext = React.useContext;
  useContextMock = React.useContext = jest.fn();
});

afterEach(() => {
  React.useContext = realUseContext;
});

describe('Config Screen component', () => {
  let callbacks: any;
  beforeEach(() => {
    const result = makeMockSdk();
    useContextMock.mockReturnValue({ api: { install: jest.fn() } });
    (useSDK as jest.Mock).mockReturnValue(result.sdk);
    callbacks = result.callbacks;
  });
  it('Component text exists', async () => {
    const { getByText } = render(<ConfigScreen />);

    await act(callbacks.onConfigure);

    expect(getByText('Connect to Slack')).toBeInTheDocument();
  });
  it('Shows the connected workspace if installation parameters are set', async () => {
    const { sdk } = makeMockSdk();
    const { apiClient } = jest.requireMock('../requests');
    sdk.app.getParameters = () => ({ workspaces: ['whatever'], notifications: [] });
    (useSDK as jest.Mock).mockReturnValue(sdk);
    apiClient.getWorkspace.mockResolvedValueOnce({
      id: 'so-unique',
      name: 'nice workspace',
      icon: { image_68: 'whatever' },
    });
    apiClient.getWorkspace.mockResolvedValueOnce([]);

    const { getByText } = render(<ConfigScreen />);
    await waitFor(() => screen.findByText('Slack workspace'));

    await waitFor(() => screen.findByText('nice workspace'));

    expect(getByText('nice workspace')).toBeInTheDocument();
  });
  it('Shows an error message if fetching the workspace failed', async () => {
    const { sdk } = makeMockSdk();
    const { apiClient } = jest.requireMock('../requests');

    apiClient.getWorkspace.mockRejectedValueOnce(new Error());
    sdk.app.getParameters = () => ({ workspaces: ['whatever'], notifications: [] });
    (useSDK as jest.Mock).mockReturnValue(sdk);

    const { getByText } = render(<ConfigScreen />);

    await waitFor(() => screen.findByText('Failed to fetch workspace'));

    expect(getByText('Failed to fetch workspace')).toBeInTheDocument();
  });
  it('Saves the token after first installation', async () => {
    const UUID = '1234';
    const { sdk, callbacks } = makeMockSdk();
    sdk.app.isInstalled = () => Promise.resolve(false);
    (useSDK as jest.Mock).mockReturnValue(sdk);

    const { apiClient } = jest.requireMock('../requests');
    authStore.getState().setTemporaryRefreshToken('not-empty');
    authStore.getState().setInstallationUuid(UUID);
    render(<ConfigScreen />);

    await act(callbacks.onConfigure);
    await waitFor(() => act(callbacks.onConfigurationCompleted));

    expect(apiClient.createAuthToken).toHaveBeenCalledWith(sdk, undefined, 'not-empty', UUID);
  });
});
