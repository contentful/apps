import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AppExtensionSDK } from '@contentful/app-sdk';
import { SDKContext, useCMA, useSDK } from '@contentful/react-apps-toolkit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openPopup } from './helpers';
import { apiClient, slackClient } from './requests';
import { useConnect } from './useConnect';
import { useAuthStore } from './auth.store';
import { useWorkspaceStore, WorkspaceState } from './workspace.store';

vi.mock('@contentful/react-apps-toolkit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@contentful/react-apps-toolkit')>();
  return { ...actual, useSDK: vi.fn(), useCMA: vi.fn() };
});

vi.mock('./helpers', () => ({ openPopup: vi.fn() }));

vi.mock('./requests', () => ({
  apiClient: { createAuthToken: vi.fn() },
  slackClient: { getWorkspace: vi.fn(), getChannels: vi.fn() },
}));

const workspace = { id: 'workspace-id', name: 'Workspace', icon: {} };
const channels = [{ id: 'channel-id', name: 'general' }];
const success = {
  state: 'oauth-state',
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
};

const ConnectButton = () => {
  const { startOAuth } = useConnect();
  return <button onClick={startOAuth}>Connect</button>;
};

const dispatchMessage = (source: Window | null, data: object, origin = window.location.origin) => {
  act(() => {
    window.dispatchEvent(new MessageEvent('message', { origin, source, data }));
  });
};

