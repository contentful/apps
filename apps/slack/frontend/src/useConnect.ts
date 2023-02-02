import { useCallback, useContext, useEffect } from 'react';
import { ConnectedWorkspace, useWorkspaceStore, WorkspaceState } from './workspace.store';
import { apiClient, slackClient } from './requests';
import { openPopup } from './helpers';
import { makeOAuthURL } from './constants';
import { getEnvironmentName } from './utils';
import { SDKContext, useCMA, useSDK } from '@contentful/react-apps-toolkit';
import { AppExtensionSDK } from '@contentful/app-sdk';
import { useAuthStore } from './auth.store';

export const useConnect = () => {
  const sdk = useSDK<AppExtensionSDK>();
  const cma = useCMA();
  const { temporaryRefreshToken } = useAuthStore((state) => ({
    temporaryRefreshToken: state.temporaryRefreshToken,
  }));

  // @ts-expect-error private api not typed
  const { api } = useContext(SDKContext);

  const saveWorkspace = useCallback(
    async (workspace, token) => {
      const isInstalled = await sdk.app.isInstalled();

      const genericErrorMessage =
        'Unable to store configuration. Please try connecting Slack again.';

      if (!isInstalled && token) {
        try {
          await api.install({ workspaces: [workspace.id] });
          await apiClient.createAuthToken(sdk, cma, token);
        } catch (e) {
          console.error(e);
          sdk.notifier.error(genericErrorMessage);
        }
      }
    },
    [cma, sdk, temporaryRefreshToken]
  );

  const { addConnectedWorkspace, setWorkspaceState, setNotificationsLoading, setChannels } =
    useWorkspaceStore((state) => ({
      addConnectedWorkspace: state.addConnectedWorkspace,
      setWorkspaceState: state.setWorkspaceState,
      notificationsLoading: state.notificationsLoading,
      setNotificationsLoading: state.setNotificationsLoading,
      setChannels: state.setChannels,
    }));

  const [setTemporaryRefreshToken] = useAuthStore((state) => [state.setTemporaryRefreshToken]);

  const onMessage = async (message: MessageEvent) => {
    if (message.data.result === 'error') {
      sdk.notifier.error('Something went wrong while authenticating with Slack. Please try again.');
    }
    if (message.data.errorMessage) {
      console.error(message.data.errorMessage);
    }
    if (message.data.state && message.data.accessToken) {
      setWorkspaceState(WorkspaceState.LOADING);
      setNotificationsLoading(true);
      try {
        const token = message.data.accessToken;
        setTemporaryRefreshToken(message.data.refreshToken);
        const workspace = await slackClient.getWorkspace(token);
        const channels = await slackClient.getChannels(token, workspace.id);
        setChannels(channels);
        await saveWorkspace(workspace, message.data.refreshToken);
        addConnectedWorkspace({ ...(workspace as ConnectedWorkspace) });
        sdk.notifier.success('Connected to the Slack workspace successfully.');
      } catch (e) {
        sdk.notifier.error(
          'Something went wrong while authenticating with Slack. Please try again.'
        );
      } finally {
        setNotificationsLoading(false);
      }
      if (message.data) {
        window.removeEventListener('message', onMessage);
      }

      setWorkspaceState(WorkspaceState.SUCCESS);
    }
  };

  useEffect(() => {
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const startOAuth = () => {
    window.addEventListener('message', onMessage);
    openPopup(makeOAuthURL(sdk.ids.space, getEnvironmentName(sdk.ids)), 700, 900);
  };

  return { startOAuth };
};