describe('useConnect OAuth messages', () => {
  const sdk = {
    ids: { space: 'space-id', environment: 'master' },
    notifier: { error: vi.fn(), success: vi.fn() },
  } as unknown as AppExtensionSDK;
  const api = { install: vi.fn() };
  const popupA = {} as Window;
  const popupB = {} as Window;
  const popupC = {} as Window;

  const renderConnect = () =>
    render(
      <SDKContext.Provider value={{ sdk, api } as unknown as React.ContextType<typeof SDKContext>}>
        <ConnectButton />
      </SDKContext.Provider>
    );

  const connect = () => fireEvent.click(screen.getByRole('button', { name: 'Connect' }));

  const expectNoCompletion = () => {
    expect(sdk.notifier.error).not.toHaveBeenCalled();
    expect(sdk.notifier.success).not.toHaveBeenCalled();
    expect(slackClient.getWorkspace).not.toHaveBeenCalled();
    expect(slackClient.getChannels).not.toHaveBeenCalled();
    expect(api.install).not.toHaveBeenCalled();
    expect(apiClient.createAuthToken).not.toHaveBeenCalled();
    expect(useWorkspaceStore.getState().workspaceState).toBe(WorkspaceState.IDLE);
    expect(useAuthStore.getState().temporaryRefreshToken).toBeUndefined();
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSDK).mockReturnValue(sdk);
    vi.mocked(useCMA).mockReturnValue({} as ReturnType<typeof useCMA>);
    vi.mocked(openPopup).mockReturnValue(popupA);
    vi.mocked(slackClient.getWorkspace).mockResolvedValue(workspace);
    vi.mocked(slackClient.getChannels).mockResolvedValue(channels);
    api.install.mockResolvedValue(undefined);
    vi.mocked(apiClient.createAuthToken).mockResolvedValue(undefined);
    useWorkspaceStore.setState({
      workspaceState: WorkspaceState.IDLE,
      connectedWorkspaces: {},
      channels: undefined,
      notificationsLoading: false,
    });
    useAuthStore.setState({ temporaryRefreshToken: undefined, installationUuid: '' });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('rejects wrong origin and wrong source before any completion side effect', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderConnect();
    connect();

    dispatchMessage(popupA, success, 'https://untrusted.example');
    dispatchMessage(popupB, success);
    dispatchMessage(popupB, { result: 'error', errorMessage: 'untrusted error' });

    expectNoCompletion();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('rejects messages when the popup was blocked', () => {
    vi.mocked(openPopup).mockReturnValue(null);
    const addListener = vi.spyOn(window, 'addEventListener');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderConnect();
    connect();

    dispatchMessage(popupA, success);
    dispatchMessage(null, { result: 'error', errorMessage: 'blocked' });

    expectNoCompletion();
    expect(consoleError).not.toHaveBeenCalled();
    expect(addListener.mock.calls.some(([type]) => type === 'message')).toBe(false);
  });

  it('keeps waiting when the active popup sends an incomplete success payload', async () => {
    renderConnect();
    connect();

    dispatchMessage(popupA, { accessToken: success.accessToken });
    dispatchMessage(popupA, { state: success.state });
    expectNoCompletion();

    dispatchMessage(popupA, success);
    await waitFor(() => expect(sdk.notifier.success).toHaveBeenCalledTimes(1));
    expect(slackClient.getWorkspace).toHaveBeenCalledTimes(1);
  });

  it('accepts one active-popup success before async workspace lookup resolves', async () => {
    let resolveWorkspace!: (value: typeof workspace) => void;
    vi.mocked(slackClient.getWorkspace).mockReturnValue(
      new Promise((resolve) => {
        resolveWorkspace = resolve;
      })
    );
    const addListener = vi.spyOn(window, 'addEventListener');
    const removeListener = vi.spyOn(window, 'removeEventListener');
    renderConnect();
    connect();
    const messageListener = addListener.mock.calls.find(([type]) => type === 'message')?.[1];

    dispatchMessage(popupA, success);
    dispatchMessage(popupA, success);

    expect(slackClient.getWorkspace).toHaveBeenCalledTimes(1);
    expect(slackClient.getWorkspace).toHaveBeenCalledWith(success.accessToken);
    expect(removeListener).toHaveBeenCalledWith('message', messageListener);
    expect(api.install).not.toHaveBeenCalled();

    await act(async () => {
      resolveWorkspace(workspace);
    });

    await waitFor(() => expect(sdk.notifier.success).toHaveBeenCalledTimes(1));
    expect(slackClient.getChannels).toHaveBeenCalledTimes(1);
    expect(api.install).toHaveBeenCalledTimes(1);
    expect(apiClient.createAuthToken).toHaveBeenCalledTimes(1);
    expect(useWorkspaceStore.getState().workspaceState).toBe(WorkspaceState.SUCCESS);
    expect(useWorkspaceStore.getState().connectedWorkspaces[workspace.id]).toEqual(workspace);
  });

  it('notifies and logs a valid error once, then removes its listener', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const addListener = vi.spyOn(window, 'addEventListener');
    const removeListener = vi.spyOn(window, 'removeEventListener');
    renderConnect();
    connect();
    const messageListener = addListener.mock.calls.find(([type]) => type === 'message')?.[1];

    dispatchMessage(popupA, { result: 'error', errorMessage: 'oauth failed' });
    dispatchMessage(popupA, { result: 'error', errorMessage: 'oauth failed' });

    expect(sdk.notifier.error).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(removeListener).toHaveBeenCalledWith('message', messageListener);
    expect(slackClient.getWorkspace).not.toHaveBeenCalled();
  });

  it('ignores cancels from a wrong origin or source', async () => {
    renderConnect();
    connect();

    dispatchMessage(popupA, { result: 'cancel' }, 'https://untrusted.example');
    dispatchMessage(popupB, { result: 'cancel' });
    expectNoCompletion();

    dispatchMessage(popupA, success);
    await waitFor(() => expect(sdk.notifier.success).toHaveBeenCalledTimes(1));
    expect(slackClient.getWorkspace).toHaveBeenCalledTimes(1);
  });

  it('consumes a cancel without side effects and lets only a new attempt complete', async () => {
    vi.mocked(openPopup).mockReturnValueOnce(popupA).mockReturnValueOnce(popupB);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const addListener = vi.spyOn(window, 'addEventListener');
    const removeListener = vi.spyOn(window, 'removeEventListener');
    renderConnect();
    connect();
    const messageListener = addListener.mock.calls.find(([type]) => type === 'message')?.[1];

    dispatchMessage(popupA, { result: 'cancel' });
    dispatchMessage(popupA, success);

    expect(removeListener).toHaveBeenCalledWith('message', messageListener);
    expectNoCompletion();
    expect(consoleError).not.toHaveBeenCalled();

    connect();
    dispatchMessage(popupA, success);
    dispatchMessage(popupB, success);

    await waitFor(() => expect(sdk.notifier.success).toHaveBeenCalledTimes(1));
    expect(slackClient.getWorkspace).toHaveBeenCalledTimes(1);
    expect(api.install).toHaveBeenCalledTimes(1);
  });

  it('replaces an attempt and lets later attempts complete only from their own popup', async () => {
    vi.mocked(openPopup)
      .mockReturnValueOnce(popupA)
      .mockReturnValueOnce(popupB)
      .mockReturnValueOnce(popupC);
    renderConnect();
    connect();
    connect();

    dispatchMessage(popupA, success);
    dispatchMessage(popupB, success);
    await waitFor(() => expect(sdk.notifier.success).toHaveBeenCalledTimes(1));

    connect();
    dispatchMessage(popupB, success);
    dispatchMessage(popupC, success);
    await waitFor(() => expect(sdk.notifier.success).toHaveBeenCalledTimes(2));

    expect(slackClient.getWorkspace).toHaveBeenCalledTimes(2);
    expect(api.install).toHaveBeenCalledTimes(2);
  });

  it('removes the active attempt listener on unmount', () => {
    const addListener = vi.spyOn(window, 'addEventListener');
    const removeListener = vi.spyOn(window, 'removeEventListener');
    const view = renderConnect();
    connect();
    const messageListener = addListener.mock.calls.find(([type]) => type === 'message')?.[1];

    view.unmount();
    dispatchMessage(popupA, success);

    expect(removeListener).toHaveBeenCalledWith('message', messageListener);
    expectNoCompletion();
  });
});
